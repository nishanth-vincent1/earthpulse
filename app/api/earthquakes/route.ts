import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 300;

type Feature = {
  id: string;
  properties: { mag: number; place: string; time: number; url: string };
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
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    depth: f.geometry.coordinates[2],
  }));

  return NextResponse.json({ quakes });
}
