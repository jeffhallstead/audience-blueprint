import { ProgressBar } from "./progress-bar";

/** Headline score with the publisher maturity ladder. */
export function ScoreCard({
  score,
  level,
  levels,
  levelIndex,
}: {
  score: number;
  level: string;
  levels: string[];
  levelIndex: number;
}) {
  return (
    <section className="surface-panel flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-eyebrow">Overall readiness</p>
          <p className="text-display mt-2 text-6xl leading-none">{score}</p>
          <p className="mt-2 text-xs text-muted-foreground">out of 100 · placeholder scoring</p>
        </div>
        <div className="text-right">
          <p className="text-eyebrow">Publisher level</p>
          <p className="mt-2 inline-flex rounded-full border border-brass/50 bg-brass/10 px-3 py-1 text-sm font-medium text-brass-foreground">
            {level}
          </p>
        </div>
      </div>

      <ProgressBar value={score} tone="brass" />

      <ol className="grid grid-cols-5 gap-1 text-center">
        {levels.map((item, index) => (
          <li key={item} className="space-y-2">
            <div
              className={`h-1 rounded-full ${index <= levelIndex ? "bg-brass" : "bg-muted"}`}
              aria-hidden
            />
            <span
              className={`block text-[10px] leading-tight ${
                index === levelIndex ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {item}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
