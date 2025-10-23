import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateFeedback(prompt: string, conversational = true) {
  try {
    const systemPrompt = conversational
      ? "You are a friendly creative writing assistant. Reply naturally and conversationally, like chatting with a friend. Do not include JSON, lists, or labels — just plain helpful text."
      : "You are an AI strategist that provides structured brand feedback.";

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 500,
    });

    const text = res.choices[0]?.message?.content?.trim() || "";
    return { ok: true, plain_text: text };
  } catch (error: any) {
    console.error("[AI Engine Error]", error);
    return { ok: false, error: error.message };
  }
}
