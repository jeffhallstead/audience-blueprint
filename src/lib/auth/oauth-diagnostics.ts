const FLOW_KEY = "publisher-blueprint:oauth-flow";
const FLOW_TTL_MS = 2 * 60 * 1000;

type OAuthFlow = {
  id: string;
  startedAt: number;
};

function readFlow(): OAuthFlow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(FLOW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OAuthFlow>;
    if (typeof parsed.id !== "string" || typeof parsed.startedAt !== "number") return null;
    return { id: parsed.id, startedAt: parsed.startedAt };
  } catch {
    return null;
  }
}

export function beginOAuthFlow(): void {
  if (typeof window === "undefined") return;
  const flow: OAuthFlow = {
    id: crypto.randomUUID(),
    startedAt: Date.now(),
  };
  window.sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow));
  recordOAuthStage("started");
}

export function isRecentOAuthFlow(): boolean {
  const flow = readFlow();
  return flow !== null && Date.now() - flow.startedAt < FLOW_TTL_MS;
}

export function completeOAuthFlow(): void {
  recordOAuthStage("completed");
  if (typeof window !== "undefined") window.sessionStorage.removeItem(FLOW_KEY);
}

export function recordOAuthStage(stage: string, details: Record<string, string | number | boolean> = {}): void {
  if (typeof window === "undefined") return;
  const flow = readFlow();
  console.info("[auth-flow]", {
    stage,
    flowId: flow?.id ?? "untracked",
    elapsedMs: flow ? Date.now() - flow.startedAt : 0,
    context: window.self === window.top ? "standalone" : "iframe",
    ...details,
  });
}