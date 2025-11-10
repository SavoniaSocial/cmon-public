import fetch from "node-fetch";

export type BrandShape = {
  name?: string;
  summary?: string;
  messages?: string[];
  content_pillars?: string[];
};

export async function generateFeedback(
  context: {
    client: string;
    format: string;
    platform?: string;
    user_inputs?: any;
    brand?: BrandShape | null;
    thread_memory?: string | null;
    continuing?: boolean;
    key_message_hint?: string | null;
  },
  enforceJson = true
): Promise<
  | { ok: true; json: any; plain_text: string }
  | { ok: false; error: string; plain_text?: string | null }
> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { ok: false, error: "Missing OPENAI_API_KEY" };
    }

    const {
      client,
      format,
      platform = "instagram",
      user_inputs = {},
      brand = null,
      thread_memory = null,
      continuing = false,
      key_message_hint = null,
    } = context;

    const safeJson = (v: any) => JSON.stringify(v ?? []);

    const system = continuing
      ? `You are CMON’s copy coach continuing an existing thread. Keep continuity from thread memory. Mirror language. Use ≥1 key message. Strict JSON.`
      : `You are CMON’s copy coach. Produce concise, on-brand drafts. Mirror language. Use ≥1 key message verbatim. Return STRICT JSON only.`;

    // 🧩 Ambil data user
    const user_inputs_json = safeJson(user_inputs);

    // ✅ PROMPT BARU (berdasarkan instruksi Zak)
    const userPrompt = `
You are an expert copywriter and writing coach.

The user has submitted a rough marketing draft through a form. 
Your task is to transform it into emotionally resonant, brand-aligned, and persuasive copy, 
while also coaching the user through concise feedback.

Always respond in the same language as the user's input:
If the user writes in Indonesian, reply in Indonesian.
If the user writes in English, reply in English.

You will receive:
Brand: ${user_inputs.client}
Format: ${user_inputs.format}
Target Audience: ${user_inputs.targetAudience}
Primary Pain Point or Desire: ${user_inputs.painPoint}
Hook: ${user_inputs.hook}
Copy: ${user_inputs.copy}
In-Brand Messages: ${user_inputs.brandMessages}

Your Objectives:
1. Make the copy emotionally resonant with the specified target audience.
2. Connect directly to the stated pain point or desire.
3. Include at least one in-brand message exactly as written, if provided.
4. Maintain clarity, persuasion, and a natural human tone.
5. Adapt your structure and tone to match the given format.

Follow These 3 Steps:
Step 1: Rewrite the Hook
Speak directly to the target audience.
Reflect or challenge the pain point.
Use emotion, empathy, or aspiration to grab attention.
Keep it human and conversational.

Step 2: Rewrite the Body Copy
Focus on outcomes and emotional relief or success related to the pain point.
Align the tone and structure with the format.
Highlight benefits more than features.
If brand messages are available, include one of them verbatim, woven naturally into the text.
If no brand messages are provided, skip this rule but keep a strong emotional and brand-consistent tone.

Step 3: Provide Writing Feedback
In 2–3 short sentences, comment on what worked in the original draft.
Explain what you improved and why (e.g., emotional tone, clarity, alignment with audience).
Keep the feedback motivating and constructive.

Fallback Handling:
If any of these fields are missing or empty:
- If targetAudience is missing → Write in a neutral yet professional casual tone suitable for general readers.
- If painPoint is missing → Focus on efficiency, clarity, and outcome-based benefits.
- If format is missing → Default to short-form persuasive marketing copy.
- If brandMessages is empty → Do not mention brand messages.
- If both hook and copy are empty → Politely note that no content was provided and request at least one of them.

Final Checks Before Responding:
- Does the new hook speak emotionally to the right audience?
- Does it address or reflect the main pain point or desire?
- If brand messages were provided, is one included word-for-word?
- Is the copy tone aligned with the format or the default persuasive style?

Respond in the same language as input.
`.trim();

    const messages = [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ];

    const body = {
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.2,
      max_tokens: 500,
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const aiText = data.choices?.[0]?.message?.content?.trim?.() || "";

    const extractJsonString = (s: string) => {
      if (!s) return s;
      let cleaned = s
        .replace(/```json/gi, "")
        .replace(/```/gi, "")
        .trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      return match ? match[0] : cleaned;
    };

    const jsonStr = extractJsonString(aiText);

    if (enforceJson) {
      try {
        const parsed = JSON.parse(jsonStr);
        return { ok: true, json: parsed, plain_text: aiText };
      } catch {
        return { ok: false, error: "JSON parse failed", plain_text: aiText };
      }
    } else {
      try {
        const parsed = JSON.parse(jsonStr);
        return { ok: true, json: parsed, plain_text: aiText };
      } catch {
        return { ok: true, json: null, plain_text: aiText };
      }
    }
  } catch (e: any) {
    return { ok: false, error: e.message, plain_text: null };
  }
}
