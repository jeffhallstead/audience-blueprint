CREATE TABLE public.export_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  provider text NOT NULL,
  airtable_table text,
  asana_project_id text,
  asana_project_name text,
  last_exported_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.export_targets TO authenticated;
GRANT ALL ON public.export_targets TO service_role;

ALTER TABLE public.export_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own export targets"
ON public.export_targets FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_export_targets_updated_at
BEFORE UPDATE ON public.export_targets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();