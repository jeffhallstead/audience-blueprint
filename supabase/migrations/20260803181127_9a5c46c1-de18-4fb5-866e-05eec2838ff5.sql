CREATE TYPE public.lifecycle_stage AS ENUM (
  'visitor',
  'registered',
  'assessment_started',
  'assessment_completed',
  'blueprint_owner',
  'os_subscriber',
  'churned'
);

CREATE TABLE public.customer_lifecycle (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  stage public.lifecycle_stage NOT NULL DEFAULT 'registered',
  previous_stage public.lifecycle_stage,
  highest_stage public.lifecycle_stage NOT NULL DEFAULT 'registered',
  stage_entered_at timestamptz NOT NULL DEFAULT now(),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz,
  churned_at timestamptz,
  stage_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_lifecycle_stage ON public.customer_lifecycle (stage, stage_entered_at DESC);
CREATE INDEX idx_customer_lifecycle_org ON public.customer_lifecycle (organization_id);
CREATE INDEX idx_customer_lifecycle_active ON public.customer_lifecycle (last_active_at DESC);

GRANT SELECT ON public.customer_lifecycle TO authenticated;
GRANT ALL ON public.customer_lifecycle TO service_role;

ALTER TABLE public.customer_lifecycle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own lifecycle record"
  ON public.customer_lifecycle FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read every lifecycle record"
  ON public.customer_lifecycle FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_customer_lifecycle_updated_at
  BEFORE UPDATE ON public.customer_lifecycle
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();