import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Check, Copy, Mail, MoreHorizontal, Search, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { getQualifiedLeads, updateLeadOutreach } from "@/lib/admin/leads.functions";
import { TIER_LABEL } from "@/lib/qualification/tiers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const OUTREACH_STATUS: { value: string; label: string; variant: "default" | "secondary" | "outline" | "destructive" }[] = [
  { value: "new", label: "New", variant: "default" },
  { value: "contacted", label: "Contacted", variant: "secondary" },
  { value: "responded", label: "Responded", variant: "secondary" },
  { value: "meeting_booked", label: "Meeting booked", variant: "outline" },
  { value: "nurtured", label: "Nurtured", variant: "outline" },
  { value: "no_fit", label: "No fit", variant: "destructive" },
];

const STATUS_LABEL = Object.fromEntries(OUTREACH_STATUS.map((s) => [s.value, s.label]));

const shortDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

function StatusBadge({ status }: { status: string }) {
  const item = OUTREACH_STATUS.find((s) => s.value === status) ?? OUTREACH_STATUS[0]!;
  return <Badge variant={item.variant}>{item.label}</Badge>;
}


type LeadEditState = {
  userId: string;
  fullName: string | null;
  email: string | null;
  status: string;
  notes: string;
};

export function LeadsPanel() {
  const fetchLeads = useServerFn(getQualifiedLeads);
  const saveOutreach = useServerFn(updateLeadOutreach);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [edit, setEdit] = useState<LeadEditState | null>(null);

  const filters = useMemo(
    () => ({
      search: search,
      tier: tier === "all" ? null : tier,
      status: status === "all" ? null : status,
    }),
    [search, tier, status],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "leads", filters],
    queryFn: () => fetchLeads({ data: filters }),
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { userId: string; status: string; notes: string }) =>
      saveOutreach({ data: { ...payload, lastContactedAt: payload.status === "contacted" || payload.status === "meeting_booked" ? new Date().toISOString() : null } }),
    onSuccess: () => {
      toast.success("Lead outreach updated.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
      setEdit(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const quickUpdateMutation = useMutation({
    mutationFn: (payload: { userId: string; status: string; notes: string }) =>
      saveOutreach({ data: { ...payload } }),
    onSuccess: () => {
      toast.success("Status updated.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });


  const copyEmail = (email: string) => {
    void navigator.clipboard.writeText(email);
    toast.success("Email copied to clipboard.");
  };

  const leads = data?.leads ?? [];
  const crmBaseUrl =
    typeof import.meta.env !== "undefined" ? import.meta.env["VITE_AIRTABLE_BASE_URL"] : undefined;


  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, organization, domain, or reason"
            className="pl-9"
            aria-label="Search leads"
          />
        </div>
        <div className="flex gap-3">
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="marketing_qualified">Marketing qualified</SelectItem>
              <SelectItem value="sales_qualified">Sales qualified</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {OUTREACH_STATUS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Qualified leads {data ? `(${data.count})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Index</TableHead>
                  <TableHead className="text-right">Fit / Eng</TableHead>
                  <TableHead>Outreach</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No qualified leads match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.userId}>
                      <TableCell>
                        <div className="font-medium">{lead.fullName ?? lead.email ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{lead.email ?? lead.userId.slice(0, 8)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 className="size-3.5 text-muted-foreground" />
                          {lead.organizationName ?? "—"}
                        </div>
                        {lead.domain ? (
                          <div className="text-xs text-muted-foreground">{lead.domain}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{TIER_LABEL[lead.tier as keyof typeof TIER_LABEL] ?? lead.tier}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {lead.indexScore ?? "—"} / {lead.maturityLevel ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {lead.fitScore} / {lead.engagementScore}
                        <span className="ml-1 text-muted-foreground">({lead.totalScore})</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={lead.outreachStatus} />
                          <span className="text-xs text-muted-foreground">{shortDate(lead.lastContactedAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Open actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {lead.email ? (
                              <DropdownMenuItem onClick={() => copyEmail(lead.email!)}>
                                <Copy className="mr-2 size-4" /> Copy email
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              onClick={() =>
                                setEdit({
                                  userId: lead.userId,
                                  fullName: lead.fullName,
                                  email: lead.email,
                                  status: lead.outreachStatus,
                                  notes: lead.notes ?? "",
                                })
                              }
                            >
                              <StickyNote className="mr-2 size-4" /> Notes / status
                            </DropdownMenuItem>
                            {crmBaseUrl && lead.email ? (
                              <DropdownMenuItem asChild>
                                <a
                                  href={`${crmBaseUrl}?search=${encodeURIComponent(lead.email!)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Mail className="mr-2 size-4" /> Open CRM record
                                </a>
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {edit ? (
        <Dialog open onOpenChange={() => setEdit(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base">
                {edit.fullName ?? edit.email ?? edit.userId.slice(0, 8)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Outreach status</label>
                <Select value={edit.status} onValueChange={(value) => setEdit({ ...edit, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTREACH_STATUS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={edit.notes}
                  onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
                  placeholder="What did you learn? Next step?"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                {OUTREACH_STATUS.map((s) => (
                  <Button
                    key={s.value}
                    type="button"
                    variant={edit.status === s.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEdit({ ...edit, status: s.value })}
                  >
                    {edit.status === s.value ? <Check className="mr-1.5 size-3.5" /> : null}
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  updateMutation.mutate({
                    userId: edit.userId,
                    status: edit.status,
                    notes: edit.notes,
                  })
                }
                disabled={updateMutation.isPending}
              >
                Save outreach
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
