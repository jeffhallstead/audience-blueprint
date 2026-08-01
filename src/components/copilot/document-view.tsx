import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Copy, Download, Loader2, Pencil, RefreshCw, Save, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/copilot/markdown";
import { downloadText, slugifyTitle } from "@/components/copilot/utils";
import {
  useSaveRecommendation,
  useSavedRecommendations,
  useUpdateDocument,
  type DocumentRow,
} from "@/lib/copilot/queries";
import type { StrategyDocument } from "@/lib/copilot/schema";
import { DOCUMENT_KIND_LABELS } from "@/lib/copilot/objectives";

/** The model returns effort as free text ("low — 2 weeks"), so match loosely. */
function effortTone(effort: string): string {
  const value = effort.toLowerCase();
  if (value.includes("low")) return "border-emerald-500/40 text-emerald-400";
  if (value.includes("high")) return "border-destructive/40 text-destructive";
  return "border-amber-500/40 text-amber-400";
}

/**
 * Renders a saved strategy deliverable: structured view, inline markdown
 * editing, export, and the action list that can be pushed into the Blueprint.
 */
export function DocumentView({
  document,
  onRegenerate,
  regenerating,
}: {
  document: DocumentRow;
  onRegenerate?: (() => void) | undefined;
  regenerating?: boolean | undefined;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(document.markdown);
  const [copied, setCopied] = useState(false);
  const updateDocument = useUpdateDocument();
  const saveRecommendation = useSaveRecommendation();
  const navigate = useNavigate();
  const { data: saved } = useSavedRecommendations();
  const savedTitles = new Set(
    (saved ?? []).filter((item) => item.document_id === document.id).map((item) => item.title),
  );

  const body = document.body as unknown as StrategyDocument | { simulation?: unknown } | null;
  const structured = body && "sections" in (body as object) ? (body as StrategyDocument) : null;

  async function copyAll() {
    await navigator.clipboard.writeText(document.markdown);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1600);
  }

  function saveEdits() {
    updateDocument.mutate(
      { id: document.id, markdown: draft },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success("Document saved");
        },
        onError: (error) => toast.error((error as Error).message),
      },
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
              {DOCUMENT_KIND_LABELS[document.kind] ?? document.kind}
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              Version {document.version}
            </Badge>
            {document.status === "superseded" ? (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Superseded
              </Badge>
            ) : null}
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{document.title}</h1>
          <p className="text-xs text-muted-foreground">
            Generated {new Date(document.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateDocument.mutate({ id: document.id, favorite: !document.favorite })}
            aria-label={document.favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={document.favorite ? "size-4 fill-brass text-brass" : "size-4"} />
          </Button>
          <Button variant="outline" size="sm" onClick={copyAll}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadText(`${slugifyTitle(document.title)}.md`, document.markdown)}
          >
            <Download className="size-4" /> Download
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditing((value) => !value)}>
            <Pencil className="size-4" /> {editing ? "Cancel" : "Edit"}
          </Button>
          {onRegenerate ? (
            <Button variant="secondary" size="sm" onClick={onRegenerate} disabled={regenerating}>
              {regenerating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Regenerate
            </Button>
          ) : null}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-[60vh] font-mono text-xs leading-relaxed"
          />
          <Button size="sm" onClick={saveEdits} disabled={updateDocument.isPending}>
            {updateDocument.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
            changes
          </Button>
        </div>
      ) : structured ? (
        <div className="space-y-10">
          <section className="rounded-xl border border-border bg-card p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Executive summary</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">{structured.executiveSummary}</p>
          </section>

          <div className="space-y-8">
            {structured.sections.map((section, index) => (
              <section key={`${section.heading}-${index}`} className="space-y-3">
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">{section.heading}</h2>
                {section.body ? <p className="text-sm leading-relaxed text-foreground/85">{section.body}</p> : null}
                {section.bullets.length ? (
                  <ul className="ml-4 list-disc space-y-1.5 text-sm text-foreground/85 marker:text-brass">
                    {section.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          {structured.actions.length ? (
            <section className="space-y-4">
              <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Recommended actions</h2>
              <div className="space-y-3">
                {structured.actions.map((action, index) => {
                  const alreadySaved = savedTitles.has(action.title);
                  return (
                  <div key={index} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">{action.title}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] uppercase ${effortTone(action.effort)}`}>
                          {action.effort}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={saveRecommendation.isPending || alreadySaved}
                          onClick={() =>
                            saveRecommendation.mutate(
                              {
                                title: action.title,
                                body: `${action.description}\n\nImpact: ${action.impact}\nEffort: ${action.effort}\nOwner: ${action.owner}\nDependencies: ${action.dependencies.join(", ") || "None"}`,
                                category: document.kind,
                                impact: action.impact,
                                effort: action.effort,
                                documentId: document.id,
                              },
                              {
                                onSuccess: () =>
                                  toast.success("Added to your Blueprint", {
                                    action: {
                                      label: "View",
                                      onClick: () => navigate({ to: "/blueprint", hash: "saved-actions" }),
                                    },
                                  }),
                                onError: (error) => toast.error((error as Error).message),
                              },
                            )
                          }
                        >
                          {alreadySaved ? (
                            <>
                              <Check className="size-3.5" aria-hidden /> Added
                            </>
                          ) : (
                            "Add to Blueprint"
                          )}
                        </Button>
                      </div>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{action.description}</p>
                    <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                      <div>
                        <dt className="font-mono uppercase tracking-wider text-muted-foreground">Impact</dt>
                        <dd className="mt-1 text-foreground/85">{action.impact}</dd>
                      </div>
                      <div>
                        <dt className="font-mono uppercase tracking-wider text-muted-foreground">Owner</dt>
                        <dd className="mt-1 text-foreground/85">
                          {action.owner}
                        </dd>
                      </div>
                      {action.dependencies.length ? (
                        <div className="sm:col-span-2">
                          <dt className="font-mono uppercase tracking-wider text-muted-foreground">Dependencies</dt>
                          <dd className="mt-1 text-foreground/85">{action.dependencies.join(" · ")}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <div className="grid gap-6 sm:grid-cols-2">
            {structured.successMetrics.length ? (
              <section className="rounded-xl border border-border bg-card p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Success metrics</p>
                <ul className="mt-3 ml-4 list-disc space-y-1.5 text-sm text-foreground/85 marker:text-brass">
                  {structured.successMetrics.map((metric, index) => (
                    <li key={index}>{metric}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {structured.assumptions.length ? (
              <section className="rounded-xl border border-border bg-card p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Assumptions made
                </p>
                <ul className="mt-3 ml-4 list-disc space-y-1.5 text-sm text-muted-foreground">
                  {structured.assumptions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {structured.informationGaps.length ? (
            <section className="rounded-xl border border-dashed border-border p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                What would sharpen this
              </p>
              <ul className="mt-3 ml-4 list-disc space-y-1.5 text-sm text-muted-foreground">
                {structured.informationGaps.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-xl border border-brass/40 bg-brass/5 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Next step</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{structured.nextStep}</p>
          </section>
        </div>
      ) : (
        <Markdown content={document.markdown} />
      )}
    </div>
  );
}
