import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/integrations/dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Scheduled caller authenticates with the project's publishable key.
        const expected =
          process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"];
        const provided = request.headers.get("apikey");
        if (!expected || provided !== expected) {
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
