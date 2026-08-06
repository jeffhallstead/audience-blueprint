/**
 * Extended organization profiles — audience, marketing and content operations.
 *
 * These are identity/segmentation depth, not assessment answers: nothing here
 * changes the Publisher Index score. They enrich qualification fit and give
 * the Copilot better context about how the organization actually operates.
 *
 * Config-driven so a new question is one entry here plus nothing else.
 */

export type ExtendedFieldType = "text" | "number" | "select" | "multiselect" | "textarea";

export interface ExtendedFieldConfig {
  /** Column name on the profile table. */
  id: string;
  label: string;
  type: ExtendedFieldType;
  options?: string[];
  placeholder?: string;
  help?: string;
  /** Counts toward the group's completeness. */
  weighted?: boolean;
}

export interface ExtendedProfileGroup {
  key: "audience" | "marketing" | "content_ops";
  table:
    | "organization_audience_profile"
    | "organization_marketing_profile"
    | "organization_content_ops_profile";
  title: string;
  description: string;
  fields: ExtendedFieldConfig[];
}

export const EXTENDED_PROFILE_GROUPS: ExtendedProfileGroup[] = [
  {
    key: "audience",
    table: "organization_audience_profile",
    title: "Audience",
    description: "The owned audience you already reach, and how well you know it.",
    fields: [
      {
        id: "email_list_size",
        label: "Email list size",
        type: "select",
        options: ["None yet", "< 1,000", "1,000 – 10,000", "10,000 – 100,000", "100,000 – 1M", "1M+"],
        weighted: true,
      },
      {
        id: "newsletter_subscribers",
        label: "Active newsletter subscribers",
        type: "number",
        placeholder: "12000",
        help: "Recipients who opened or clicked in the last 90 days.",
        weighted: true,
      },
      {
        id: "primary_channels",
        label: "Primary owned channels",
        type: "multiselect",
        options: [
          "Email newsletter",
          "Website / blog",
          "Podcast",
          "Video / YouTube",
          "Events & webinars",
          "Community",
          "Print",
          "Mobile app",
        ],
        weighted: true,
      },
      {
        id: "audience_segments",
        label: "Defined audience segments",
        type: "multiselect",
        options: [
          "Executives",
          "Practitioners",
          "Prospects",
          "Existing customers",
          "Partners / channel",
          "Job function",
          "Industry vertical",
          "Lifecycle stage",
        ],
        weighted: true,
      },
      {
        id: "first_party_data_maturity",
        label: "First-party data maturity",
        type: "select",
        options: [
          "No first-party capture",
          "Basic email capture",
          "Segmented and tagged",
          "Unified profiles across channels",
          "Activated in real time",
        ],
        weighted: true,
      },
      { id: "notes", label: "Anything else about your audience", type: "textarea" },
    ],
  },
  {
    key: "marketing",
    table: "organization_marketing_profile",
    title: "Marketing",
    description: "How the marketing function is resourced, measured and tooled.",
    fields: [
      {
        id: "team_structure",
        label: "Team structure",
        type: "select",
        options: [
          "Solo marketer",
          "Small generalist team",
          "Specialist pods",
          "Centralized centre of excellence",
          "Distributed across business units",
          "Primarily agency-led",
        ],
        weighted: true,
      },
      {
        id: "martech_stack",
        label: "Core marketing tools",
        type: "multiselect",
        options: [
          "HubSpot",
          "Marketo",
          "Salesforce",
          "Klaviyo",
          "Mailchimp",
          "Braze",
          "Airtable",
          "Asana",
          "Google Analytics",
          "Segment",
          "Other",
        ],
        weighted: true,
      },
      {
        id: "paid_spend_range",
        label: "Annual paid media spend",
        type: "select",
        options: ["None", "< $100K", "$100K – $500K", "$500K – $2M", "$2M – $10M", "$10M+"],
        weighted: true,
      },
      {
        id: "primary_kpis",
        label: "Primary KPIs",
        type: "multiselect",
        options: [
          "Pipeline / revenue",
          "Subscriber growth",
          "Engagement rate",
          "Retention",
          "Brand awareness",
          "Cost per acquisition",
          "Share of search",
        ],
        weighted: true,
      },
      {
        id: "attribution_maturity",
        label: "Attribution maturity",
        type: "select",
        options: [
          "No attribution",
          "Last touch only",
          "Multi-touch",
          "Blended with incrementality testing",
        ],
        weighted: true,
      },
      { id: "notes", label: "Anything else about marketing", type: "textarea" },
    ],
  },
  {
    key: "content_ops",
    table: "organization_content_ops_profile",
    title: "Content operations",
    description: "How content actually gets produced, governed and shipped.",
    fields: [
      {
        id: "publishing_cadence",
        label: "Publishing cadence",
        type: "select",
        options: ["Ad hoc", "Monthly", "Twice monthly", "Weekly", "Several times a week", "Daily"],
        weighted: true,
      },
      {
        id: "content_types",
        label: "Content formats produced",
        type: "multiselect",
        options: [
          "Articles",
          "Newsletters",
          "Research reports",
          "Video",
          "Podcast",
          "Webinars",
          "Social-first",
          "Interactive tools",
        ],
        weighted: true,
      },
      {
        id: "production_capacity",
        label: "Production capacity",
        type: "select",
        options: [
          "No dedicated capacity",
          "1 – 2 contributors",
          "3 – 5 contributors",
          "6 – 15 contributors",
          "In-house newsroom",
        ],
        weighted: true,
      },
      {
        id: "workflow_tooling",
        label: "Workflow tooling",
        type: "multiselect",
        options: [
          "Spreadsheets",
          "Airtable",
          "Asana",
          "Monday",
          "Jira",
          "Notion",
          "Dedicated CMS workflow",
          "None",
        ],
        weighted: true,
      },
      {
        id: "governance_maturity",
        label: "Editorial governance",
        type: "select",
        options: [
          "No documented process",
          "Informal review",
          "Documented editorial standards",
          "Standards plus measurement loop",
        ],
        weighted: true,
      },
      { id: "notes", label: "Anything else about content operations", type: "textarea" },
    ],
  },
];

export type ExtendedProfileValues = Record<string, string | number | string[] | null>;

export type ExtendedProfileState = Record<ExtendedProfileGroup["key"], ExtendedProfileValues>;

export const EMPTY_EXTENDED_STATE: ExtendedProfileState = {
  audience: {},
  marketing: {},
  content_ops: {},
};

function isAnswered(value: string | number | string[] | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return value.trim().length > 0;
}

/** 0–100 completeness for one group, counting only weighted fields. */
export function groupCompleteness(group: ExtendedProfileGroup, values: ExtendedProfileValues): number {
  const weighted = group.fields.filter((field) => field.weighted);
  if (weighted.length === 0) return 0;
  const answered = weighted.filter((field) => isAnswered(values[field.id])).length;
  return Math.round((answered / weighted.length) * 100);
}

/** 0–100 completeness across all three extended profiles. */
export function extendedCompleteness(state: ExtendedProfileState): number {
  const scores = EXTENDED_PROFILE_GROUPS.map((group) => groupCompleteness(group, state[group.key] ?? {}));
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}
