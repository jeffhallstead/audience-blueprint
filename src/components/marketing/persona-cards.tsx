import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CORE_SALES_PERSONAS } from "@/lib/personas";
import { Button } from "@/components/ui/button";

export function PersonaCards() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <h2 className="text-display text-3xl">Which of these sounds like you?</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your Publisher Index score and weakest category point to one of five common patterns. Each one has a different next step.
        </p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CORE_SALES_PERSONAS.map((persona) => (
          <div
            key={persona.id}
            className="surface-panel flex flex-col justify-between gap-5 p-6"
          >
            <div className="space-y-3">
              <p className="text-eyebrow">Pattern {persona.number}</p>
              <h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
                {persona.headline}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{persona.body}</p>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/auth" search={{ mode: "signup", plan: "test" }}>
                {persona.cta.label} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
