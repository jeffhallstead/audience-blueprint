/**
 * Microdrama Greenlight — category-aware editorial copy.
 * Scoring never changes by category; only the diagnosis wording does.
 */
import type { PatternId, ScoredKey } from "./greenlight";

export type Category = "beauty_fashion" | "food_beverage" | "health_wellness" | "other";

export const CATEGORIES: Category[] = ["beauty_fashion", "food_beverage", "health_wellness", "other"];

export const CATEGORY_LABELS: Record<Category, string> = {
  beauty_fashion: "Beauty & Fashion",
  food_beverage: "Food & Beverage",
  health_wellness: "Health & Wellness",
  other: "Other consumer brand",
};

export const CATEGORY_DIAGNOSIS: Record<Category, Record<PatternId, string>> = {
  beauty_fashion: {
    paid_media_plateau:
      "For a beauty and fashion brand, paid acquisition CAC continues to compress margin. A microdrama can reignite acquisition, but only if the series is engineered as a subscriber acquisition engine, capturing viewer email/SMS on the premiere, rather than driving one-off traffic to a rented feed.",
    borrowed_audience:
      "For a fashion or beauty brand with strong algorithmic reach, your bottleneck is not creative aesthetic or visual appeal. It is conversion. The series only succeeds if it bridges high-fashion drama into tracked shoppable looks, VIP drop lists, or direct checkout.",
    campaign_factory:
      "Beauty brands often live in a cycle of collection drops and seasonal launch fatigue. A 3-episode trial will not move your metrics; vertical fiction requires a committed 20–40+ episode season that turns character wardrobes and beauty rituals into continuous cultural touchpoints.",
    invisible_studio:
      "Your brand already possesses exceptional creative taste and visual craft. However, without clean attribution linking episodic view-through rates to repeat customer purchase behavior, executive leadership will view the series as an expensive branding indulgence.",
    fragmented_builder:
      "Your social, influencer, and ecommerce teams are currently creating disconnected content. A microdrama cannot simply be another one-off campaign; it must serve as the central cultural tentpole that every channel orchestrates around.",
    category_leader:
      "At your category scale, organic momentum alone will not cut through. A flagship beauty microdrama requires dedicated launch media spend and co-starring talent to dominate the cultural conversation from day one.",
  },
  food_beverage: {
    paid_media_plateau:
      "For a food or beverage brand fighting rising grocery retail margins or climbing DTC ad costs, a scripted series creates emotional loyalty paid ads cannot buy. However, it must capture first-party data so you can drive local retail velocity or replenishment subscriptions directly.",
    borrowed_audience:
      "Food and beverage content naturally commands viral engagement, but viral recipe clips don't build brand equity. The microdrama must build recurring character relationships around mealtime rituals and dining occasions that translate directly into shopping basket additions.",
    campaign_factory:
      "In food and beverage, purchase frequency is everything. Moving beyond sporadic seasonal promotions requires treating your series as a sustained programming block that anchors weekly consumption habits across an entire season.",
    invisible_studio:
      "You have the culinary authority and high-production storytelling, but food leadership needs commercial proof. The series must have tight promo tracking, geo-targeted retail store locators, or shoppable cart integrations from the first episode.",
    fragmented_builder:
      "Between creator partnerships, brand activations, and retail promotions, your narrative is currently fractured. A scripted culinary or dining series must be the singular creative north star that unifies your marketing calendar.",
    category_leader:
      "As an established category giant, the production must feel like prime-time prestige entertainment. Backing the release with cross-retail promotion and a dedicated paid media launch window is essential to justify the production scale.",
  },
  health_wellness: {
    paid_media_plateau:
      "Wellness brands face some of the highest paid-search and social ad costs in consumer goods. Scripted storytelling lets you explore human struggles and transformations without triggering ad fatigue, provided viewers are channeled immediately into an owned wellness community or email sequence.",
    borrowed_audience:
      "In wellness, passive social viewers are easy to gather, but trust is hard to build. A microdrama works only if it turns casual viewers into an engaged first-party audience ready for deeper education, consultations, or subscription regimen commitments.",
    campaign_factory:
      "Transformational health and lifestyle changes do not happen in a single marketing stunt. A short test clip cannot communicate credibility; the narrative demands a serialized arc that mirrors real lifestyle habits over a multi-episode run.",
    invisible_studio:
      "Your scientific authority and brand ethos are rigorous, but health and wellness categories face strict regulatory and attribution hurdles. Before filming, you must lock in both compliance approval speed and an attribution model that tracks patient or subscriber lifetime value.",
    fragmented_builder:
      "Your brand message is likely split between clinical efficacy, lifestyle aspirations, and product specs. A scripted series must crystallize your core philosophy into one clear, emotionally resonant story arc that aligns your entire organization.",
    category_leader:
      "Dominating the wellness category requires broad cultural authority. To shift perception at scale, the series requires a dedicated distribution budget to seed the premiere across both paid channels and trusted practitioner ecosystems.",
  },
  other: {
    paid_media_plateau:
      "As customer acquisition costs rise across digital channels, scripted entertainment replaces transactional ad fatigue with organic pull, provided every viewer has a friction-free path into an owned first-party database.",
    borrowed_audience:
      "Your social channels generate strong awareness, but audience ownership sits entirely on rented platforms. The series must be structured with explicit lead magnets and conversion mechanics to turn viewers into direct brand relationships.",
    campaign_factory:
      "Isolated campaign spikes create operational burnout without compounding retention. A microdrama only delivers ROI when committed to as an episodic season that builds cumulative audience momentum week after week.",
    invisible_studio:
      "You have high creative standards, but executive backing requires commercial discipline. Establishing a clear attribution model before production begins is necessary to demonstrate pipeline and revenue impact.",
    fragmented_builder:
      "Your marketing initiatives are running in departmental silos. A serialized flagship series gives all internal teams a single narrative engine to amplify across social, email, and PR.",
    category_leader:
      "At your market footprint, production quality is assumed. Breaking through consumer indifference requires an intentional media distribution budget that guarantees wide cultural reach from week one.",
  },
};

/** Category-specific wording for "I'm not sure" open questions. Falls back to the generic prompt. */
export const CATEGORY_CONFIRM: Partial<Record<Category, Partial<Record<ScoredKey, string>>>> = {
  beauty_fashion: {
    product_role: "Can the brand's aesthetic or product line be woven into character styling without making the drama feel like a continuous infomercial?",
    purchase_path: "Do you have a streamlined mobile landing page or TikTok Shop workflow ready to handle episodic lookbook purchases?",
  },
  food_beverage: {
    product_role: "Does the product naturally anchor a social ritual, kitchen crisis, or dining gathering in the plot?",
    measurement: "Will success be measured by DTC cart conversions or velocity at key grocery and retail partners?",
  },
  health_wellness: {
    product_role: "How can the emotional impact of the product benefit be dramatized while remaining strictly within regulatory and brand compliance guidelines?",
    capture: "Is your email onboarding or SMS flow prepared to nurture viewers who enter through an emotional health narrative?",
  },
};

export const VERDICT_SUMMARY = {
  green_light:
    "The strategic and creative fundamentals are in place. Here is the operational condition that makes a serialized short-form production pay off for your category.",
  not_yet:
    "There is genuine promise in the concept, but critical operational gaps must be resolved before committing production capital.",
  no: "A scripted short-form series is not the right vehicle for your brand's current growth model. Your creative and capital resources will generate far higher compounding returns in an owned editorial franchise, such as a recurring video column or high-frequency newsletter.",
} as const;
