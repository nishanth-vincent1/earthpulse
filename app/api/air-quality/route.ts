import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 600;

type AQIStation = {
  lat: number;
  lon: number;
  uid: number;
  aqi: string;
  station: { name: string; time?: string };
};

const BOUNDS: Array<[number, number, number, number]> = [
  [-90, -180, 0, 0],
  [-90, 0, 0, 180],
  [0, -180, 90, 0],
  [0, 0, 90, 180],
];

export async function GET() {
  const token = process.env.WAQI_TOKEN;
  if (!token) {
    return NextResponse.json({ stations: [], needsKey: true });
  }

  try {
    const responses = await Promise.all(
      BOUNDS.map(async ([minLat, minLng, maxLat, maxLng]) => {
        const url = `https://api.waqi.info/map/bounds/?latlng=${minLat},${minLng},${maxLat},${maxLng}&token=${token}`;
        const r = await fetch(url, { next: { revalidate: 600 } });
        if (!r.ok) return [];
        const d = (await r.json()) as { status: string; data?: AQIStation[] };
        if (d.status !== "ok") return [];
        return d.data ?? [];
      }),
    );

    const all = responses.flat();
    const seen = new Set<number>();
    const deduped: AQIStation[] = [];
    for (const s of all) {
      if (seen.has(s.uid)) continue;
      seen.add(s.uid);
      deduped.push(s);
    }

    const stations = deduped
      .filter((s) => {
        const a = parseInt(s.aqi, 10);
        return !Number.isNaN(a);
      })
      .map((s) => {
        const aqi = parseInt(s.aqi, 10);
        return {
          id: `aqi-${s.uid}`,
          uid: s.uid,
          name: s.station.name,
          lat: s.lat,
          lng: s.lon,
          aqi,
          time: s.station.time ?? null,
          severity: aqiSeverity(aqi),
          color: aqiColor(aqi),
        };
      });

    const max = 500;
    const sampled =
      stations.length > max
        ? stations
            .sort((a, b) => b.aqi - a.aqi)
            .slice(0, max)
        : stations;

    return NextResponse.json({
      stations: sampled,
      total: stations.length,
    });
  } catch {
    return NextResponse.json({ stations: [] });
  }
}

function aqiSeverity(a: number): string {
  if (a <= 50) return "Good";
  if (a <= 100) return "Moderate";
  if (a <= 150) return "Unhealthy for sensitive groups";
  if (a <= 200) return "Unhealthy";
  if (a <= 300) return "Very unhealthy";
  return "Hazardous";
}

function aqiColor(a: number): string {
  if (a <= 50) return "#7ad36b";
  if (a <= 100) return "#ffe16a";
  if (a <= 150) return "#ff9b3d";
  if (a <= 200) return "#ff5050";
  if (a <= 300) return "#a872c6";
  return "#7e1a1a";
}
