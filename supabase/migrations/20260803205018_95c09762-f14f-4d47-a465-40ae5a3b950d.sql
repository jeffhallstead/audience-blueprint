-- 1. Lock down SECURITY DEFINER / internal functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.platform_events_immutable() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.platform_events_no_delete() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.entitlement_tier(uuid, text) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid, text) FROM anon, authenticated, public;

-- Used inside RLS policies and by the admin console: signed-in only, never anonymous.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE ALL ON FUNCTION public.is_org_member(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;

-- 2. integration_outbox: explicit fail-closed policies
GRANT SELECT ON public.integration_outbox TO authenticated;
GRANT ALL ON public.integration_outbox TO service_role;

DROP POLICY IF EXISTS "Admins read integration outbox" ON public.integration_outbox;
CREATE POLICY "Admins read integration outbox"
ON public.integration_outbox FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "No client writes to integration outbox" ON public.integration_outbox;
CREATE POLICY "No client writes to integration outbox"
ON public.integration_outbox FOR ALL TO authenticated
USING (false) WITH CHECK (false);

-- 3. user_integration_credentials: owner-scoped, ciphertext never readable
REVOKE ALL ON public.user_integration_credentials FROM anon, authenticated;
GRANT SELECT (id, user_id, provider, airtable_base_id, account_label, created_at, updated_at)
  ON public.user_integration_credentials TO authenticated;
GRANT DELETE ON public.user_integration_credentials TO authenticated;
GRANT ALL ON public.user_integration_credentials TO service_role;

DROP POLICY IF EXISTS "Users read own integration connections" ON public.user_integration_credentials;
CREATE POLICY "Users read own integration connections"
ON public.user_integration_credentials FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own integration connections" ON public.user_integration_credentials;
CREATE POLICY "Users delete own integration connections"
ON public.user_integration_credentials FOR DELETE TO authenticated
USING (auth.uid() = user_id);