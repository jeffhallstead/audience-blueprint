/**
 * Publisher Copilot™ — client data layer.
 *
 * All Copilot reads go through these hooks so cache keys stay consistent and
 * every surface invalidates the same entries after a generation.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SessionRow = Database["public"]["Tables"]["ai_sessions"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["generated_documents"]["Row"];
export type PromptRow = Database["public"]["Tables"]["prompt_templates"]["Row"];
export type SavedRecommendationRow = Database["public"]["Tables"]["saved_recommendations"]["Row"];

export const copilotKeys = {
  sessions: ["copilot", "sessions"] as const,
  session: (id: string) => ["copilot", "session", id] as const,
  messages: (id: string) => ["copilot", "messages", id] as const,
  documents: ["copilot", "documents"] as const,
  document: (id: string) => ["copilot", "document", id] as const,
  prompts: ["copilot", "prompts"] as const,
  saved: ["copilot", "saved-recommendations"] as const,
};

export function useSessions() {
  return useQuery({
    queryKey: copilotKeys.sessions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_sessions")
        .select("*")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: copilotKeys.session(sessionId),
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_sessions").select("*").eq("id", sessionId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Stored rows rehydrated into the AI SDK's UIMessage shape. */
export function useSessionMessages(sessionId: string) {
  return useQuery({
    queryKey: copilotKeys.messages(sessionId),
    queryFn: async (): Promise<UIMessage[]> => {
      const { data, error } = await supabase
        .from("ai_messages")
        .select("id, role, parts, content, message_key, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => {
        const parts = Array.isArray(row.parts) && row.parts.length > 0 ? row.parts : [{ type: "text", text: row.content }];
        return {
          id: row.message_key ?? row.id,
          role: row.role as UIMessage["role"],
          parts: parts as UIMessage["parts"],
        };
      });
    },
    staleTime: Infinity,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title?: string; objective?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You are signed out.");
      const { data, error } = await supabase
        .from("ai_sessions")
        .insert({ user_id: userId, title: input.title ?? "New conversation", objective: input.objective ?? "ask" })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: copilotKeys.sessions }),
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from("ai_sessions").update({ status: "archived" }).eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: copilotKeys.sessions }),
  });
}

export function useDocuments(kind?: string) {
  return useQuery({
    queryKey: [...copilotKeys.documents, kind ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("generated_documents")
        .select("*")
        .neq("status", "archived")
        .order("created_at", { ascending: false });
      if (kind) query = query.eq("kind", kind);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: copilotKeys.document(documentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_documents")
        .select("*")
        .eq("id", documentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; markdown?: string; title?: string; favorite?: boolean; status?: string }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("generated_documents").update(patch).eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: copilotKeys.document(id) });
      queryClient.invalidateQueries({ queryKey: copilotKeys.documents });
    },
  });
}

export function usePrompts() {
  return useQuery({
    queryKey: copilotKeys.prompts,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .order("is_system", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSavedRecommendations() {
  return useQuery({
    queryKey: copilotKeys.saved,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_recommendations")
        .select("*")
        .neq("status", "archived")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Pushes an AI action into the Blueprint so it stops being a one-off answer. */
export function useSaveRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      body: string;
      category?: string;
      impact?: string;
      effort?: string;
      documentId?: string | null;
      sessionId?: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You are signed out.");
      const { error } = await supabase.from("saved_recommendations").insert({
        user_id: userId,
        title: input.title,
        body: input.body,
        category: input.category ?? "strategy",
        impact: input.impact ?? "medium",
        effort: input.effort ?? "medium",
        document_id: input.documentId ?? null,
        session_id: input.sessionId ?? null,
        source: "copilot",
      });
      // A duplicate means it is already in the Blueprint — treat as success.
      if (error && error.code !== "23505") throw error;
      const { trackRecommendation } = await import("@/lib/analytics/recommendation-metadata");
      await trackRecommendation({
        title: input.title,
        action: "saved",
        category: input.category ?? "strategy",
        source: "copilot",
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: copilotKeys.saved }),
  });
}

export function useToggleSavedStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: string }) => {
      const { error } = await supabase
        .from("saved_recommendations")
        .update({ status: input.status })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: copilotKeys.saved }),
  });
}
