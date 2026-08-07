import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteUserAccount } from "@/lib/admin/admin.functions";
import type { AdminUserRow } from "@/lib/admin/shared";
import { getStripeEnvironment } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Permanent account deletion. Requires typing the email to confirm, because
 * every assessment, blueprint and document owned by the account cascades away.
 */
export function DeleteUserDialog({ user }: { user: AdminUserRow }) {
  const environment = getStripeEnvironment();
  const queryClient = useQueryClient();
  const remove = useServerFn(deleteUserAccount);

  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: () => remove({ data: { userId: user.userId, environment } }),
    onSuccess: () => {
      toast.success(`${user.email} deleted.`);
      setOpen(false);
      setConfirm("");
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const matches = confirm.trim().toLowerCase() === user.email.toLowerCase();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirm("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Delete ${user.email}`}>
          <Trash2 className="size-4 text-destructive" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this account?</DialogTitle>
          <DialogDescription>
            This permanently removes {user.email} along with their assessments, scores, blueprints,
            roadmaps, Copilot sessions and documents. Any live subscription is canceled first. This
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm-email">Type the email to confirm</Label>
          <Input
            id="confirm-email"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={user.email}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!matches || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting…" : "Delete account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
