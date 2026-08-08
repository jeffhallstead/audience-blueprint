/**
 * Moves an anonymous Publisher Test into the account that just claimed it.
 *
 * Runs in the browser under the new session, so every write goes through RLS
 * as the owner. Called immediately after passwordless signup, and again if the
 * visitor returns through a sign-in link with progress still stored locally.
 */

import { trackEvent } from "@/lib/events/track.functions";
import { completeAssessment, getOrCreateAssessment, saveAnswer, saveStep } from "./persistence";
import { clearAnonymousTest, readAnonymousTest } from "./local-store";
import { SECTIONS, questionsForSection } from "./config";
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
  for (const [questionId, value] of Object.entries(stored.answers)) {
    await saveAnswer(assessment.id, userId, questionId, value);
  }
  await saveStep(assessment.id, stored.step);

  // Replay the pre-signup funnel so the lead's whole path is attributable.
  for (const event of stored.events) {
    await trackEvent({
      data: {
        type: event.type,
        context: { ...(event.context ?? {}), visitorId: stored.visitorId, occurredAt: event.occurredAt },
        payload: event.payload ?? {},
      },
    }).catch(() => undefined);
  }

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
