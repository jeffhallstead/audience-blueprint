import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";

function authorized(request: Request, secret: string) {
  const header = request.headers.get("x-cron-secret") ?? "";
  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/integrations/dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["INTEGRATIONS_CRON_SECRET"];
        if (!secret) {
          return new Response("Not configured", { status: 503 });
        }
        if (!authorized(request, secret)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { dispatchOutbox } = await import("@/lib/integrations/outbox.server");
        try {
          const result = await dispatchOutbox();
          return Response.json(result);
        } catch (err) {
          console.error("[integrations] dispatch failed:", err);
          return new Response("Dispatch failed", { status: 500 });
        }
      },
    },
  },
});
