/**
 * Publisher Copilot — objective catalog.
 *
 * The six strategy actions on Copilot home, plus the derived surfaces. This is
 * the single registry the UI, the router, and the server prompts all read from,
 * so adding a capability is a configuration change.
 */

export type ObjectiveId =
  | "strategy"
  | "roadmap"
  | "pillars"
  | "franchises"
  | "score"
  | "ask"
  | "simulator"
  | "presentation"
  | "prompts";

export type DocumentKind = Exclude<ObjectiveId, "ask">;

export interface ObjectiveConfig {
  id: ObjectiveId;
  /** Icon name resolved against lucide-react in the UI layer. */
  icon: string;
  title: string;
  tagline: string;
  description: string;
  /** What the user gets back, shown before they run it. */
  deliverable: string;
  /** Objectives with a document kind produce a saved strategy document. */
  produces: "document" | "conversation" | "simulation" | "prompt-pack";
  /** Surfaced as one of the six primary cards on Copilot home. */
  primary: boolean;
}

export const OBJECTIVES: ObjectiveConfig[] = [
  {
    id: "strategy",
    icon: "Compass",
    title: "Build My Strategy",
    tagline: "Executive strategy from your assessment",
    description:
      "A consulting-grade owned-audience strategy written against your Publisher Index results, industry, and stated goals.",
    deliverable: "Strategy brief with actions, impact, effort, dependencies, and metrics",
    produces: "document",
    primary: true,
  },
  {
    id: "roadmap",
    icon: "Map",
    title: "Create My Roadmap",
    tagline: "Expand the 90 days into weekly detail",
    description:
      "Turns each month of your roadmap into weekly priorities, deliverables, meetings, a content calendar, KPIs, risks, and dependencies.",
    deliverable: "Detailed month-by-month implementation plan",
    produces: "document",
    primary: true,
  },
  {
    id: "pillars",
    icon: "Layers",
    title: "Generate Content Pillars",
    tagline: "Editorial mission through measurement",
    description:
      "A full content strategy: editorial mission, audience definition, core messaging, pillars, cadence, channels, distribution, and measurement.",
    deliverable: "Editable content strategy document",
    produces: "document",
    primary: true,
  },
  {
    id: "franchises",
    icon: "Clapperboard",
    title: "Branded Entertainment Concepts",
    tagline: "Recurring franchises, not campaigns",
    description:
      "Series, shows, newsletters, podcasts, research reports, communities, interview series, and educational products matched to your objectives.",
    deliverable: "Ranked franchise concepts with fit rationale and complexity",
    produces: "document",
    primary: true,
  },
  {
    id: "score",
    icon: "TrendingUp",
    title: "Improve My Publisher Score",
    tagline: "Highest-leverage moves first",
    description:
      "The specific actions most likely to move your Publisher Index, ordered by leverage against the categories you score lowest on.",
    deliverable: "Prioritized score-improvement plan",
    produces: "document",
    primary: true,
  },
  {
    id: "ask",
    icon: "MessagesSquare",
    title: "Ask Publisher Copilot",
    tagline: "Conversation with full context",
    description:
      "Ask anything about your program. Every answer is grounded in your assessment, blueprint, and roadmap — you never explain your business twice.",
    deliverable: "Ongoing conversation, saved to your history",
    produces: "conversation",
    primary: true,
  },
  {
    id: "simulator",
    icon: "FlaskConical",
    title: "Publisher Score Simulator",
    tagline: "Model a change before you make it",
    description:
      "Describe a change — launch a newsletter, double cadence, invest in executive thought leadership — and see the qualitative effect on each category.",
    deliverable: "Directional category-by-category read with assumptions",
    produces: "simulation",
    primary: false,
  },
  {
    id: "presentation",
    icon: "Presentation",
    title: "Executive Presentation",
    tagline: "Board-ready narrative",
    description:
      "A slide-by-slide outline making the case for the owned-audience program: maturity, opportunity, initiatives, roadmap, and metrics.",
    deliverable: "Twelve-slide presentation outline",
    produces: "document",
    primary: false,
  },
  {
    id: "prompts",
    icon: "Wand2",
    title: "AI Prompt Library",
    tagline: "Prompts written for your blueprint",
    description:
      "Ready-to-use prompts tailored to your organization for research, newsletters, LinkedIn, podcasts, video, presentations, and repurposing.",
    deliverable: "Editable, downloadable prompt pack",
    produces: "prompt-pack",
    primary: false,
  },
];

export const PRIMARY_OBJECTIVES = OBJECTIVES.filter((objective) => objective.primary);

export function objectiveById(id: string): ObjectiveConfig | undefined {
  return OBJECTIVES.find((objective) => objective.id === id);
}

export const DOCUMENT_KIND_LABELS: Record<string, string> = {
  strategy: "Strategy brief",
  roadmap: "Roadmap expansion",
  pillars: "Content strategy",
  franchises: "Branded entertainment",
  score: "Score improvement plan",
  simulator: "Scenario simulation",
  presentation: "Executive presentation",
  prompts: "Prompt pack",
};

/** Example scenarios shown on the simulator before the user writes their own. */
export const SIMULATION_EXAMPLES = [
  "What happens if we launch a weekly newsletter?",
  "What if we double our publishing frequency?",
  "What if we improve executive thought leadership?",
  "What if we cut paid media by half?",
  "What if we hire a dedicated editor-in-chief?",
];
