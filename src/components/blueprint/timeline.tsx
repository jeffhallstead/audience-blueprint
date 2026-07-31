import type { ReactNode } from "react";

export interface TimelineEntry {
  id: string;
  label: string;
  title: string;
  content: ReactNode;
}

/** Vertical milestone rail used by the roadmap. */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative space-y-10 border-l border-border pl-8">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className="absolute -left-[2.15rem] top-1.5 size-3 rounded-full border-2 border-brass bg-background"
            aria-hidden
          />
          <p className="text-eyebrow">{entry.label}</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">{entry.title}</h3>
          <div className="mt-4">{entry.content}</div>
        </li>
      ))}
    </ol>
  );
}
