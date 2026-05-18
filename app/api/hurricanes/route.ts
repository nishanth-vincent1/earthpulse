import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 600;

type Storm = {
  id: string;
  binNumber: string;
  name: string;
  classification: string;
  intensity: string;
  pressure: string;
  lat: number;
  lon: number;
  movementDir: number;
  movementSpeed: number;
};

export async function GET() {
  try {
    const r = await fetch("https://www.nhc.noaa.gov/CurrentStorms.json", {
      next: { revalidate: 600 },
    });
    if (!r.ok) return NextResponse.json({ storms: [] });
    const data = (await r.json()) as { activeStorms?: Storm[] };
    const storms = (data.activeStorms ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      classification: s.classification,
      intensity: s.intensity,
      pressure: s.pressure,
      lat: s.lat,
      lng: s.lon,
      heading: s.movementDir,
      speedKt: s.movementSpeed,
    }));
    return NextResponse.json({ storms });
  } catch {
    return NextResponse.json({ storms: [] });
  }
}
