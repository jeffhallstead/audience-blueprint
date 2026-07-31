import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, PenLine, Radar, FileSearch } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/ai-toolkit")({
  head: () => ({
    meta: [
      { title: "AI Toolkit — Owned Audience Blueprint" },
      { name: "description", content: "Upcoming AI capabilities for format ideation, briefs, and competitive scans." },
      { property: "og:title", content: "AI Toolkit — Owned Audience Blueprint" },
      { property: "og:description", content: "Upcoming AI capabilities for your owned-audience program." },
    ],
  }),
  component: AiToolkit,
});

const TOOLS = [
  { icon: Sparkles, title: "Format ideation", body: "Generate episodic franchise concepts grounded in your assessment." },
  { icon: PenLine, title: "Executive brief writer", body: "Draft the greenlight memo for your leadership committee." },
  { icon: Radar, title: "Competitive scan", body: "Map adjacent brands already publishing to your audience." },
  { icon: FileSearch, title: "Roadmap critique", body: "Stress-test sequencing against your stated constraints." },
];

function AiToolkit() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="AI toolkit"
        title="Intelligence layer"
        description="These capabilities are architected and will activate in a coming release. Nothing here generates output yet."
        actions={<Badge variant="secondary">Coming soon</Badge>}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <DashboardCard key={tool.title} className="opacity-90">
            <tool.icon className="size-5 text-brass" />
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">{tool.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{tool.body}</p>
            </div>
            <Badge variant="outline" className="w-fit text-[10px] uppercase">
              Placeholder
            </Badge>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}
