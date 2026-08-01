import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUp, Loader2, Square } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/copilot/markdown";
import { supabase } from "@/integrations/supabase/client";
import { copilotKeys } from "@/lib/copilot/queries";
import { cn } from "@/lib/utils";

/** Attaches the caller's bearer token; /api/chat authenticates from it. */
async function authedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init?.headers);
  if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  return fetch(input, { ...init, headers });
}

function messageText(message: UIMessage): string {
  return (message.parts ?? [])
    .map((part) => ("text" in part && typeof part.text === "string" ? part.text : ""))
    .join("");
}

interface ChatPanelProps {
  sessionId: string;
  initialMessages: UIMessage[];
  /** Sent automatically on mount when the session was opened from a suggestion. */
  autoSend?: string | undefined;
  onFirstMessage?: ((text: string) => void) | undefined;
}

export function ChatPanel({ sessionId, initialMessages, autoSend, onFirstMessage }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);
  const queryClient = useQueryClient();

  const { messages, sendMessage, status, stop, error } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: authedFetch,
      body: { sessionId },
    }),
    onError: (chatError) => toast.error(chatError.message || "Publisher Copilot™ could not respond."),
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: copilotKeys.sessions });
    },
  });

  const busy = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (messages.length === 0) onFirstMessage?.(trimmed);
    void sendMessage({ text: trimmed });
    setInput("");
  }

  // A suggestion click creates the session then lands here — send it once.
  useEffect(() => {
    if (autoSend && !autoSentRef.current && messages.length === 0) {
      autoSentRef.current = true;
      submit(autoSend);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy, sessionId]);

  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="flex-1 space-y-6 pb-6">
        {messages.length === 0 && !busy ? (
          <p className="text-sm text-muted-foreground">
            Ask anything about your strategy. Publisher Copilot™ already has your Publisher Index™ scores, gaps, and
            roadmap — you never need to explain your business.
          </p>
        ) : null}

        {messages.map((message) => {
          const text = messageText(message);
          if (message.role === "user") {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-sidebar px-4 py-3 text-sm leading-relaxed text-sidebar-foreground">
                  {text}
                </div>
              </div>
            );
          }
          return (
            <div key={message.id} className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Publisher Copilot™</p>
              <Markdown content={text} />
            </div>
          );
        })}

        {status === "submitted" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Reading your blueprint…
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message}
          </p>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background/95 pt-4 backdrop-blur">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit(input);
              }
            }}
            placeholder="Ask your strategist…"
            rows={1}
            className={cn(
              "max-h-40 min-h-10 resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none",
              "focus-visible:ring-0",
            )}
          />
          {busy ? (
            <Button size="icon" variant="secondary" onClick={() => stop()} aria-label="Stop generating">
              <Square className="size-3.5" />
            </Button>
          ) : (
            <Button size="icon" onClick={() => submit(input)} disabled={!input.trim()} aria-label="Send message">
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Copilot states its assumptions and never guarantees outcomes. Verify figures before board use.
        </p>
      </div>
    </div>
  );
}
