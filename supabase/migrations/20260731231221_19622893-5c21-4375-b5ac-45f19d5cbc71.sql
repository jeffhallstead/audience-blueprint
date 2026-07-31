ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS version text NOT NULL DEFAULT 'v1';
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS started_at timestamptz NOT NULL DEFAULT now();

DELETE FROM public.assessment_answers a
USING public.assessment_answers b
WHERE a.assessment_id = b.assessment_id
  AND a.question_key = b.question_key
  AND a.ctid < b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS assessment_answers_unique_question
  ON public.assessment_answers (assessment_id, question_key);

CREATE TABLE IF NOT EXISTS public.assessment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score integer NOT NULL DEFAULT 0,
  audience_score integer NOT NULL DEFAULT 0,
  content_score integer NOT NULL DEFAULT 0,
  distribution_score integer NOT NULL DEFAULT 0,
  operations_score integer NOT NULL DEFAULT 0,
  strategy_score integer NOT NULL DEFAULT 0,
  alignment_score integer NOT NULL DEFAULT 0,
  maturity_level integer NOT NULL DEFAULT 1,
  maturity_title text NOT NULL DEFAULT 'Observer',
  config_version text NOT NULL DEFAULT 'v1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_scores TO authenticated;
GRANT ALL ON public.assessment_scores TO service_role;
ALTER TABLE public.assessment_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own assessment scores" ON public.assessment_scores
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_assessment_scores_updated_at BEFORE UPDATE ON public.assessment_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.assessment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  section text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.assessment_events TO authenticated;
GRANT ALL ON public.assessment_events TO service_role;
ALTER TABLE public.assessment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own assessment events" ON public.assessment_events
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);