import { z } from "zod";

export const VERTICALS = ["beauty", "fashion", "food", "wellness", "other"] as const;
export const PATTERN_IDS = ["paid_media_plateau", "campaign_factory", "borrowed_audience", "invisible_studio", "fragmented_builder", "category_leader"] as const;

export const intakeShape = {
  brandName: z.string().trim().min(1).max(200).describe("Brand name"),
  website: z.string().trim().max(500).optional().default("").describe("Brand website URL"),
  handles: z.string().trim().max(1000).optional().default("").describe("Social handles and reach, e.g. '@brand IG 250k, TikTok 80k'"),
  vertical: z.enum(VERTICALS).describe("Brand vertical"),
  editorialNewsletter: z.boolean().describe("Has an editorial newsletter (not just a discount popup)"),
  recurringSeries: z.boolean().describe("Publishes recurring series / franchise content"),
  heavyPaid: z.boolean().describe("Relies heavily on paid ads"),
  activeCommunity: z.boolean().describe("Has an active community"),
  notes: z.string().trim().max(4000).optional().default("").describe("Your observations about the brand"),
};
export const intake = z.object(intakeShape);
