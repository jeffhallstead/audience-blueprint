/**
 * Browser-local storage for the anonymous Publisher Test.
 *
 * Visitors take the whole test before they are asked for an email, so the
 * answers live here until an account exists to claim them. Nothing in this
 * module touches the network.
 */

import type { AssessmentAnswers, AnswerValue } from "./config";
import type { PlatformEventType } from "@/lib/events/catalog";

const KEY = "pb.anon-test.v1";
/** Anonymous progress is resumable for 30 days. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface BufferedEvent {
  type: PlatformEventType;
  occurredAt: string;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}

export interface AnonymousTestState {
  visitorId: string;
  startedAt: string;
  updatedAt: string;
  step: number;
  answers: AssessmentAnswers;
  events: BufferedEvent[];
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function blank(): AnonymousTestState {
  const now = new Date().toISOString();
  return {
    visitorId: crypto.randomUUID(),
    startedAt: now,
    updatedAt: now,
    step: 0,
    answers: {},
    events: [],
  };
}

/** Reads stored progress, or null when there is none (or it expired). */
export function readAnonymousTest(): AnonymousTestState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AnonymousTestState;
    if (!parsed?.visitorId || typeof parsed.answers !== "object") return null;
    if (Date.now() - new Date(parsed.updatedAt).getTime() > TTL_MS) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return { ...blank(), ...parsed, events: parsed.events ?? [] };
  } catch {
    return null;
  }
}

export function ensureAnonymousTest(): AnonymousTestState {
  return readAnonymousTest() ?? write(blank());
}

function write(state: AnonymousTestState): AnonymousTestState {
  const next = { ...state, updatedAt: new Date().toISOString() };
  if (isBrowser()) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage full or blocked — the test still works for this session */
    }
  }
  return next;
}

export function saveAnonymousAnswer(questionId: string, value: AnswerValue): AnonymousTestState {
  const state = ensureAnonymousTest();
  return write({ ...state, answers: { ...state.answers, [questionId]: value } });
}

export function saveAnonymousStep(step: number): AnonymousTestState {
  return write({ ...ensureAnonymousTest(), step });
}

/** Buffers an event locally; it is flushed once the account exists. */
export function bufferAnonymousEvent(
  type: PlatformEventType,
  context?: Record<string, unknown>,
  payload?: Record<string, unknown>,
): void {
  const state = ensureAnonymousTest();
  // Cap the buffer so a long session can't grow storage without bound.
  const events = [...state.events, { type, occurredAt: new Date().toISOString(), context, payload }].slice(-50);
  write({ ...state, events });
}

export function clearAnonymousTest(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to clean up */
  }
}
