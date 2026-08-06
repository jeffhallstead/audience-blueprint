import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Loader2, Plus, Plug, Unplug } from "lucide-react";
import { toast } from "sonner";

import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  connectIntegration,
  createAsanaProject,
  disconnectIntegration,
  listMyAirtableBases,
  listMyAsanaProjects,
  listMyConnections,
  selectAirtableBase,
  selectAsanaProject,
} from "@/lib/integrations/connections.functions";

import { getStripeEnvironment } from "@/lib/stripe";
import { useEntitlement } from "@/lib/commerce/use-entitlement";
import { LockedFeature } from "@/components/billing/feature-gate";


type Provider = "airtable" | "asana";

const PROVIDER_COPY: Record<Provider, { name: string; help: string; before: string; tokenUrl: string; placeholder: string }> = {
  airtable: {
    name: "Airtable",
    help: "Create a personal access token with data.records:read/write and schema.bases:read, then give it access to the base you want your plan written into.",
    before: "You need an existing Airtable base. The export will create a table inside it.",
    tokenUrl: "https://airtable.com/create/tokens",
    placeholder: "pat...",
  },
  asana: {
    name: "Asana",
    help: "Create a personal access token in your Asana developer console. Tasks are created in the project you pick when exporting.",
    before: "You need at least one Asana workspace. The project itself can be empty — we create tasks in it.",
    tokenUrl: "https://app.asana.com/0/my-apps",
    placeholder: "1/12345...",
  },
};


/** Lets each user connect their own Airtable and Asana accounts for exports. */
export function ConnectionsPanel() {
  const queryClient = useQueryClient();
  const [tokens, setTokens] = useState<Record<Provider, string>>({ airtable: "", asana: "" });
  const { can, isLoading: entitlementLoading } = useEntitlement();
  const canUseConnectors = can("connector_export");
  const environment = getStripeEnvironment();

  const connections = useQuery({
    queryKey: ["integrations", "connections"],
    queryFn: () => listMyConnections(),
  });

  const connected = (provider: Provider) =>
    connections.data?.connections.find((item) => item.provider === provider) ?? null;

  const bases = useQuery({
    queryKey: ["integrations", "airtable-bases"],
    queryFn: () => listMyAirtableBases({ data: { environment } }),
    enabled: canUseConnectors && Boolean(connected("airtable")),
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["integrations"] });
    void queryClient.invalidateQueries({ queryKey: ["export"] });
  }

  const connect = useMutation({
    mutationFn: (input: { provider: Provider; token: string }) => connectIntegration({ data: { ...input, environment } }),
    onSuccess: (_result, input) => {
      setTokens((current) => ({ ...current, [input.provider]: "" }));
      toast.success(`${PROVIDER_COPY[input.provider].name} connected.`);
      refresh();
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const disconnect = useMutation({
    mutationFn: (provider: Provider) => disconnectIntegration({ data: { provider } }),
    onSuccess: () => {
      toast.success("Disconnected.");
      refresh();
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const asanaProjects = useQuery({
    queryKey: ["integrations", "asana-projects"],
    queryFn: () => listMyAsanaProjects({ data: { environment } }),
    enabled: canUseConnectors && Boolean(connected("asana")),
  });

  const chooseBase = useMutation({
    mutationFn: (baseId: string) => selectAirtableBase({ data: { baseId, environment } }),
    onSuccess: () => {
      toast.success("Airtable base saved.");
      refresh();
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const chooseProject = useMutation({
    mutationFn: (input: { projectId: string; projectName: string | null }) =>
      selectAsanaProject({ data: { ...input, environment } }),
    onSuccess: () => {
      toast.success("Asana project saved.");
      refresh();
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const [asanaWorkspaceId, setAsanaWorkspaceId] = useState<string>("");
  const createAsanaProjectMutation = useMutation({
    mutationFn: (input: { workspaceId?: string | null; projectName?: string | null }) =>
      createAsanaProject({ data: { ...input, environment } }),
    onSuccess: () => {
      toast.success("Asana project created and selected.");
      setAsanaWorkspaceId("");
      refresh();
    },
    onError: (error) => toast.error((error as Error).message),
  });




  if (!entitlementLoading && !canUseConnectors) {
    return (
      <LockedFeature
        feature="connector_export"
        title="Connect Airtable and Asana"
        description="Sync your opportunities, 90-day roadmap and KPIs into the tools your team already runs on. Included with Publisher Blueprint™."
      />
    );
  }

  return (
    <DashboardCard eyebrow="Integrations" title="Connections">
      <div className="space-y-6">
        {(Object.keys(PROVIDER_COPY) as Provider[]).map((provider, index) => {
          const copy = PROVIDER_COPY[provider];
          const link = connected(provider);
          return (
            <div key={provider} className="space-y-3">
              {index > 0 ? <Separator className="mb-6" /> : null}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{copy.name}</p>
                  {link ? (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-primary" aria-hidden />
                      Connected{link.accountLabel ? ` — ${link.accountLabel}` : ""}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  )}
                </div>
                {link ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disconnect.isPending}
                    onClick={() => disconnect.mutate(provider)}
                  >
                    <Unplug className="size-4" aria-hidden /> Disconnect
                  </Button>
                ) : null}
              </div>

              {link ? null : (
                <div className="space-y-2">
                  <Label htmlFor={`${provider}-token`} className="text-sm">
                    Personal access token
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={`${provider}-token`}
                      type="password"
                      autoComplete="off"
                      placeholder={copy.placeholder}
                      value={tokens[provider]}
                      onChange={(event) =>
                        setTokens((current) => ({ ...current, [provider]: event.target.value }))
                      }
                    />
                    <Button
                      size="sm"
                      disabled={connect.isPending || tokens[provider].trim().length < 10}
                      onClick={() => connect.mutate({ provider, token: tokens[provider].trim() })}
                    >
                      {connect.isPending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Plug className="size-4" aria-hidden />
                      )}
                      Connect
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Before you connect:</strong> {copy.before}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {copy.help}{" "}
                    <a
                      className="inline-flex items-center gap-1 underline"
                      href={copy.tokenUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Create a token <ExternalLink className="size-3" aria-hidden />
                    </a>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your token is encrypted and only used for your own exports.
                  </p>

                </div>
              )}

              {provider === "airtable" && link ? (
                <div className="space-y-2">
                  <Label htmlFor="airtable-base" className="text-sm">
                    Base to export into
                  </Label>
                  <Select
                    value={bases.data?.selectedBaseId ?? ""}
                    onValueChange={(value) => chooseBase.mutate(value)}
                  >

                    <SelectTrigger id="airtable-base">
                      <SelectValue placeholder={bases.isLoading ? "Loading bases…" : "Choose a base"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(bases.data?.bases ?? []).map((base) => (
                        <SelectItem key={base.id} value={base.id}>
                          {base.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Exports write to a table named on the export screen (default “Publisher Blueprint Actions”).
                  </p>
                </div>
              ) : null}

              {provider === "asana" && link ? (
                <div className="space-y-2">
                  <Label htmlFor="asana-project" className="text-sm">
                    Default project to export into
                  </Label>
                  {(asanaProjects.data?.projects.length ?? 0) > 0 || asanaProjects.isLoading ? (
                    <Select
                      value={asanaProjects.data?.selectedProjectId ?? ""}
                      onValueChange={(value) =>
                        chooseProject.mutate({
                          projectId: value,
                          projectName:
                            asanaProjects.data?.projects.find((project) => project.id === value)?.name ?? null,
                        })
                      }
                    >
                      <SelectTrigger id="asana-project">
                        <SelectValue
                          placeholder={asanaProjects.isLoading ? "Loading projects…" : "Choose a project"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(asanaProjects.data?.projects ?? []).map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-md border border-dashed p-3 space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">No projects found in your Asana workspace</p>
                        <p className="text-xs text-muted-foreground">
                          Create a project now and we will start writing tasks there.
                        </p>
                      </div>
                      {(asanaProjects.data?.workspaces.length ?? 0) > 1 && (
                        <Select value={asanaWorkspaceId} onValueChange={setAsanaWorkspaceId}>
                          <SelectTrigger id="asana-workspace">
                            <SelectValue placeholder="Choose a workspace" />
                          </SelectTrigger>
                          <SelectContent>
                            {(asanaProjects.data?.workspaces ?? []).map((workspace) => (
                              <SelectItem key={workspace.id} value={workspace.id}>
                                {workspace.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          createAsanaProjectMutation.isPending ||
                          ((asanaProjects.data?.workspaces.length ?? 0) > 1 && !asanaWorkspaceId)
                        }
                        onClick={() =>
                          createAsanaProjectMutation.mutate({
                            workspaceId: asanaWorkspaceId,
                          })
                        }
                      >
                        {createAsanaProjectMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <Plus className="size-4" aria-hidden />
                        )}
                        Create default project
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {asanaProjects.data?.error
                      ? `Asana couldn't list your projects: ${asanaProjects.data.error}`
                      : (asanaProjects.data?.projects.length ?? 0) > 0
                        ? "Exports create one Asana task per recommendation in this project."
                        : "The project can be empty — we create tasks as you export."}
                  </p>
                </div>
              ) : null}


            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
