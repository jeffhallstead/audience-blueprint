import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

type OAuthResult = { data: any; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails(id: string): Promise<OAuthResult>;
  approveAuthorization(id: string): Promise<OAuthResult>;
  denyAuthorization(id: string): Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  validateSearch: z.object({ authorization_id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Connect an assistant — Publisher Blueprint" },
      { name: "description", content: "Approve an AI assistant's access to your Publisher Blueprint account." },
      { property: "og:title", content: "Connect an assistant — Publisher Blueprint" },
      { property: "og:description", content: "Approve an AI assistant's access to Publisher Blueprint." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConsentPage,
  errorComponent: ({ error }) => <Shell><p className="text-sm text-destructive">{error instanceof Error ? error.message : "Something went wrong."}</p></Shell>,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-border rounded-md bg-card p-8 space-y-5">
        <Logo />
        {children}
      </div>
    </main>
  );
}

function ConsentPage() {
  const { authorization_id: id } = Route.useSearch();
  const [state, setState] = useState<"loading" | "ready" | "error" | "busy">("loading");
  const [details, setDetails] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) { setErr("This connection link is missing or expired."); setState("error"); return; }
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        const next = window.location.pathname + window.location.search;
        window.location.replace(`/auth?mode=signin&next=${encodeURIComponent(next)}`);
        return;
      }
      setEmail(u.user.email ?? "");
      const { data, error } = await oauth().getAuthorizationDetails(id);
      if (error) { setErr(error.message); setState("error"); return; }
      const redirect = data?.redirect_url ?? data?.redirect_to;
      if (redirect && !data?.client) { window.location.replace(redirect); return; }
      setDetails(data); setState("ready");
    })().catch((e) => { setErr(e instanceof Error ? e.message : "Something went wrong."); setState("error"); });
  }, [id]);

  async function decide(approve: boolean) {
    if (!id) return;
    setState("busy");
    const { data, error } = approve ? await oauth().approveAuthorization(id) : await oauth().denyAuthorization(id);
    if (error) { setErr(error.message); setState("error"); return; }
    const redirect = data?.redirect_url ?? data?.redirect_to;
    if (redirect) window.location.replace(redirect);
  }

  if (state === "loading") return <Shell><p className="text-sm text-muted-foreground">Checking connection…</p></Shell>;
  if (state === "error") return <Shell><h1 className="font-serif text-2xl">Connection problem</h1><p className="text-sm text-muted-foreground">{err}</p></Shell>;
  const client = details?.client?.name ?? details?.client?.client_name ?? "An assistant";
  const scopes: string[] = String(details?.scope ?? "").split(" ").filter(Boolean);
  return (
    <Shell>
      <h1 className="font-serif text-2xl">Connect {client} to Publisher Blueprint</h1>
      <p className="text-sm text-muted-foreground">Signed in as {email}. This lets {client} use Brand Scout as you: run teardowns and read saved teardowns.</p>
      {details?.redirect_uri && <p className="text-xs text-muted-foreground break-all">Returns to {details.redirect_uri}</p>}
      {scopes.length > 0 && <ul className="text-sm list-disc pl-5">{scopes.map((s) => <li key={s}>{s === "email" ? "Share your email address" : s === "profile" ? "Share your basic profile" : s === "openid" ? "Confirm your identity" : `Additional permission: ${s}`}</li>)}</ul>}
      <p className="text-xs text-muted-foreground">This does not bypass this app's permissions — only admin and analyst accounts can use Brand Scout.</p>
      <div className="flex gap-3">
        <Button disabled={state === "busy"} onClick={() => decide(true)}>Approve</Button>
        <Button variant="outline" disabled={state === "busy"} onClick={() => decide(false)}>Cancel connection</Button>
      </div>
    </Shell>
  );
}
