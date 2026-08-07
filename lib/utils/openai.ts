import OpenAI from "openai";

const openAiApiKey = process.env.OPENAI_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

export const openai = openAiApiKey && openAiApiKey.trim() !== "" ? new OpenAI({ apiKey: openAiApiKey }) : null;

export interface ProviderLog {
  provider: string;
  latencyMs: number;
  success: boolean;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  reason: string;
}

/**
 * Multi-Provider AI Generator:
 * Strict Sequential Pipeline: Groq (Llama 3.3 70b) -> Gemini 1.5 Flash -> OpenAI GPT-4o-mini -> Deterministic Engine
 */
export async function generateModuleInsight(
  systemPrompt: string,
  userContent: string,
  fallbackJSON: any
): Promise<any> {
  const providerLogs: ProviderLog[] = [];

  // Helper to log provider telemetry
  const recordLog = (provider: string, startTime: number, status: "SUCCESS" | "FAILED" | "SKIPPED", reason: string) => {
    const latencyMs = Math.round(performance.now() - startTime);
    const success = status === "SUCCESS";
    const logItem: ProviderLog = { provider, latencyMs, success, status, reason };
    providerLogs.push(logItem);
    console.log(`[AI Provider Pipeline] Provider: ${provider} | Status: ${status} | Latency: ${latencyMs}ms | Reason: ${reason}`);
  };

  // ---------------------------------------------------------------------------
  // 1. GROQ API (llama-3.3-70b-versatile) — 100% Free & Ultra Fast
  // ---------------------------------------------------------------------------
  const groqStartTime = performance.now();
  if (groqApiKey && groqApiKey.trim() !== "") {
    try {
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
        signal: AbortSignal.timeout(8000), // 8-second strict timeout limit
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const content = groqData.choices?.[0]?.message?.content;
        if (content) {
          try {
            const parsed = JSON.parse(content);
            recordLog("Groq (llama-3.3-70b-versatile)", groqStartTime, "SUCCESS", "Valid JSON response received");
            return parsed;
          } catch (jsonErr: any) {
            recordLog("Groq (llama-3.3-70b-versatile)", groqStartTime, "FAILED", `JSON parse error: ${jsonErr.message}`);
          }
        } else {
          recordLog("Groq (llama-3.3-70b-versatile)", groqStartTime, "FAILED", "Empty content in response body");
        }
      } else {
        const status = groqRes.status;
        const errReason = status === 401 ? "401 Unauthorized (Invalid GROQ_API_KEY)" : status === 429 ? "429 Rate Limit Exceeded" : `${status} HTTP Error`;
        recordLog("Groq (llama-3.3-70b-versatile)", groqStartTime, "FAILED", errReason);
      }
    } catch (groqErr: any) {
      const isTimeout = groqErr.name === "AbortError" || groqErr.name === "TimeoutError";
      const reason = isTimeout ? "Network Timeout (>8s limit reached)" : `Network Exception: ${groqErr.message || groqErr}`;
      recordLog("Groq (llama-3.3-70b-versatile)", groqStartTime, "FAILED", reason);
    }
  } else {
    recordLog("Groq (llama-3.3-70b-versatile)", groqStartTime, "SKIPPED", "GROQ_API_KEY missing or empty");
  }

  // ---------------------------------------------------------------------------
  // 2. GEMINI API (gemini-1.5-flash)
  // ---------------------------------------------------------------------------
  const geminiStartTime = performance.now();
  if (geminiApiKey && geminiApiKey.trim() !== "") {
    try {
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
          signal: AbortSignal.timeout(8000), // 8-second strict timeout limit
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          try {
            const parsed = JSON.parse(rawText);
            recordLog("Gemini (gemini-1.5-flash)", geminiStartTime, "SUCCESS", "Valid JSON response received");
            return parsed;
          } catch (jsonErr: any) {
            recordLog("Gemini (gemini-1.5-flash)", geminiStartTime, "FAILED", `JSON parse error: ${jsonErr.message}`);
          }
        } else {
          recordLog("Gemini (gemini-1.5-flash)", geminiStartTime, "FAILED", "Empty content in response candidate");
        }
      } else {
        const status = geminiRes.status;
        const errReason = status === 401 ? "401 Unauthorized (Invalid GEMINI_API_KEY)" : status === 429 ? "429 Rate Limit Exceeded" : `${status} HTTP Error`;
        recordLog("Gemini (gemini-1.5-flash)", geminiStartTime, "FAILED", errReason);
      }
    } catch (geminiErr: any) {
      const isTimeout = geminiErr.name === "AbortError" || geminiErr.name === "TimeoutError";
      const reason = isTimeout ? "Network Timeout (>8s limit reached)" : `Network Exception: ${geminiErr.message || geminiErr}`;
      recordLog("Gemini (gemini-1.5-flash)", geminiStartTime, "FAILED", reason);
    }
  } else {
    recordLog("Gemini (gemini-1.5-flash)", geminiStartTime, "SKIPPED", "GEMINI_API_KEY missing or empty");
  }

  // ---------------------------------------------------------------------------
  // 3. OPENAI API (gpt-4o-mini)
  // ---------------------------------------------------------------------------
  const openAiStartTime = performance.now();
  if (openai) {
    try {
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
        try {
          const parsed = JSON.parse(content);
          recordLog("OpenAI (gpt-4o-mini)", openAiStartTime, "SUCCESS", "Valid JSON response received");
          return parsed;
        } catch (jsonErr: any) {
          recordLog("OpenAI (gpt-4o-mini)", openAiStartTime, "FAILED", `JSON parse error: ${jsonErr.message}`);
        }
      } else {
        recordLog("OpenAI (gpt-4o-mini)", openAiStartTime, "FAILED", "Empty content in choices[0]");
      }
    } catch (openAiErr: any) {
      const status = openAiErr?.status || openAiErr?.statusCode;
      const reason = status === 401 ? "401 Unauthorized (Invalid OPENAI_API_KEY)" : status === 429 ? "429 Rate Limit Exceeded" : `OpenAI Error: ${openAiErr.message || openAiErr}`;
      recordLog("OpenAI (gpt-4o-mini)", openAiStartTime, "FAILED", reason);
    }
  } else {
    recordLog("OpenAI (gpt-4o-mini)", openAiStartTime, "SKIPPED", "OPENAI_API_KEY missing or empty");
  }

  // ---------------------------------------------------------------------------
  // 4. DETERMINISTIC ENGINE FALLBACK
  // ---------------------------------------------------------------------------
  const fallbackStartTime = performance.now();
  recordLog("Deterministic Engine", fallbackStartTime, "SUCCESS", "Safe Question-Aware Schema Fallback activated");
  return fallbackJSON;
}
