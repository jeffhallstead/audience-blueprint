import { supabase } from "@/integrations/supabase/client";

export type PostAuthPath = "/welcome" | "/dashboard";

/**
 * Where a freshly authenticated user should land.
 *
 * First-timers (no recorded Welcome visit) get the Welcome screen; everyone
 * else goes straight to the dashboard. Falls back to Welcome when the profile
 * row can't be read, since it is the safer, non-empty landing surface.
 */
export async function resolvePostAuthPath(): Promise<PostAuthPath> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return "/welcome";

    const { data } = await supabase
      .from("profiles")
      .select("welcome_email_sent_at")
      .eq("id", userId)
      .maybeSingle();

    return data?.welcome_email_sent_at ? "/dashboard" : "/welcome";
  } catch {
    return "/welcome";
  }
}
