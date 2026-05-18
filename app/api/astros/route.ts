import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 86400;

export async function GET() {
  try {
    const r = await fetch("http://api.open-notify.org/astros.json", {
      next: { revalidate: 86400 },
    });
    if (!r.ok) return NextResponse.json({ people: [], number: 0 });
    const data = (await r.json()) as {
      number: number;
      people: Array<{ name: string; craft: string }>;
    };
    return NextResponse.json({
      number: data.number,
      people: data.people,
    });
  } catch {
    return NextResponse.json({ people: [], number: 0 });
  }
}
