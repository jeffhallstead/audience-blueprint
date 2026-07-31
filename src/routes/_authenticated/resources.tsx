import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { RESOURCE_PLACEHOLDERS } from "@/lib/placeholder-blueprint";

export const Route = createFileRoute("/_authenticated/resources")({
  head: () => ({
    meta: [
      { title: "Resources — Owned Audience Blueprint" },
      { name: "description", content: "Frameworks, templates, and playbooks for building an owned audience." },
      { property: "og:title", content: "Resources — Owned Audience Blueprint" },
      { property: "og:description", content: "Frameworks, templates, and playbooks for owned audience building." },
    ],
  }),
  component: Resources,
});

function Resources() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Resources"
        title="Executive library"
        description="Frameworks and templates that support each stage of the blueprint. Content is placeholder for now."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {RESOURCE_PLACEHOLDERS.map((resource) => (
          <DashboardCard key={resource.title} footer="Available in a future release">
            <Badge variant="secondary" className="w-fit text-[10px] uppercase">
              {resource.kind}
            </Badge>
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">{resource.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{resource.description}</p>
            </div>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}
