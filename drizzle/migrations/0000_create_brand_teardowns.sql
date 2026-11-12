CREATE TABLE public.brand_teardowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  brand_name text NOT NULL,
  website text,
  vertical text NOT NULL DEFAULT 'other',
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_score integer NOT NULL,
  dimension_scores jsonb NOT NULL,
  pattern_id text NOT NULL,
  pattern_reason text NOT NULL,
  priorities jsonb NOT NULL DEFAULT '[]'::jsonb,
  email_subject text NOT NULL,
  email_body text NOT NULL,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_teardowns TO authenticated;
GRANT ALL ON public.brand_teardowns TO service_role;
ALTER TABLE public.brand_teardowns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage brand teardowns" ON public.brand_teardowns FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'analyst'))
WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'analyst')) AND created_by = auth.uid());
CREATE TRIGGER brand_teardowns_updated_at BEFORE UPDATE ON public.brand_teardowns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX brand_teardowns_created_at_idx ON public.brand_teardowns (created_at DESC);