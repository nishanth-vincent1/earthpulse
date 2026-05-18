import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 1800;

type Feature = {
  type: string;
  properties: {
    name: string;
    center: string;
    center_id: number;
    state: string;
    danger?: string;
    travel_advice?: string;
    forecast?: { url?: string };
    off_season?: boolean;
    timezone?: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
};

const DANGER_COLOR: Record<string, string> = {
  low: "#7ad36b",
  moderate: "#ffe16a",
  considerable: "#ff9b3d",
  high: "#ff5050",
  extreme: "#000000",
  "no rating": "#6b7280",
  "off season": "#374151",
};

const DANGER_RANK: Record<string, number> = {
  extreme: 5,
  high: 4,
  considerable: 3,
  moderate: 2,
  low: 1,
  "no rating": 0,
  "off season": 0,
};

function polygonCentroid(coords: number[][][]): [number, number] | null {
  // Take first ring; compute simple average of vertices
  const ring = coords[0];
  if (!ring || ring.length === 0) return null;
  let sumX = 0,
    sumY = 0;
  for (const [x, y] of ring) {
    sumX += x;
    sumY += y;
  }
  return [sumY / ring.length, sumX / ring.length];
}

export async function GET() {
  try {
    const r = await fetch(
      "https://api.avalanche.org/v2/public/products/map-layer",
      { next: { revalidate: 1800 } },
    );
    if (!r.ok) return NextResponse.json({ zones: [] });
    const data = (await r.json()) as { features: Feature[] };

    const zones: Array<{
      id: string;
      name: string;
      center: string;
      state: string;
      danger: string;
      color: string;
      rank: number;
      travelAdvice: string;
      forecastUrl: string | null;
      offSeason: boolean;
      lat: number;
      lng: number;
    }> = [];

    for (const f of data.features) {
      let centroid: [number, number] | null = null;
      if (f.geometry.type === "Polygon") {
        centroid = polygonCentroid(f.geometry.coordinates as number[][][]);
      } else if (f.geometry.type === "MultiPolygon") {
        const first = (f.geometry.coordinates as number[][][][])[0];
        if (first) centroid = polygonCentroid(first);
      }
      if (!centroid) continue;
      const danger = (f.properties.danger ?? "no rating").toLowerCase();
      zones.push({
        id: `aval-${f.properties.center_id}-${f.properties.name}`,
        name: f.properties.name,
        center: f.properties.center,
        state: f.properties.state,
        danger,
        color: DANGER_COLOR[danger] ?? "#6b7280",
        rank: DANGER_RANK[danger] ?? 0,
        travelAdvice: f.properties.travel_advice ?? "",
        forecastUrl: f.properties.forecast?.url ?? null,
        offSeason: !!f.properties.off_season,
        lat: centroid[0],
        lng: centroid[1],
      });
    }

    return NextResponse.json({ zones });
  } catch {
    return NextResponse.json({ zones: [] });
  }
}
