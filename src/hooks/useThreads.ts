"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Message = {
  id?: number;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

export type Thread = {
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

  // ✅ Ambil semua threads
  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return setThreads([]);

      const res = await fetch("/api/threads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (res.ok) {
        setThreads(json.threads || []);
      } else {
        console.error("fetchThreads error:", json.error);
      }
    } catch (err) {
      console.error("fetchThreads error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Realtime listener Supabase
  useEffect(() => {
    fetchThreads();

    // 🔹 Listener untuk pesan baru (user atau AI)
    const msgChannel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("🔔 New message received:", payload);
          fetchThreads();
        }
      )
      .subscribe();

    // 🔹 Listener untuk thread baru (biar auto muncul tanpa refresh)
    const threadChannel = supabase
      .channel("threads-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "threads",
        },
        (payload) => {
          console.log("🧵 New thread created:", payload);
          fetchThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(threadChannel);
    };
  }, [fetchThreads]);

  // ✅ Buat thread baru
  const createThread = useCallback(
    async (payload: {
      client?: string;
      format?: string;
      hook?: string;
      copy?: string;
      brand_kit_id?: string | null;
      target_audience?: string;
      pain_point?: string;
      brand_messages?: string;
    }) => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create thread");

      return json.thread as Thread;
    },
    []
  );

  // ✅ Kirim pesan ke thread + dapetin balasan AI
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

        // 🔹 FIX: route sebelumnya salah (/api/thread → /api/threads)
        const res = await fetch(`/api/threads/${threadId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages,
            brandKitId,
          }),
        });

        // 🔹 FIX: tangani HTML error page dari Next.js
        const text = await res.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Invalid JSON response. Check API route.");
        }

        if (!res.ok) {
          throw new Error(data.error || "AI request failed");
        }

        return data.reply; // Balasan AI
      } catch (err) {
        console.error("sendMessage error:", err);
        throw err;
      }
    },
    []
  );

  // ✅ Hapus thread
  const deleteThread = useCallback(async (threadId: string) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`/api/threads/${threadId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON response while deleting thread");
    }

    if (!res.ok) throw new Error(data.error || "Failed to delete thread");
  }, []);

  return {
    threads,
    setThreads,
    loading,
    fetchThreads,
    createThread,
    sendMessage,
    deleteThread,
  };
}
