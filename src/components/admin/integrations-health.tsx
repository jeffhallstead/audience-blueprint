import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PlugZap, Send, Users } from "lucide-react";
import { toast } from "sonner";

import {
  backfillCrmContacts,
  dispatchOutboxNow,
  getIntegrationsStatus,
} from "@/lib/admin/admin.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PROVIDER_LABEL: Record<string, string> = {
  airtable: "Airtable",
  hubspot: "HubSpot",
};

function when(iso: string | null) {
  if (!iso) return "never";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** CRM pipeline health: what's connected, what's queued, and manual controls. */
export function IntegrationsHealth() {
  const fetchStatus = useServerFn(getIntegrationsStatus);
  const backfill = useServerFn(backfillCrmContacts);
  const dispatch = useServerFn(dispatchOutboxNow);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "integrations-status"],
    queryFn: () => fetchStatus(),
    retry: false,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "integrations-status"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
  };

  const backfillMutation = useMutation({
    mutationFn: () => backfill(),
    onSuccess: (result) => {
      toast.success(`Queued ${result.queued} lead${result.queued === 1 ? "" : "s"} for CRM sync.`, {
        description: result.skipped ? `${result.skipped} skipped (no email or no provider).` : undefined,
      });
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const dispatchMutation = useMutation({
    mutationFn: () => dispatch(),
    onSuccess: (result) => {
      toast.success(
        `Dispatched ${result.delivered} delivered, ${result.failed} failed, ${result.skipped} skipped.`,
      );
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading || !data) return <Skeleton className="h-40" />;

  const connected = data.contactProviders.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">CRM pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <PlugZap className="size-3.5" /> Connected
            </p>
            {connected ? (
              <div className="flex flex-wrap gap-1.5">
                {data.contactProviders.map((p) => (
                  <Badge key={p} variant="secondary">
                    {PROVIDER_LABEL[p] ?? p}
                  </Badge>
                ))}
              </div>
            ) : (
              <Badge variant="destructive">No contact provider configured</Badge>
            )}
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <Send className="size-3.5" /> Last delivered
            </p>
            <p className="text-sm">{when(data.lastDeliveredAt)}</p>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <Users className="size-3.5" /> Qualified leads
            </p>
            <p className="text-sm tabular-nums">{data.qualifiedLeads}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!connected || backfillMutation.isPending}
            onClick={() => backfillMutation.mutate()}
          >
            Backfill qualified leads
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={dispatchMutation.isPending}
            onClick={() => dispatchMutation.mutate()}
          >
            Dispatch now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
