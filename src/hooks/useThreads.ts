// src/hooks/useThreads.ts
"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Message = { id?: number; role: "user" | "assistant"; content: string; created_at?: string };
export type Thread = {
  response_text: any;
  id: string;
  user_id: string;
  brand_kit_id?: string | null;
  client?: string | null;
  format?: string | null;
  hook?: string | null;
  copy?: string | null;
  ai_feedback?: string | null;
  improved_draft?: string | null;
  char_count?: number;
  created_at?: string;
  messages?: Message[];
};

export default function useThreads() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setThreads([]);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/threads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setThreads(json.threads || []);
      else throw new Error(json.error || "Failed to load threads");
    } catch (err) {
      console.error("fetchThreads error:", err);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const createThread = useCallback(
    async (payload: { client?: string; format?: string; hook?: string; copy?: string; brand_kit_id?: string | null }) => {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const res = await fetch("/api/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to create thread");

        // refresh threads (or optimistic add)
        await fetchThreads();
        return json.thread as Thread;
      } catch (err) {
        console.error("createThread error:", err);
        throw err;
      }
    },
    [fetchThreads]
  );

  const sendMessage = useCallback(
  async ({
    threadId,
    messages,
    brandKitId,
  }: {
    threadId: string;
    messages: Message[];
    brandKitId?: string | null;
  }) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      // Build a plain prompt string for the AI from messages:
      // Prefer the last message by the user; otherwise join all messages.
      let prompt = "";
      if (Array.isArray(messages) && messages.length > 0) {
        // Try to find the last user message (common pattern: role === 'user')
        const lastUser = [...messages].reverse().find((m) => (m as any).role === "user" || (m as any).role === "User");
        if (lastUser && (lastUser as any).content) {
          prompt = (lastUser as any).content;
        } else {
          // fallback: join all message contents
          prompt = messages.map((m) => (m as any).content ?? "").join("\n\n");
        }
      }

      // Safety: ensure prompt is not empty (backend expects it)
      if (!prompt || !prompt.trim()) {
        throw new Error("Prompt required");
      }

      // Send both prompt and raw messages (keeps compatibility / traceability)
      const res = await fetch("/api/ai-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt, messages, threadId, brandKitId }),
      });

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        // Provide helpful error message for debugging
        throw new Error(json?.error || json?.message || "AI request failed");
      }

      // Parse reply from the new API shape:
      // backend returns { ok, thread, ai, remaining_sparks }
      // ai may contain plain_text or json
      let reply = "";
      if (json?.ai?.plain_text) {
        reply = json.ai.plain_text;
      } else if (json?.ai?.json) {
        // try to pick a reasonable human-readable field (summary / suggestions)
        const aiJson = json.ai.json;
        if (aiJson.summary) {
          reply = aiJson.summary;
        } else if (Array.isArray(aiJson.suggestions)) {
          reply = aiJson.suggestions.join("\n");
        } else {
          // fallback to stringified JSON
          reply = JSON.stringify(aiJson);
        }
      } else if (typeof json?.reply === "string") {
        // back-compat if something else returns `reply`
        reply = json.reply;
      } else {
        reply = JSON.stringify(json?.ai ?? json ?? "No reply");
      }

      // refresh threads to get latest messages & sparks updated
      await fetchThreads();

      return reply as string;
    } catch (err) {
      console.error("sendMessage error:", err);
      throw err;
    }
  },
  [fetchThreads]
);

const deleteThread = useCallback(async (threadId: string) => {
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`/api/threads/${threadId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to delete thread");
  } catch (err) {
    console.error("deleteThread error:", err);
    throw err;
  }
}, []);

  return { threads, setThreads, loading, fetchThreads, createThread, sendMessage, deleteThread };
}
