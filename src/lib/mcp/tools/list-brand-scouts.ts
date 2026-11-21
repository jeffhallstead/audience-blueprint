import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_brand_scouts",
  title: "List Brand Scout teardowns",
  description: "List recent saved Brand Scout teardowns (admin/analyst only).",
  inputSchema: {},
  annotations: { readOnlyHint: true },
  handler: async (_a, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const { data, error } = await supabaseForUser(ctx).from("brand_teardowns")
      .select("id, brand_name, vertical, overall_score, pattern_id, email_subject, created_at")
      .order("created_at", { ascending: false }).limit(50);
    if (error) throw new ToolError(error.message);
    const rows = (data ?? []).map((r: any) => ({ id: String(r.id), brand: String(r.brand_name), vertical: String(r.vertical), publisherIndex: Number(r.overall_score), pattern: String(r.pattern_id), emailSubject: String(r.email_subject ?? ""), createdAt: String(r.created_at) }));
    return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }], structuredContent: { teardowns: rows } };
  },
});
