/**
 * Re-derives the personalization figures published in marketing copy.
 *
 * Usage: bun scripts/verify-personalization.ts
 *
 * Samples the live rule engine across random Publisher Index™ score profiles
 * and counts distinct outputs. Exits non-zero if the engine can no longer
 * produce at least the numbers in `PERSONALIZATION_STATS`, which keeps the
 * public claims honest as rules change.
 */
import { generateBlueprint } from "../src/lib/blueprint/engine";
import { PERSONALIZATION_STATS } from "../src/lib/blueprint/personalization-stats";

const CATEGORIES = ["audience", "content", "distribution", "operations", "strategy", "alignment"] as const;

function maturityLevelFor(overall: number): number {
  if (overall >= 85) return 5;
  if (overall >= 70) return 4;
  if (overall >= 50) return 3;
  if (overall >= 30) return 2;
  return 1;
}

const sampleSize = Number(process.argv[2] ?? PERSONALIZATION_STATS.sampleSize);
const roadmaps = new Set<string>();
const blueprints = new Map<string, number>();
const opportunitySets = new Set<string>();
const quickWinSets = new Set<string>();
const longTermSets = new Set<string>();

for (let i = 0; i < sampleSize; i++) {
  const categories: Record<string, number> = {};
  let total = 0;
  for (const category of CATEGORIES) {
    const score = Math.floor(Math.random() * 101);
    categories[category] = score;
    total += score;
  }
  const overall = Math.round(total / CATEGORIES.length);
  const blueprint = generateBlueprint({
    overall,
    categories,
    maturityLevel: maturityLevelFor(overall),
    completedAt: null,
    organizationName: null,
  });

  const opportunities = blueprint.opportunities.map((item) => item.id).join(",");
  const quickWins = blueprint.quickWins.map((item) => item.id).join(",");
  const longTerm = blueprint.longTerm.map((item) => item.id).join(",");
  opportunitySets.add(opportunities);
  quickWinSets.add(quickWins);
  longTermSets.add(longTerm);
  roadmaps.add(
    blueprint.roadmap
      .map((phase) => `${phase.id}:${phase.priorities.map((priority) => priority.id).join("+")}`)
      .join("|"),
  );

  const key = [
    blueprint.tier,
    blueprint.categories.map((category) => category.band).join(""),
    blueprint.gaps.map((gap) => gap.id).join(","),
    blueprint.strengths.map((strength) => strength.id).join(","),
    opportunities,
    quickWins,
    longTerm,
    blueprint.resources.map((resource) => resource.id).join(","),
  ].join("|");
  blueprints.set(key, (blueprints.get(key) ?? 0) + 1);
}

// Chao1 lower-bound estimator for unseen configurations.
let singletons = 0;
let doubletons = 0;
for (const count of blueprints.values()) {
  if (count === 1) singletons++;
  else if (count === 2) doubletons++;
}
const chao1 = Math.round(blueprints.size + (singletons * (singletons - 1)) / (2 * (doubletons + 1)));

const measured = {
  roadmaps: roadmaps.size,
  blueprints: chao1,
  opportunitySets: opportunitySets.size,
  quickWinSets: quickWinSets.size,
  longTermSets: longTermSets.size,
};

console.log(`Sample size: ${sampleSize.toLocaleString("en-US")}`);
console.table(
  Object.entries(measured).map(([metric, value]) => ({
    metric,
    measured: value,
    published: PERSONALIZATION_STATS[metric as keyof typeof measured],
  })),
);

const shortfalls = Object.entries(measured).filter(
  ([metric, value]) => value < PERSONALIZATION_STATS[metric as keyof typeof measured],
);

if (shortfalls.length > 0) {
  console.error(
    `\nFAIL — published copy overstates the engine for: ${shortfalls.map(([metric]) => metric).join(", ")}.\n` +
      `Update src/lib/blueprint/personalization-stats.ts and the landing/pricing copy.`,
  );
  process.exit(1);
}

console.log("\nOK — every published figure is supported by the current rule engine.");
