-- 1. Organization profile extensions
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS business_model text,
  ADD COLUMN IF NOT EXISTS domain text,
  ADD COLUMN IF NOT EXISTS profile_completeness integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS organizations_domain_idx ON public.organizations (domain);
CREATE INDEX IF NOT EXISTS organizations_owner_idx ON public.organizations (owner_id);

-- 2. Membership
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = _org_id AND owner_id = _user_id
  );
$$;

CREATE POLICY "Members read own membership"
  ON public.organization_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members insert own membership"
  ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members update own membership"
  ON public.organization_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members delete own membership"
  ON public.organization_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Audit log
CREATE TABLE IF NOT EXISTS public.organization_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  field text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organization_audit_org_idx ON public.organization_audit (organization_id, created_at DESC);

GRANT SELECT, INSERT ON public.organization_audit TO authenticated;
GRANT ALL ON public.organization_audit TO service_role;
ALTER TABLE public.organization_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read audit"
  ON public.organization_audit FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members write audit"
  ON public.organization_audit FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND public.is_org_member(organization_id, auth.uid()));

-- 4. Idempotent backfill
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT DISTINCT ON (o.owner_id) o.id, o.owner_id, 'owner'
FROM public.organizations o
ORDER BY o.owner_id, o.created_at ASC
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.organizations
SET domain = lower(regexp_replace(regexp_replace(website, '^https?://', ''), '^www\.', ''))
WHERE website IS NOT NULL AND website <> '' AND domain IS NULL;

UPDATE public.organizations
SET domain = split_part(domain, '/', 1)
WHERE domain IS NOT NULL AND domain LIKE '%/%';

UPDATE public.organizations SET profile_completeness = (
  (CASE WHEN COALESCE(name, '') <> '' THEN 1 ELSE 0 END)
  + (CASE WHEN COALESCE(website, '') <> '' THEN 1 ELSE 0 END)
  + (CASE WHEN COALESCE(industry, '') <> '' THEN 1 ELSE 0 END)
  + (CASE WHEN COALESCE(revenue_range, '') <> '' THEN 1 ELSE 0 END)
  + (CASE WHEN COALESCE(team_size, '') <> '' THEN 1 ELSE 0 END)
  + (CASE WHEN COALESCE(region, '') <> '' THEN 1 ELSE 0 END)
  + (CASE WHEN COALESCE(business_model, '') <> '' THEN 1 ELSE 0 END)
  + (CASE WHEN marketer_count IS NOT NULL THEN 1 ELSE 0 END)
) * 100 / 8;