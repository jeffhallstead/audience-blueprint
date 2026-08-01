import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Star } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDocuments } from "@/lib/copilot/queries";
import { DOCUMENT_KIND_LABELS } from "@/lib/copilot/objectives";

export const Route = createFileRoute("/_authenticated/copilot/documents/")({
  head: () => ({
    meta: [
      { title: "Strategy Library — Publisher Blueprint" },
      {
        name: "description",
        content: "Every strategy brief, roadmap, and executive deliverable Publisher Copilot™ has generated for you.",
      },
      { property: "og:title", content: "Strategy Library — Publisher Blueprint" },
      { property: "og:description", content: "Your saved AI-generated strategy deliverables, versioned and editable." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentLibrary,
});

function DocumentLibrary() {
  const [kind, setKind] = useState<string | null>(null);
  const { data: documents, isLoading } = useDocuments();

  const kinds = Array.from(new Set((documents ?? []).map((document) => document.kind)));
  const filtered = kind ? (documents ?? []).filter((document) => document.kind === kind) : (documents ?? []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Strategy library"
        title="Your deliverables"
        description="Everything Publisher Copilot™ has produced, versioned. Open any document to edit, export, or regenerate it."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : documents?.length ? (
        <>
          {kinds.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button variant={kind === null ? "secondary" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setKind(null)}>
                All
              </Button>
              {kinds.map((item) => (
                <Button
                  key={item}
                  variant={kind === item ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setKind(item)}
                >
                  {DOCUMENT_KIND_LABELS[item] ?? item}
                </Button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((document) => (
              <Link
                key={document.id}
                to="/copilot/documents/$documentId"
                params={{ documentId: document.id }}
                className="surface-panel flex flex-col gap-3 p-5 transition-colors hover:border-brass/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <FileText className="size-4 shrink-0 text-brass" aria-hidden />
                  {document.favorite ? <Star className="size-4 fill-brass text-brass" aria-hidden /> : null}
                </div>
                <h2 className="text-sm font-semibold leading-snug tracking-tight text-foreground">{document.title}</h2>
                {document.summary ? (
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{document.summary}</p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                    {DOCUMENT_KIND_LABELS[document.kind] ?? document.kind}
                  </Badge>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    v{document.version} · {new Date(document.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="surface-panel space-y-4 p-8">
          <h2 className="text-display text-xl">Nothing generated yet</h2>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Run a strategy action in Publisher Copilot™ and your deliverables will collect here — each one versioned,
            editable, and exportable.
          </p>
          <Button asChild size="sm">
            <Link to="/copilot">Open Publisher Copilot™</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
