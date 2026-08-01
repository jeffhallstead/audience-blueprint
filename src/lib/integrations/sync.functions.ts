import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Pushes a completed assessment to the connected CRM/records providers.
 * Best-effort: queues the event and returns immediately.
 */
export const syncAssessmentCompleted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { assessmentId: string }) => {
    if (!input?.assessmentId || typeof input.assessmentId !== "string") {
      throw new Error("assessmentId is required");
    }
    return { assessmentId: input.assessmentId };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    const { data: scores } = await supabase
      .from("assessment_scores")
      .select("overall_score, maturity_level, maturity_title")
      .eq("assessment_id", data.assessmentId)
      .maybeSingle();

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const { enqueueIntegrationEvent } = await import("@/lib/integrations/outbox.server");
    await enqueueIntegrationEvent(
      {
        eventName: "assessment.completed",
        userId,
        email: (claims as { email?: string } | null)?.email ?? null,
        fullName: profile?.full_name ?? null,
        score: scores?.overall_score ?? null,
        maturityLevel: scores?.maturity_title ?? scores?.maturity_level ?? null,
        occurredAt: new Date().toISOString(),
        metadata: { assessmentId: data.assessmentId },
      },
      { dedupeKey: `assessment:${data.assessmentId}` },
    );

    return { queued: true as const };
  });
