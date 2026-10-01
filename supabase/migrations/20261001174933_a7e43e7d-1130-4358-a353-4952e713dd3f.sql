CREATE TABLE public.microdrama_greenlight_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score smallint NOT NULL,
  pattern_id text NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('green_light','not_yet','no')),
  condition_met boolean NOT NULL,
  enterprise_referral boolean NOT NULL DEFAULT false,
  blockers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.microdrama_greenlight_checks TO authenticated;
GRANT ALL ON public.microdrama_greenlight_checks TO service_role;
ALTER TABLE public.microdrama_greenlight_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and analysts read greenlight checks" ON public.microdrama_greenlight_checks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE INDEX microdrama_greenlight_checks_created_idx ON public.microdrama_greenlight_checks (created_at DESC);