/**
 * Microdrama Greenlight — question set and pure verdict engine.
 * Browser-safe: no I/O. The server recomputes the verdict from raw answers.
 */

export const GREENLIGHT_THRESHOLD = 12;
export const GREENLIGHT_FLOOR = 10;
export const MAX_SCORE = 18;

export type Verdict = "green_light" | "not_yet" | "no";
export type PatternId =
  | "paid_media_plateau"
  | "borrowed_audience"
  | "campaign_factory"
  | "invisible_studio"
  | "fragmented_builder"
  | "category_leader";

export type ScoredKey =
  | "product_role"
  | "purchase_path"
  | "capture"
  | "distribution_budget"
  | "approval_speed"
  | "genre_comfort"
  | "season_commitment"
  | "measurement"
  | "budget_status";

export interface GreenlightOption {
  value: string;
  label: string;
  detail?: string;
  score?: 0 | 1 | 2;
}

export interface GreenlightQuestion {
  key: ScoredKey | "operating_context";
  title: string;
  prompt: string;
  /** Short plain-language blocker shown when this answer holds the brand back. */
  blocker?: string;
  options: GreenlightOption[];
}

export const GREENLIGHT_QUESTIONS: GreenlightQuestion[] = [
  {
    key: "product_role",
    title: "Product role",
    prompt: "How would your product or service fit into a scripted vertical story?",
    blocker: "The product's benefit doesn't yet drive the story's tension.",
    options: [
      { value: "2", score: 2, label: "It can drive the plot", detail: "Its benefit, feature, or absence sparks a conflict, a turning point, or resolves a crisis. Physical or intangible both count." },
      { value: "1", score: 1, label: "It sits naturally in the characters' world", detail: "It appears in their routine, but the drama exists without it." },
      { value: "0", score: 0, label: "No dramatic stakes", detail: "It's purely procedural, abstract, or regulated in a way that can't tie to human conflict." },
    ],
  },
  {
    key: "purchase_path",
    title: "Purchase path",
    prompt: "Can a viewer buy or sign up directly from a vertical video today?",
    blocker: "There's no direct path from an episode to a purchase or sign-up.",
    options: [
      { value: "2", score: 2, label: "Yes", detail: "Shoppable links, TikTok Shop, or a tracked mobile landing page." },
      { value: "1", score: 1, label: "Not yet, but we could set it up", detail: "A promo code or short link." },
      { value: "0", score: 0, label: "No direct or trackable path" },
    ],
  },
  {
    key: "capture",
    title: "Audience capture",
    prompt: "Do you have a way to keep in touch with viewers after they finish watching?",
    blocker: "Viewers have nowhere to land that you can reach again.",
    options: [
      { value: "2", score: 2, label: "An active email or SMS program on a regular schedule" },
      { value: "1", score: 1, label: "A list exists, but we rarely use it" },
      { value: "0", score: 0, label: "No first-party channel; we rely on social platforms" },
    ],
  },
  {
    key: "distribution_budget",
    title: "Media budget",
    prompt: "Is there paid media budget to promote the series once it's released?",
    blocker: "There's no media budget to launch the opening episodes.",
    options: [
      { value: "2", score: 2, label: "Yes, already allocated alongside production" },
      { value: "1", score: 1, label: "Possibly, if the case is compelling" },
      { value: "0", score: 0, label: "No, it would rely entirely on organic reach" },
    ],
  },
  {
    key: "approval_speed",
    title: "Approval speed",
    prompt: "How long does it realistically take to approve a script or a cut?",
    blocker: "Approvals are slower than a weekly production rhythm allows.",
    options: [
      { value: "2", score: 2, label: "Under two weeks", detail: "One empowered decision-maker." },
      { value: "1", score: 1, label: "Two to six weeks", detail: "Several brand and marketing reviewers." },
      { value: "0", score: 0, label: "More than six weeks", detail: "Legal, brand safety, and executive committees." },
    ],
  },
  {
    key: "genre_comfort",
    title: "Genre comfort",
    prompt: "Microdramas run on melodrama, cliffhangers, and familiar tropes. How comfortable is your brand with that tone?",
    blocker: "The brand is wary of the format's dramatic tone.",
    options: [
      { value: "2", score: 2, label: "Very comfortable; it fits our voice" },
      { value: "1", score: 1, label: "Comfortable with a lighter or comedic version" },
      { value: "0", score: 0, label: "Not comfortable; our guidelines require restraint" },
    ],
  },
  {
    key: "season_commitment",
    title: "Series commitment",
    prompt: "How is leadership thinking about the commitment?",
    blocker: "The commitment is a one-off test, not a season.",
    options: [
      { value: "2", score: 2, label: "A full season, designed with room for a sequel" },
      { value: "1", score: 1, label: "One season, then decide on results" },
      { value: "0", score: 0, label: "A single test piece to see what happens" },
    ],
  },
  {
    key: "measurement",
    title: "Measurement",
    prompt: "Could you connect viewing to sales or sign-ups today?",
    blocker: "Viewing can't yet be tied to sales or sign-ups.",
    options: [
      { value: "2", score: 2, label: "Yes, through first-party or sales data" },
      { value: "1", score: 1, label: "Partly, through platform metrics and promo codes" },
      { value: "0", score: 0, label: "Not today; only views and likes" },
    ],
  },
  {
    key: "budget_status",
    title: "Production budget",
    prompt: "Where does production budget stand right now?",
    blocker: "Production budget hasn't been raised yet.",
    options: [
      { value: "2", score: 2, label: "Approved or earmarked" },
      { value: "1", score: 1, label: "Being discussed for this or next quarter" },
      { value: "0", score: 0, label: "Not yet budgeted or proposed" },
    ],
  },
  {
    key: "operating_context",
    title: "Growth model",
    prompt: "Which statement best describes your brand's current growth engine?",
    options: [
      { value: "paid_media_plateau", label: "We spend heavily on paid ads, but acquisition costs are climbing and returns are flattening." },
      { value: "borrowed_audience", label: "We get strong social reach, but few viewers become email subscribers." },
      { value: "campaign_factory", label: "We launch high-effort campaigns, but attention drops off between launches." },
      { value: "invisible_studio", label: "We make high-quality content, but distribution is weak and leadership questions the return." },
      { value: "fragmented_builder", label: "Different teams make disconnected content without one flagship property." },
      { value: "category_leader", label: "We have an established audience and scale across many channels." },
    ],
  },
];

export const PATTERN_LABELS: Record<PatternId, string> = {
  paid_media_plateau: "Paid Media Plateau",
  borrowed_audience: "Borrowed Audience",
  campaign_factory: "Campaign Factory",
  invisible_studio: "Invisible Studio",
  fragmented_builder: "Fragmented Builder",
  category_leader: "Category Leader",
};

/** The single deciding condition per growth model, in plain language. */
export const PATTERN_CONDITIONS: Record<PatternId, string> = {
  paid_media_plateau: "Your paid media can launch the series. It only pays off if viewers land somewhere you can reach again.",
  borrowed_audience: "Your reach is already there. The series has to turn viewers into subscribers or buyers you own.",
  campaign_factory: "A one-off spike is what you already have. The series only works as a sustained season.",
  invisible_studio: "Your craft isn't the question. The series needs attribution so leadership can see the return.",
  fragmented_builder: "The series has to become the flagship every team rallies behind, with strong fundamentals across the board.",
  category_leader: "At your scale, the series needs dedicated media budget from day one to break through.",
};

export type GreenlightAnswers = Partial<Record<ScoredKey, number>> & { operating_context?: PatternId };

export interface GreenlightResult {
  verdict: Verdict;
  score: number;
  patternId: PatternId;
  conditionMet: boolean;
  enterpriseReferral: boolean;
  blockers: string[];
  reason: "no_dramatic_stakes" | "tone_mismatch" | "budget_gate" | "below_floor" | "condition_not_met" | "near_threshold" | "green_light";
}

const SCORED = GREENLIGHT_QUESTIONS.filter((q) => q.key !== "operating_context");

function conditionMet(p: PatternId, a: Record<ScoredKey, number>, score: number): boolean {
  switch (p) {
    case "paid_media_plateau": return a.capture >= 1;
    case "borrowed_audience": return a.capture === 2 || a.purchase_path === 2;
    case "campaign_factory": return a.season_commitment === 2;
    case "invisible_studio": return a.measurement >= 1;
    case "fragmented_builder": return a.season_commitment === 2 && score >= 15;
    case "category_leader": return a.distribution_budget === 2;
  }
}

export function resolveGreenlight(input: GreenlightAnswers): GreenlightResult {
  const a = Object.fromEntries(SCORED.map((q) => [q.key, input[q.key as ScoredKey] ?? 0])) as Record<ScoredKey, number>;
  const patternId = input.operating_context ?? "fragmented_builder";
  const score = Object.values(a).reduce((s, v) => s + v, 0);
  const met = conditionMet(patternId, a, score);
  // Lowest answers first, ties broken by question order; max three.
  const blockers = SCORED.map((q, i) => ({ q, i, v: a[q.key as ScoredKey] }))
    .filter((x) => x.v < 2)
    .sort((x, y) => x.v - y.v || x.i - y.i)
    .slice(0, 3)
    .sort((x, y) => x.i - y.i)
    .map((x) => x.q.blocker!);
  const base = { score, patternId, conditionMet: met, enterpriseReferral: patternId === "category_leader", blockers };

  if (a.product_role === 0) return { ...base, verdict: "no", reason: "no_dramatic_stakes" };
  if (a.genre_comfort === 0) return { ...base, verdict: "no", reason: "tone_mismatch" };
  if (a.distribution_budget === 0 || a.budget_status === 0) return { ...base, verdict: "not_yet", reason: "budget_gate" };
  if (score < GREENLIGHT_FLOOR) return { ...base, verdict: "not_yet", reason: "below_floor" };
  if (!met) return { ...base, verdict: "not_yet", reason: "condition_not_met" };
  if (score >= GREENLIGHT_THRESHOLD) return { ...base, verdict: "green_light", reason: "green_light" };
  return { ...base, verdict: "not_yet", reason: "near_threshold" };
}

export const VERDICT_LABELS: Record<Verdict, string> = {
  green_light: "Green Light",
  not_yet: "Not Yet",
  no: "No",
};
