import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BillingPanel } from "@/components/billing/billing-panel";
import { AccountSecurityPanel } from "@/components/billing/account-security-panel";
import { ConnectionsPanel } from "@/components/settings/connections-panel";
import { OrganizationPanel } from "@/components/organization/organization-panel";


export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Publisher Blueprint" },
      { name: "description", content: "Manage your profile details and account preferences." },
      { property: "og:title", content: "Settings — Publisher Blueprint" },
      { property: "og:description", content: "Manage your profile details and account preferences." },
    ],
  }),
  component: Settings,
});

const profileSchema = z.object({
  full_name: z.string().trim().max(120),
  job_title: z.string().trim().max(120),
});

function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, job_title")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setJobTitle(profile.job_title ?? "");
    }
  }, [profile]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    const parsed = profileSchema.safeParse({ full_name: fullName, job_title: jobTitle });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...parsed.data });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    void queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Settings" title="Your profile" description="Details shown across your blueprint and exports." />

      <form onSubmit={save} className="grid gap-5 lg:grid-cols-2">
        <DashboardCard eyebrow="Profile" title="Personal details">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">Job title</Label>
              <Input
                id="job_title"
                value={jobTitle}
                placeholder="Chief Marketing Officer"
                onChange={(event) => setJobTitle(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={saving} className="w-fit">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </DashboardCard>

      </form>

      <section aria-labelledby="organization-heading" className="space-y-5">
        <h2 id="organization-heading" className="text-display text-2xl">
          Organization
        </h2>
        <OrganizationPanel />
      </section>

      <section aria-labelledby="connections-heading" className="space-y-5">
        <h2 id="connections-heading" className="text-display text-2xl">
          Connections
        </h2>
        <ConnectionsPanel />
      </section>

      <section aria-labelledby="billing-heading" className="space-y-5">
        <h2 id="billing-heading" className="text-display text-2xl">
          Plan &amp; billing
        </h2>
        <BillingPanel />
      </section>


      <section aria-labelledby="account-heading" className="space-y-5">
        <h2 id="account-heading" className="text-display text-2xl">
          Account &amp; security
        </h2>
        <AccountSecurityPanel />
      </section>
    </div>
  );
}
