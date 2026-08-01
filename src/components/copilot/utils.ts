import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Resolve an objective's configured icon name against lucide-react. */
export function objectiveIcon(name: string): LucideIcon {
  const registry = Icons as unknown as Record<string, LucideIcon>;
  return registry[name] ?? Icons.Sparkles;
}

export function downloadText(filename: string, content: string, type = "text/markdown") {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "publisher-blueprint-document"
  );
}
