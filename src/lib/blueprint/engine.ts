/**
 * Publisher Blueprint — deterministic rule engine.
 *
 * Input: Publisher Index scores. Output: the full blueprint the dashboard,
 * roadmap, and resources screens render. This module contains selection and
 * ranking logic only — every string, threshold, and template lives in
 * `rules.ts`. A future AI service can replace `generateBlueprint` wholesale
 * while keeping this return shape, so no UI change is required.
 */

import { CATEGORIES, MATURITY_LEVELS, type CategoryId, type MaturityLevelConfig } from "@/lib/assessment/config";
import {
  BAND_THRESHOLDS,
  BLUEPRINT_RULES_VERSION,
  CATEGORY_RULES,
  CTA_RULES,
  KPI_RULES,
  LONG_TERM_RULES,
  OPPORTUNITY_RULES,
  QUICK_WIN_RULES,
  RESOURCE_RULES,
  ROADMAP_TEMPLATES,
  SUMMARY_TEMPLATES,
  tierForLevel,
  type ActionRule,
  type CtaRule,
  type KpiRule,
  type MaturityTier,
  type PerformanceBand,
  type ResourceRule,
  type RoadmapPhaseTemplate,
} from "./rules";

export interface BlueprintInput {
  overall: number;
  categories: Record<string, number>;
  maturityLevel: number;
  completedAt: string | null;
  organizationName: string | null;
}

export interface CategoryReading {
  id: CategoryId;
  label: string;
  description: string;
  score: number;
  band: PerformanceBand;
  bandLabel: string;
  status: string;
  explanation: string;
  meaning: string;
  /** 1 = highest priority to address. Null when the category is strong. */
  priority: number | null;
  /** Rank among the six categories, 1 = strongest. */
  rank: number;
}

export interface OpportunityReading {
  id: string;
  rank: number;
  title: string;
  rationale: string;
  categoryLabel: string;
  impact: string;
  effort: string;
}

export interface StrengthReading {
  id: string;
  title: string;
  description: string;
  implication: string;
  score: number;
  categoryLabel: string;
}

export interface GapReading {
  id: string;
  title: string;
  whyItMatters: string;
  benefit: string;
  score: number;
  categoryLabel: string;
}

/** A score-driven priority injected into a roadmap phase. */
export interface PhasePriority {
  id: string;
  title: string;
  description: string;
  categoryLabel: string;
  timeframe: string;
}

export interface RoadmapPhase extends RoadmapPhaseTemplate {
  id: string;
  /**
   * Priorities selected from this user's own scores. Month 1 carries their
   * quick wins, month 2 their ranked opportunities, month 3 their long-term
   * moves — so the 90-day plan itself varies with the assessment, not just
   * the surrounding narrative.
   */
  priorities: PhasePriority[];
  /** Label describing where the priorities came from. */
  prioritiesLabel: string;
}


export interface ActionReading {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  categoryLabel: string;
}

export interface Blueprint {
  version: string;
  generatedFrom: "rules";
  tier: MaturityTier;
  maturity: MaturityLevelConfig;
  overall: number;
  completedAt: string | null;
  organizationName: string | null;
  summary: {
    position: string;
    biggestOpportunity: string;
    biggestRisk: string;
    recommendedFocus: string;
  };
  categories: CategoryReading[];
  opportunities: OpportunityReading[];
  strengths: StrengthReading[];
  gaps: GapReading[];
  roadmap: RoadmapPhase[];
  quickWins: ActionReading[];
  longTerm: ActionReading[];
  kpis: KpiRule[];
  resources: ResourceRule[];
  cta: CtaRule;
}

function bandFor(score: number): (typeof BAND_THRESHOLDS)[number] {
  return (
    [...BAND_THRESHOLDS].sort((a, b) => b.minScore - a.minScore).find((entry) => score >= entry.minScore) ??
    BAND_THRESHOLDS[BAND_THRESHOLDS.length - 1]!
  );
}

export function bandToneClasses(band: PerformanceBand) {
  if (band === "strong") return { text: "text-success", bg: "bg-success/12", border: "border-success/40", bar: "bg-success" };
  if (band === "developing") return { text: "text-warning", bg: "bg-warning/12", border: "border-warning/40", bar: "bg-warning" };
  return { text: "text-destructive", bg: "bg-destructive/12", border: "border-destructive/40", bar: "bg-destructive" };
}

function pickActions(rules: ActionRule[], readings: CategoryReading[], count: number): ActionReading[] {
  const scoreOf = new Map(readings.map((reading) => [reading.id, reading.score]));
  const labelOf = new Map(readings.map((reading) => [reading.id, reading.label]));
  return rules
    .filter((rule) => (scoreOf.get(rule.category) ?? 100) <= rule.maxScore)
    .sort((a, b) => (scoreOf.get(a.category) ?? 100) - (scoreOf.get(b.category) ?? 100))
    .slice(0, count)
    .map((rule) => ({
      id: rule.id,
      title: rule.title,
      description: rule.description,
      timeframe: rule.timeframe,
      categoryLabel: labelOf.get(rule.category) ?? rule.category,
    }));
}

/** Pure, deterministic blueprint generation from Publisher Index scores. */
export function generateBlueprint(input: BlueprintInput): Blueprint {
  const maturity =
    MATURITY_LEVELS.find((level) => level.level === input.maturityLevel) ?? MATURITY_LEVELS[0]!;
  const tier = tierForLevel(maturity.level);

  const scored = CATEGORIES.map((category) => {
    const score = Math.round(input.categories[category.id] ?? 0);
    const band = bandFor(score);
    const rule = CATEGORY_RULES[category.id];
    return { category, score, band, rule };
  });

  const byScoreDesc = [...scored].sort((a, b) => b.score - a.score);
  const weakestOrder = [...scored].sort((a, b) => a.score - b.score);

  const categories: CategoryReading[] = scored.map((entry) => {
    const rankIndex = byScoreDesc.findIndex((item) => item.category.id === entry.category.id);
    const weakIndex = weakestOrder.findIndex((item) => item.category.id === entry.category.id);
    return {
      id: entry.category.id,
      label: entry.category.label,
      description: entry.category.description,
      score: entry.score,
      band: entry.band.band,
      bandLabel: entry.band.label,
      status: entry.rule.band[entry.band.band].status,
      explanation: entry.rule.band[entry.band.band].explanation,
      meaning: entry.rule.meaning,
      priority: entry.band.band === "strong" ? null : weakIndex + 1,
      rank: rankIndex + 1,
    };
  });

  const scoreOf = new Map(categories.map((item) => [item.id, item.score]));
  const labelOf = new Map(categories.map((item) => [item.id, item.label]));

  const opportunities: OpportunityReading[] = OPPORTUNITY_RULES.filter(
    (rule) => (scoreOf.get(rule.category) ?? 100) <= rule.maxScore,
  )
    .map((rule) => ({
      rule,
      // Lower category score and higher configured leverage rank first.
      weight: rule.leverage + (100 - (scoreOf.get(rule.category) ?? 100)),
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((entry, index) => ({
      id: entry.rule.id,
      rank: index + 1,
      title: entry.rule.title,
      rationale: entry.rule.rationale,
      categoryLabel: labelOf.get(entry.rule.category) ?? entry.rule.category,
      impact: entry.rule.impact,
      effort: entry.rule.effort,
    }));

  const strengths: StrengthReading[] = byScoreDesc.slice(0, 3).map((entry) => ({
    id: entry.category.id,
    title: entry.rule.strength.title,
    description: entry.rule.strength.description,
    implication: entry.rule.strength.implication,
    score: entry.score,
    categoryLabel: entry.category.label,
  }));

  const gaps: GapReading[] = weakestOrder.slice(0, 3).map((entry) => ({
    id: entry.category.id,
    title: entry.rule.gap.title,
    whyItMatters: entry.rule.gap.whyItMatters,
    benefit: entry.rule.gap.benefit,
    score: entry.score,
    categoryLabel: entry.category.label,
  }));

  const topGapIds = new Set(gaps.map((gap) => gap.id as CategoryId));
  const resources = RESOURCE_RULES.filter(
    (resource) =>
      resource.always ||
      resource.tiers?.includes(tier) ||
      resource.categories?.some((category) => topGapIds.has(category)),
  ).slice(0, 6);

  const weakest = weakestOrder[0]!;
  const strongest = byScoreDesc[0]!;

  const quickWins = pickActions(QUICK_WIN_RULES, categories, 3);
  const longTerm = pickActions(LONG_TERM_RULES, categories, 3);

  // Month 1 executes the quick wins, month 2 the ranked opportunities, month 3
  // the long-term moves. Each set is selected from this user's own scores, so
  // the 90-day plan varies with the assessment rather than by tier alone.
  const phasePriorities: Record<1 | 2 | 3, { label: string; items: PhasePriority[] }> = {
    1: {
      label: "Your priority actions",
      items: quickWins.map((action) => ({
        id: action.id,
        title: action.title,
        description: action.description,
        categoryLabel: action.categoryLabel,
        timeframe: action.timeframe,
      })),
    },
    2: {
      label: "Your highest-leverage opportunities",
      items: opportunities.map((opportunity) => ({
        id: opportunity.id,
        title: opportunity.title,
        description: opportunity.rationale,
        categoryLabel: opportunity.categoryLabel,
        timeframe: `${opportunity.impact} impact · ${opportunity.effort} effort`,
      })),
    },
    3: {
      label: "Your long-term moves to stage",
      items: longTerm.map((action) => ({
        id: action.id,
        title: action.title,
        description: action.description,
        categoryLabel: action.categoryLabel,
        timeframe: action.timeframe,
      })),
    },
  };

  return {
    version: BLUEPRINT_RULES_VERSION,
    generatedFrom: "rules",
    tier,
    maturity,
    overall: Math.round(input.overall),
    completedAt: input.completedAt,
    organizationName: input.organizationName,
    summary: {
      position: SUMMARY_TEMPLATES.position[tier],
      biggestOpportunity:
        opportunities[0]?.rationale ??
        `Extend your strongest capability — ${strongest.category.label.toLowerCase()} — into the rest of the program.`,
      biggestRisk: weakest.rule.band[weakest.band.band].explanation,
      recommendedFocus: SUMMARY_TEMPLATES.focus[tier],
    },
    categories,
    opportunities,
    strengths,
    gaps,
    roadmap: ROADMAP_TEMPLATES[tier].map((phase) => ({
      ...phase,
      id: `${tier}-month-${phase.month}`,
      priorities: phasePriorities[phase.month].items,
      prioritiesLabel: phasePriorities[phase.month].label,
    })),
    quickWins,
    longTerm,
    kpis: KPI_RULES[tier],

    resources,
    cta: CTA_RULES[tier],
  };
}
