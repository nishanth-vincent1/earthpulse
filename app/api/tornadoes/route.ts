import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 60;

type Feature = {
  type: "Feature";
  properties: {
    id: string;
    event: string;
    severity: string;
    headline: string;
    description: string;
    instruction: string | null;
    areaDesc: string;
    sent: string;
    effective: string;
    expires: string;
    senderName: string;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon" | null;
    coordinates: number[][][] | number[][][][];
  } | null;
};

function polygonCentroid(ring: number[][]): [number, number] | null {
  if (!ring || ring.length === 0) return null;
  let sx = 0;
  let sy = 0;
  for (const [x, y] of ring) {
    sx += x;
    sy += y;
  }
  return [sy / ring.length, sx / ring.length];
}

function severityColor(event: string, severity: string): string {
  if (event.toLowerCase().includes("warning")) {
    return severity === "Extreme" ? "#9c27e3" : "#ff3030";
  }
  return "#ff9b3d";
}

export async function GET() {
  try {
    const url =
      "https://api.weather.gov/alerts/active?event=Tornado%20Warning,Tornado%20Watch";
    const r = await fetch(url, {
      headers: {
        "User-Agent": "earthpulse (https://earthpulse.app)",
        Accept: "application/geo+json",
      },
      next: { revalidate: 60 },
    });
    if (!r.ok) return NextResponse.json({ tornadoes: [] });
    const data = (await r.json()) as { features: Feature[] };

    const tornadoes = (data.features ?? [])
      .map((f) => {
        const g = f.geometry;
        let center: [number, number] | null = null;
        let polygon: number[][] | null = null;
        if (g?.type === "Polygon") {
          const ring = (g.coordinates as number[][][])[0];
          center = polygonCentroid(ring);
          polygon = ring;
        } else if (g?.type === "MultiPolygon") {
          const first = (g.coordinates as number[][][][])[0]?.[0];
          if (first) {
            center = polygonCentroid(first);
            polygon = first;
          }
        }
        if (!center) return null;
        const isWarning = f.properties.event
          .toLowerCase()
          .includes("warning");
        return {
          id: f.properties.id,
          event: f.properties.event,
          isWarning,
          severity: f.properties.severity,
          headline: f.properties.headline,
          description: f.properties.description,
          instruction: f.properties.instruction,
          areaDesc: f.properties.areaDesc,
          sent: f.properties.sent,
          expires: f.properties.expires,
          senderName: f.properties.senderName,
          color: severityColor(f.properties.event, f.properties.severity),
          lat: center[0],
          lng: center[1],
          path: polygon
            ? polygon.map(([x, y]) => [y, x] as [number, number])
            : null,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => Number(b.isWarning) - Number(a.isWarning));

    return NextResponse.json({ tornadoes });
  } catch {
    return NextResponse.json({ tornadoes: [] });
  }
}
