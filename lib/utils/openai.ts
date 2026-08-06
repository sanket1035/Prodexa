import OpenAI from "openai";

const openAiApiKey = process.env.OPENAI_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

export const openai = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

/**
 * Primary AI Generator: Try OpenAI first (reliable), fall back to Gemini, then deterministic fallback.
 * Gemini key format must start with 'AIza' — other formats (AQ.*) are OAuth tokens, not API keys.
 */
export async function generateModuleInsight(
  systemPrompt: string,
  userContent: string,
  fallbackJSON: any
): Promise<any> {

  // 1. Try OpenAI first — most reliable with JSON mode
  if (openai) {
    try {
      console.log("[AI] Calling OpenAI GPT-4o-mini...");
      const response = await openai.chat.completions.create({
        model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1200,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        console.log("[AI] OpenAI response received.");
        return JSON.parse(content);
      }
    } catch (openAiErr) {
      console.error("[AI] OpenAI API call failed:", openAiErr);
    }
  }

  // 2. Try Gemini API if OpenAI fails and key looks like a valid API key (AIza...)
  if (geminiApiKey && geminiApiKey.startsWith("AIza")) {
    try {
      console.log("[AI] Calling Gemini 1.5 Flash...");
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
              temperature: 0.7,
            },
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          console.log("[AI] Gemini response received.");
          return JSON.parse(rawText);
        }
      } else {
        const errText = await geminiRes.text();
        console.warn("[AI] Gemini API HTTP error:", geminiRes.status, errText);
      }
    } catch (geminiErr) {
      console.warn("[AI] Gemini API call failed:", geminiErr);
    }
  } else if (geminiApiKey) {
    console.warn("[AI] GEMINI_API_KEY appears invalid (must start with AIza). Skipping Gemini.");
  }

  // 3. Final fallback to deterministic JSON schema
  console.warn("[AI] All AI providers failed or unavailable. Using deterministic fallback.");
  return fallbackJSON;
}
