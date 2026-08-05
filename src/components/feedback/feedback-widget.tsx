import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { submitFeedback } from "@/lib/feedback/feedback.functions";
import {
  FEEDBACK_COMMENT_MAX,
  FEEDBACK_SENTIMENTS,
  type FeedbackSentiment,
} from "@/lib/feedback/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Persistent feedback launcher available on every signed-in screen. */
export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [sentiment, setSentiment] = useState<FeedbackSentiment>("idea");
  const [comment, setComment] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const send = useServerFn(submitFeedback);

  const mutation = useMutation({
    mutationFn: () =>
      send({
        data: {
          sentiment,
          comment: comment.trim(),
          page: pathname,
          userAgent: typeof navigator === "undefined" ? undefined : navigator.userAgent.slice(0, 400),
        },
      }),
    onSuccess: () => {
      toast.success("Thanks — your feedback is with the team.");
      setOpen(false);
      setComment("");
      setSentiment("idea");
    },
    onError: (error: Error) => toast.error(error.message || "Could not send feedback."),
  });

  const trimmed = comment.trim();
  const invalid = trimmed.length === 0 || trimmed.length > FEEDBACK_COMMENT_MAX;

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 gap-2 rounded-full shadow-elevated"
        size="sm"
      >
        <MessageSquarePlus className="size-4" />
        Feedback
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share feedback</DialogTitle>
            <DialogDescription>
              Tell us what is working, what is confusing, or what you would like to see next. We read every note.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {FEEDBACK_SENTIMENTS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSentiment(option.value)}
                  aria-pressed={sentiment === option.value}
                  className={cn(
                    "rounded-lg border border-border px-3 py-2 text-left transition-colors hover:bg-muted/50",
                    sentiment === option.value && "border-primary bg-primary/10",
                  )}
                >
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.hint}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value.slice(0, FEEDBACK_COMMENT_MAX))}
                placeholder="What happened, and what did you expect?"
                rows={5}
                aria-label="Feedback comment"
              />
              <p className="text-right text-xs text-muted-foreground">
                {trimmed.length}/{FEEDBACK_COMMENT_MAX}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={invalid || mutation.isPending}>
              {mutation.isPending ? "Sending…" : "Send feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
