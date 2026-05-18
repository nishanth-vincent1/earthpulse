import { NextRequest, NextResponse } from "next/server";
import { parseBuoyText } from "@/lib/buoy-parse";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id || !/^[A-Za-z0-9]+$/.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    const r = await fetch(`https://www.ndbc.noaa.gov/data/realtime2/${id}.txt`, {
      next: { revalidate: 600 },
    });
    if (!r.ok) return NextResponse.json({ readings: null });
    const text = await r.text();
    const readings = parseBuoyText(text);
    return NextResponse.json({ readings });
  } catch {
    return NextResponse.json({ readings: null });
  }
}
