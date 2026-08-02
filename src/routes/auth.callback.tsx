import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostAuthPath } from "@/lib/auth/post-auth";

export const Route = createFileRoute("/auth/callback")({
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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let retryTimer: number | undefined;
    let attempt = 0;

    const finishSignIn = async () => {
      if (!active || completedRef.current) return;

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const { data: userData, error } = await supabase.auth.getUser();
        if (!error && userData.user && active && !completedRef.current) {
          completedRef.current = true;
          navigate({ to: await resolvePostAuthPath(), replace: true });
          return;
        }
      }

      attempt += 1;
      if (attempt >= 20) {
        if (active) setFailed(true);
        return;
      }
      retryTimer = window.setTimeout(() => void finishSignIn(), 500);
    };

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void finishSignIn();
    });
    void finishSignIn();

    return () => {
      active = false;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      subscription.subscription.unsubscribe();
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
              Your Google account was selected, but a secure session was not returned. Please try again.
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