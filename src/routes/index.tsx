import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, LineChart, Layers } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostAuthPath } from "@/lib/auth/post-auth";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Publisher Blueprint — Executive Readiness Platform" },
      {
        name: "description",
        content:
          "Assess your organization's readiness to build an owned audience through branded entertainment, and receive a personalized 90-day strategic roadmap.",
      },
      { property: "og:title", content: "Publisher Blueprint — Executive Readiness Platform" },
      {
        property: "og:description",
        content:
          "A premium executive assessment that turns owned-audience ambition into a sequenced, accountable roadmap.",
      },
    ],
  }),
  component: Landing,
});

const PILLARS = [
  {
    icon: Layers,
    title: "Seven-dimension diagnostic",
    body: "Company, audience, content, distribution, operations, goals, and constraints assessed in one structured pass.",
  },
  {
    icon: LineChart,
    title: "Publisher maturity score",
    body: "A defensible readiness score and maturity level you can present to the executive committee.",
  },
  {
    icon: ShieldCheck,
    title: "Sequenced 90-day roadmap",
    body: "Named owners, month-by-month initiatives, and the risks worth escalating now.",
  },
];

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  // OAuth returns the browser here (a public URL). Forward an authenticated
  // visitor to the right in-app surface instead of showing marketing copy.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled || !data.session) return;
      setSignedIn(true);
      navigate({ to: await resolvePostAuthPath(), replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/pricing">Pricing</Link>
          </Button>
          {signedIn ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>

              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create account
                </Link>
              </Button>
            </>
          )}
        </div>
      </header>



      <main>
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 sm:pt-24">
          <p className="text-eyebrow">Publisher Blueprint™</p>
          <h1 className="text-display mt-6 max-w-3xl text-5xl leading-[1.05] sm:text-6xl">
            Stop renting attention. <span className="italic">Build an audience you own.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            A structured executive assessment that measures your organization's readiness to build an owned
            audience through branded entertainment — and returns a personalized strategic roadmap.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>
                Begin your blueprint <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Approximately 12 minutes · Seven sections · Confidential</p>
        </section>

        <section className="border-y border-border bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="space-y-3">
                <pillar.icon className="size-5 text-brass" />
                <h2 className="text-sm font-semibold tracking-tight text-foreground">{pillar.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="surface-panel flex flex-col items-start justify-between gap-6 p-10 sm:flex-row sm:items-center">
            <div className="max-w-xl space-y-2">
              <h2 className="text-display text-3xl">Your blueprint takes one sitting.</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Answer seven sections and receive a scored executive dashboard, prioritized recommendations, and a
                sequenced 90-day roadmap.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start now <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Publisher Blueprint™</span>
          <nav className="flex flex-wrap gap-4">
            <Link to="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link to="/refund-policy" className="hover:text-foreground">
              Refund policy
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
