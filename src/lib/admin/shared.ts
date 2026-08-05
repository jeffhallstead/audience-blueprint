/** Shared, client-safe admin types and helpers. */

export type AdminMetrics = {
  users: number;
  newUsers7d: number;
  assessmentsStarted: number;
  assessmentsCompleted: number;
  avgIndexScore: number | null;
  blueprintCustomers: number;
  activeSubscriptions: number;
  revenueCents: number;
  aiSessions: number;
  documentsGenerated: number;
};

export type AdminUserRow = {
  userId: string;
  email: string;
  fullName: string | null;
  createdAt: string;
  organization: string | null;
  indexScore: number | null;
  maturityLevel: number | null;
  tier: "free" | "blueprint" | "os";
  isAdmin: boolean;
  /** Manually granted tier (admin comp), when an active grant exists. */
  grantedTier: "blueprint" | "os" | null;
  grantExpiresAt: string | null;
};


export type AdminOutboxRow = {
  id: string;
  provider: string;
  eventName: string;
  status: string;
  attempts: number;
  lastError: string | null;
  nextAttemptAt: string;
  createdAt: string;
};

export type AdminOverview = {
  metrics: AdminMetrics;
  scoreDistribution: { level: number; label: string; count: number }[];
  users: AdminUserRow[];
  outbox: AdminOutboxRow[];
  outboxCounts: Record<string, number>;
};

export const MATURITY_LABELS: Record<number, string> = {
  1: "Ad Hoc",
  2: "Emerging",
  3: "Structured",
  4: "Scaling",
  5: "Publisher-Grade",
};

type RoleContext = {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
  userId: string;
};

/** True when the caller holds the `admin` role, checked server-side via RLS-safe RPC. */
export async function isAdminContext(context: RoleContext): Promise<boolean> {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  return data === true;
}

/** Throws unless the caller holds the `admin` role. Never trust client claims. */
export async function assertAdmin(context: RoleContext): Promise<void> {
  if (!(await isAdminContext(context))) throw new Error("Forbidden");
}

/* ---------- E7: organizations, events, audit ---------- */

export type AdminOrgRow = {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string | null;
  domain: string | null;
  industry: string | null;
  region: string | null;
  businessModel: string | null;
  revenueRange: string | null;
  teamSize: string | null;
  completeness: number;
  memberCount: number;
  archivedAt: string | null;
  createdAt: string;
};

export type AdminOrgMember = {
  userId: string;
  email: string | null;
  role: string;
  createdAt: string;
};

export type AdminAuditRow = {
  id: string;
  organizationId: string;
  organizationName: string | null;
  actorId: string | null;
  actorEmail: string | null;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
};

export type AdminOrgAssessment = {
  id: string;
  status: string;
  overallScore: number | null;
  maturityLevel: number | null;
  createdAt: string;
  completedAt: string | null;
};

export type AdminOrgDetail = {
  organization: AdminOrgRow;
  members: AdminOrgMember[];
  audit: AdminAuditRow[];
  assessments: AdminOrgAssessment[];
};

export type AdminEventRow = {
  id: string;
  eventType: string;
  userId: string | null;
  userEmail: string | null;
  organizationId: string | null;
  source: string;
  environment: string;
  occurredAt: string;
  /** Pre-serialized payload JSON — the RPC boundary only carries plain values. */
  payloadJson: string;
};

export type AdminEventFeed = {
  events: AdminEventRow[];
  types: { type: string; count: number }[];
};

export type AdminLeadRow = {
  userId: string;
  email: string | null;
  fullName: string | null;
  organizationId: string | null;
  organizationName: string | null;
  domain: string | null;
  tier: string;
  fitScore: number;
  engagementScore: number;
  totalScore: number;
  indexScore: number | null;
  maturityLevel: number | null;
  reason: string | null;
  signals: { label: string; points: number }[];
  outreachStatus: string;
  notes: string | null;
  lastContactedAt: string | null;
  scoredAt: string;
  lifecycleStage: string | null;
};

export type AdminLeadFeed = {
  leads: AdminLeadRow[];
  count: number;
};

export type IntegrationsStatus = {
  /** Contact providers with credentials wired up right now. */
  contactProviders: string[];
  /** Outbox row counts keyed by status. */
  counts: Record<string, number>;
  lastDeliveredAt: string | null;
  qualifiedLeads: number;
};
