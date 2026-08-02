import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostAuthPath } from "@/lib/auth/post-auth";
import {
  recordOAuthStage,
} from "@/lib/auth/oauth-diagnostics";

export const Route = createFileRoute("/oauth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Completing sign in — Publisher Blueprint" },
      {
        name: "description",
        content: "Complete your secure sign in to Publisher Blueprint.",
      },
      { property: "og:title", content: "Completing sign in — Publisher Blueprint" },
      {
        property: "og:description",
        content: "Complete your secure sign in to Publisher Blueprint.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const completedRef = useRef(false);
  const checkingRef = useRef(false);
  const [failed, setFailed] = useState(false);
  const [failureMessage, setFailureMessage] = useState(
    "Your Google account was selected, but a secure session was not returned. Please try again.",
  );

  useEffect(() => {
    let active = true;
    let retryTimer: number | undefined;
    const startedAt = Date.now();
    const timeoutMs = 60_000;

    const callbackUrl = new URL(window.location.href);
    const providerError = callbackUrl.searchParams.get("error") ??
      new URLSearchParams(callbackUrl.hash.slice(1)).get("error");
    if (providerError) {
      recordOAuthStage("callback_provider_error");
      setFailureMessage("Google sign-in was cancelled or could not be completed. Please try again.");
      setFailed(true);
      return () => {
        active = false;
      };
    }

    recordOAuthStage("callback_mounted");

    const finishSignIn = async () => {
      if (!active || completedRef.current || checkingRef.current) return;
      checkingRef.current = true;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          recordOAuthStage("callback_session_found");
          const { data: userData, error } = await supabase.auth.getUser();
          if (!error && userData.user && active && !completedRef.current) {
            completedRef.current = true;
            recordOAuthStage("callback_user_validated");
            const destination = await resolvePostAuthPath();
            navigate({ to: destination, replace: true });
            return;
          }
        }

        if (Date.now() - startedAt >= timeoutMs) {
          recordOAuthStage("callback_timeout");
          if (active) setFailed(true);
          return;
        }
      } finally {
        checkingRef.current = false;
      }
      retryTimer = window.setTimeout(() => void finishSignIn(), 500);
    };

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void finishSignIn();
    });
    void finishSignIn();

    const resume = () => {
      recordOAuthStage("callback_resumed");
      void finishSignIn();
    };
    window.addEventListener("pageshow", resume);
    document.addEventListener("visibilitychange", resume);

    return () => {
      active = false;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      subscription.subscription.unsubscribe();
      window.removeEventListener("pageshow", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        {failed ? (
          <div className="space-y-4">
            <h1 className="text-display text-3xl">Sign in could not be completed</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {failureMessage}
            </p>
            <Button asChild className="w-full">
              <Link to="/auth">Return to sign in</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4" aria-live="polite">
            <LoaderCircle className="mx-auto size-6 animate-spin text-primary" aria-hidden="true" />
            <h1 className="text-display text-3xl">Completing your sign in</h1>
            <p className="text-sm text-muted-foreground">Securely connecting your Google account…</p>
          </div>
        )}
      </div>
    </main>
  );
}