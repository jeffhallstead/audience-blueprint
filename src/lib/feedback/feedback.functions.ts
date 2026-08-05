import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin/shared";
import {
  FEEDBACK_COMMENT_MAX,
  FEEDBACK_SENTIMENT_VALUES,
  type AdminFeedbackRow,
} from "@/lib/feedback/types";

const submitSchema = z.object({
  sentiment: z.enum(FEEDBACK_SENTIMENT_VALUES as [string, ...string[]]),
  comment: z.string().trim().min(1, "Tell us a little more").max(FEEDBACK_COMMENT_MAX),
  page: z.string().trim().max(200).optional(),
  userAgent: z.string().trim().max(400).optional(),
});

export type SubmitFeedbackInput = z.infer<typeof submitSchema>;

/** Records in-app feedback, audits it, and queues a CRM push. Never blocks on the CRM. */
export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SubmitFeedbackInput) => submitSchema.parse(input))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const email = (context.claims.email as string | undefined) ?? null;

    const { error } = await context.supabase.from("user_feedback").insert({
      user_id: userId,
      target_type: "app",
      rating: data.sentiment,
      comment: data.comment,
      metadata: {
        page: data.page ?? null,
        userAgent: data.userAgent ?? null,
      } as never,
    });
    if (error) {
      console.error("[submitFeedback] insert failed:", error);
      throw new Error("Could not save your feedback. Please try again.");
    }

    const occurredAt = new Date().toISOString();

    const { emitPlatformEvent } = await import("@/lib/events/emit.server");
    await emitPlatformEvent({
      type: "feedback.submitted",
      userId,
      context: { page: data.page ?? null },
      payload: { sentiment: data.sentiment },
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const { enqueueIntegrationEvent } = await import("@/lib/integrations/outbox.server");
    await enqueueIntegrationEvent(
      {
        eventName: "feedback.submitted",
        userId,
        email,
        fullName: profile?.full_name ?? null,
        occurredAt,
        metadata: {
          sentiment: data.sentiment,
          comment: data.comment,
          page: data.page ?? null,
        },
      },
      { providers: ["airtable"] },
    );

    return { ok: true };
  });

/** Admin-only feedback feed, newest first. */
export const listFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminFeedbackRow[]> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("user_feedback")
      .select("id, user_id, rating, comment, metadata, created_at")
      .eq("target_type", "app")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const [{ data: authUsers }, { data: profiles }] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      supabaseAdmin.from("profiles").select("id, full_name"),
    ]);
    const emailById = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? null]));
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    return (rows ?? []).map((row) => {
      const metadata = (row.metadata ?? {}) as { page?: string | null };
      return {
        id: row.id,
        userId: row.user_id,
        email: emailById.get(row.user_id) ?? null,
        fullName: nameById.get(row.user_id) ?? null,
        sentiment: row.rating,
        comment: row.comment ?? "",
        page: metadata.page ?? null,
        createdAt: row.created_at,
      };
    });
  });
