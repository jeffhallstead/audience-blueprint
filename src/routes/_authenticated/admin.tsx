import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { getAdminOverview, retryOutboxEvent } from "@/lib/admin/admin.functions";
import { LifecyclePanel } from "@/components/admin/lifecycle-panel";
import { QualificationPanel } from "@/components/admin/qualification-panel";
import { OrganizationsPanel } from "@/components/admin/organizations-panel";
import { EventsPanel } from "@/components/admin/events-panel";
import { LeadsPanel } from "@/components/admin/leads-panel";
import { IntegrationsHealth } from "@/components/admin/integrations-health";
import { GrantAccessDialog } from "@/components/admin/grant-access-dialog";


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console | Publisher Blueprint" },
      {
        name: "description",
        content:
          "Internal operations console for Publisher Blueprint: users, assessments, revenue, and integration health.",
      },
      { property: "og:title", content: "Admin Console | Publisher Blueprint" },
      {
        property: "og:description",
        content: "Internal operations console for Publisher Blueprint.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminConsole,
});

const currency = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  blueprint: "Blueprint",
  os: "Publisher OS",
};

function AdminConsole() {
  const fetchOverview = useServerFn(getAdminOverview);
  const retry = useServerFn(retryOutboxEvent);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => fetchOverview(),
    retry: false,
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => retry({ data: { id } }),
    onSuccess: () => {
      toast.success("Event requeued for the next dispatch run.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data?.users ?? [];
    return (data?.users ?? []).filter((u) =>
      [u.email, u.fullName, u.organization].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [data, search]);

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-20 text-center">
        <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Restricted</h1>
        <p className="text-sm text-muted-foreground">
          This console is available to internal administrators only.
        </p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const m = data.metrics;
  const maxLevel = Math.max(1, ...data.scoreDistribution.map((d) => d.count));

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Internal</p>
        <h1 className="text-3xl font-semibold tracking-tight">Admin Console</h1>
        <p className="text-sm text-muted-foreground">
          Operations snapshot across accounts, the Publisher Index™, commerce, and integration
          health.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Accounts"
          value={String(m.users)}
          hint={`${m.newUsers7d} new in last 7 days`}
        />
        <Metric
          label="Assessments"
          value={`${m.assessmentsCompleted}/${m.assessmentsStarted}`}
          hint="Completed / started"
        />
        <Metric
          label="Avg Publisher Index"
          value={m.avgIndexScore === null ? "—" : String(m.avgIndexScore)}
          hint="Latest score per account"
        />
        <Metric label="Revenue" value={currency(m.revenueCents)} hint="Completed purchases" />
        <Metric label="Blueprint customers" value={String(m.blueprintCustomers)} />
        <Metric label="Active OS subscriptions" value={String(m.activeSubscriptions)} />
        <Metric label="Copilot sessions" value={String(m.aiSessions)} />
        <Metric label="Documents generated" value={String(m.documentsGenerated)} />
      </section>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Accounts</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
          <TabsTrigger value="qualification">Qualification</TabsTrigger>
          <TabsTrigger value="maturity">Maturity mix</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-6">
          <LeadsPanel />
        </TabsContent>

        <TabsContent value="organizations" className="mt-6">
          <OrganizationsPanel />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <EventsPanel />
        </TabsContent>

        <TabsContent value="lifecycle" className="mt-6">
          <LifecyclePanel />
        </TabsContent>

        <TabsContent value="qualification" className="mt-6">
          <QualificationPanel />
        </TabsContent>

        <TabsContent value="users" className="mt-6 space-y-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name, or organization"
            className="max-w-sm"
            aria-label="Search accounts"
          />
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead className="text-right">Index</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.userId}>
                      <TableCell>
                        <div className="font-medium">{u.fullName ?? u.email}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.organization ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {u.indexScore ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={u.tier === "free" ? "outline" : "secondary"}>
                            {TIER_LABEL[u.tier]}
                          </Badge>
                          {u.grantedTier ? <Badge variant="outline">Manual</Badge> : null}
                          {u.isAdmin ? <Badge>Admin</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {shortDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <GrantAccessDialog user={u} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No accounts match that search.
                      </TableCell>
                    </TableRow>
                  ) : null}

                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maturity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Publisher Index™ maturity distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.scoreDistribution.map((row) => (
                <div key={row.level} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      Level {row.level} · {row.label}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{row.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${(row.count / maxLevel) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-4">
          <IntegrationsHealth />
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.outboxCounts).map(([status, count]) => (
              <Badge key={status} variant={status === "failed" ? "destructive" : "secondary"}>
                {status}: {count}
              </Badge>
            ))}
            {Object.keys(data.outboxCounts).length === 0 ? (
              <p className="text-sm text-muted-foreground">No integration events queued yet.</p>
            ) : null}
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                    <TableHead>Queued</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.outbox.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="capitalize">{row.provider}</TableCell>
                      <TableCell>
                        <div className="text-sm">{row.eventName}</div>
                        {row.lastError ? (
                          <div className="max-w-md truncate text-xs text-destructive">
                            {row.lastError}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === "failed" ? "destructive" : "secondary"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.attempts}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {shortDate(row.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={retryMutation.isPending}
                          onClick={() => retryMutation.mutate(row.id)}
                        >
                          <RefreshCw className="mr-2 size-3.5" /> Retry
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.outbox.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        Nothing in the integration outbox.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
