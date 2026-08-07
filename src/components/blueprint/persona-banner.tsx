import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveSalesPersona, type SalesPersona } from "@/lib/personas";
import type { Blueprint } from "@/lib/blueprint/engine";

interface PersonaBannerProps {
  blueprint: Blueprint;
}

export function PersonaBanner({ blueprint }: PersonaBannerProps) {
  const weakest = blueprint.categories.find((c) => c.priority === 1);
  const persona = resolveSalesPersona(blueprint.maturity.level, weakest?.id);

  return <PersonaBannerCard persona={persona} />;
}

function PersonaBannerCard({ persona }: { persona: SalesPersona }) {
  const isExternal = persona.cta.external;
  return (
    <div className="surface-panel border-l-4 border-l-primary p-6 sm:p-8">
      <div className="space-y-4">
        <p className="text-eyebrow">Your Publisher Index pattern: {persona.label}</p>
        <h2 className="text-display text-2xl leading-snug">{persona.headline}</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {persona.body} {persona.primaryOffer}.
        </p>
        {isExternal ? (
          <Button asChild size="sm">
            <a
              href={persona.cta.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {persona.cta.label} <ArrowRight className="size-4" aria-hidden />
            </a>
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link to={persona.cta.href}>
              {persona.cta.label} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
