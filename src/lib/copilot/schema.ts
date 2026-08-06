/**
 * Publisher Copilot — structured output contracts.
 *
 * Every generated deliverable conforms to one of these shapes so the UI renders
 * strategy documents rather than essays, and so outputs stay editable and
 * savable. Schemas are deliberately flat and constraint-free: limits are stated
 * in the prompt and clamped in code, never encoded as schema bounds.
 */

import { z } from "zod";

export const strategyActionSchema = z.object({
  title: z.string(),
  description: z.string(),
  impact: z.string().describe("Expected business impact, one sentence."),
  effort: z.string().describe("Estimated effort: low, medium, or high, with a time estimate."),
  dependencies: z.array(z.string()).describe("What must be true or in place first."),
  owner: z.string().describe("The role accountable, e.g. 'Editor-in-chief'."),
});

export const strategySectionSchema = z.object({
  heading: z.string(),
  body: z.string().describe("A short paragraph. May be empty when bullets carry the content."),
  bullets: z.array(z.string()),
});

export const strategyDocumentSchema = z.object({
  title: z.string(),
  executiveSummary: z.string().describe("Three to five sentences an executive can read standing up."),
  assumptions: z.array(z.string()).describe("Assumptions made where data was missing."),
  sections: z.array(strategySectionSchema),
  actions: z.array(strategyActionSchema),
  successMetrics: z.array(z.string()),
  nextStep: z.string().describe("The single next action, stated concretely."),
  informationGaps: z.array(z.string()).describe("What extra information would sharpen this."),
});

export type StrategyAction = z.infer<typeof strategyActionSchema>;
export type StrategySection = z.infer<typeof strategySectionSchema>;
export type StrategyDocument = z.infer<typeof strategyDocumentSchema>;

export const simulationCategorySchema = z.object({
  category: z.string().describe("One of: Audience, Content, Distribution, Operations, Strategy, Alignment."),
  direction: z.string().describe("up, down, or flat"),
  magnitude: z.string().describe("negligible, modest, or significant"),
  rationale: z.string(),
});

export const simulationSchema = z.object({
  title: z.string(),
  headline: z.string().describe("The one-sentence directional read on this scenario."),
  assumptions: z.array(z.string()),
  categories: z.array(simulationCategorySchema),
  prerequisites: z.array(z.string()).describe("What has to be true for this to move the index at all."),
  caveats: z.array(z.string()).describe("Why this is directional and not a guarantee."),
  recommendedExperiment: z.string().describe("A bounded experiment that would test the scenario cheaply."),
});

export type SimulationCategory = z.infer<typeof simulationCategorySchema>;
export type Simulation = z.infer<typeof simulationSchema>;

export const promptPackItemSchema = z.object({
  slug: z.string().describe("kebab-case identifier"),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  body: z.string().describe("The prompt itself, written so it can be pasted into any AI tool."),
});

export const promptPackSchema = z.object({
  prompts: z.array(promptPackItemSchema),
});

export type PromptPackItem = z.infer<typeof promptPackItemSchema>;

/** Renders a generated document to markdown for export, copy, and download. */
export function documentToMarkdown(doc: StrategyDocument): string {
  const lines: string[] = [`# ${doc.title}`, "", "## Executive summary", "", doc.executiveSummary, ""];

  for (const section of doc.sections) {
    lines.push(`## ${section.heading}`, "");
    if (section.body?.trim()) lines.push(section.body, "");
    for (const bullet of section.bullets ?? []) lines.push(`- ${bullet}`);
    if (section.bullets?.length) lines.push("");
  }

  if (doc.actions.length) {
    lines.push("## Recommended actions", "");
    doc.actions.forEach((action, index) => {
      lines.push(`### ${index + 1}. ${action.title}`, "", action.description, "");
      lines.push(`- **Expected impact:** ${action.impact}`);
      lines.push(`- **Estimated effort:** ${action.effort}`);
      lines.push(`- **Owner:** ${action.owner}`);
      if (action.dependencies?.length) {
        lines.push(`- **Dependencies:** ${action.dependencies.join("; ")}`);
      }
      lines.push("");
    });
  }

  if (doc.successMetrics.length) {
    lines.push("## Success metrics", "");
    for (const metric of doc.successMetrics) lines.push(`- ${metric}`);
    lines.push("");
  }

  if (doc.assumptions.length) {
    lines.push("## Assumptions", "");
    for (const assumption of doc.assumptions) lines.push(`- ${assumption}`);
    lines.push("");
  }

  if (doc.informationGaps.length) {
    lines.push("## What would sharpen this", "");
    for (const gap of doc.informationGaps) lines.push(`- ${gap}`);
    lines.push("");
  }

  lines.push("## Next step", "", doc.nextStep, "");
  return lines.join("\n");
}

export function simulationToMarkdown(sim: Simulation): string {
  const lines: string[] = [`# ${sim.title}`, "", sim.headline, "", "## Category effects", ""];
  for (const entry of sim.categories) {
    lines.push(`- **${entry.category}** — ${entry.direction}, ${entry.magnitude}. ${entry.rationale}`);
  }
  lines.push("", "## Prerequisites", "");
  for (const item of sim.prerequisites) lines.push(`- ${item}`);
  lines.push("", "## Assumptions", "");
  for (const item of sim.assumptions) lines.push(`- ${item}`);
  lines.push("", "## Caveats", "");
  for (const item of sim.caveats) lines.push(`- ${item}`);
  lines.push("", "## Recommended experiment", "", sim.recommendedExperiment, "");
  return lines.join("\n");
}
