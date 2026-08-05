CREATE TABLE public.entitlement_grants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('blueprint','os')),
  environment text NOT NULL DEFAULT 'sandbox',
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX entitlement_grants_user_env_idx ON public.entitlement_grants (user_id, environment);

GRANT SELECT ON public.entitlement_grants TO authenticated;
GRANT ALL ON public.entitlement_grants TO service_role;

ALTER TABLE public.entitlement_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entitlement grants"
ON public.entitlement_grants FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_entitlement_grants_updated_at
BEFORE UPDATE ON public.entitlement_grants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();