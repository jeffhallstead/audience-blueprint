/**
 * Published personalization figures used in public marketing copy.
 *
 * These are derived from the live rule engine, not asserted by hand. Re-derive
 * them with `bun scripts/verify-personalization.ts` after any change to
 * `rules.ts` or `engine.ts`; the script fails if the engine can no longer
 * produce at least these numbers, so the claims on the landing and pricing
 * pages cannot silently drift.
 */
export const PERSONALIZATION_STATS = {
  /** Distinct 90-day roadmaps (tier template + score-driven phase priorities). */
  roadmaps: 5502,
  /** Distinct full blueprint configurations, Chao1 lower-bound estimate. */
  blueprints: 250000,
  /** Distinct priority-opportunity sets. */
  opportunitySets: 242,
  /** Distinct quick-win sets. */
  quickWinSets: 186,
  /** Distinct long-term-move sets. */
  longTermSets: 157,
  /** Sample size behind the published figures. */
  sampleSize: 2000000,
} as const;

/** "5,502" style formatting for display in copy. */
export function formatStat(value: number): string {
  return value.toLocaleString("en-US");
}
