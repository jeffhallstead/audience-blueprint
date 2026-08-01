import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { deleteAccount } from "@/lib/commerce/account.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import { useAuth } from "@/hooks/use-auth";

const passwordSchema = z.string().min(8, "Use at least 8 characters");
const emailSchema = z.string().email("Enter a valid email address");

/** Password, email address and account deletion. */
export function AccountSecurityPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<null | "password" | "email" | "delete">(null);
  const [confirmDelete, setConfirmDelete] = useState("");

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setBusy("password");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("Password updated");
  }

  async function changeEmail(event: React.FormEvent) {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }

    setBusy("email");
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}/settings` },
    );
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEmail("");
    toast.success("Check your new inbox — confirm the change to finish.");
  }

  async function removeAccount() {
    if (confirmDelete !== "DELETE") {
      toast.error("Type DELETE to confirm");
      return;
    }
    setBusy("delete");
    try {
      await deleteAccount({ data: { environment: getPaddleEnvironment() } });
      await supabase.auth.signOut();
      toast.success("Your account has been deleted.");
      void navigate({ to: "/" });
    } catch (error) {
      toast.error((error as Error).message || "Could not delete the account.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <DashboardCard eyebrow="Security" title="Change password">
        <form onSubmit={changePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy === "password"} className="w-fit">
            {busy === "password" ? "Saving…" : "Update password"}
          </Button>
        </form>
      </DashboardCard>

      <DashboardCard
        eyebrow="Account"
        title="Change email address"
        footer={`Current address: ${user?.email ?? "—"}`}
      >
        <form onSubmit={changeEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-email">New email address</Label>
            <Input
              id="new-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            We send a confirmation link to the new address. The change applies once you confirm.
          </p>
          <Button type="submit" variant="outline" disabled={busy === "email"} className="w-fit">
            {busy === "email" ? "Sending…" : "Send confirmation"}
          </Button>
        </form>
      </DashboardCard>

      <DashboardCard
        eyebrow="Danger zone"
        title="Delete account"
        className="lg:col-span-2 border-destructive/40"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Permanently deletes your account, assessments, blueprints, Copilot sessions and billing
            records. This cannot be undone. Cancel any active subscription first so you are not
            billed again.
          </p>
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
            <Input
              id="confirm-delete"
              value={confirmDelete}
              placeholder="DELETE"
              onChange={(event) => setConfirmDelete(event.target.value)}
              className="max-w-xs"
            />
          </div>
          <Button
            variant="destructive"
            disabled={busy === "delete" || confirmDelete !== "DELETE"}
            onClick={() => void removeAccount()}
            className="w-fit"
          >
            {busy === "delete" ? "Deleting…" : "Delete my account"}
          </Button>
        </div>
      </DashboardCard>
    </div>
  );
}
