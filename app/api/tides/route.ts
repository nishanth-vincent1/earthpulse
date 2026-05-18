import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 86400;

type Station = {
  id: string;
  name: string;
  state?: string;
  lat: number;
  lng: number;
};

export async function GET() {
  try {
    const r = await fetch(
      "https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions",
      { cache: "no-store" },
    );
    if (!r.ok) return NextResponse.json({ stations: [] });
    const data = (await r.json()) as {
      stations: Array<{
        id: string;
        name: string;
        state?: string;
        lat: number;
        lng: number;
      }>;
    };

    const stations: Station[] = (data.stations ?? [])
      .filter((s) => s.lat !== undefined && s.lng !== undefined)
      .map((s) => ({
        id: s.id,
        name: s.name,
        state: s.state,
        lat: s.lat,
        lng: s.lng,
      }));

    const max = 600;
    const sampled =
      stations.length > max
        ? stations.filter((_, i) => i % Math.ceil(stations.length / max) === 0)
        : stations;

    return NextResponse.json({ stations: sampled, total: stations.length });
  } catch {
    return NextResponse.json({ stations: [], total: 0 });
  }
}
