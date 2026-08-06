import OpenAI from "openai";

const openAiApiKey = process.env.OPENAI_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

export const openai = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

/**
 * Primary AI Generator: Accepts any valid Gemini key format (AIza... or AQ...), falls back to OpenAI, then deterministic fallback.
 */
export async function generateModuleInsight(
  systemPrompt: string,
  userContent: string,
  fallbackJSON: any
): Promise<any> {

  // 1. Try Gemini API first if GEMINI_API_KEY exists
  if (geminiApiKey && geminiApiKey.trim() !== "") {
    try {
      console.log("[AI] Calling Gemini 1.5 Flash API...");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // If token starts with AQ. (OAuth / Bearer token), pass Authorization header too
      if (geminiApiKey.startsWith("AQ.") || geminiApiKey.startsWith("ya29.")) {
        headers["Authorization"] = `Bearer ${geminiApiKey}`;
      }

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers,
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
          console.log("[AI] Gemini 1.5 Flash response received successfully.");
          return JSON.parse(rawText);
        }
      } else {
        const errText = await geminiRes.text();
        console.warn("[AI] Gemini API HTTP error:", geminiRes.status, errText);
      }
    } catch (geminiErr) {
      console.warn("[AI] Gemini API call failed:", geminiErr);
    }
  }

  // 2. Try OpenAI fallback if Gemini fails or key is missing
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

  // 3. Final fallback to deterministic JSON schema
  console.warn("[AI] All AI providers failed or unavailable. Using question-aware deterministic fallback.");
  return fallbackJSON;
}
