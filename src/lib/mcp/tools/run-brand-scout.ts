import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { intakeShape } from "@/lib/brand-scout/intake";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "run_brand_scout",
  title: "Run Brand Scout teardown",
  description: "Estimate a brand's Publisher Index, diagnose its Publisher Pattern, and draft an outreach email teardown. Saves it to Brand Scout history.",
  inputSchema: intakeShape,
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (args, ctx) => {
    const userId = ctx.getUserId();
    if (!ctx.isAuthenticated() || !userId) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { assertStaff, generateTeardown } = await import("@/lib/brand-scout/engine");
    try {
      await assertStaff(supabase, userId);
      const t = await generateTeardown(args as never, supabase, userId);
      const priorities = (t.priorities as { title: string; detail: string }[]).map((p) => ({ title: p.title, detail: p.detail }));
      const dims = t.dimension_scores as Record<string, number>;
      const result = {
        id: t.id as string, brand: t.brand_name as string, publisherIndex: t.overall_score as number,
        dimensions: { ...dims }, pattern: t.pattern_id as string, patternReason: t.pattern_reason as string,
        priorities, emailSubject: t.email_subject as string, emailBody: t.email_body as string,
      };
      const text = `# ${result.brand} — Publisher Index ${result.publisherIndex}\nPattern: ${result.pattern} — ${result.patternReason}\n\nDimensions: ${Object.entries(dims).map(([k, v]) => `${k} ${v}`).join(", ")}\n\nPriorities:\n${priorities.map((p, i) => `${i + 1}. ${p.title}: ${p.detail}`).join("\n")}\n\nSubject: ${result.emailSubject}\n\n${result.emailBody}`;
      return { content: [{ type: "text", text }], structuredContent: result };
    } catch (e) {
      throw new ToolError(e instanceof Error ? e.message : "Teardown failed");
    }
  },
});
