DROP POLICY IF EXISTS "Members insert own membership" ON public.organization_members;
DROP POLICY IF EXISTS "Members update own membership" ON public.organization_members;
DROP POLICY IF EXISTS "Members delete own membership" ON public.organization_members;

CREATE POLICY "Owners can add members"
  ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id AND owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners can update members"
  ON public.organization_members FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id AND owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id AND owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Members can leave organization"
  ON public.organization_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id AND owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );