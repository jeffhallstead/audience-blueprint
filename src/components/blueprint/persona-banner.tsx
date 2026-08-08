import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveSalesPersona, type SalesPersona } from "@/lib/personas";
import { BookACallButton } from "@/lib/marketing/book-a-call";
import type { Blueprint } from "@/lib/blueprint/engine";

interface PersonaBannerProps {
  blueprint: Blueprint;
}

export function PersonaBanner({ blueprint }: PersonaBannerProps) {
  const weakest = blueprint.categories.find((c) => c.priority === 1);
  const persona = resolveSalesPersona(blueprint.maturity.level, weakest?.id);

  return (
    <PersonaBannerCard
      persona={persona}
      maturityLevel={blueprint.maturity.level}
      {...(weakest?.id ? { weakestCategory: weakest.id } : {})}
    />
  );
}

function PersonaBannerCard({
  persona,
  maturityLevel,
  weakestCategory,
}: {
  persona: SalesPersona;
  maturityLevel?: number;
  weakestCategory?: string;
}) {
  return (
    <div className="surface-panel border-l-4 border-l-primary p-6 sm:p-8">
      <div className="space-y-4">
        <p className="text-eyebrow">Your Publisher Index pattern: {persona.label}</p>
        <h2 className="text-display text-2xl leading-snug">{persona.headline}</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {persona.body} {persona.primaryOffer}.
        </p>
        {persona.cta.external ? (
          <BookACallButton
            surface="persona_banner"
            personaId={persona.id}
            {...(maturityLevel != null ? { maturityLevel } : {})}
            {...(weakestCategory ? { weakestCategory } : {})}
            label={persona.cta.label}
            size="sm"
          />
        ) : (
          <Button asChild size="sm">
            <Link to="/test">
              {persona.cta.label} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
