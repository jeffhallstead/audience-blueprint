import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getStripeEnvironment } from "@/lib/stripe";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { copilotKeys, usePrompts } from "@/lib/copilot/queries";
import { generatePromptPack } from "@/lib/copilot/copilot.functions";

export const Route = createFileRoute("/_authenticated/copilot/prompts")({
  head: () => ({
    meta: [
      { title: "Prompt Library — Publisher Blueprint" },
      {
        name: "description",
        content: "Ready-to-use AI prompts for research, newsletters, LinkedIn, podcasts, and executive communication.",
      },
      { property: "og:title", content: "Prompt Library — Publisher Blueprint" },
      { property: "og:description", content: "Reusable prompts tailored to your publishing strategy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PromptLibrary,
});

function PromptCard({ title, description, body, category, isSystem }: {
  title: string;
  description: string;
  body: string;
  category: string;
  isSystem: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="surface-panel flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
          {category}
        </Badge>
        {!isSystem ? (
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
            Tailored to you
          </Badge>
        ) : null}
      </div>
      <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      <pre className={`whitespace-pre-wrap rounded-lg bg-muted/60 p-3 font-mono text-[11px] leading-relaxed text-foreground/85 ${expanded ? "" : "line-clamp-4"}`}>
        {body}
      </pre>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={async () => {
            await navigator.clipboard.writeText(body);
            setCopied(true);
            toast.success("Prompt copied");
            setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} Copy
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Collapse" : "Expand"}
        </Button>
      </div>
    </article>
  );
}

function PromptLibrary() {
  const [category, setCategory] = useState<string | null>(null);
  const { data: prompts, isLoading } = usePrompts();
  const queryClient = useQueryClient();
  const generate = useServerFn(generatePromptPack);

  const createPack = useMutation({
    mutationFn: async () => generate({ data: { environment: getStripeEnvironment() } }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: copilotKeys.prompts });
      toast.success(`${result.count} tailored prompts added`);
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const categories = Array.from(new Set((prompts ?? []).map((prompt) => prompt.category)));
  const filtered = category ? (prompts ?? []).filter((prompt) => prompt.category === category) : (prompts ?? []);

  return (
    <div className="space-y-8">
      <Link to="/copilot" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Copilot
      </Link>

      <PageHeader
        eyebrow="Prompt library"
        title="Prompts your team can reuse"
        description="A working set of prompts for research, newsletters, LinkedIn, podcasts, video, and executive communication. Generate a tailored pack written against your own strategy."
        actions={
          <Button size="sm" onClick={() => createPack.mutate()} disabled={createPack.isPending}>
            {createPack.isPending ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            {createPack.isPending ? "Writing…" : "Generate tailored pack"}
          </Button>
        }
      />

      {categories.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          <Button variant={category === null ? "secondary" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setCategory(null)}>
            All
          </Button>
          {categories.map((item) => (
            <Button
              key={item}
              variant={category === item ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setCategory(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-56 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((prompt) => (
            <PromptCard
              key={prompt.id}
              title={prompt.title}
              description={prompt.description}
              body={prompt.body}
              category={prompt.category}
              isSystem={prompt.is_system}
            />
          ))}
        </div>
      )}
    </div>
  );
}
