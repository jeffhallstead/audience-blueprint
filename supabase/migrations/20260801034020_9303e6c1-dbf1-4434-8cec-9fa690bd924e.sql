-- ============ ai_sessions ============
CREATE TABLE public.ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE SET NULL,
  objective text NOT NULL DEFAULT 'ask',
  title text NOT NULL DEFAULT 'New conversation',
  status text NOT NULL DEFAULT 'active',
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_sessions TO authenticated;
GRANT ALL ON public.ai_sessions TO service_role;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai sessions" ON public.ai_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ai_sessions_user_updated_idx ON public.ai_sessions (user_id, updated_at DESC);

-- ============ ai_messages ============
CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.ai_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  message_key text,
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  content text NOT NULL DEFAULT '',
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai messages" ON public.ai_messages FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ai_messages_session_created_idx ON public.ai_messages (session_id, created_at);
CREATE UNIQUE INDEX ai_messages_session_key_idx ON public.ai_messages (session_id, message_key) WHERE message_key IS NOT NULL;

-- ============ generated_documents ============
CREATE TABLE public.generated_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.ai_sessions(id) ON DELETE SET NULL,
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE SET NULL,
  parent_document_id uuid REFERENCES public.generated_documents(id) ON DELETE SET NULL,
  kind text NOT NULL,
  title text NOT NULL,
  summary text,
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  markdown text NOT NULL DEFAULT '',
  model text,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'saved',
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_documents TO authenticated;
GRANT ALL ON public.generated_documents TO service_role;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own generated documents" ON public.generated_documents FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX generated_documents_user_created_idx ON public.generated_documents (user_id, created_at DESC);
CREATE INDEX generated_documents_kind_idx ON public.generated_documents (user_id, kind, created_at DESC);

-- ============ saved_recommendations ============
CREATE TABLE public.saved_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.generated_documents(id) ON DELETE SET NULL,
  session_id uuid REFERENCES public.ai_sessions(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'strategy',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  impact text NOT NULL DEFAULT 'medium',
  effort text NOT NULL DEFAULT 'medium',
  source text NOT NULL DEFAULT 'copilot',
  status text NOT NULL DEFAULT 'saved',
  favorite boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_recommendations TO authenticated;
GRANT ALL ON public.saved_recommendations TO service_role;
ALTER TABLE public.saved_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saved recommendations" ON public.saved_recommendations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX saved_recommendations_user_idx ON public.saved_recommendations (user_id, created_at DESC);

-- ============ prompt_templates ============
CREATE TABLE public.prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_system boolean NOT NULL DEFAULT false,
  slug text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  body text NOT NULL,
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_templates TO authenticated;
GRANT ALL ON public.prompt_templates TO service_role;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read system prompt templates" ON public.prompt_templates FOR SELECT TO authenticated
  USING (is_system = true AND user_id IS NULL);
CREATE POLICY "own prompt templates select" ON public.prompt_templates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "own prompt templates insert" ON public.prompt_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_system = false);
CREATE POLICY "own prompt templates update" ON public.prompt_templates FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND is_system = false);
CREATE POLICY "own prompt templates delete" ON public.prompt_templates FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE UNIQUE INDEX prompt_templates_system_slug_idx ON public.prompt_templates (slug) WHERE user_id IS NULL;

-- ============ user_feedback ============
CREATE TABLE public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid,
  rating text NOT NULL DEFAULT 'up',
  comment text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_feedback TO authenticated;
GRANT ALL ON public.user_feedback TO service_role;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user feedback" ON public.user_feedback FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE UNIQUE INDEX user_feedback_target_idx ON public.user_feedback (user_id, target_type, target_id);

-- ============ updated_at triggers ============
CREATE TRIGGER update_ai_sessions_updated_at BEFORE UPDATE ON public.ai_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_messages_updated_at BEFORE UPDATE ON public.ai_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_generated_documents_updated_at BEFORE UPDATE ON public.generated_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_saved_recommendations_updated_at BEFORE UPDATE ON public.saved_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_feedback_updated_at BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ seed: system prompt library ============
INSERT INTO public.prompt_templates (user_id, is_system, slug, category, title, description, body) VALUES
(NULL, true, 'audience-research', 'Research', 'Audience research brief',
 'Interrogate who your owned audience actually is before you publish to them.',
 'Act as a senior audience researcher. Using our organization profile and Publisher Index™ results, produce an audience research brief: three prioritized audience segments, the job each is hiring content to do, where they already spend attention, the questions they ask before buying, and the three research methods we should run first. State any assumption you had to make.'),
(NULL, true, 'newsletter-franchise', 'Newsletter', 'Newsletter franchise plan',
 'Design a flagship newsletter that compounds a first-party subscriber base.',
 'Act as an editorial director. Design a flagship newsletter franchise for our organization: name, promise, target reader, section structure, cadence, first six issue topics, subscriber acquisition plan, and the two metrics that prove it is working. Keep it to a one-page plan.'),
(NULL, true, 'linkedin-executive', 'LinkedIn', 'Executive LinkedIn cadence',
 'Turn a named executive into a credible category voice.',
 'Act as an executive ghostwriter. Build a four-week LinkedIn cadence for our senior executive: three recurring post formats, ten specific post angles drawn from our strategic priorities, a hook pattern for each, and a weekly production ritual that takes the executive under 45 minutes.'),
(NULL, true, 'podcast-planning', 'Podcast', 'Podcast concept and season plan',
 'Plan a recurring show rather than a one-off episode.',
 'Act as a branded podcast showrunner. Propose one podcast concept aligned with our business objectives: format, host, episode length, guest criteria, an eight-episode season one arc, the distribution plan, and the operational cost of sustaining it. Flag the biggest risk to consistency.'),
(NULL, true, 'video-scripting', 'Video', 'Video script framework',
 'A repeatable script structure for episodic video.',
 'Act as a video producer. Write a reusable script framework for our episodic video series: cold open, thesis, three-beat body, proof, and call to action — then apply it to one concrete episode drawn from our strategic priorities. Include on-screen direction.'),
(NULL, true, 'executive-presentation', 'Executive', 'Executive presentation outline',
 'A board-ready narrative for the owned-audience investment.',
 'Act as a strategy consultant presenting to a board. Outline a twelve-slide executive presentation making the case for our owned-audience program: current maturity, the cost of the status quo, the strategic opportunity, the recommended initiatives, the 90-day roadmap, the investment required, and the success metrics. One headline plus three supporting points per slide.'),
(NULL, true, 'repurposing-workflow', 'Operations', 'Content repurposing workflow',
 'Get more surface area from every flagship asset.',
 'Act as a content operations lead. Design a repurposing workflow that turns one flagship asset into eight derivative assets across our active channels. Specify who owns each step, the tooling, the turnaround time, and the quality bar that stops us shipping filler.'),
(NULL, true, 'interview-series', 'Research', 'Executive interview series',
 'A recurring interview franchise that builds industry relationships.',
 'Act as an editorial strategist. Design a recurring executive interview series: the thesis that makes it worth watching, guest selection criteria, the five questions asked of every guest, the format and length, how each episode is distributed, and how the series compounds into a proprietary data asset over twelve months.');