/**
 * Seller identity used across the legal pages. Paddle requires the legal
 * entity name to appear in the Terms and the Privacy Notice — update this
 * single constant if your legal name or contact address differs.
 */
export const SELLER = {
  legalName: "Momentive Ventures LLC",
  tradingName: "Publisher Blueprint™",
  supportEmail: "support@jeffhallstead.com",
  website: "https://jeffhallstead.com",
  jurisdiction: "the United States",
  refundDays: 30,
} as const;

export const PADDLE_BUYER_TERMS = "https://www.paddle.com/legal/checkout-buyer-terms";
export const PADDLE_REFUND_POLICY = "https://www.paddle.com/legal/refund-policy";
export const PADDLE_SUPPORT = "https://paddle.net";
