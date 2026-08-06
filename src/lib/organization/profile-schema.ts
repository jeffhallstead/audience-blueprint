/**
 * Organization profile — the persistent record of who the customer is.
 *
 * This is deliberately separate from the Publisher Index assessment answers.
 * Nothing in this file feeds scoring; it is identity + segmentation only.
 */

export type OrgFieldType = "text" | "url" | "select" | "number";

export interface OrgFieldConfig {
  /** Column name on public.organizations */
  id: OrgFieldId;
  label: string;
  type: OrgFieldType;
  placeholder?: string;
  help?: string;
  options?: string[];
  /** Part of the minimal gate collected before the assessment starts. */
  intake: boolean;
  required?: boolean;
  /** Assessment question this field prefills, when one exists. */
  prefills?: string;
}

export type OrgFieldId =
  | "name"
  | "website"
  | "industry"
  | "revenue_range"
  | "team_size"
  | "region"
  | "business_model"
  | "marketer_count";

export const INDUSTRY_OPTIONS = [
  "Technology / SaaS",
  "Financial Services",
  "Healthcare",
  "Professional Services",
  "Manufacturing",
  "Retail / CPG",
  "Media & Entertainment",
  "Education",
  "Nonprofit",
  "Other",
];

export const REVENUE_OPTIONS = ["< $10M", "$10M – $50M", "$50M – $250M", "$250M – $1B", "$1B+"];

export const TEAM_SIZE_OPTIONS = ["1 – 50", "51 – 250", "251 – 1,000", "1,001 – 5,000", "5,000+"];

export const REGION_OPTIONS = [
  "North America",
  "Latin America",
  "United Kingdom & Ireland",
  "Europe",
  "Middle East & Africa",
  "Asia Pacific",
  "Global",
];

export const BUSINESS_MODEL_OPTIONS = ["B2B", "B2C", "DTC", "Marketplace", "Nonprofit", "Hybrid"];

export const ORG_FIELDS: OrgFieldConfig[] = [
  {
    id: "name",
    label: "Organization name",
    type: "text",
    placeholder: "Acme Industries",
    intake: true,
    required: true,
    prefills: "company_name",
  },
  {
    id: "website",
    label: "Website",
    type: "url",
    placeholder: "https://acme.com",
    intake: true,
    required: true,
    prefills: "website",
  },
  {
    id: "industry",
    label: "Industry",
    type: "select",
    options: INDUSTRY_OPTIONS,
    intake: true,
    required: true,
    prefills: "industry",
  },
  {
    id: "revenue_range",
    label: "Annual revenue",
    type: "select",
    options: REVENUE_OPTIONS,
    intake: true,
    required: true,
    prefills: "revenue_range",
  },
  {
    id: "team_size",
    label: "Company size",
    type: "select",
    options: TEAM_SIZE_OPTIONS,
    intake: true,
    required: true,
    prefills: "company_size",
  },
  {
    id: "region",
    label: "Primary region",
    type: "select",
    options: REGION_OPTIONS,
    intake: true,
    required: true,
  },
  {
    id: "business_model",
    label: "Primary business model",
    type: "select",
    options: BUSINESS_MODEL_OPTIONS,
    intake: false,
    prefills: "business_model",
  },
  {
    id: "marketer_count",
    label: "Marketing team size",
    help: "Full-time equivalents dedicated to marketing.",
    type: "number",
    placeholder: "12",
    intake: false,
    prefills: "marketing_team_size",
  },
];

export const INTAKE_FIELDS = ORG_FIELDS.filter((field) => field.intake);

export interface OrganizationProfile {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  revenue_range: string | null;
  team_size: string | null;
  region: string | null;
  business_model: string | null;
  marketer_count: number | null;
  domain: string | null;
  profile_completeness: number;
}

export type OrgProfilePatch = Partial<Record<OrgFieldId, string | number | null>>;

/** Strips protocol, www and any path so the domain is a stable CRM match key. */
export function normalizeDomain(website: string | null | undefined): string | null {
  if (!website) return null;
  const trimmed = website.trim().toLowerCase();
  if (!trimmed) return null;
  return (
    trimmed
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0] || null
  );
}

/** 0–100 across the eight profile fields. Mirrors the SQL backfill exactly. */
export function computeCompleteness(profile: Partial<OrganizationProfile>): number {
  const filled = ORG_FIELDS.filter((field) => {
    const value = profile[field.id];
    if (field.type === "number") return value !== null && value !== undefined && value !== ("" as unknown);
    return typeof value === "string" && value.trim() !== "";
  }).length;
  return Math.round((filled * 100) / ORG_FIELDS.length);
}

export function missingIntakeFields(profile: OrgProfilePatch): OrgFieldConfig[] {
  return INTAKE_FIELDS.filter((field) => {
    const value = profile[field.id];
    return value === null || value === undefined || String(value).trim() === "";
  });
}
