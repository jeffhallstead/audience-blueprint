import { useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ClipboardList, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { WIZARD_SECTIONS } from "@/lib/wizard-config";
import { sendWelcomeEmail } from "@/lib/email/welcome.functions";

export const Route = createFileRoute("/_authenticated/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome — Publisher Blueprint" },
      { name: "description", content: "Start your owned-audience readiness assessment in seven guided sections." },
      { property: "og:title", content: "Welcome — Publisher Blueprint" },
      { property: "og:description", content: "Start your owned-audience readiness assessment." },
    ],
  }),
  component: Welcome,
});

const FACTS = [
  { icon: Clock, label: "Approximately 12 minutes" },
  { icon: ClipboardList, label: "Seven diagnostic sections" },
  { icon: Users, label: "Best completed with your marketing lead" },
];

function Welcome() {
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <div className="space-y-4">
        <p className="text-eyebrow">Welcome</p>
        <h1 className="text-display text-4xl leading-tight sm:text-5xl">
          Let's establish where your organization stands today.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          The Blueprint assesses seven dimensions of owned-audience readiness. Answer candidly — the roadmap is only
          as useful as the honesty behind the inputs. You can revisit any section before submitting.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-3">
        {FACTS.map((fact) => (
          <li key={fact.label} className="rounded-lg border border-border bg-surface px-4 py-4">
            <fact.icon className="size-4 text-brass" />
            <p className="mt-3 text-sm leading-snug text-muted-foreground">{fact.label}</p>
          </li>
        ))}
      </ul>

      <DashboardCard eyebrow="What we'll cover" title="Seven sections">
        <ol className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {WIZARD_SECTIONS.map((section, index) => (
            <li key={section.id} className="flex gap-3 text-sm">
              <span className="tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
              <span>
                <span className="font-medium text-foreground">{section.title}</span>
                <span className="block text-xs text-muted-foreground">{section.summary}</span>
              </span>
            </li>
          ))}
        </ol>
      </DashboardCard>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/wizard">
            Start the assessment <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link to="/dashboard">Skip to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
