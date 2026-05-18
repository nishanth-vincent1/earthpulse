import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 300;

type RVResp = {
  host: string;
  radar: { past: Array<{ time: number; path: string }> };
};

export async function GET() {
  try {
    const r = await fetch("https://api.rainviewer.com/public/weather-maps.json", {
      next: { revalidate: 300 },
    });
    if (!r.ok) return NextResponse.json({ frames: [], host: null });
    const data = (await r.json()) as RVResp;

    const host = data.host;
    const frames = (data.radar?.past ?? []).slice(-12).map((f) => ({
      time: f.time * 1000,
      tile0: `${host}${f.path}/256/0/0/0/2/1_1.png`,
      tile1: `${host}${f.path}/512/1/0/0/2/1_1.png`,
    }));

    return NextResponse.json({ frames, host });
  } catch {
    return NextResponse.json({ frames: [], host: null });
  }
}
