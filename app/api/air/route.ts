import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  const url = `https://api.openaq.org/v2/latest?coordinates=${lat},${lng}&radius=100000&limit=1&order_by=distance`;

  try {
    const r = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 600 },
    });

    if (!r.ok) return NextResponse.json({ measurements: [] });

    const data = (await r.json()) as {
      results?: Array<{
        location: string;
        city: string | null;
        country: string;
        measurements: Array<{ parameter: string; value: number; unit: string }>;
      }>;
    };

    const first = data.results?.[0];
    if (!first) return NextResponse.json({ measurements: [] });

    return NextResponse.json({
      location: first.location,
      city: first.city,
      country: first.country,
      measurements: first.measurements.slice(0, 6),
    });
  } catch {
    return NextResponse.json({ measurements: [] });
  }
}
