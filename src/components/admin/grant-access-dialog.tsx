import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { grantEntitlement, revokeEntitlement } from "@/lib/admin/admin.functions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Comps a paid tier to an account without a payment. Grants are recorded
 * separately from purchases, so revenue metrics stay accurate.
 */
export function GrantAccessDialog({ user }: { user: AdminUserRow }) {
  const environment = getStripeEnvironment();
  const queryClient = useQueryClient();
  const grant = useServerFn(grantEntitlement);
  const revoke = useServerFn(revokeEntitlement);

  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<"blueprint" | "os">(user.grantedTier ?? "blueprint");
  const [expiresAt, setExpiresAt] = useState(user.grantExpiresAt?.slice(0, 10) ?? "");
  const [reason, setReason] = useState("");

  const done = (message: string) => {
    toast.success(message);
    setOpen(false);
    void queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    void queryClient.invalidateQueries({ queryKey: ["entitlement"] });
  };

  const grantMutation = useMutation({
    mutationFn: () =>
      grant({
        data: {
          userId: user.userId,
          tier,
          environment,
          expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59Z`).toISOString() : null,
          reason: reason || null,
        },
      }),
    onSuccess: () => done("Access granted."),
    onError: (err: Error) => toast.error(err.message),
  });

  const revokeMutation = useMutation({
    mutationFn: () => revoke({ data: { userId: user.userId, environment } }),
    onSuccess: () => done("Manual access revoked."),
    onError: (err: Error) => toast.error(err.message),
  });

  const pending = grantMutation.isPending || revokeMutation.isPending;

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
            Grant {user.email} a paid tier without a payment. This does not create a purchase or
            affect revenue reporting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {user.grantedTier ? (
            <p className="rounded-md border border-border bg-muted/40 p-3 text-sm">
              Active manual grant: <strong>{user.grantedTier === "os" ? "Publisher OS" : "Blueprint"}</strong>
              {user.grantExpiresAt
                ? ` until ${new Date(user.grantExpiresAt).toLocaleDateString()}`
                : " with no expiry"}
              .
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="grant-tier">Tier</Label>
            <Select value={tier} onValueChange={(v) => setTier(v as "blueprint" | "os")}>
              <SelectTrigger id="grant-tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blueprint">Publisher Blueprint</SelectItem>
                <SelectItem value="os">Publisher OS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grant-expiry">Expires (optional)</Label>
            <Input
              id="grant-expiry"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grant-reason">Internal note (optional)</Label>
            <Input
              id="grant-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Beta partner, comped for review…"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {user.grantedTier ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => revokeMutation.mutate()}
            >
              Revoke access
            </Button>
          ) : (
            <span />
          )}
          <Button disabled={pending} onClick={() => grantMutation.mutate()}>
            {user.grantedTier ? "Update grant" : "Grant access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
