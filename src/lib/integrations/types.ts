/** Provider-agnostic integration contracts (browser-safe: types + constants only). */

export type IntegrationProvider = "airtable" | "hubspot";

export type IntegrationEventName =
  | "user.signed_up"
  | "assessment.completed"
  | "purchase.completed"
  | "subscription.changed";

/** Normalized contact/event record every adapter receives. */
export interface IntegrationEvent {
  eventName: IntegrationEventName;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  organization?: string | null;
  /** 0-100 Publisher Index score, when known. */
  score?: number | null;
  maturityLevel?: string | null;
  tier?: string | null;
  amount?: number | null;
  currency?: string | null;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface IntegrationAdapter {
  provider: IntegrationProvider;
  /** False when the provider is not connected/configured — the event is skipped, not failed. */
  isConfigured(): boolean;
  send(event: IntegrationEvent): Promise<void>;
}

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = ["airtable", "hubspot"];

/** Max delivery attempts before an outbox row is marked failed. */
export const MAX_ATTEMPTS = 5;
