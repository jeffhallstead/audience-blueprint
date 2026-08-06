import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/** Shared shell for the public legal pages. */
export function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 px-5 py-10 sm:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" aria-label="Publisher Blueprint home">
          <Logo />
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link to="/pricing">Pricing</Link>
        </Button>
      </div>

      <header className="space-y-3">
        <p className="text-eyebrow">{eyebrow}</p>
        <h1 className="text-display text-3xl sm:text-4xl">{title}</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Last updated {updated}
        </p>
      </header>

      <article className="space-y-6 text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h2]:text-base [&_h2]:font-medium [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
        {children}
      </article>

      <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-foreground/60">Publisher Blueprint · by Jeff Hallstead</span>
          <Link to="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link to="/refund-policy" className="hover:text-foreground">
            Refund policy
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}
