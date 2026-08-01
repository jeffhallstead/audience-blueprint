CREATE TABLE public.integration_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_name text NOT NULL,
  user_id uuid,
  dedupe_key text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX integration_outbox_dedupe_idx
  ON public.integration_outbox (provider, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX integration_outbox_pending_idx
  ON public.integration_outbox (status, next_attempt_at);

GRANT ALL ON public.integration_outbox TO service_role;

ALTER TABLE public.integration_outbox ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_integration_outbox_updated_at
  BEFORE UPDATE ON public.integration_outbox
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();