CREATE TABLE public.user_integration_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('airtable','asana')),
  token_ciphertext text NOT NULL,
  airtable_base_id text,
  account_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

GRANT ALL ON public.user_integration_credentials TO service_role;
ALTER TABLE public.user_integration_credentials ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_user_integration_credentials_updated_at
BEFORE UPDATE ON public.user_integration_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();