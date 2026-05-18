import { NextResponse } from "next/server";

export const runtime = "edge";

type CableFeature = {
  properties: { id: string; name: string; color: string };
  geometry:
    | { type: "MultiLineString"; coordinates: Array<Array<[number, number]>> }
    | { type: "LineString"; coordinates: Array<[number, number]> };
};

export async function GET() {
  try {
    const r = await fetch(
      "https://www.submarinecablemap.com/api/v3/cable/cable-geo.json",
      { cache: "no-store" },
    );
    if (!r.ok) return NextResponse.json({ cables: [] });
    const data = (await r.json()) as { features: CableFeature[] };

    const cables: Array<{
      id: string;
      name: string;
      color: string;
      path: Array<[number, number]>;
    }> = [];

    for (const f of data.features) {
      const lines: Array<Array<[number, number]>> =
        f.geometry.type === "MultiLineString"
          ? (f.geometry.coordinates as Array<Array<[number, number]>>)
          : [f.geometry.coordinates as Array<[number, number]>];

      for (let i = 0; i < lines.length; i++) {
        const coords = lines[i];
        const stride = Math.max(1, Math.floor(coords.length / 60));
        const path: Array<[number, number]> = [];
        for (let j = 0; j < coords.length; j += stride) {
          const c = coords[j];
          path.push([c[1], c[0]]);
        }
        if (path.length >= 2) {
          cables.push({
            id: `${f.properties.id}-${i}`,
            name: f.properties.name,
            color: f.properties.color || "#7be4ff",
            path,
          });
        }
      }
    }

    return NextResponse.json({ cables, total: cables.length });
  } catch {
    return NextResponse.json({ cables: [] });
  }
}
