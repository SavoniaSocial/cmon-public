"use client";
import { useState } from "react";
import useThreads from "@/hooks/useThreads";
import useProfile from "@/hooks/useProfile";

export default function AddDraftPanel({
  draft,
  setDraft,
  sparks,
  onClose,
}: {
  draft: any;
  setDraft: (v: any) => void;
  sparks: number;
  onClose: () => void;
}) {
  const { createThread, sendMessage, fetchThreads } = useThreads();
  const { refreshProfile } = useProfile();
  const [loading, setLoading] = useState(false);

  const detectLanguage = (text: string) => {
    const indoWords = ["yang", "dan", "tidak", "aja", "banget", "kopi"];
    const lower = text.toLowerCase();
    return indoWords.some((w) => lower.includes(w)) ? "indonesian" : "english";
  };

  const handleStart = async () => {
    if (!draft.client?.trim() || !draft.format?.trim()) {
      alert("Please fill client and format");
      return;
    }

    if (sparks <= 0) {
      alert("✨ You have no sparks left. Upgrade to Pro!");
      return;
    }

    setLoading(true);
    try {
      const lang = detectLanguage(
        `${draft.hook || ""} ${draft.copy || ""} ${draft.client || ""}`
      );

      const prompt = `
You are an expert copywriter and writing coach.

The user has submitted a rough marketing draft through a form. 
Your task is to transform it into emotionally resonant, brand-aligned, and persuasive copy, 
while also coaching the user through concise feedback.

Always respond in the same language as the user's input:
If the user writes in Indonesian, reply in Indonesian.
If the user writes in English, reply in English.

You will receive:
Brand: ${draft.client}
Format: ${draft.format}
Target Audience: ${draft.targetAudience}
Primary Pain Point or Desire: ${draft.painPoint}
Hook: ${draft.hook}
Copy: ${draft.copy}
In-Brand Messages: ${draft.brandMessages}

[... full prompt sama persis dengan versi di aiEngine ...]
      `.trim();

      const newThread = await createThread({
        client: draft.client,
        format: draft.format,
        hook: draft.hook,
        copy: draft.copy,
        target_audience: draft.targetAudience || null,
        pain_point: draft.painPoint || null,
        brand_messages: draft.brandMessages || null,
        brand_kit_id: draft.brand_kit_id || null,
      });

      await sendMessage({
        threadId: newThread.id,
        messages: [{ role: "user", content: prompt }],
        brandKitId: draft.brand_kit_id || null,
      });

      await refreshProfile();
      await fetchThreads();

      const cleared = {
        client: "",
        format: "",
        hook: "",
        copy: "",
        targetAudience: "",
        painPoint: "",
        brandMessages: "",
      };
      setDraft(cleared);
      localStorage.removeItem("creates_draft");

      onClose();
    } catch (err: any) {
      console.error("handleStart error:", err);
      alert(err.message || "Failed to start thread");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h3 className="text-lg font-semibold text-purple-700">Add Draft</h3>
        <button
          onClick={() => {
            localStorage.removeItem("creates_draft");
            onClose();
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          ✖
        </button>
      </div>

      {/* Tambahkan flex-1 + overflow-y-auto di sini */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-6 text-sm">
          {/* semua form tetap sama */}
          <label className="font-medium">Client</label>
          <input
            type="text"
            value={draft.client || ""}
            onChange={(e) => setDraft({ ...draft, client: e.target.value })}
            placeholder="Client name"
            className="rounded-md border px-3 py-2"
          />

          <label className="font-medium">Content Format</label>
          <select
            value={draft.format || ""}
            onChange={(e) => setDraft({ ...draft, format: e.target.value })}
            className="rounded-md border px-3 py-2"
          >
            <option value="">Select format</option>
            <option value="Carousel">Carousel</option>
            <option value="SEO Caption">SEO Caption</option>
            <option value="LinkedIn Post">LinkedIn Post</option>
            <option value="Short Video Script">Short Video Script</option>
          </select>

          <label className="font-medium">Target Audience</label>
          <input
            type="text"
            value={draft.targetAudience || ""}
            onChange={(e) =>
              setDraft({ ...draft, targetAudience: e.target.value })
            }
            placeholder="Describe your ideal audience..."
            className="rounded-md border px-3 py-2"
          />

          <label className="font-medium">Primary Pain Point or Desire</label>
          <input
            type="text"
            value={draft.painPoint || ""}
            onChange={(e) => setDraft({ ...draft, painPoint: e.target.value })}
            placeholder="What problem or desire does your audience have?"
            className="rounded-md border px-3 py-2"
          />

          <label className="font-medium">In-Brand Messages</label>
          <textarea
            value={draft.brandMessages || ""}
            onChange={(e) =>
              setDraft({ ...draft, brandMessages: e.target.value })
            }
            placeholder="List up to 3 brand messages, separated by commas"
            className="h-20 rounded-md border px-3 py-2"
          />

          <label className="font-medium">Hook</label>
          <input
            type="text"
            value={draft.hook || ""}
            onChange={(e) => setDraft({ ...draft, hook: e.target.value })}
            placeholder="Short hook"
            className="rounded-md border px-3 py-2"
          />

          <label className="font-medium">Copy</label>
          <textarea
            value={draft.copy || ""}
            onChange={(e) => setDraft({ ...draft, copy: e.target.value })}
            placeholder="Write your copy here..."
            className="h-32 rounded-md border px-3 py-2"
          />
        </div>
      </div>

      <div className="mt-auto border-t px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-500">
            ✨ Sparks left: {sparks}
          </div>
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {loading && (
              <svg
                className="h-4 w-4 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            {loading ? "Generating..." : "Start Thread"}
          </button>
        </div>
      </div>
    </div>
  );
}
