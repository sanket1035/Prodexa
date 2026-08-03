import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

export const openai = apiKey ? new OpenAI({ apiKey }) : null;

/**
 * Helper to execute structured prompt with OpenAI or fallback deterministic response
 */
export async function generateModuleInsight(
  systemPrompt: string,
  userContent: string,
  fallbackJSON: any
): Promise<any> {
  if (!openai) {
    return fallbackJSON;
  }

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
    if (!content) return fallbackJSON;
    return JSON.parse(content);
  } catch (error) {
    console.warn("OpenAI API call failed or timed out, returning fallback insight:", error);
    return fallbackJSON;
  }
}
