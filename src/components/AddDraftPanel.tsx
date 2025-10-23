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

const handleStart = async () => {
  if (!draft.client || !draft.format) {
    alert("Please fill client and format");
    return;
  }
  if (sparks <= 0) {
    alert("✨ You have no sparks left. Upgrade to Pro!");
    return;
  }

  setLoading(true);
  try {
    // 1️⃣ buat thread dulu
    const newThread = await createThread({
      client: draft.client,
      format: draft.format,
      hook: draft.hook,
      copy: draft.copy,
      brand_kit_id: draft.brand_kit_id || null,
    });

    // 2️⃣ rakit prompt untuk AI (bebas kamu ubah gaya bahasanya)
    const prompt = `
Brand: ${draft.client}
Format: ${draft.format}
Hook: ${draft.hook}
Copy: ${draft.copy}
`;

    // 3️⃣ kirim ke AI
    await sendMessage({
      threadId: newThread.id,
      messages: [{ role: "user", content: prompt }],
      brandKitId: draft.brand_kit_id || null,
    });

    // 4️⃣ refresh sparks dan threads
    await refreshProfile();
    await fetchThreads();

    // 5️⃣ reset form
    setDraft({ client: "", format: "", hook: "", copy: "" });
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
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✖
        </button>
      </div>

      <div className="flex flex-col gap-4 p-6 text-sm">
        <label className="font-medium">Client</label>
        <input
          type="text"
          value={draft.client}
          onChange={(e) => setDraft({ ...draft, client: e.target.value })}
          placeholder="Client name"
          className="rounded-md border px-3 py-2"
        />

        <label className="font-medium">Content Format</label>
        <select
          value={draft.format}
          onChange={(e) => setDraft({ ...draft, format: e.target.value })}
          className="rounded-md border px-3 py-2"
        >
          <option value="">Select format</option>
          <option>Hook</option>
          <option>Slide Story</option>
          <option>SEO Caption</option>
          <option>LinkedIn Post</option>
          <option>Short Video Script</option>
        </select>

        <label className="font-medium">Hook</label>
        <input
          type="text"
          value={draft.hook}
          onChange={(e) => setDraft({ ...draft, hook: e.target.value })}
          placeholder="Short hook"
          className="rounded-md border px-3 py-2"
        />

        <label className="font-medium">Copy</label>
        <textarea
          value={draft.copy}
          onChange={(e) => setDraft({ ...draft, copy: e.target.value })}
          placeholder="Write your copy here..."
          className="h-32 rounded-md border px-3 py-2"
        />

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-500">
            ✨ Sparks left (server): see profile
          </div>
          <button
            onClick={handleStart}
            disabled={loading}
            className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {loading ? "Starting..." : "Start Thread"}
          </button>
        </div>
      </div>
    </div>
  );
}
