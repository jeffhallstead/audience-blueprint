import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { fetchMyOrganization } from "@/lib/organization/store";
import {
  EXTENDED_PROFILE_GROUPS,
  extendedCompleteness,
  groupCompleteness,
  type ExtendedProfileGroup,
  type ExtendedProfileState,
  type ExtendedProfileValues,
} from "@/lib/organization/extended-profiles";
import { fetchExtendedProfiles, saveExtendedProfile } from "@/lib/organization/extended-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export function ExtendedProfilePanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const orgQuery = useQuery({
    queryKey: ["organization", userId],
    queryFn: () => fetchMyOrganization(userId!),
    enabled: Boolean(userId),
  });
  const organizationId = orgQuery.data?.id ?? null;

  const profilesQuery = useQuery({
    queryKey: ["organization-extended", organizationId],
    queryFn: () => fetchExtendedProfiles(organizationId!),
    enabled: Boolean(organizationId),
  });

  const [draft, setDraft] = useState<ExtendedProfileState | null>(null);
  useEffect(() => {
    if (profilesQuery.data) setDraft(profilesQuery.data);
  }, [profilesQuery.data]);

  const save = useMutation({
    mutationFn: async (group: ExtendedProfileGroup) => {
      if (!organizationId || !draft) return;
      await saveExtendedProfile(organizationId, group, draft[group.key] ?? {});
    },
    onSuccess: (_data, group) => {
      toast.success(`${group.title} profile saved`);
      void queryClient.invalidateQueries({ queryKey: ["organization-extended", organizationId] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save profile"),
  });

  const overall = useMemo(() => (draft ? extendedCompleteness(draft) : 0), [draft]);

  if (!organizationId && !orgQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deep profile</CardTitle>
          <CardDescription>
            Complete your organization details first — deep profiles attach to your organization.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const setValue = (
    key: ExtendedProfileGroup["key"],
    fieldId: string,
    value: string | number | string[] | null,
  ) =>
    setDraft((current) =>
      current ? { ...current, [key]: { ...(current[key] ?? {}), [fieldId]: value } } : current,
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="size-4 text-muted-foreground" />
              Deep profile
            </CardTitle>
            <CardDescription>
              Optional depth on audience, marketing and content operations. It sharpens Copilot
              context and how we read your fit — it never changes your Publisher Index™ score.
            </CardDescription>
          </div>
          <div className="min-w-[10rem] space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Depth</span>
              <span className="tabular-nums">{overall}%</span>
            </div>
            <Progress value={overall} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {orgQuery.isLoading || profilesQuery.isLoading || !draft ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <Tabs defaultValue={EXTENDED_PROFILE_GROUPS[0]!.key}>
            <TabsList>
              {EXTENDED_PROFILE_GROUPS.map((group) => (
                <TabsTrigger key={group.key} value={group.key}>
                  {group.title}
                  <Badge variant="secondary" className="ml-2 tabular-nums">
                    {groupCompleteness(group, draft[group.key] ?? {})}%
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {EXTENDED_PROFILE_GROUPS.map((group) => (
              <TabsContent key={group.key} value={group.key} className="mt-6 space-y-6">
                <p className="text-sm text-muted-foreground">{group.description}</p>

                <div className="grid gap-6 md:grid-cols-2">
                  {group.fields.map((field) => {
                    const value = (draft[group.key] ?? {})[field.id] ?? null;
                    const wide = field.type === "textarea" || field.type === "multiselect";
                    return (
                      <div key={field.id} className={`space-y-2 ${wide ? "md:col-span-2" : ""}`}>
                        <Label htmlFor={`${group.key}-${field.id}`}>{field.label}</Label>

                        {field.type === "select" && (
                          <Select
                            value={typeof value === "string" ? value : ""}
                            onValueChange={(next) => setValue(group.key, field.id, next)}
                          >
                            <SelectTrigger id={`${group.key}-${field.id}`}>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {(field.options ?? []).map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {field.type === "multiselect" && (
                          <div className="flex flex-wrap gap-2">
                            {(field.options ?? []).map((option) => {
                              const selected = Array.isArray(value) && value.includes(option);
                              return (
                                <Button
                                  key={option}
                                  type="button"
                                  size="sm"
                                  variant={selected ? "secondary" : "outline"}
                                  onClick={() => {
                                    const current = Array.isArray(value) ? value : [];
                                    setValue(
                                      group.key,
                                      field.id,
                                      selected
                                        ? current.filter((item) => item !== option)
                                        : [...current, option],
                                    );
                                  }}
                                >
                                  {selected && <Check className="size-3" />}
                                  {option}
                                </Button>
                              );
                            })}
                          </div>
                        )}

                        {field.type === "textarea" && (
                          <Textarea
                            id={`${group.key}-${field.id}`}
                            rows={3}
                            value={typeof value === "string" ? value : ""}
                            onChange={(event) => setValue(group.key, field.id, event.target.value)}
                            placeholder={field.placeholder ?? ""}
                          />
                        )}

                        {(field.type === "text" || field.type === "number") && (
                          <Input
                            id={`${group.key}-${field.id}`}
                            type={field.type === "number" ? "number" : "text"}
                            value={value === null ? "" : String(value)}
                            onChange={(event) =>
                              setValue(
                                group.key,
                                field.id,
                                event.target.value === "" ? null : event.target.value,
                              )
                            }
                            placeholder={field.placeholder ?? ""}
                          />
                        )}

                        {field.help && (
                          <p className="text-xs text-muted-foreground">{field.help}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button onClick={() => save.mutate(group)} disabled={save.isPending}>
                  {save.isPending && <Loader2 className="size-4 animate-spin" />}
                  Save {group.title.toLowerCase()} profile
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
