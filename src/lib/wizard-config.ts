/**
 * Declarative configuration for the Blueprint wizard.
 *
 * Every section/question is data — the wizard UI renders from this file, so
 * adding a question never requires touching a component. Answers are stored
 * in `assessment_answers` keyed by `question_key`.
 */

export type QuestionType = "text" | "select" | "number" | "scale" | "multi" | "textarea";

export interface Question {
  key: string;
  label: string;
  help?: string;
  type: QuestionType;
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

export interface WizardSection {
  id: string;
  title: string;
  summary: string;
  questions: Question[];
}

const maturity = ["None", "Exploring", "Operational", "Advanced"];

export const WIZARD_SECTIONS: WizardSection[] = [
  {
    id: "company",
    title: "Company Profile",
    summary: "Establish the organizational context for your blueprint.",
    questions: [
      { key: "company_name", label: "Company name", type: "text", required: true, placeholder: "Acme Industries" },
      { key: "website", label: "Website", type: "text", placeholder: "https://acme.com" },
      {
        key: "industry",
        label: "Industry",
        type: "select",
        options: [
          "Technology / SaaS",
          "Financial Services",
          "Healthcare",
          "Professional Services",
          "Manufacturing",
          "Retail / CPG",
          "Media & Entertainment",
          "Other",
        ],
      },
      {
        key: "revenue_range",
        label: "Annual revenue",
        type: "select",
        options: ["< $10M", "$10M – $50M", "$50M – $250M", "$250M – $1B", "$1B+"],
      },
      {
        key: "team_size",
        label: "Total employees",
        type: "select",
        options: ["1 – 50", "51 – 250", "251 – 1,000", "1,001 – 5,000", "5,000+"],
      },
      { key: "marketer_count", label: "Number of marketers", type: "number", placeholder: "12" },
    ],
  },
  {
    id: "audience",
    title: "Audience",
    summary: "Quantify the audience you already own today.",
    questions: [
      { key: "email_subscribers", label: "Email subscribers", type: "number", placeholder: "25000" },
      { key: "crm_size", label: "CRM contact records", type: "number", placeholder: "80000" },
      {
        key: "community",
        label: "Owned community",
        type: "select",
        options: ["None", "Private group", "Dedicated platform", "Multiple communities"],
      },
      { key: "website_traffic", label: "Monthly website visits", type: "number", placeholder: "120000" },
      {
        key: "social_channels",
        label: "Active social channels",
        type: "multi",
        options: ["LinkedIn", "YouTube", "Instagram", "X", "TikTok", "Podcast platforms", "Substack"],
      },
    ],
  },
  {
    id: "content",
    title: "Content",
    summary: "Rate the maturity of each content asset your organization runs.",
    questions: [
      { key: "newsletter", label: "Newsletter", type: "scale", options: maturity },
      { key: "blog", label: "Blog", type: "scale", options: maturity },
      { key: "podcast", label: "Podcast", type: "scale", options: maturity },
      { key: "video", label: "Video / episodic series", type: "scale", options: maturity },
      { key: "events", label: "Events", type: "scale", options: maturity },
      { key: "research", label: "Original research", type: "scale", options: maturity },
      { key: "case_studies", label: "Case studies", type: "scale", options: maturity },
      { key: "exec_thought_leadership", label: "Executive thought leadership", type: "scale", options: maturity },
    ],
  },
  {
    id: "distribution",
    title: "Distribution",
    summary: "Assess how reliably your content reaches the right audience.",
    questions: [
      { key: "dist_email", label: "Email", type: "scale", options: maturity },
      { key: "dist_seo", label: "SEO", type: "scale", options: maturity },
      { key: "dist_social", label: "Social", type: "scale", options: maturity },
      { key: "dist_partnerships", label: "Partnerships", type: "scale", options: maturity },
      { key: "dist_paid", label: "Paid media", type: "scale", options: maturity },
      { key: "dist_pr", label: "PR", type: "scale", options: maturity },
      { key: "dist_influencers", label: "Creators & influencers", type: "scale", options: maturity },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    summary: "Evaluate the operating system behind your content engine.",
    questions: [
      { key: "ops_team", label: "Dedicated team", type: "scale", options: maturity },
      { key: "ops_workflow", label: "Editorial workflow", type: "scale", options: maturity },
      { key: "ops_ai", label: "AI adoption", type: "scale", options: maturity },
      { key: "ops_measurement", label: "Measurement infrastructure", type: "scale", options: maturity },
      {
        key: "ops_kpis",
        label: "Primary KPIs tracked",
        type: "multi",
        options: ["Subscribers", "Pipeline influenced", "Engagement", "Retention", "Share of voice", "CAC payback"],
      },
    ],
  },
  {
    id: "goals",
    title: "Goals",
    summary: "Select the outcomes this blueprint should optimize for.",
    questions: [
      {
        key: "objectives",
        label: "Strategic objectives",
        help: "Choose up to three for a focused roadmap.",
        type: "multi",
        options: [
          "Thought leadership",
          "Lead generation",
          "Community",
          "Retention",
          "First-party audience",
          "Brand awareness",
        ],
      },
      { key: "goal_notes", label: "What does success look like in 12 months?", type: "textarea" },
    ],
  },
  {
    id: "constraints",
    title: "Constraints",
    summary: "Name the realities your roadmap has to respect.",
    questions: [
      {
        key: "budget",
        label: "Annual budget available",
        type: "select",
        options: ["< $100K", "$100K – $500K", "$500K – $2M", "$2M+"],
      },
      { key: "constraint_team", label: "Team capacity", type: "scale", options: ["Severe", "Tight", "Adequate", "Strong"] },
      {
        key: "constraint_buyin",
        label: "Executive buy-in",
        type: "scale",
        options: ["Absent", "Curious", "Supportive", "Championed"],
      },
      { key: "constraint_time", label: "Time to first launch", type: "select", options: ["30 days", "90 days", "6 months", "12 months"] },
      { key: "constraint_tech", label: "Technology readiness", type: "scale", options: ["Severe", "Tight", "Adequate", "Strong"] },
    ],
  },
];

export const TOTAL_STEPS = WIZARD_SECTIONS.length;

export type AnswerValue = string | number | string[] | null;
export type WizardAnswers = Record<string, AnswerValue>;
