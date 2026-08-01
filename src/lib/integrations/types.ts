/** Provider-agnostic integration contracts (browser-safe: types + constants only). */

import type { ExportRow } from "@/lib/export/rows";

export type IntegrationProvider = "airtable" | "hubspot" | "airtable_records" | "asana";

export type IntegrationEventName =
  | "user.signed_up"
  | "assessment.completed"
  | "purchase.completed"
  | "subscription.changed"
  | "records.exported";

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
  /** Present on `records.exported` events: the rows to push into the destination. */
  records?: ExportRow[];
  /** Per-user destination config resolved at enqueue time. */
  target?: {
    airtableTable?: string | null;
    asanaProjectId?: string | null;
    asanaWorkspaceId?: string | null;
  };
}

export interface IntegrationAdapter {
  provider: IntegrationProvider;
  /** False when the provider is not connected/configured — the event is skipped, not failed. */
  isConfigured(): boolean;
  /** For providers whose credentials belong to each end user. */
  isConfiguredForUser?(userId: string | null): Promise<boolean>;
  send(event: IntegrationEvent): Promise<void>;
}


export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  "airtable",
  "hubspot",
  "airtable_records",
  "asana",
];

/** Providers that receive contact/lifecycle events. */
export const CONTACT_PROVIDERS: IntegrationProvider[] = ["airtable", "hubspot"];

/** Providers that receive exported Blueprint rows (tasks / records). */
export const RECORD_PROVIDERS: IntegrationProvider[] = ["airtable_records", "asana"];

export const RECORD_PROVIDER_LABELS: Record<string, string> = {
  airtable_records: "Airtable",
  asana: "Asana",
};

/** Max delivery attempts before an outbox row is marked failed. */
export const MAX_ATTEMPTS = 5;
