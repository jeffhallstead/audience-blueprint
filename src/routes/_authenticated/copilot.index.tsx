import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getPaddleEnvironment } from "@/lib/paddle";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, FileText, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { BlueprintEmptyState } from "@/components/blueprint/blueprint-empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { objectiveIcon } from "@/components/copilot/utils";
import { OBJECTIVES, PRIMARY_OBJECTIVES, DOCUMENT_KIND_LABELS } from "@/lib/copilot/objectives";
import { generateStrategyDocument } from "@/lib/copilot/copilot.functions";
import { copilotKeys, useCreateSession, useDocuments, useSessions, type DocumentRow } from "@/lib/copilot/queries";
import { useBlueprint } from "@/lib/blueprint/use-blueprint";

export const Route = createFileRoute("/_authenticated/copilot/")({
  head: () => ({
    meta: [
      { title: "Publisher Copilot™ — Publisher Blueprint" },
      {
        name: "description",
        content:
          "Your AI strategic advisor. Turn your Publisher Index™ results into strategy, roadmaps, content pillars, and board-ready deliverables.",
      },
      { property: "og:title", content: "Publisher Copilot™ — Publisher Blueprint" },
      {
        property: "og:description",
        content: "AI strategy, roadmaps, and executive deliverables generated from your Publisher Index™ assessment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CopilotHome,
});

const SUGGESTED_QUESTIONS = [
  "What should we prioritize in the next 30 days?",
  "How do we compete against publishers with bigger teams?",
  "What is the fastest path to owning our audience?",
  "Where are we wasting effort right now?",
];

function CopilotHome() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: blueprint, isLoading } = useBlueprint();
  const { data: sessions } = useSessions();
  const { data: documents, isLoading: documentsLoading } = useDocuments();
  const createSession = useCreateSession();
  const generateDocument = useServerFn(generateStrategyDocument);
  const [runningObjective, setRunningObjective] = useState<string | null>(null);

  const runObjective = useMutation({
    mutationFn: async (objective: string) =>
      generateDocument({ data: { objective: objective as "strategy", environment: getPaddleEnvironment() } }),
    onMutate: (objective) => setRunningObjective(objective),
    onSettled: () => setRunningObjective(null),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: copilotKeys.documents });
      navigate({ to: "/copilot/documents/$documentId", params: { documentId: result.documentId } });
    },
    onError: (error) => toast.error((error as Error).message),
  });

  async function startConversation(question?: string) {
    try {
      const session = await createSession.mutateAsync({ title: question?.slice(0, 60) ?? "New conversation" });
      navigate({
        to: "/copilot/chat/$sessionId",
        params: { sessionId: session.id },
        search: question ? { q: question } : {},
      });
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Publisher Copilot™"
          title="Your AI strategic advisor"
          description="Copilot works from your Publisher Index™ results. Complete the assessment and it will know your business before you ask it anything."
        />
        <BlueprintEmptyState
          title="Copilot needs your assessment first"
          description="Publisher Copilot™ writes strategy against your real scores, gaps, and roadmap — not generic best practice. Ten minutes of assessment unlocks the entire AI layer."
        />
      </div>
    );
  }

  const secondary = OBJECTIVES.filter((objective) => !objective.primary && objective.id !== "ask");
  const busy = runObjective.isPending;

  // Documents come back newest-first, so the first match per kind is the latest report.
  const latestByKind = new Map<string, DocumentRow>();
  for (const document of documents ?? []) {
    if (!latestByKind.has(document.kind)) latestByKind.set(document.kind, document);
  }
  const formatGenerated = (value: string) =>
    new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Publisher Copilot™"
        title="Your AI strategic advisor"
        description="Copilot already knows your scores, gaps, and roadmap. Pick an objective and it produces a deliverable you can take to your leadership team."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              Index {blueprint.overall} · Level {blueprint.maturity.level} {blueprint.maturity.title}
            </Badge>
          </div>
        }
      />

      <section className="space-y-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Strategy actions</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {PRIMARY_OBJECTIVES.map((objective) => {
            const Icon = objectiveIcon(objective.icon);
            const running = runningObjective === objective.id;
            const isAsk = objective.id === "ask";
            const existing = isAsk ? undefined : latestByKind.get(objective.id);
            return (
              <article
                key={objective.id}
                className="surface-panel flex flex-col gap-4 p-6 transition-colors hover:border-brass/40"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-lg border border-brass/30 bg-brass/10">
                  <Icon className="size-4.5 text-brass" aria-hidden />
                </span>
                <div className="flex-1 space-y-2">
                  <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
                    {objective.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{objective.description}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                    Delivers: {objective.deliverable}
                  </p>
                </div>
                {existing ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" asChild>
                        <Link to="/copilot/documents/$documentId" params={{ documentId: existing.id }}>
                          <FileText className="size-4" aria-hidden />
                          View my report
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        disabled={busy}
                        onClick={() => runObjective.mutate(objective.id)}
                      >
                        {running ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                        {running ? "Regenerating…" : "Regenerate"}
                      </Button>
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                      Generated {formatGenerated(existing.created_at)}
                    </p>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant={isAsk ? "outline" : "default"}
                    className="w-fit"
                    disabled={busy || (!isAsk && documentsLoading)}
                    onClick={() => (isAsk ? void startConversation() : runObjective.mutate(objective.id))}
                  >
                    {running ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                    {running ? "Generating…" : isAsk ? "Start a conversation" : "Generate"}
                  </Button>
                )}
              </article>
            );
          })}
        </div>
        {busy ? (
          <p className="text-xs text-muted-foreground">
            Copilot is reading your full blueprint and writing the deliverable. This usually takes under a minute.
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Ask your strategist</h2>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((question) => (
            <button
              key={question}
              onClick={() => void startConversation(question)}
              className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-brass/50 hover:text-foreground"
            >
              {question}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {secondary.map((objective) => {
          const Icon = objectiveIcon(objective.icon);
          const to = objective.id === "simulator" ? "/copilot/simulator" : objective.id === "prompts" ? "/copilot/prompts" : null;
          const card = (
            <div className="surface-panel flex h-full flex-col gap-3 p-5 transition-colors hover:border-brass/40">
              <Icon className="size-4.5 text-brass" aria-hidden />
              <h3 className="text-sm font-semibold tracking-tight text-foreground">{objective.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{objective.tagline}</p>
            </div>
          );
          if (to) {
            return (
              <Link key={objective.id} to={to}>
                {card}
              </Link>
            );
          }
          return (
            <button
              key={objective.id}
              className="text-left"
              disabled={busy}
              onClick={() => runObjective.mutate(objective.id)}
            >
              {card}
            </button>
          );
        })}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Recent deliverables</h2>
            <Link to="/copilot/documents" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          {documents?.length ? (
            <ul className="space-y-2">
              {documents.slice(0, 5).map((document) => (
                <li key={document.id}>
                  <Link
                    to="/copilot/documents/$documentId"
                    params={{ documentId: document.id }}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-brass/40"
                  >
                    <FileText className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-foreground">{document.title}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {DOCUMENT_KIND_LABELS[document.kind] ?? document.kind}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No deliverables yet. Run a strategy action above.</p>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Recent conversations</h2>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => void startConversation()}>
              <Sparkles className="size-3.5" /> New
            </Button>
          </div>
          {sessions?.length ? (
            <ul className="space-y-2">
              {sessions.slice(0, 5).map((session) => (
                <li key={session.id}>
                  <Link
                    to="/copilot/chat/$sessionId"
                    params={{ sessionId: session.id }}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-brass/40"
                  >
                    <MessageSquare className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-foreground">{session.title}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {new Date(session.updated_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
