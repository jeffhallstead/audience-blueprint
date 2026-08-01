-- ============ subscriptions ============
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paddle_subscription_id text NOT NULL UNIQUE,
  paddle_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_paddle_id ON public.subscriptions(paddle_subscription_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own subscriptions select"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ purchases (one-time orders) ============
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paddle_transaction_id text NOT NULL UNIQUE,
  paddle_customer_id text,
  product_id text NOT NULL,
  price_id text NOT NULL,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'completed',
  -- Buying the Blueprint includes one month of Publisher OS access.
  included_os_access_until timestamptz,
  invoice_url text,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);

GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own purchases select"
  ON public.purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ customer_events (commercial funnel analytics) ============
CREATE TABLE public.customer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_name text NOT NULL,
  tier text,
  price_id text,
  amount_cents integer,
  currency text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_events_user_id ON public.customer_events(user_id);
CREATE INDEX idx_customer_events_name ON public.customer_events(event_name);

GRANT SELECT, INSERT ON public.customer_events TO authenticated;
GRANT ALL ON public.customer_events TO service_role;

ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own customer events select"
  ON public.customer_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "own customer events insert"
  ON public.customer_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============ entitlement helpers ============
CREATE OR REPLACE FUNCTION public.has_active_subscription(
  user_uuid uuid,
  check_env text DEFAULT 'live'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND (
        (status IN ('active', 'trialing', 'past_due')
          AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;

-- 'os' > 'blueprint' > 'free'
CREATE OR REPLACE FUNCTION public.entitlement_tier(
  user_uuid uuid,
  check_env text DEFAULT 'live'
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.has_active_subscription(user_uuid, check_env) THEN 'os'
    WHEN EXISTS (
      SELECT 1 FROM public.purchases
      WHERE user_id = user_uuid
        AND environment = check_env
        AND status = 'completed'
        AND included_os_access_until > now()
    ) THEN 'os'
    WHEN EXISTS (
      SELECT 1 FROM public.purchases
      WHERE user_id = user_uuid
        AND environment = check_env
        AND status = 'completed'
    ) THEN 'blueprint'
    ELSE 'free'
  END;
$$;