import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

type Body = {
  context: string;
};

const SYSTEM_PROMPT =
  "You are a poetic naturalist narrating a living globe. Given location data, write 2-3 short sentences that weave the facts into a cinematic field note. Specific, sensory, no clichés. Never start with 'Here' or 'In'. No exclamation marks. Present tense.";

async function narrateViaGemini(
  apiKey: string,
  context: string,
): Promise<string | null> {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: context }] }],
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.85,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      },
    );
    if (!r.ok) return null;
    const data = (await r.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    return text || null;
  } catch {
    return null;
  }
}

async function narrateViaClaude(
  apiKey: string,
  context: string,
): Promise<string | null> {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 180,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: context }],
      }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as {
      content?: Array<{ type: string; text: string }>;
    };
    return data.content?.find((c) => c.type === "text")?.text ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const geminiKey =
    process.env.GEMINI_API_KEY || process.env.AI_GATEWAY_API_KEY;
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  if (!geminiKey && !claudeKey) {
    return NextResponse.json({ narration: null, reason: "no-key" });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ narration: null, reason: "bad-body" });
  }
  if (!body.context) {
    return NextResponse.json({ narration: null, reason: "no-context" });
  }

  // Prefer Gemini (free tier); fall back to Claude.
  if (geminiKey) {
    const text = await narrateViaGemini(geminiKey, body.context);
    if (text) return NextResponse.json({ narration: text });
  }
  if (claudeKey) {
    const text = await narrateViaClaude(claudeKey, body.context);
    if (text) return NextResponse.json({ narration: text });
  }
  return NextResponse.json({ narration: null, reason: "api-error" });
}
