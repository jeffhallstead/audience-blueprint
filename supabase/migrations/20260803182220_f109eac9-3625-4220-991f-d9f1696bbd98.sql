CREATE TYPE public.qualification_tier AS ENUM ('unqualified', 'lead', 'marketing_qualified', 'sales_qualified', 'customer');

CREATE TABLE public.customer_qualification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  tier public.qualification_tier NOT NULL DEFAULT 'unqualified',
  previous_tier public.qualification_tier,
  highest_tier public.qualification_tier NOT NULL DEFAULT 'unqualified',
  fit_score integer NOT NULL DEFAULT 0,
  engagement_score integer NOT NULL DEFAULT 0,
  total_score integer NOT NULL DEFAULT 0,
  tier_reason text,
  signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  tier_entered_at timestamptz NOT NULL DEFAULT now(),
  scored_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.customer_qualification TO authenticated;
GRANT ALL ON public.customer_qualification TO service_role;

ALTER TABLE public.customer_qualification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own qualification"
  ON public.customer_qualification FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all qualifications"
  ON public.customer_qualification FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_customer_qualification_tier ON public.customer_qualification(tier);
CREATE INDEX idx_customer_qualification_org ON public.customer_qualification(organization_id);

CREATE TRIGGER update_customer_qualification_updated_at
  BEFORE UPDATE ON public.customer_qualification
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();