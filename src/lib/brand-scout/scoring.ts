import { CATEGORIES, type CategoryId } from "@/lib/assessment/config";

export type DimensionScores = Record<CategoryId, number>;

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));

/** Clamp model-estimated dimension scores and recompute the weighted Publisher Index. */
export function normalizeTeardownScores(raw: Partial<Record<CategoryId, number>>) {
  const dims = {} as DimensionScores;
  let sum = 0;
  let weights = 0;
  for (const c of CATEGORIES) {
    const v = clamp(raw[c.id] ?? 0);
    dims[c.id] = v;
    sum += v * c.weight;
    weights += c.weight;
  }
  return { dimensions: dims, overall: Math.round(sum / weights) };
}
