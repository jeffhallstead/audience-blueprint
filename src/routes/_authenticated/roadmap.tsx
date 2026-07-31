import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Timeline, type TimelineEntry } from "@/components/blueprint/timeline";
import { RoadmapCard } from "@/components/blueprint/roadmap-card";
import { Button } from "@/components/ui/button";
import { PLACEHOLDER_ROADMAP, type RoadmapItem } from "@/lib/placeholder-blueprint";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({
    meta: [
      { title: "90-Day Roadmap — Publisher Blueprint" },
      { name: "description", content: "A sequenced three-month roadmap with owners for your owned-audience build." },
      { property: "og:title", content: "90-Day Roadmap — Publisher Blueprint" },
      { property: "og:description", content: "A sequenced three-month roadmap with named owners." },
    ],
  }),
  component: RoadmapPage,
});

const MONTH_LABELS: Record<number, { label: string; title: string }> = {
  1: { label: "Month 1", title: "Establish the thesis" },
  2: { label: "Month 2", title: "Build the engine" },
  3: { label: "Month 3", title: "Distribute and measure" },
};

function RoadmapPage() {
  const [items, setItems] = useState<RoadmapItem[]>(PLACEHOLDER_ROADMAP);

  function updateItem(index: number, next: RoadmapItem) {
    setItems((prev) => prev.map((item, i) => (i === index ? next : item)));
    toast.success("Initiative updated");
  }

  const entries: TimelineEntry[] = [1, 2, 3].map((month) => ({
    id: `month-${month}`,
    label: MONTH_LABELS[month]!.label,
    title: MONTH_LABELS[month]!.title,
    content: (
      <div className="space-y-4">
        {items.map((item, index) =>
          item.month === month ? (
            <RoadmapCard key={`${month}-${index}`} item={item} onChange={(next) => updateItem(index, next)} />
          ) : null,
        )}
      </div>
    ),
  }));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Roadmap"
        title="Your next 90 days"
        description="Three months of sequenced initiatives with named owners. Edit any card to match your operating reality."
        actions={
          <Button variant="outline" onClick={() => toast.info("PDF export arrives in the next release.")}>
            <Download className="size-4" /> Export PDF
          </Button>
        }
      />
      <Timeline entries={entries} />
    </div>
  );
}
