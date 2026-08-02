import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/integrations/supabase/client";
import {
  completeOAuthFlow,
  isRecentOAuthFlow,
  recordOAuthStage,
} from "@/lib/auth/oauth-diagnostics";

const AUTH_RETRY_DELAYS_MS = [0, 300, 700, 1_200];

async function getValidatedUser() {
  const delays = isRecentOAuthFlow() ? AUTH_RETRY_DELAYS_MS : [0];
  for (const delay of delays) {
    if (delay > 0) await new Promise((resolve) => window.setTimeout(resolve, delay));
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) return data.user;
  }
  return null;
}

/** Protected subtree: client-only session gate + application chrome. */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = await getValidatedUser();
    if (!user) {
      recordOAuthStage("protected_route_rejected");
      throw redirect({ to: "/auth" });
    }
    recordOAuthStage("protected_route_entered");
    completeOAuthFlow();
    return { user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
