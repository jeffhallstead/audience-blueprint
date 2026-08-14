import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { ProgressBar } from "@/components/blueprint/progress-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IndexRadar } from "@/components/assessment/index-radar";
import { CATEGORIES, MATURITY_LEVELS } from "@/lib/assessment/config";
import { fetchLatestScores } from "@/lib/assessment/persistence";
import { PatternDetail } from "@/components/blueprint/pattern-summary";
import { PATTERN_EXPLAINER, resolvePublisherPattern } from "@/lib/publisher-patterns";

export const Route = createFileRoute("/_authenticated/results")({
  head: () => ({
    meta: [
      { title: "Your Publisher Index Results — Publisher Blueprint" },
      {
        name: "description",
        content: "Your Publisher Index score, six category scores, maturity level, strengths, and growth opportunities.",
      },
      { property: "og:title", content: "Publisher Index Results" },
      { property: "og:description", content: "Overall score, category breakdown, and maturity classification." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Results,
  errorComponent: ({ error }) => (
    <div role="alert" className="surface-panel p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <p className="text-sm text-muted-foreground">No assessment results found.</p>,
});

function Results() {
  const { data, isLoading } = useQuery({ queryKey: ["assessment", "scores"], queryFn: fetchLatestScores });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="surface-panel space-y-4 p-8 text-center">
        <h1 className="text-display text-2xl">No results yet</h1>
        <p className="text-sm text-muted-foreground">Complete the Publisher Index assessment to see your scores.</p>
        <Button asChild>
          <Link to="/wizard">Start assessment</Link>
        </Button>
      </div>
    );
  }

  const maturity = MATURITY_LEVELS.find((level) => level.level === data.maturityLevel) ?? MATURITY_LEVELS[0]!;
  const categories = CATEGORIES.map((category) => ({
    ...category,
    score: data.categories[category.id] ?? 0,
  }));
  const ranked = [...categories].sort((a, b) => b.score - a.score);
  const strengths = ranked.slice(0, 2);
  const opportunities = ranked.slice(-2).reverse();
  const pattern = resolvePublisherPattern(data.maturityLevel, data.categories);
  const assessedOn = data.completedAt
    ? new Date(data.completedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Publisher Index"
        title={data.organizationName ? `${data.organizationName} — assessment results` : "Your assessment results"}
        description={`Assessed ${assessedOn}. Scores are calculated from your seven-section diagnostic and drive every recommendation in your Blueprint.`}
        actions={
          <Button asChild>
            <Link to="/dashboard">
              Continue to dashboard <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      <section className="surface-panel grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_1.1fr]">
        <div className="space-y-6">
          <div>
            <p className="text-eyebrow">Overall Publisher Index</p>
            <p className="text-display mt-2 text-7xl leading-none">{data.overall}</p>
            <p className="mt-2 text-xs text-muted-foreground">out of 100</p>
          </div>
          <ProgressBar value={data.overall} tone="brass" />
          <div className="space-y-3">
            <p className="inline-flex rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Publisher Maturity: Level {maturity.level} — {maturity.title}
            </p>
            <p className="text-sm leading-relaxed text-foreground">{maturity.summary}</p>
            <p className="text-xs text-muted-foreground">{PATTERN_EXPLAINER.indexLine}</p>
          </div>
          <ol className="grid grid-cols-5 gap-1 text-center">
            {MATURITY_LEVELS.map((level) => (
              <li key={level.level} className="space-y-2">
                <div
                  className={`h-1 rounded-full ${level.level <= maturity.level ? "bg-primary" : "bg-muted"}`}
                  aria-hidden
                />
                <span
                  className={`block text-[10px] leading-tight ${
                    level.level === maturity.level ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {level.title}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <p className="text-eyebrow">Category breakdown</p>
          <IndexRadar data={categories.map((category) => ({ label: category.label, score: category.score }))} />
        </div>
      </section>

      <PatternDetail pattern={pattern} />

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardCard eyebrow="Category scores" title="Where you stand">
          <div className="space-y-4">
            {categories.map((category) => (
              <ProgressBar key={category.id} label={category.label} value={category.score} />
            ))}
          </div>
        </DashboardCard>

        <div className="space-y-5">
          <DashboardCard eyebrow="Strengths" title="What is already working" accent>
            <ul className="space-y-3">
              {strengths.map((category) => (
                <li key={category.id} className="flex gap-3 text-sm">
                  <TrendingUp className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="font-medium text-foreground">
                      {category.label} · {category.score}
                    </span>
                    <span className="block text-xs text-muted-foreground">{category.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard eyebrow="Growth opportunities" title="Where the gap is widest">
            <ul className="space-y-3">
              {opportunities.map((category) => (
                <li key={category.id} className="flex gap-3 text-sm">
                  <TrendingDown className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                  <span>
                    <span className="font-medium text-foreground">
                      {category.label} · {category.score}
                    </span>
                    <span className="block text-xs text-muted-foreground">{category.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </DashboardCard>
        </div>
      </div>

      <DashboardCard
        eyebrow={`Publisher Maturity: Level ${maturity.level} — ${maturity.title}`}
        title="What this level means"
        footer={PATTERN_EXPLAINER.blueprintLine}
      >
        <ul className="space-y-2">
          {maturity.characteristics.map((item) => (
            <li key={item} className="text-sm text-muted-foreground">
              · {item}
            </li>
          ))}
        </ul>
        <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <div>
            <p className="text-eyebrow">Strategic focus</p>
            <p className="mt-1 text-sm text-foreground">{maturity.strategicFocus}</p>
          </div>
          <div>
            <p className="text-eyebrow">Recommended next step</p>
            <p className="mt-1 text-sm text-foreground">{maturity.nextStep}</p>
          </div>
        </div>
      </DashboardCard>

      <div className="flex justify-end">
        <Button asChild size="lg">
          <Link to="/dashboard">
            Continue to dashboard <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}
