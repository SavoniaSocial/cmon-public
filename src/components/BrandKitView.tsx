"use client";
import { useState } from "react";

export default function BrandKitView() {
  const [form, setForm] = useState({
    name: "",
    product: "",
    uvp: "",
    story: "",
    messages: ["", "", "", "", ""],
  });

  return (
    <div className="text-gray-600">
      <h2 className="text-xl font-semibold text-purple-700">Brand Kit 🏅</h2>
      <p className="mt-2 text-sm text-gray-500">
        Define your brand identity and story to personalize AI outputs.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Brand Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-md border px-3 py-2"
        />
        <input
          type="text"
          placeholder="Product"
          value={form.product}
          onChange={(e) => setForm({ ...form, product: e.target.value })}
          className="rounded-md border px-3 py-2"
        />
        <input
          type="text"
          placeholder="Unique Value Proposition"
          value={form.uvp}
          onChange={(e) => setForm({ ...form, uvp: e.target.value })}
          className="col-span-2 rounded-md border px-3 py-2"
        />
        <textarea
          placeholder="Brand Story"
          value={form.story}
          onChange={(e) => setForm({ ...form, story: e.target.value })}
          className="col-span-2 h-24 rounded-md border px-3 py-2"
        />
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium">5 Key Messages</p>
        {form.messages.map((msg, i) => (
          <input
            key={i}
            type="text"
            placeholder={`Message ${i + 1}`}
            value={msg}
            onChange={(e) => {
              const updated = [...form.messages];
              updated[i] = e.target.value;
              setForm({ ...form, messages: updated });
            }}
            className="mt-2 w-full rounded-md border px-3 py-2"
          />
        ))}
      </div>
    </div>
  );
}
