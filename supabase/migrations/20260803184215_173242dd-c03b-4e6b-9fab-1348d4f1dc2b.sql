-- ============ E4: extended organization profiles ============

CREATE TABLE public.organization_audience_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  email_list_size text,
  newsletter_subscribers integer,
  primary_channels text[] NOT NULL DEFAULT '{}',
  audience_segments text[] NOT NULL DEFAULT '{}',
  first_party_data_maturity text,
  notes text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_audience_profile TO authenticated;
GRANT ALL ON public.organization_audience_profile TO service_role;
ALTER TABLE public.organization_audience_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage their audience profile"
  ON public.organization_audience_profile FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Admins can view audience profiles"
  ON public.organization_audience_profile FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_organization_audience_profile_updated_at
  BEFORE UPDATE ON public.organization_audience_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.organization_marketing_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_structure text,
  martech_stack text[] NOT NULL DEFAULT '{}',
  paid_spend_range text,
  primary_kpis text[] NOT NULL DEFAULT '{}',
  attribution_maturity text,
  notes text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_marketing_profile TO authenticated;
GRANT ALL ON public.organization_marketing_profile TO service_role;
ALTER TABLE public.organization_marketing_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage their marketing profile"
  ON public.organization_marketing_profile FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Admins can view marketing profiles"
  ON public.organization_marketing_profile FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_organization_marketing_profile_updated_at
  BEFORE UPDATE ON public.organization_marketing_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.organization_content_ops_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  publishing_cadence text,
  content_types text[] NOT NULL DEFAULT '{}',
  production_capacity text,
  workflow_tooling text[] NOT NULL DEFAULT '{}',
  governance_maturity text,
  notes text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_content_ops_profile TO authenticated;
GRANT ALL ON public.organization_content_ops_profile TO service_role;
ALTER TABLE public.organization_content_ops_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage their content ops profile"
  ON public.organization_content_ops_profile FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Admins can view content ops profiles"
  ON public.organization_content_ops_profile FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_organization_content_ops_profile_updated_at
  BEFORE UPDATE ON public.organization_content_ops_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ E8: acquisition + recommendation analytics ============

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_touch_source text,
  ADD COLUMN IF NOT EXISTS first_touch_medium text,
  ADD COLUMN IF NOT EXISTS first_touch_campaign text,
  ADD COLUMN IF NOT EXISTS first_touch_referrer text,
  ADD COLUMN IF NOT EXISTS first_touch_landing_path text,
  ADD COLUMN IF NOT EXISTS acquisition_captured_at timestamptz;

CREATE TABLE public.recommendation_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_key text NOT NULL,
  title text,
  category text,
  source text NOT NULL DEFAULT 'blueprint',
  saved_recommendation_id uuid REFERENCES public.saved_recommendations(id) ON DELETE SET NULL,
  view_count integer NOT NULL DEFAULT 0,
  export_count integer NOT NULL DEFAULT 0,
  last_export_provider text,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  saved_at timestamptz,
  exported_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, recommendation_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendation_metadata TO authenticated;
GRANT ALL ON public.recommendation_metadata TO service_role;
ALTER TABLE public.recommendation_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own recommendation activity"
  ON public.recommendation_metadata FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view recommendation activity"
  ON public.recommendation_metadata FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_recommendation_metadata_updated_at
  BEFORE UPDATE ON public.recommendation_metadata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_recommendation_metadata_user ON public.recommendation_metadata(user_id);