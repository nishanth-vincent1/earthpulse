import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

type Body = {
  context: string;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
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
        system:
          "You are a poetic naturalist narrating a living globe. Given location data, write 2-3 short sentences that weave the facts into a cinematic field note. Specific, sensory, no clichés. Never start with 'Here' or 'In'. No exclamation marks. Present tense.",
        messages: [{ role: "user", content: body.context }],
      }),
    });

    if (!r.ok) {
      return NextResponse.json({ narration: null, reason: "api-error" });
    }

    const data = (await r.json()) as {
      content: Array<{ type: string; text: string }>;
    };
    const narration = data.content?.find((c) => c.type === "text")?.text ?? null;
    return NextResponse.json({ narration });
  } catch {
    return NextResponse.json({ narration: null, reason: "exception" });
  }
}
