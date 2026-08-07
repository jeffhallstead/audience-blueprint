import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { setAnalystRole, revokeEntitlement } from "@/lib/admin/admin.functions";
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

/**
 * Internal access control. The Blueprint is not sold — it is delivered on a
 * booked call — so full access is granted by making someone an internal
 * analyst rather than by comping a paid tier.
 */
export function GrantAccessDialog({ user }: { user: AdminUserRow }) {
  const environment = getStripeEnvironment();
  const queryClient = useQueryClient();
  const setRole = useServerFn(setAnalystRole);
  const revoke = useServerFn(revokeEntitlement);

  const [open, setOpen] = useState(false);

  const done = (message: string) => {
    toast.success(message);
    setOpen(false);
    void queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    void queryClient.invalidateQueries({ queryKey: ["entitlement"] });
  };

  const roleMutation = useMutation({
    mutationFn: (enabled: boolean) => setRole({ data: { userId: user.userId, enabled } }),
    onSuccess: (_res, enabled) =>
      done(enabled ? "Internal analyst access granted." : "Internal access removed."),
    onError: (err: Error) => toast.error(err.message),
  });

  const revokeMutation = useMutation({
    mutationFn: () => revoke({ data: { userId: user.userId, environment } }),
    onSuccess: () => done("Legacy grant revoked."),
    onError: (err: Error) => toast.error(err.message),
  });

  const pending = roleMutation.isPending || revokeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Manage access
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage access</DialogTitle>
          <DialogDescription>
            Internal analysts see the complete Blueprint, roadmap, Copilot and exports so they can
            deliver it on a call. Everyone else keeps the free Publisher Test.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
            {user.isAdmin ? (
              <span>
                <strong>{user.email}</strong> is an admin and already has full access.
              </span>
            ) : user.isAnalyst ? (
              <span>
                <strong>{user.email}</strong> has internal analyst access.
              </span>
            ) : (
              <span>
                <strong>{user.email}</strong> is a free Publisher Test user.
              </span>
            )}
          </div>

          {user.grantedTier ? (
            <p className="rounded-md border border-border p-3 text-sm text-muted-foreground">
              A legacy manual grant is still on file (
              {user.grantedTier === "os" ? "Publisher OS" : "Blueprint"}). It no longer affects
              access and can be cleared.
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {user.grantedTier ? (
            <Button variant="outline" disabled={pending} onClick={() => revokeMutation.mutate()}>
              Clear legacy grant
            </Button>
          ) : (
            <span />
          )}
          {user.isAdmin ? null : user.isAnalyst ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => roleMutation.mutate(false)}
            >
              Remove internal access
            </Button>
          ) : (
            <Button disabled={pending} onClick={() => roleMutation.mutate(true)}>
              Grant internal access
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
