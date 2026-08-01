import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Loader2, Plug, Unplug } from "lucide-react";
import { toast } from "sonner";

import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  connectIntegration,
  disconnectIntegration,
  listMyAirtableBases,
  listMyConnections,
  selectAirtableBase,
} from "@/lib/integrations/connections.functions";

type Provider = "airtable" | "asana";

const PROVIDER_COPY: Record<Provider, { name: string; help: string; tokenUrl: string; placeholder: string }> = {
  airtable: {
    name: "Airtable",
    help: "Create a personal access token with data.records:read/write and schema.bases:read, then give it access to the base you want your plan written into.",
    tokenUrl: "https://airtable.com/create/tokens",
    placeholder: "pat...",
  },
  asana: {
    name: "Asana",
    help: "Create a personal access token in your Asana developer console. Tasks are created in the project you pick when exporting.",
    tokenUrl: "https://app.asana.com/0/my-apps",
    placeholder: "1/12345...",
  },
};

/** Lets each user connect their own Airtable and Asana accounts for exports. */
export function ConnectionsPanel() {
  const queryClient = useQueryClient();
  const [tokens, setTokens] = useState<Record<Provider, string>>({ airtable: "", asana: "" });

  const connections = useQuery({
    queryKey: ["integrations", "connections"],
    queryFn: () => listMyConnections(),
  });

  const connected = (provider: Provider) =>
    connections.data?.connections.find((item) => item.provider === provider) ?? null;

  const bases = useQuery({
    queryKey: ["integrations", "airtable-bases"],
    queryFn: () => listMyAirtableBases(),
    enabled: Boolean(connected("airtable")),
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["integrations"] });
    void queryClient.invalidateQueries({ queryKey: ["export"] });
  }

  const connect = useMutation({
    mutationFn: (input: { provider: Provider; token: string }) => connectIntegration({ data: input }),
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

  const chooseBase = useMutation({
    mutationFn: (baseId: string) => selectAirtableBase({ data: { baseId } }),
    onSuccess: () => {
      toast.success("Airtable base saved.");
      refresh();
    },
    onError: (error) => toast.error((error as Error).message),
  });

  return (
    <DashboardCard title="Connections" description="Send your Blueprint into your own Airtable base or Asana workspace.">
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
                    value={bases.data?.selectedBaseId ?? undefined}
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
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
