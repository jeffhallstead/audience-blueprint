import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentView } from "@/components/copilot/document-view";
import { SimulationView } from "@/components/copilot/simulation-view";
import { copilotKeys, useDocument } from "@/lib/copilot/queries";
import { generateStrategyDocument } from "@/lib/copilot/copilot.functions";
import type { Simulation } from "@/lib/copilot/schema";

export const Route = createFileRoute("/_authenticated/copilot/documents/$documentId")({
  head: () => ({
    meta: [
      { title: "Strategy Deliverable — Publisher Blueprint" },
      { name: "description", content: "An AI-generated strategy deliverable produced from your Publisher Index™ results." },
      { property: "og:title", content: "Strategy Deliverable — Publisher Blueprint" },
      { property: "og:description", content: "Edit, export, or regenerate your Publisher Copilot™ deliverable." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentDetail,
});

const REGENERABLE = ["strategy", "roadmap", "pillars", "franchises", "score", "presentation"];

function DocumentDetail() {
  const { documentId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: document, isLoading } = useDocument(documentId);
  const generateDocument = useServerFn(generateStrategyDocument);

  const regenerate = useMutation({
    mutationFn: async () =>
      generateDocument({
        data: { objective: document!.kind as "strategy", supersedesDocumentId: documentId },
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: copilotKeys.documents });
      toast.success(`Version ${result.version} generated`);
      navigate({ to: "/copilot/documents/$documentId", params: { documentId: result.documentId } });
    },
    onError: (error) => toast.error((error as Error).message),
  });

  if (isLoading) return <Skeleton className="h-[70vh] w-full" />;

  if (!document) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">This document no longer exists.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/copilot/documents">Back to the library</Link>
        </Button>
      </div>
    );
  }

  const simulationBody = document.kind === "simulator" ? (document.body as unknown as { simulation: Simulation; scenario: string }) : null;

  return (
    <div className="space-y-8">
      <Link
        to="/copilot/documents"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Strategy library
      </Link>

      {simulationBody ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Scenario simulation</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{document.title}</h1>
            <p className="text-sm text-muted-foreground">{simulationBody.scenario}</p>
          </div>
          <SimulationView simulation={simulationBody.simulation} />
        </div>
      ) : (
        <DocumentView
          document={document}
          onRegenerate={REGENERABLE.includes(document.kind) ? () => regenerate.mutate() : undefined}
          regenerating={regenerate.isPending}
        />
      )}
    </div>
  );
}
