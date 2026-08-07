import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/events/track.functions";
import { cn } from "@/lib/utils";

/** Single source of truth for the consulting contact destination. */
export const CONTACT_URL = "https://jeffhallstead.com/contact";

export type BookCallSurface =
  | "homepage_hero"
  | "homepage_closing"
  | "homepage_persona_card"
  | "persona_selector"
  | "persona_banner"
  | "dashboard_locked"
  | "results"
  | "pricing_redirect"
  | "billing_panel"
  | "legal_header"
  | "app_shell";

export interface BookCallContext {
  surface: BookCallSurface;
  personaId?: string;
  maturityLevel?: number;
  weakestCategory?: string;
}

/**
 * Records booking intent, then opens the consulting contact page. Tracking is
 * best-effort and only possible for signed-in users; it never blocks the link.
 */
export async function trackBookCallClick(ctx: BookCallContext) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await trackEvent({
      data: {
        type: "consulting.book_call_clicked",
        context: { surface: ctx.surface, url: CONTACT_URL },
        payload: {
          ...(ctx.personaId ? { personaId: ctx.personaId } : {}),
          ...(ctx.maturityLevel != null ? { maturityLevel: ctx.maturityLevel } : {}),
          ...(ctx.weakestCategory ? { weakestCategory: ctx.weakestCategory } : {}),
        },
      },
    });
  } catch {
    // Analytics must never break the outbound link.
  }
}

interface BookACallButtonProps extends BookCallContext {
  label?: ReactNode;
  size?: "sm" | "lg" | "default";
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
  showArrow?: boolean;
  /** Extra analytics fired alongside the funnel event. */
  onTrack?: () => void;
}

/** Outbound "Book a call" CTA with funnel attribution. */
export function BookACallButton({
  label = "Book a call",
  size = "default",
  variant = "default",
  className,
  showArrow = true,
  onTrack,
  ...ctx
}: BookACallButtonProps) {
  return (
    <Button asChild size={size} variant={variant} className={cn(className)}>
      <a
        href={CONTACT_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          onTrack?.();
          void trackBookCallClick(ctx);
        }}
      >
        {label}
        {showArrow ? <ArrowRight className="size-4" aria-hidden /> : null}
      </a>
    </Button>
  );
}
