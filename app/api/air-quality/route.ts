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

type OpenAQResult = {
  datetime: { utc: string };
  value: number;
  coordinates: { latitude: number; longitude: number };
  sensorsId: number;
  locationsId: number;
};

const BOUNDS: Array<[number, number, number, number]> = [
  [-90, -180, 0, 0],
  [-90, 0, 0, 180],
  [0, -180, 90, 0],
  [0, 0, 90, 180],
];

// EPA AQI breakpoints for PM2.5 (µg/m³ → AQI 0–500)
const PM25_BREAKPOINTS: Array<[number, number, number, number]> = [
  [0.0, 12.0, 0, 50],
  [12.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 150.4, 151, 200],
  [150.5, 250.4, 201, 300],
  [250.5, 500.4, 301, 500],
];

function pm25ToAQI(pm25: number): number | null {
  if (pm25 < 0 || !Number.isFinite(pm25)) return null;
  for (const [cLow, cHigh, aLow, aHigh] of PM25_BREAKPOINTS) {
    if (pm25 >= cLow && pm25 <= cHigh) {
      return Math.round(
        ((aHigh - aLow) / (cHigh - cLow)) * (pm25 - cLow) + aLow,
      );
    }
  }
  return pm25 > 500 ? 500 : null;
}

type OutStation = {
  id: string;
  uid: number;
  name: string;
  lat: number;
  lng: number;
  aqi: number;
  time: string | null;
  severity: string;
  color: string;
  source: "aqicn" | "openaq";
};

async function fetchAqicn(token: string): Promise<OutStation[]> {
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

  return deduped
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
        source: "aqicn" as const,
      };
    });
}

async function fetchOpenAQ(key: string): Promise<OutStation[]> {
  try {
    // /v3/parameters/2/latest returns latest PM2.5 measurements across all stations
    const r = await fetch(
      "https://api.openaq.org/v3/parameters/2/latest?limit=1000",
      {
        headers: { "X-API-Key": key, Accept: "application/json" },
        next: { revalidate: 600 },
      },
    );
    if (!r.ok) return [];
    const data = (await r.json()) as { results?: OpenAQResult[] };
    const now = Date.now();
    const maxAge = 24 * 3600 * 1000;
    const out: OutStation[] = [];
    for (const m of data.results ?? []) {
      const ts = new Date(m.datetime.utc).getTime();
      if (Number.isNaN(ts) || now - ts > maxAge) continue;
      if (m.value < 0) continue;
      const aqi = pm25ToAQI(m.value);
      if (aqi == null) continue;
      out.push({
        id: `openaq-${m.locationsId}`,
        uid: m.locationsId,
        name: `Station ${m.locationsId}`,
        lat: m.coordinates.latitude,
        lng: m.coordinates.longitude,
        aqi,
        time: m.datetime.utc,
        severity: aqiSeverity(aqi),
        color: aqiColor(aqi),
        source: "openaq" as const,
      });
    }
    return out;
  } catch {
    return [];
  }
}

function dedupeByProximity(stations: OutStation[]): OutStation[] {
  // Two stations within ~3km are considered duplicates; prefer AQICN
  // (named, often AQI-native) over OpenAQ.
  const result: OutStation[] = [];
  const grid = new Map<string, OutStation>();
  const sorted = [...stations].sort((a) =>
    a.source === "aqicn" ? -1 : 1,
  );
  for (const s of sorted) {
    const key = `${Math.round(s.lat * 30)}-${Math.round(s.lng * 30)}`;
    if (!grid.has(key)) {
      grid.set(key, s);
      result.push(s);
    }
  }
  return result;
}

export async function GET() {
  const aqicnToken = process.env.WAQI_TOKEN;
  const openaqKey = process.env.OPENAQ_API_KEY;

  if (!aqicnToken && !openaqKey) {
    return NextResponse.json({ stations: [], needsKey: true });
  }

  const [aqicnStations, openaqStations] = await Promise.all([
    aqicnToken ? fetchAqicn(aqicnToken) : Promise.resolve([]),
    openaqKey ? fetchOpenAQ(openaqKey) : Promise.resolve([]),
  ]);

  const merged = dedupeByProximity([...aqicnStations, ...openaqStations]);
  const max = 600;
  const sampled =
    merged.length > max
      ? merged.sort((a, b) => b.aqi - a.aqi).slice(0, max)
      : merged;

  return NextResponse.json({
    stations: sampled,
    total: merged.length,
    counts: {
      aqicn: aqicnStations.length,
      openaq: openaqStations.length,
      merged: merged.length,
    },
  });
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
