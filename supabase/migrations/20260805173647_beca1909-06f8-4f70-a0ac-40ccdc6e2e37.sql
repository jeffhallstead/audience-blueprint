CREATE TYPE public.lead_outreach_status AS ENUM ('new', 'contacted', 'responded', 'meeting_booked', 'no_fit', 'nurtured');

CREATE TABLE public.lead_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.lead_outreach_status NOT NULL DEFAULT 'new',
  notes text,
  last_contacted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_outreach TO authenticated;
GRANT ALL ON public.lead_outreach TO service_role;

ALTER TABLE public.lead_outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lead outreach"
  ON public.lead_outreach
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_lead_outreach_updated_at
  BEFORE UPDATE ON public.lead_outreach
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();