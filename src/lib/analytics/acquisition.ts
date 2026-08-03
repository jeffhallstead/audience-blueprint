/**
 * First-touch acquisition capture (browser-only).
 *
 * The very first page a visitor lands on carries the only honest acquisition
 * signal we will ever get. We stash it locally before any sign-in exists, then
 * flush it onto the profile once the user authenticates — first touch wins and
 * is never overwritten.
 */

const STORAGE_KEY = "pb.first_touch.v1";

export interface FirstTouch {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
  landingPath: string | null;
  capturedAt: string;
}

function inferSource(params: URLSearchParams, referrer: string | null): string | null {
  const utm = params.get("utm_source");
  if (utm) return utm;
  if (params.get("gclid")) return "google";
  if (params.get("fbclid")) return "facebook";
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host && host !== window.location.hostname) return host;
  } catch {
    /* malformed referrer — treat as direct */
  }
  return "direct";
}

/** Records first touch once per browser. Safe to call on every page load. */
export function captureFirstTouch(): FirstTouch | null {
  if (typeof window === "undefined") return null;
  const existing = readFirstTouch();
  if (existing) return existing;

  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer || null;
  const touch: FirstTouch = {
    source: inferSource(params, referrer),
    medium: params.get("utm_medium") ?? (referrer ? "referral" : "none"),
    campaign: params.get("utm_campaign"),
    referrer,
    landingPath: window.location.pathname + window.location.search,
    capturedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(touch));
  } catch {
    /* private mode — acquisition data is nice to have, never required */
  }
  return touch;
}

export function readFirstTouch(): FirstTouch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FirstTouch) : null;
  } catch {
    return null;
  }
}

export function markFirstTouchFlushed() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${STORAGE_KEY}.flushed`, "1");
  } catch {
    /* ignore */
  }
}

export function firstTouchFlushed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(`${STORAGE_KEY}.flushed`) === "1";
  } catch {
    return true;
  }
}
