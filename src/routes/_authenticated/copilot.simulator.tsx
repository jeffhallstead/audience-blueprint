import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getStripeEnvironment } from "@/lib/stripe";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { BlueprintEmptyState } from "@/components/blueprint/blueprint-empty-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SimulationView } from "@/components/copilot/simulation-view";
import { simulateScenario } from "@/lib/copilot/copilot.functions";
import { copilotKeys } from "@/lib/copilot/queries";
import { SIMULATION_EXAMPLES } from "@/lib/copilot/objectives";
import { useBlueprint } from "@/lib/blueprint/use-blueprint";
import type { Simulation } from "@/lib/copilot/schema";

export const Route = createFileRoute("/_authenticated/copilot/simulator")({
  head: () => ({
    meta: [
      { title: "Score Simulator — Publisher Blueprint" },
      {
        name: "description",
        content: "Model how a strategic change would move your Publisher Index™ before you commit resources to it.",
      },
      { property: "og:title", content: "Score Simulator — Publisher Blueprint" },
      { property: "og:description", content: "Directional what-if modeling against your Publisher Index™ categories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Simulator,
});

function Simulator() {
  const [scenario, setScenario] = useState("");
  const [result, setResult] = useState<Simulation | null>(null);
  const { data: blueprint, isLoading } = useBlueprint();
  const queryClient = useQueryClient();
  const runSimulation = useServerFn(simulateScenario);

  const simulate = useMutation({
    mutationFn: async (value: string) => runSimulation({ data: { scenario: value, environment: getStripeEnvironment() } }),
    onSuccess: (response) => {
      setResult(response.simulation);
      queryClient.invalidateQueries({ queryKey: copilotKeys.documents });
    },
    onError: (error) => toast.error((error as Error).message),
  });

  if (!isLoading && !blueprint) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Score simulator" title="Model a change before you make it" />
        <BlueprintEmptyState
          title="The simulator needs a baseline"
          description="Complete the Publisher Index™ assessment and the simulator can model how a change would move each category."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link to="/copilot" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Copilot
      </Link>

      <PageHeader
        eyebrow="Score simulator"
        title="Model a change before you make it"
        description="Describe a strategic move and Copilot estimates its directional effect on each Publisher Index™ category — including where it costs you before it pays."
      />

      <div className="surface-panel space-y-4 p-6">
        <Textarea
          value={scenario}
          onChange={(event) => setScenario(event.target.value)}
          placeholder="What if we launch a weekly executive newsletter and cut our blog cadence in half?"
          className="min-h-24 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {SIMULATION_EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => setScenario(example)}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-brass/50 hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          disabled={!scenario.trim() || simulate.isPending}
          onClick={() => simulate.mutate(scenario.trim())}
        >
          {simulate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          {simulate.isPending ? "Modeling…" : "Run simulation"}
        </Button>
      </div>

      {result ? <SimulationView simulation={result} /> : null}
    </div>
  );
}
