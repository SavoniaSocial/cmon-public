"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import useThreads, { Thread, Message } from "@/hooks/useThreads";
import useProfile from "@/hooks/useProfile";

export default function ThreadList() {
  const { threads, loading, fetchThreads, sendMessage, deleteThread } = useThreads();
  const { profile, refreshProfile } = useProfile();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    // auto scroll ke bawah tiap ada pesan baru
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeThreadId, threads]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  const handleSend = async () => {
    if (!activeThread) return;
    if (!input.trim()) return;
    if ((profile?.sparks ?? 0) <= 0) {
      alert("No sparks left. Upgrade to Pro!");
      return;
    }

    setSending(true);
    try {
      const userMessage: Message = { role: "user", content: input };
      const allMessages: Message[] = [...(activeThread.messages || []), userMessage];

      const reply = await sendMessage({
        threadId: activeThread.id,
        messages: allMessages,
        brandKitId: activeThread.brand_kit_id || null,
      });

      // optional: kalau mau munculin hasil JSON langsung di console
      console.log("🧠 AI Reply:", reply);

      await refreshProfile();
      await fetchThreads();
      setInput("");
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteThread = async (id: string) => {
    if (confirm("Are you sure want to delete thread?")) {
      await deleteThread(id);
      await fetchThreads();
      setActiveThreadId(null);
    }
  };

  // Fallback loading
  if (loading) return <p className="text-gray-500">Loading threads...</p>;

  // Tidak ada thread sama sekali
  if (threads.length === 0)
    return (
      <div className="text-gray-600">
        <h2 className="text-xl font-semibold text-purple-700">Threads</h2>
        <p className="mt-3 text-sm text-gray-500">
          No threads yet. Start your first draft ✨
        </p>
      </div>
    );

  // Tidak ada thread yang sedang aktif
  if (!activeThread)
    return (
      <div className="text-gray-600">
        <h2 className="text-xl font-semibold text-purple-700">Threads</h2>
        <ul className="mt-4 space-y-4">
          {threads.map((t) => (
            <li
              key={t.id}
              className="relative rounded-md border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:bg-purple-50"
              onClick={() => setActiveThreadId(t.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-purple-700">
                    {t.client} – {t.format}
                  </h3>
                  <span className="text-xs text-gray-400 block mt-1">
                    {new Date(t.created_at || "").toLocaleString()}
                  </span>
                </div>

                {/* Tombol Delete (dirapihin posisinya) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteThread(t.id);
                  }}
                  className="text-xs text-red-500 hover:underline ml-3"
                >
                  Delete
                </button>
              </div>

              <p className="mt-2 text-sm text-gray-700 line-clamp-1">
                {(t.messages && t.messages.length > 0)
                  ? t.messages[t.messages.length - 1].content
                  : t.copy}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );

  // --- ✅ CHAT VIEW ---
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-purple-700">
            {activeThread.client} – {activeThread.format}
          </h2>
          <p className="text-xs text-gray-500">
            Sparks left: {profile?.sparks ?? "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveThreadId(null)}
            className="text-sm text-gray-500 hover:underline"
          >
            ← Back
          </button>
          <button
            onClick={() => handleDeleteThread(activeThread.id)}
            className="text-sm text-red-500 hover:underline"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-3 border rounded-md p-4 bg-white shadow-sm"
      >
        {(() => {
          const msgs = activeThread.messages || [];

          // ⚡ filter supaya cuma AI terakhir aja yang tampil (hapus echo singkat)
          const filteredMsgs = msgs.filter((m, idx) => {
            if (m.role !== "assistant") return true;
            const nextAssistant = msgs.slice(idx + 1).find((x) => x.role === "assistant");
            return !nextAssistant;
          });

          return filteredMsgs.map((m, idx) => {
            let displayText = m.content;
            let parsed: any = null;

            try {
              parsed = JSON.parse(m.content);
              if (parsed) {
                if (parsed.format === "slides" || parsed.slides) {
                  const slides = parsed.slides?.join("\n\n• ") ?? "";
                  displayText = `🎞️ ${parsed.format?.toUpperCase() || "SLIDES"}\n• ${slides}`;
                } else if (parsed.text) {
                  displayText = parsed.text;
                }

                if (parsed.notes) {
                  displayText += `\n\n📝 ${parsed.notes}`;
                }

                if (parsed.key_message_used) {
                  displayText += `\n\n🎯 Key Message: ${parsed.key_message_used}`;
                }
              }
            } catch {
              // not JSON
            }

            const isUser = m.role === "user";

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`max-w-[80%] p-3 rounded-2xl text-sm break-words ${
                  isUser
                    ? "ml-auto bg-purple-600 text-white rounded-br-none whitespace-pre-wrap"
                    : "mr-auto bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
              >
                {/* 🧩 Render dengan HTML supaya **bold** tampil tebal */}
                <div
                  dangerouslySetInnerHTML={{
                    __html: displayText
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br>"),
                  }}
                />
              </motion.div>
            );
          });
        })()}
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message..."
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button
          onClick={handleSend}
          disabled={sending || (profile?.sparks ?? 0) <= 0}
          className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:bg-gray-300"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
