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

type RoleContext = { supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> }; userId: string };

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
