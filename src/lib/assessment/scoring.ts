/**
 * Publisher Index™ scoring.
 *
 * Pure functions over the configuration in `config.ts` — no question, weight,
 * or threshold is hardcoded here.
 */

import {
  CATEGORIES,
  MATURITY_LEVELS,
  QUESTIONS,
  type AssessmentAnswers,
  type AnswerValue,
  type CategoryId,
  type MaturityLevelConfig,
  type QuestionConfig,
} from "./config";

export interface CategoryScore {
  id: CategoryId;
  label: string;
  score: number;
  answered: number;
  total: number;
}

export interface PublisherIndex {
  overall: number;
  categories: CategoryScore[];
  maturity: MaturityLevelConfig;
  strengths: CategoryScore[];
  opportunities: CategoryScore[];
}

function isAnswered(value: AnswerValue): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim() !== "";
}

/** Normalizes a single answer to 0–1, or null when it cannot be scored. */
export function normalizeAnswer(question: QuestionConfig, value: AnswerValue): number | null {
  if (!question.scoring || !isAnswered(value)) return null;

  if (question.type === "multi") {
    const selected = Array.isArray(value) ? value : [];
    const target = question.maxScoredSelections ?? question.options?.length ?? selected.length;
    const explicit = selected
      .map((item) => question.options?.find((option) => option.value === item)?.score)
      .filter((score): score is number => typeof score === "number");
    if (explicit.length) return clamp01(explicit.reduce((a, b) => a + b, 0) / explicit.length);
    return clamp01(selected.length / Math.max(1, target));
  }

  if (question.type === "number") {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    const band = [...(question.bands ?? [])].sort((a, b) => b.min - a.min).find((item) => numeric >= item.min);
    return band ? clamp01(band.score) : 0;
  }

  const option = question.options?.find((item) => item.value === String(value));
  if (option && typeof option.score === "number") return clamp01(option.score);
  return null;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

/** Computes overall + category scores and the resulting maturity level. */
export function computePublisherIndex(answers: AssessmentAnswers): PublisherIndex {
  const totals = new Map<CategoryId, { weighted: number; weight: number; answered: number; total: number }>();
  for (const category of CATEGORIES) {
    totals.set(category.id, { weighted: 0, weight: 0, answered: 0, total: 0 });
  }

  for (const question of QUESTIONS) {
    if (!question.scoring) continue;
    const normalized = normalizeAnswer(question, answers[question.id] ?? null);
    for (const [categoryId, weight] of Object.entries(question.scoring) as [CategoryId, number][]) {
      const bucket = totals.get(categoryId);
      if (!bucket || !weight) continue;
      bucket.total += 1;
      if (normalized === null) continue;
      bucket.answered += 1;
      bucket.weighted += normalized * weight;
      bucket.weight += weight;
    }
  }

  const categories: CategoryScore[] = CATEGORIES.map((category) => {
    const bucket = totals.get(category.id)!;
    return {
      id: category.id,
      label: category.label,
      score: bucket.weight > 0 ? Math.round((bucket.weighted / bucket.weight) * 100) : 0,
      answered: bucket.answered,
      total: bucket.total,
    };
  });

  let weighted = 0;
  let weight = 0;
  for (const category of CATEGORIES) {
    const score = categories.find((item) => item.id === category.id)!;
    weighted += score.score * category.weight;
    weight += category.weight;
  }
  const overall = weight > 0 ? Math.round(weighted / weight) : 0;

  const ranked = [...categories].sort((a, b) => b.score - a.score);

  return {
    overall,
    categories,
    maturity: maturityForScore(overall),
    strengths: ranked.slice(0, 2),
    opportunities: ranked.slice(-2).reverse(),
  };
}

export function maturityForScore(overall: number): MaturityLevelConfig {
  const sorted = [...MATURITY_LEVELS].sort((a, b) => b.minScore - a.minScore);
  return sorted.find((level) => overall >= level.minScore) ?? MATURITY_LEVELS[0]!;
}

/** Percentage of required questions answered, used for progress + validation. */
export function completionPercent(answers: AssessmentAnswers): number {
  const scored = QUESTIONS.filter((question) => question.scoring || question.required);
  if (!scored.length) return 0;
  const done = scored.filter((question) => isAnswered(answers[question.id] ?? null)).length;
  return Math.round((done / scored.length) * 100);
}

export function missingRequired(questions: QuestionConfig[], answers: AssessmentAnswers): QuestionConfig[] {
  return questions.filter((question) => question.required && !isAnswered(answers[question.id] ?? null));
}

export { isAnswered };
