import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 300;

type Feature = {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    detail?: string;
    felt?: number | null;
    cdi?: number | null;
    mmi?: number | null;
    alert?: string | null;
    status?: string;
    tsunami?: number;
    sig?: number;
    magType?: string;
    type?: string;
    nst?: number | null;
  };
  geometry: { coordinates: [number, number, number] };
};

export async function GET() {
  const r = await fetch(
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
    { next: { revalidate: 300 } },
  );

  if (!r.ok) return NextResponse.json({ quakes: [] });

  const data = (await r.json()) as { features: Feature[] };

  const quakes = data.features.map((f) => ({
    id: f.id,
    mag: f.properties.mag,
    place: f.properties.place,
    time: f.properties.time,
    url: f.properties.url,
    detail: f.properties.detail,
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    depth: f.geometry.coordinates[2],
    felt: f.properties.felt ?? null,
    cdi: f.properties.cdi ?? null,
    mmi: f.properties.mmi ?? null,
    alert: f.properties.alert ?? null,
    status: f.properties.status ?? null,
    tsunami: f.properties.tsunami === 1,
    sig: f.properties.sig ?? null,
    magType: f.properties.magType ?? null,
    type: f.properties.type ?? "earthquake",
    nst: f.properties.nst ?? null,
  }));

  return NextResponse.json({ quakes });
}
