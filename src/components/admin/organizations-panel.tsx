import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Search } from "lucide-react";

import {
  getOrganizationDetail,
  listOrganizationAudit,
  searchOrganizations,
} from "@/lib/admin/insights.functions";
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

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function Detail({ organizationId, onClose }: { organizationId: string; onClose: () => void }) {
  const fetchDetail = useServerFn(getOrganizationDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "org", organizationId],
    queryFn: () => fetchDetail({ data: { organizationId } }),
    retry: false,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data) return null;
  const org = data.organization;

  const facts: [string, string | null][] = [
    ["Owner", org.ownerEmail],
    ["Domain", org.domain],
    ["Industry", org.industry],
    ["Region", org.region],
    ["Business model", org.businessModel],
    ["Revenue", org.revenueRange],
    ["Team size", org.teamSize],
    ["Profile completeness", `${org.completeness}%`],
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" />
          {org.name}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Back to list
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label} className="space-y-1">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
              <dd className="text-sm">{value || "—"}</dd>
            </div>
          ))}
        </dl>

        <section className="space-y-2">
          <h4 className="text-sm font-semibold">Members ({data.members.length})</h4>
          {data.members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No member records.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.members.map((m) => (
                <li key={m.userId} className="flex items-center gap-2">
                  <Badge variant="secondary">{m.role}</Badge>
                  <span>{m.email ?? m.userId}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h4 className="text-sm font-semibold">Assessments ({data.assessments.length})</h4>
          {data.assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assessments linked to this organization.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Index</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.assessments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.status}</TableCell>
                    <TableCell className="tabular-nums">{a.overallScore ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{a.maturityLevel ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{when(a.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        <section className="space-y-2">
          <h4 className="text-sm font-semibold">Audit history</h4>
          {data.audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.audit.map((a) => (
                <li key={a.id} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{a.field}</span>
                  <span className="text-muted-foreground">
                    {a.oldValue || "—"} → {a.newValue || "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {when(a.createdAt)} · {a.actorEmail ?? "system"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

export function OrganizationsPanel() {
  const search = useServerFn(searchOrganizations);
  const fetchAudit = useServerFn(listOrganizationAudit);
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const orgs = useQuery({
    queryKey: ["admin", "orgs", query],
    queryFn: () => search({ data: { query } }),
    retry: false,
  });

  const audit = useQuery({
    queryKey: ["admin", "audit", query],
    queryFn: () => fetchAudit({ data: { search: query } }),
    retry: false,
  });

  if (selected) return <Detail organizationId={selected} onClose={() => setSelected(null)} />;

  return (
    <div className="space-y-6">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(term.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search organizations by name, domain, or owner email"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {orgs.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (orgs.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No organizations match that search.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orgs.data ?? []).map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <span className="font-medium">{org.name}</span>
                      {org.domain ? (
                        <span className="block text-xs text-muted-foreground">{org.domain}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{org.ownerEmail ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{org.industry ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{org.memberCount}</TableCell>
                    <TableCell className="tabular-nums">{org.completeness}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(org.id)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
        </CardHeader>
        <CardContent>
          {audit.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (audit.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No organization changes recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(audit.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.organizationName ?? "—"}</TableCell>
                    <TableCell className="font-medium">{row.field}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.oldValue || "—"} → {row.newValue || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.actorEmail ?? "system"}</TableCell>
                    <TableCell className="text-muted-foreground">{when(row.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
