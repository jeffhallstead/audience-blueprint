import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatPanel } from "@/components/copilot/chat-panel";
import {
  copilotKeys,
  useCreateSession,
  useDeleteSession,
  useSession,
  useSessionMessages,
  useSessions,
} from "@/lib/copilot/queries";
import { nameSession } from "@/lib/copilot/copilot.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/copilot/chat/$sessionId")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Ask Publisher Copilot™ — Publisher Blueprint" },
      {
        name: "description",
        content: "A working conversation with your AI strategist, grounded in your Publisher Index™ assessment.",
      },
      { property: "og:title", content: "Ask Publisher Copilot™" },
      { property: "og:description", content: "Strategic answers grounded in your own assessment data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CopilotChat,
});

function CopilotChat() {
  const { sessionId } = Route.useParams();
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session, isLoading } = useSession(sessionId);
  const { data: messages, isLoading: loadingMessages } = useSessionMessages(sessionId);
  const { data: sessions } = useSessions();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const renameSession = useServerFn(nameSession);

  async function newConversation() {
    const created = await createSession.mutateAsync({});
    navigate({ to: "/copilot/chat/$sessionId", params: { sessionId: created.id }, search: {} });
  }

  if (isLoading || loadingMessages) {
    return <Skeleton className="h-[60vh] w-full" />;
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">This conversation no longer exists.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/copilot">Back to Copilot</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-8 space-y-3">
          <Button variant="outline" size="sm" className="w-full" onClick={() => void newConversation()}>
            <Plus className="size-3.5" /> New conversation
          </Button>
          <ul className="space-y-1">
            {(sessions ?? []).map((item) => (
              <li key={item.id} className="group flex items-center gap-1">
                <Link
                  to="/copilot/chat/$sessionId"
                  params={{ sessionId: item.id }}
                  search={{}}
                  className={cn(
                    "min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-xs transition-colors",
                    item.id === sessionId
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                  )}
                >
                  {item.title}
                </Link>
                <button
                  aria-label={`Delete ${item.title}`}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    deleteSession.mutate(item.id, {
                      onSuccess: () => {
                        toast.success("Conversation removed");
                        if (item.id === sessionId) navigate({ to: "/copilot" });
                      },
                    });
                  }}
                >
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="min-w-0 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/copilot"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Copilot
          </Link>
          <Button variant="ghost" size="sm" className="h-7 text-xs lg:hidden" onClick={() => void newConversation()}>
            {createSession.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            New
          </Button>
        </div>

        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{session.title}</h1>

        <ChatPanel
          key={sessionId}
          sessionId={sessionId}
          initialMessages={messages ?? []}
          autoSend={q}
          onFirstMessage={(text) => {
            void renameSession({ data: { sessionId, firstMessage: text } }).then(() => {
              queryClient.invalidateQueries({ queryKey: copilotKeys.session(sessionId) });
              queryClient.invalidateQueries({ queryKey: copilotKeys.sessions });
            });
          }}
        />
      </div>
    </div>
  );
}
