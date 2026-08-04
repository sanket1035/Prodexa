import OpenAI from "openai";

const openAiApiKey = process.env.OPENAI_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

export const openai = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

/**
 * Primary AI Generator: Try Gemini REST API first, fall back to OpenAI, then fall back to deterministic JSON schema
 */
export async function generateModuleInsight(
  systemPrompt: string,
  userContent: string,
  fallbackJSON: any
): Promise<any> {
  // 1. Try Gemini API Primary First if GEMINI_API_KEY is present
  if (geminiApiKey) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\n${userContent}\n\nOutput strictly valid JSON.` }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return parsed;
        }
      } else {
        console.warn("Gemini API HTTP status:", geminiRes.status, await geminiRes.text());
      }
    } catch (geminiErr) {
      console.warn("Gemini API call failed, attempting OpenAI fallback:", geminiErr);
    }
  }

  // 2. Fallback to OpenAI if Gemini fails or key missing
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (content) return JSON.parse(content);
    } catch (openAiErr) {
      console.warn("OpenAI API call failed, returning deterministic fallback insight:", openAiErr);
    }
  }

  // 3. Final fallback to deterministic JSON schema
  return fallbackJSON;
}
