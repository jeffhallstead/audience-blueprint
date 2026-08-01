import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { resolvePostAuthPath } from "@/lib/auth/post-auth";


const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid work email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  fullName: z.string().trim().max(120).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Publisher Blueprint" },
      { name: "description", content: "Access your executive owned-audience readiness blueprint and roadmap." },
      { property: "og:title", content: "Sign in — Publisher Blueprint" },
      { property: "og:description", content: "Access your executive owned-audience readiness blueprint." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const navigatedRef = useRef(false);

  const goToApp = useCallback(async () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    navigate({ to: await resolvePostAuthPath(), replace: true });
  }, [navigate]);

  // Navigate off this page whenever a session actually exists — on mount, and
  // whenever one arrives later (OAuth popup completing, token exchange, etc.).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void goToApp();
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        void goToApp();
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, [goToApp]);


  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = credentialsSchema.safeParse({ email, password, fullName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }

    setPending(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/welcome`,
            data: { full_name: parsed.data.fullName ?? "" },
          },
        });
        if (error) throw error;
        // Auto-confirm is enabled, so a session is returned immediately. The
        // inbox screen remains only as a fallback if that ever changes.
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
        await goToApp();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        await goToApp();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setPending(false);
    }
  }

  async function handleGoogle() {
    setGooglePending(true);
    try {
      // Resolves when the OAuth tab/popup posts back, is closed, or is blocked.
      // No client-side timeout: on mobile the provider opens a full tab and a
      // sign-in can legitimately take minutes.
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        // The session may still have landed via the auth-state listener.
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          await goToApp();
          return;
        }
        toast.error(result.error.message || "Google sign-in failed. Please try again.");
        return;
      }
      if (result.redirected) return;
      await goToApp();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Google sign-in failed. Please try again.",
      );
    } finally {
      if (!navigatedRef.current) setGooglePending(false);
    }
  }




  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 lg:flex">
        <Link to="/">
          <Logo inverted />
        </Link>
        <div className="max-w-md space-y-5">
          <h2 className="text-display text-4xl leading-tight text-sidebar-foreground">
            The most valuable audience is the one you don't have to rent.
          </h2>
          <p className="text-sm leading-relaxed text-sidebar-foreground/70">
            Seven diagnostic sections. One executive readiness score. A sequenced 90-day roadmap your leadership team
            can act on immediately.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">Confidential · Executive strategy platform</p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          {checkEmail ? (
            <div className="space-y-3">
              <h1 className="text-display text-3xl">Check your inbox</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Confirm
                your address to open your blueprint.
              </p>
              <Button variant="outline" onClick={() => setCheckEmail(false)} className="mt-2">
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-eyebrow">{isSignUp ? "Create account" : "Welcome back"}</p>
                <h1 className="text-display text-3xl">
                  {isSignUp ? "Begin your blueprint" : "Sign in to continue"}
                </h1>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogle}
                disabled={googlePending || pending}
              >
                {googlePending ? "Connecting to Google…" : "Continue with Google"}
              </Button>


              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp ? (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Jordan Ellis"
                      autoComplete="name"
                    />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
                </Button>
              </form>

              <p className="text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "New to the platform?"}{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline underline-offset-4"
                  onClick={() => setIsSignUp((value) => !value)}
                >
                  {isSignUp ? "Sign in" : "Create an account"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
