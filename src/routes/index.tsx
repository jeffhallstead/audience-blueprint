import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, LineChart, Layers } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PersonalizationProof } from "@/components/marketing/personalization-proof";
import { PersonaCards } from "@/components/marketing/persona-cards";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Publisher Blueprint — Strategy OS for Publishers" },
      {
        name: "description",
        content:
          "Publisher Blueprint is a premium executive assessment that scores your publishing maturity and delivers a personalized 90-day strategic roadmap.",
      },
      { property: "og:title", content: "Publisher Blueprint — Strategy OS for Publishers" },
      {
        property: "og:description",
        content:
          "A premium executive assessment that scores publishing maturity and delivers a sequenced 90-day roadmap.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://blueprint.jeffhallstead.com/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://blueprint.jeffhallstead.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: "Publisher Blueprint",
              url: "https://blueprint.jeffhallstead.com/",
              description:
                "A premium executive assessment that scores publishing maturity and delivers a sequenced 90-day strategic roadmap.",
            },
            {
              "@type": "Organization",
              name: "Momentive Ventures LLC",
              alternateName: "Publisher Blueprint",
              url: "https://blueprint.jeffhallstead.com/",
              description:
                "Strategic assessment and 90-day roadmap platform for newsletter publishers and content entrepreneurs.",
            },
          ],
        }),
      },
    ],
  }),

  component: Landing,
});

const PILLARS = [
  {
    icon: Layers,
    title: "Know exactly where your content strategy is strong and where it's leaking.",
    body: "Seven dimensions — company, audience, content, distribution, operations, goals, and constraints — assessed in one structured pass.",
  },
  {
    icon: LineChart,
    title: "A score that tells you where you stand — and how far you are from where you need to be.",
    body: "Your Publisher Index score places you on a five-tier maturity scale and identifies the highest-leverage gap to close first.",
  },
  {
    icon: ShieldCheck,
    title: "A 90-day roadmap you can act on, not file away.",
    body: "Named owners, month-by-month initiatives, and the risks worth escalating now.",
  },
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  // Session-aware header only. OAuth completion and navigation are owned by
  // /auth and /oauth/callback so this public route cannot race them.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });

    return () => subscription.subscription.unsubscribe();
  }, []);


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
          <h1 className="text-display mt-6 max-w-4xl text-4xl leading-[1.1] sm:text-5xl">
            Publisher Blueprint: Strategy OS for Publishers
          </h1>
          <p className="text-display mt-6 max-w-3xl text-2xl leading-snug text-foreground sm:text-3xl">
            Most brands rent their audience. The ones that win, own it.
          </p>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            You&rsquo;re spending to reach people who disappear the moment the budget stops. The Publisher Test scores
            your content operation across seven dimensions, shows you exactly where you&rsquo;re leaking audience, and
            hands you a prioritized 90-day plan to fix it.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup", plan: "test" }}>
                Begin the Publisher Test — it&rsquo;s free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Approximately 12 minutes · Seven sections · Confidential · by Jeff Hallstead
          </p>
        </section>

        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-3xl space-y-6 px-6 py-20 text-base leading-relaxed text-muted-foreground">
            <p>
              Most brand content strategies are built around campaigns, not infrastructure. The ad budget runs, the
              audience disappears, and the cycle starts over.
            </p>
            <p>
              I spent 20 years building the audience measurement systems that help the TV and advertising industry
              understand who was watching — and how viewing behavior translated to action. That work taught me that the
              gap between brands that rent audiences and brands that own them is real, measurable, and closable. The
              Publisher Test is designed to tell you exactly where your brand stands on that continuum.
            </p>
            <p className="text-xs uppercase tracking-widest text-foreground">Jeff Hallstead</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-display text-3xl">Your blueprint takes one sitting.</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="space-y-3">
                <pillar.icon className="size-5 text-brass" />
                <h3 className="text-sm font-semibold tracking-tight text-foreground">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
              </div>
            ))}
          </div>
        </section>

        <PersonalizationProof />

        <section className="border-y border-border">

          <div className="mx-auto max-w-3xl px-6 py-20">
            <p className="text-display text-2xl leading-snug sm:text-3xl">
              Brands that stay in campaign mode keep spending without building an audience. Every dollar goes toward
              renting one that belongs to the platform the moment the budget stops. The Publisher Test tells you what it
              would take to change that.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="surface-panel flex flex-col items-start justify-between gap-6 p-10 sm:flex-row sm:items-center">
            <div className="max-w-xl space-y-2">
              <h2 className="text-display text-3xl">Start with the free Publisher Test.</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Answer seven sections and receive a scored executive dashboard, prioritized recommendations, and a
                sequenced 90-day roadmap.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup", plan: "test" }}>
                Begin the Publisher Test — it&rsquo;s free <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Publisher Blueprint · by Jeff Hallstead</span>
          <nav className="flex flex-wrap gap-4">
            <a
              href="https://jeffhallstead.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Jeff Hallstead Consulting
            </a>
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
