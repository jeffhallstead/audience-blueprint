/**
 * Moves an anonymous Publisher Test into the account that just claimed it.
 *
 * Runs in the browser under the new session, so every write goes through RLS
 * as the owner. Called immediately after passwordless signup, and again if the
 * visitor returns through a sign-in link with progress still stored locally.
 */

import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/events/track.functions";
import { completeAssessment, getOrCreateAssessment, saveStep } from "./persistence";
import { clearAnonymousTest, readAnonymousTest } from "./local-store";
import { QUESTIONS, SECTIONS, questionsForSection } from "./config";
import { missingRequired } from "./scoring";

export interface ClaimResult {
  assessmentId: string;
  /** True when every required answer was present and the score was computed. */
  completed: boolean;
}

export async function claimAnonymousTest(userId: string): Promise<ClaimResult | null> {
  const stored = readAnonymousTest();
  if (!stored || Object.keys(stored.answers).length === 0) return null;

  const assessment = await getOrCreateAssessment(userId);

  // One round trip for the whole test — the visitor is staring at a spinner.
  const rows = Object.entries(stored.answers).map(([questionId, value]) => ({
    assessment_id: assessment.id,
    user_id: userId,
    section: QUESTIONS.find((question) => question.id === questionId)?.section ?? "unknown",
    question_key: questionId,
    value: { value } as never,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("assessment_answers")
    .upsert(rows, { onConflict: "assessment_id,question_key" });
  if (error) throw error;
  await saveStep(assessment.id, stored.step);

  // Replay the pre-signup funnel so the lead's whole path is attributable.
  void Promise.allSettled(
    stored.events.map((event) =>
      trackEvent({
        data: {
          type: event.type,
          context: { ...(event.context ?? {}), visitorId: stored.visitorId, occurredAt: event.occurredAt },
          payload: event.payload ?? {},
        },
      }),
    ),
  );


  const missing = missingRequired(
    SECTIONS.flatMap((section) => questionsForSection(section.id)),
    stored.answers,
  );
  if (missing.length) {
    clearAnonymousTest();
    return { assessmentId: assessment.id, completed: false };
  }

  await completeAssessment(userId, assessment.id, stored.answers);
  clearAnonymousTest();
  return { assessmentId: assessment.id, completed: true };
}
