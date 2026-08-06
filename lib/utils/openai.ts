import OpenAI from "openai";

const openAiApiKey = process.env.OPENAI_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

export const openai = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

/**
 * Multi-Provider AI Generator:
 * Tries Groq (if key exists) -> Gemini 1.5 -> OpenAI -> Question-aware Fallback.
 */
export async function generateModuleInsight(
  systemPrompt: string,
  userContent: string,
  fallbackJSON: any
): Promise<any> {

  // 1. Try Groq API first if GROQ_API_KEY exists (100% free & ultra fast)
  if (groqApiKey && groqApiKey.trim() !== "") {
    try {
      console.log("[AI] Calling Groq API (llama-3.3-70b-versatile)...");
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `${userContent}\n\nOutput strictly valid JSON.` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 1200,
        }),
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const content = groqData.choices?.[0]?.message?.content;
        if (content) {
          console.log("[AI] Groq response received successfully.");
          return JSON.parse(content);
        }
      } else {
        const errText = await groqRes.text();
        console.warn("[AI] Groq API error:", groqRes.status, errText);
      }
    } catch (groqErr) {
      console.warn("[AI] Groq API call failed, falling back:", groqErr);
    }
  }

  // 2. Try Gemini API if GEMINI_API_KEY exists
  if (geminiApiKey && geminiApiKey.trim() !== "") {
    try {
      console.log("[AI] Calling Gemini 1.5 Flash API...");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

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

  // 3. Try OpenAI fallback if Gemini/Groq fail or keys missing
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

  // 4. Final fallback to deterministic JSON schema
  console.warn("[AI] All AI providers failed or unavailable. Using question-aware deterministic fallback.");
  return fallbackJSON;
}
