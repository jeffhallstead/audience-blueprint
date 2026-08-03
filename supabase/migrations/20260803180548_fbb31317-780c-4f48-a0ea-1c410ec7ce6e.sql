-- Canonical, versioned, immutable platform event store.
CREATE TABLE public.platform_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_version integer NOT NULL DEFAULT 1,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product text NOT NULL DEFAULT 'publisher_blueprint',
  environment text NOT NULL DEFAULT 'live',
  source text NOT NULL DEFAULT 'app',
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Read access only; emission is server-side (service role) so the stream stays immutable.
GRANT SELECT ON public.platform_events TO authenticated;
GRANT ALL ON public.platform_events TO service_role;

ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read platform events"
  ON public.platform_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read their own platform events"
  ON public.platform_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_platform_events_occurred_at ON public.platform_events (occurred_at DESC);
CREATE INDEX idx_platform_events_type_occurred ON public.platform_events (event_type, occurred_at DESC);
CREATE INDEX idx_platform_events_user ON public.platform_events (user_id, occurred_at DESC);
CREATE INDEX idx_platform_events_org ON public.platform_events (organization_id, occurred_at DESC);
CREATE INDEX idx_platform_events_unprocessed ON public.platform_events (occurred_at) WHERE processed_at IS NULL;

-- Immutability: rows may never be rewritten or removed, even by the service role.
CREATE OR REPLACE FUNCTION public.platform_events_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.id IS NOT DISTINCT FROM OLD.id
     AND NEW.event_type IS NOT DISTINCT FROM OLD.event_type
     AND NEW.event_version IS NOT DISTINCT FROM OLD.event_version
     AND NEW.organization_id IS NOT DISTINCT FROM OLD.organization_id
     AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id
     AND NEW.product IS NOT DISTINCT FROM OLD.product
     AND NEW.environment IS NOT DISTINCT FROM OLD.environment
     AND NEW.source IS NOT DISTINCT FROM OLD.source
     AND NEW.occurred_at IS NOT DISTINCT FROM OLD.occurred_at
     AND NEW.context IS NOT DISTINCT FROM OLD.context
     AND NEW.payload IS NOT DISTINCT FROM OLD.payload
     AND NEW.dedupe_key IS NOT DISTINCT FROM OLD.dedupe_key
     AND NEW.created_at IS NOT DISTINCT FROM OLD.created_at THEN
    -- Only processed_at changed: consumers are allowed to mark rows handled.
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'platform_events rows are immutable';
END;
$$;

CREATE TRIGGER platform_events_no_rewrite
  BEFORE UPDATE ON public.platform_events
  FOR EACH ROW EXECUTE FUNCTION public.platform_events_immutable();

CREATE OR REPLACE FUNCTION public.platform_events_no_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'platform_events rows cannot be deleted';
END;
$$;

CREATE TRIGGER platform_events_block_delete
  BEFORE DELETE ON public.platform_events
  FOR EACH ROW EXECUTE FUNCTION public.platform_events_no_delete();

-- Backfill legacy assessment_events at version 0.
INSERT INTO public.platform_events
  (event_type, event_version, organization_id, user_id, source, occurred_at, context, payload, dedupe_key)
SELECT
  'legacy.assessment.' || ae.event_name,
  0,
  a.organization_id,
  ae.user_id,
  'backfill',
  ae.created_at,
  jsonb_strip_nulls(jsonb_build_object('section', ae.section, 'assessmentId', ae.assessment_id)),
  ae.metadata,
  'legacy:assessment_events:' || ae.id
FROM public.assessment_events ae
LEFT JOIN public.assessments a ON a.id = ae.assessment_id
ON CONFLICT (dedupe_key) DO NOTHING;

-- Backfill legacy customer_events at version 0.
INSERT INTO public.platform_events
  (event_type, event_version, organization_id, user_id, source, environment, occurred_at, context, payload, dedupe_key)
SELECT
  'legacy.commerce.' || ce.event_name,
  0,
  (SELECT o.id FROM public.organizations o WHERE o.owner_id = ce.user_id ORDER BY o.created_at LIMIT 1),
  ce.user_id,
  'backfill',
  COALESCE(ce.metadata->>'environment', 'live'),
  ce.created_at,
  jsonb_strip_nulls(jsonb_build_object('tier', ce.tier, 'priceId', ce.price_id, 'amountCents', ce.amount_cents, 'currency', ce.currency)),
  ce.metadata,
  'legacy:customer_events:' || ce.id
FROM public.customer_events ce
ON CONFLICT (dedupe_key) DO NOTHING;