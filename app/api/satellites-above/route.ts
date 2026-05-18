import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const CATEGORIES: Array<{ id: number; name: string; emoji: string }> = [
  { id: 52, name: "Starlink", emoji: "🛰" },
  { id: 4, name: "GPS Operational", emoji: "📡" },
  { id: 32, name: "Hubble", emoji: "🔭" },
  { id: 30, name: "Weather", emoji: "🌦" },
];

export async function GET(req: NextRequest) {
  const apiKey = process.env.N2YO_KEY;
  if (!apiKey) {
    return NextResponse.json({ satellites: [], needsKey: true });
  }

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ satellites: [] });
  }

  try {
    const results = await Promise.all(
      CATEGORIES.map(async (cat) => {
        const r = await fetch(
          `https://api.n2yo.com/rest/v1/satellite/above/${lat}/${lng}/0/30/${cat.id}/&apiKey=${apiKey}`,
          { next: { revalidate: 60 } },
        );
        if (!r.ok) return [];
        const data = (await r.json()) as {
          above?: Array<{ satid: number; satname: string; satlat: number; satlng: number; satalt: number }>;
        };
        return (data.above ?? []).slice(0, 8).map((s) => ({
          id: s.satid,
          name: s.satname,
          category: cat.name,
          emoji: cat.emoji,
          lat: s.satlat,
          lng: s.satlng,
          alt: s.satalt,
        }));
      }),
    );

    return NextResponse.json({ satellites: results.flat() });
  } catch {
    return NextResponse.json({ satellites: [] });
  }
}
