import type { CategoryId } from "@/lib/assessment/config";

export type SalesPersonaId =
  | "paid-media-plateau"
  | "campaign-factory"
  | "orphaned-audience"
  | "stalled-studio"
  | "funded-builder"
  | "curious-observer"
  | "internal-champion"
  | "category-leader";

export interface SalesPersona {
  id: SalesPersonaId;
  number: number;
  label: string;
  headline: string;
  body: string;
  primaryOffer: string;
  cta: {
    label: string;
    href: string;
    external?: boolean;
  };
  /** Which maturity level and weakest category select this persona. */
  match: {
    levels?: number[];
    weakest?: CategoryId[];
  };
}

export const SALES_PERSONAS: SalesPersona[] = [
  {
    id: "paid-media-plateau",
    number: 1,
    label: "Paid Media Plateau",
    headline: "You built the brand on paid media. Now the CAC curve is bending the wrong way.",
    body: "Your content works, but every view is rented. I help marketing leaders turn performance spend into owned audience infrastructure.",
    primaryOffer: "3–6 month consulting engagement",
    cta: { label: "Start with the free Publisher Test", href: "/auth?mode=signup&plan=test" },
    match: { levels: [2], weakest: ["distribution"] },
  },
  {
    id: "campaign-factory",
    number: 2,
    label: "Campaign Factory",
    headline: "Your team ships constantly, but nothing compounds.",
    body: "Campaigns launch, then vanish. I help teams build an editorial operating cadence so the work keeps working when nobody is forcing it.",
    primaryOffer: "Blueprint → OS → consulting",
    cta: { label: "Start with the free Publisher Test", href: "/auth?mode=signup&plan=test" },
    match: { levels: [1, 2], weakest: ["operations"] },
  },
  {
    id: "orphaned-audience",
    number: 3,
    label: "Orphaned Audience",
    headline: "You have the content. You do not own the audience.",
    body: "Followers, lists, and subscribers are scattered across platforms you do not control. I help brands build a direct audience relationship that survives an algorithm change.",
    primaryOffer: "3–6 month consulting engagement",
    cta: { label: "Start with the free Publisher Test", href: "/auth?mode=signup&plan=test" },
    match: { levels: [2, 3], weakest: ["audience"] },
  },
  {
    id: "stalled-studio",
    number: 4,
    label: "Stalled Studio",
    headline: "The content operation is real. The board cannot see it.",
    body: "You have a funded team, recurring formats, and no measurement story. I help leaders translate content into a board-level narrative with numbers behind it.",
    primaryOffer: "Senior consulting engagement",
    cta: { label: "Start with the free Publisher Test", href: "/auth?mode=signup&plan=test" },
    match: { levels: [3], weakest: ["operations", "alignment"] },
  },
  {
    id: "funded-builder",
    number: 5,
    label: "Funded Builder",
    headline: "You have money and ambition. You need a sequence.",
    body: "Eight priorities is the same as zero. I help founders and first marketing leaders decide which two moves matter now and which can wait.",
    primaryOffer: "$49 Blueprint → OS",
    cta: { label: "Start with the free Publisher Test", href: "/auth?mode=signup&plan=test" },
    match: { levels: [1, 2], weakest: ["strategy"] },
  },
  {
    id: "curious-observer",
    number: 6,
    label: "Curious Observer",
    headline: "You are just getting started. That is the right place to begin.",
    body: "Start with one owned channel. The free Publisher Test shows you which one, and the 90-day roadmap tells you what to do first.",
    primaryOffer: "Free Publisher Test → $49 Blueprint → OS waitlist",
    cta: { label: "Start with the free Publisher Test", href: "/auth?mode=signup&plan=test" },
    match: { levels: [1] },
  },
  {
    id: "category-leader",
    number: 8,
    label: "Category Leader",
    headline: "You are already operating at a high level.",
    body: "Your Blueprint shows few critical gaps. If you are open to it, I would love to compare notes or feature your work as a reference case.",
    primaryOffer: "Partner or referral conversation",
    cta: { label: "Get in touch", href: "https://jeffhallstead.com/contact", external: true },
    match: { levels: [4, 5] },
  },
];

export function resolveSalesPersona(
  level: number,
  weakestCategoryId?: CategoryId,
): SalesPersona {
  // Tier-specific overrides first.
  if (level === 1) {
    return SALES_PERSONAS.find((p) => p.id === "curious-observer")!;
  }
  if (level >= 4) {
    return SALES_PERSONAS.find((p) => p.id === "category-leader")!;
  }

  // Match by weakest category against the level-appropriate personas.
  if (weakestCategoryId) {
    const byWeakest = SALES_PERSONAS.find(
      (p) =>
        p.match.levels?.includes(level) && p.match.weakest?.includes(weakestCategoryId),
    );
    if (byWeakest) return byWeakest;
  }

  // Fallback by level alone.
  const byLevel = SALES_PERSONAS.find(
    (p) => p.match.levels?.includes(level) && p.match.weakest == null,
  );
  if (byLevel) return byLevel;

  return SALES_PERSONAS.find((p) => p.id === "funded-builder")!;
}

export const CORE_SALES_PERSONAS = SALES_PERSONAS.filter((p) =>
  ["paid-media-plateau", "campaign-factory", "orphaned-audience", "stalled-studio", "funded-builder"].includes(
    p.id,
  ),
);
