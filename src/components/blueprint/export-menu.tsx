import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardCopy, Download, FileSpreadsheet, Loader2, Send, Table2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Blueprint } from "@/lib/blueprint/engine";
import { useSavedRecommendations } from "@/lib/copilot/queries";
import { copyForSheets, downloadCsv, downloadXlsx } from "@/lib/export/file";
import { trackRecommendationExport } from "@/lib/analytics/recommendation-metadata";
import { ALL_SCOPES, EXPORT_SCOPES, buildExportRows, exportFilename, type ExportScope } from "@/lib/export/rows";
import {
  getExportDestinations,
  listExportAsanaProjects,
  pushExportRows,
  saveExportTarget,
} from "@/lib/export/export.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { useEntitlement } from "@/lib/commerce/use-entitlement";
import { LockedFeature } from "@/components/billing/feature-gate";

/**
 * One export surface for every destination. File downloads happen in the
 * browser; Airtable and Asana pushes queue through the integration outbox.
 */
export function ExportMenu({
  blueprint,
  defaultScopes = ALL_SCOPES,
}: {
  blueprint: Blueprint | null;
  defaultScopes?: ExportScope[];
}) {
  const [open, setOpen] = useState(false);
  const [scopes, setScopes] = useState<ExportScope[]>(defaultScopes);
  const [busy, setBusy] = useState<string | null>(null);
  const [airtableTable, setAirtableTable] = useState("Publisher Blueprint Actions");
  const [asanaProject, setAsanaProject] = useState<string>("");

  const queryClient = useQueryClient();
  const { data: saved } = useSavedRecommendations();
  const { can } = useEntitlement();
  const canExportFiles = can("file_export");
  const canUseConnectors = can("connector_export");
  const environment = getStripeEnvironment();

  const destinations = useQuery({
    queryKey: ["export", "destinations"],
    queryFn: () => getExportDestinations({ data: { environment } }),
    enabled: open && canUseConnectors,
  });

  const asanaAvailable = destinations.data?.available.includes("asana") ?? false;
  const airtableAvailable = destinations.data?.available.includes("airtable_records") ?? false;

  const asanaProjects = useQuery({
    queryKey: ["export", "asana-projects"],
    queryFn: () => listExportAsanaProjects({ data: { environment } }),
    enabled: open && asanaAvailable && canUseConnectors,
  });

  const push = useMutation({
    mutationFn: (provider: "airtable_records" | "asana") =>
      pushExportRows({ data: { provider, rows, environment } }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["export", "destinations"] });
      toast.success(
        result.failed > 0
          ? `Queued ${result.rows} rows — delivery is retrying.`
          : `Sent ${result.rows} rows.`,
      );
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const saveTarget = useMutation({
    mutationFn: (input: Parameters<typeof saveExportTarget>[0]["data"]) => saveExportTarget({ data: { ...input, environment } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["export", "destinations"] }),
  });

  const rows = buildExportRows({ blueprint, saved: saved ?? null }, scopes, {
    locked: !canExportFiles,
  });
  const stem = exportFilename(blueprint);

  function toggleScope(scope: ExportScope, checked: boolean) {
    setScopes((current) =>
      checked ? [...new Set([...current, scope])] : current.filter((item) => item !== scope),
    );
  }

  async function run(kind: "csv" | "xlsx" | "clipboard") {
    if (rows.length === 0) {
      toast.error("Select at least one section to export.");
      return;
    }
    setBusy(kind);
    try {
      if (kind === "csv") downloadCsv(rows, stem);
      if (kind === "xlsx") await downloadXlsx(rows, stem);
      if (kind === "clipboard") {
        await copyForSheets(rows);
        toast.success("Copied — paste into Google Sheets or Excel.");
      }
      await trackRecommendationExport(
        rows.map((row) => row.Title),
        kind === "clipboard" ? "sheets" : kind,
      );
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function sendTo(provider: "airtable_records" | "asana") {
    if (rows.length === 0) {
      toast.error("Select at least one section to export.");
      return;
    }
    if (provider === "airtable_records") {
      await saveTarget.mutateAsync({ provider, airtableTable });
    }
    if (provider === "asana") {
      if (!asanaProject) {
        toast.error("Choose an Asana project first.");
        return;
      }
      const name = asanaProjects.data?.projects.find((p) => p.id === asanaProject)?.name ?? null;
      await saveTarget.mutateAsync({ provider, asanaProjectId: asanaProject, asanaProjectName: name });
    }
    push.mutate(provider);
    void trackRecommendationExport(
      rows.map((row) => row.Title),
      provider,
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="size-4" aria-hidden /> Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export your plan</DialogTitle>
          <DialogDescription>
            Take your Blueprint into a spreadsheet or straight into a tracking tool. Every destination uses the same
            columns.
          </DialogDescription>
        </DialogHeader>

        <fieldset className="space-y-3">
          <legend className="text-eyebrow mb-2">What to include</legend>
          {EXPORT_SCOPES.map((scope) => (
            <div key={scope.id} className="flex items-center gap-3">
              <Checkbox
                id={`scope-${scope.id}`}
                checked={scopes.includes(scope.id)}
                onCheckedChange={(checked) => toggleScope(scope.id, checked === true)}
              />
              <Label htmlFor={`scope-${scope.id}`} className="text-sm font-normal">
                {scope.label}
              </Label>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">{rows.length} rows selected</p>
        </fieldset>

        <Separator />

        {canExportFiles ? (
          <div className="space-y-3">
            <p className="text-eyebrow">Download</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => void run("csv")}>
                <Table2 className="size-4" aria-hidden /> CSV
              </Button>
              <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => void run("xlsx")}>
                {busy === "xlsx" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <FileSpreadsheet className="size-4" aria-hidden />
                )}{" "}
                Excel
              </Button>
              <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => void run("clipboard")}>
                <ClipboardCopy className="size-4" aria-hidden /> Copy for Google Sheets
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              For Google Sheets: copy, then paste into a blank sheet — or import the CSV.
            </p>
          </div>
        ) : (
          <LockedFeature
            feature="file_export"
            title="Unlock exports"
            description="CSV, Excel and Google Sheets exports of your opportunities, 90-day roadmap and KPIs come with Publisher Blueprint™."
          />
        )}


        <Separator />

        {!canUseConnectors ? (
          <LockedFeature
            feature="connector_export"
            title="Unlock Airtable and Asana sync"
            description="Push every opportunity, roadmap activity and KPI straight into your tracker. Included with Publisher Blueprint™."
          />
        ) : (
        <div className="space-y-4">
          <p className="text-eyebrow">Send to a tracker</p>


          <div className="space-y-2">
            <Label htmlFor="airtable-table" className="text-sm">
              Airtable table
            </Label>
            <div className="flex gap-2">
              <Input
                id="airtable-table"
                value={airtableTable}
                onChange={(event) => setAirtableTable(event.target.value)}
                disabled={!airtableAvailable}
              />
              <Button
                size="sm"
                disabled={!airtableAvailable || push.isPending}
                onClick={() => void sendTo("airtable_records")}
              >
                {push.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                Send
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {airtableAvailable
                ? "Rows upsert on the Key column, so re-exporting updates instead of duplicating."
                : "Connect your own Airtable account in Settings → Connections."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asana-project" className="text-sm">
              Asana project
            </Label>
            <div className="flex gap-2">
              <Select value={asanaProject} onValueChange={setAsanaProject} disabled={!asanaAvailable}>
                <SelectTrigger id="asana-project" className="flex-1">
                  <SelectValue placeholder={asanaAvailable ? "Choose a project" : "Asana not connected"} />
                </SelectTrigger>
                <SelectContent>
                  {(asanaProjects.data?.projects ?? []).map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" disabled={!asanaAvailable || push.isPending} onClick={() => void sendTo("asana")}>
                {push.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                Send
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {asanaAvailable
                ? "One task per row, with roadmap months mapped to due dates."
                : "Connect your own Asana account in Settings → Connections."}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            <Check className="size-4" aria-hidden /> Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
