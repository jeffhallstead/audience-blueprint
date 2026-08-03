import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { OrgProfileFields } from "./org-profile-fields";
import {
  ORG_FIELDS,
  missingIntakeFields,
  type OrgProfilePatch,
} from "@/lib/organization/profile-schema";
import {
  createOrganization,
  fetchMyOrganization,
  fetchOrganizationAudit,
  updateOrganization,
} from "@/lib/organization/store";

const FIELD_LABELS = new Map(ORG_FIELDS.map((field) => [field.id as string, field.label]));

/** View and edit the organization profile, with a change history. */
export function OrganizationPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<OrgProfilePatch>({});
  const [invalid, setInvalid] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization", user?.id],
    enabled: !!user,
    queryFn: () => fetchMyOrganization(user!.id),
  });

  const { data: audit } = useQuery({
    queryKey: ["organization-audit", organization?.id],
    enabled: !!organization,
    queryFn: () => fetchOrganizationAudit(organization!.id),
  });

  useEffect(() => {
    if (!organization) return;
    const next: OrgProfilePatch = {};
    for (const field of ORG_FIELDS) next[field.id] = organization[field.id] ?? null;
    setValues(next);
  }, [organization]);

  const completeness = useMemo(() => organization?.profile_completeness ?? 0, [organization]);

  async function handleSave() {
    if (!user) return;
    const missing = missingIntakeFields(values);
    if (missing.length) {
      setInvalid(missing.map((field) => field.id));
      toast.error(`${missing.length} required ${missing.length === 1 ? "field" : "fields"} still needed`);
      return;
    }
    setInvalid([]);
    setSaving(true);
    try {
      if (organization) await updateOrganization(user.id, organization, values);
      else await createOrganization(user.id, values);
      toast.success("Organization profile updated");
      void queryClient.invalidateQueries({ queryKey: ["organization", user.id] });
      void queryClient.invalidateQueries({ queryKey: ["organization-audit"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your organization");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;

  return (
    <div className="grid gap-5">
      <DashboardCard eyebrow="Organization" title={organization?.name ?? "Your organization"}>
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground">
            Identity and segmentation details. These never change your Publisher Index™ score.
          </p>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between text-xs text-muted-foreground">
              <span>Profile completeness</span>
              <span className="font-mono text-foreground">{completeness}%</span>
            </div>
            <Progress value={completeness} />
          </div>

          <OrgProfileFields
            fields={ORG_FIELDS}
            values={values}
            invalid={invalid}
            onChange={(id, value) => {
              setValues((prev) => ({ ...prev, [id]: value }));
              setInvalid((prev) => prev.filter((item) => item !== id));
            }}
          />

          <Button className="w-fit" disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Saving…" : "Save organization"}
          </Button>
        </div>
      </DashboardCard>

      {audit && audit.length > 0 ? (
        <DashboardCard eyebrow="History" title="Recent profile changes">
          <ul className="divide-y divide-border text-sm">
            {audit.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0">
                <span className="text-foreground">{FIELD_LABELS.get(entry.field) ?? entry.field}</span>
                <span className="text-xs text-muted-foreground">
                  {entry.old_value ? `${entry.old_value} → ` : "Set to "}
                  <span className="text-foreground">{entry.new_value ?? "—"}</span>
                  {" · "}
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </DashboardCard>
      ) : null}
    </div>
  );
}
