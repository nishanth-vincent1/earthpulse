import { NextResponse } from "next/server";

export const runtime = "nodejs";

let cache: { buoys: any[]; ts: number } | null = null;
const TTL = 86_400_000;

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < TTL) {
    return NextResponse.json({ buoys: cache.buoys, total: cache.buoys.length });
  }

  try {
    const r = await fetch("https://www.ndbc.noaa.gov/activestations.xml", {
      cache: "no-store",
    });
    if (!r.ok) return NextResponse.json({ buoys: [], total: 0 });
    const xml = await r.text();

    const stations = Array.from(
      xml.matchAll(
        /<station\s+id="([^"]+)"\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*?name="([^"]*)"[^>]*?owner="([^"]*)"[^>]*?type="([^"]*)"[^>]*?met="([^"]*)"[^>]*?currents="([^"]*)"[^>]*?waterquality="([^"]*)"[^>]*?dart="([^"]*)"/g,
      ),
    )
      .map((m) => ({
        id: m[1],
        lat: parseFloat(m[2]),
        lng: parseFloat(m[3]),
        name: m[4],
        owner: m[5],
        type: m[6],
        met: m[7] === "y",
        currents: m[8] === "y",
        dart: m[10] === "y",
      }))
      .filter(
        (s) =>
          !Number.isNaN(s.lat) &&
          !Number.isNaN(s.lng) &&
          (s.met || s.currents || s.dart),
      );

    const max = 600;
    const sampled =
      stations.length > max
        ? stations.filter((_, i) => i % Math.ceil(stations.length / max) === 0)
        : stations;

    cache = { buoys: sampled, ts: now };
    return NextResponse.json({
      buoys: sampled,
      total: stations.length,
      sampled: sampled.length,
    });
  } catch {
    return NextResponse.json({ buoys: [], total: 0 });
  }
}
