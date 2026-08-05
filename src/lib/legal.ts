/**
 * Seller identity used across the legal pages. The legal entity name must
 * appear in the Terms and the Privacy Notice — update this single constant
 * if your legal name or contact address differs.
 */
export const SELLER = {
  legalName: "Momentive Ventures LLC",
  tradingName: "Publisher Blueprint™",
  supportEmail: "support@jeffhallstead.com",
  website: "https://jeffhallstead.com",
  jurisdiction: "the United States",
  refundDays: 30,
} as const;

/** Payment processor referenced in the legal pages. */
export const PROCESSOR = {
  name: "Stripe",
  privacyPolicy: "https://stripe.com/privacy",
  consumerTerms: "https://stripe.com/legal/consumer",
} as const;
