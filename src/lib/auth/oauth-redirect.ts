import { supabase } from "@/integrations/supabase/client";

/**
 * Full-page OAuth return handler.
 *
 * On mobile the Lovable auth helper cannot use a popup, so it redirects the
 * whole page to the broker and comes back to the app origin carrying the
 * tokens in the URL (hash on some paths, query string on others). Nothing in
 * the SPA consumed those, so mobile sign-in appeared to do nothing. This
 * reads them once on load, establishes the session, and scrubs the URL.
 */
export async function consumeOAuthRedirect(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  const hashParams = new URLSearchParams(hash);
  const queryParams = new URLSearchParams(window.location.search);

  const accessToken = hashParams.get("access_token") ?? queryParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token") ?? queryParams.get("refresh_token");
  if (!accessToken || !refreshToken) return false;

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Remove the tokens from the address bar either way.
  for (const key of ["access_token", "refresh_token", "expires_in", "expires_at", "token_type", "provider_token", "state"]) {
    queryParams.delete(key);
  }
  const cleanedQuery = queryParams.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${cleanedQuery ? `?${cleanedQuery}` : ""}`,
  );

  return !error;
}
