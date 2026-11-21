import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

import { intake } from "./intake";

export type Ctx = { supabase: any; userId: string };
export async function requireStaff({ supabase, userId }: Ctx) {
  const [a, b] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "analyst" }),
  ]);
  if (!a.data && !b.data) throw new Error("Forbidden");
}

export const listTeardowns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context as Ctx);
    const { data, error } = await context.supabase
      .from("brand_teardowns").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteTeardown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireStaff(context as Ctx);
    const { error } = await context.supabase.from("brand_teardowns").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const runTeardown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => intake.parse(i))
  .handler(async ({ data, context }) => {
    await requireStaff(context as Ctx);
    const { generateTeardown } = await import("./engine");
    return generateTeardown(data, context.supabase, context.userId);
  });
