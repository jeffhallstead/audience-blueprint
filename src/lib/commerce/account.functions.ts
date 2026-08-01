import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PaddleEnv } from "@/lib/paddle.server";

const isEnv = (value: unknown): PaddleEnv => (value === "live" ? "live" : "sandbox");

/**
 * Permanently deletes the signed-in user. Any live subscription is scheduled
 * to cancel at the end of the paid period first, so billing never continues
 * after the account is gone. All owned rows cascade from auth.users.
 */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => ({ environment: isEnv(data.environment) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("paddle_subscription_id, status, cancel_at_period_end")
      .eq("user_id", userId)
      .eq("environment", data.environment);

    const cancellable = (subscriptions ?? []).filter(
      (row) =>
        !row.cancel_at_period_end &&
        ["active", "trialing", "past_due", "paused"].includes(row.status),
    );

    let canceled = 0;
    if (cancellable.length > 0) {
      const { getPaddleClient } = await import("@/lib/paddle.server");
      const paddle = getPaddleClient(data.environment);
      for (const row of cancellable) {
        try {
          await paddle.subscriptions.cancel(row.paddle_subscription_id, {
            effectiveFrom: "next_billing_period",
          });
          canceled += 1;
        } catch (error) {
          console.error("[payments] cancel-before-delete failed", error);
          throw new Error(
            "We could not cancel your subscription automatically. Please cancel from Manage billing, then delete your account.",
          );
        }
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { deleted: true, canceledSubscriptions: canceled };
  });
