import { NextResponse } from "next/server";

export const runtime = "nodejs";

let cache: { data: unknown; ts: number } | null = null;
const TTL = 600_000;

async function safeJson<T>(url: string, headers?: Record<string, string>): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: "no-store", headers });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < TTL) return NextResponse.json(cache.data);

  const [usgs, gdacs, nhc, eonet, waqi] = await Promise.all([
    safeJson<{
      features: Array<{ properties: { mag: number } }>;
    }>(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
    ),
    safeJson<{ features: Array<{ properties: { alertlevel: string } }> }>(
      `https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP?fromDate=${fmtDate(now - 7 * 86400000)}&toDate=${fmtDate(now)}&eventlist=DR;EQ;TC;FL;VO;WF&alertlevel=Green;Orange;Red`,
    ),
    safeJson<{ activeStorms?: unknown[] }>(
      "https://www.nhc.noaa.gov/CurrentStorms.json",
    ),
    safeJson<{
      events: Array<{ categories: Array<{ title: string }> }>;
    }>(
      "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=15&limit=300",
    ),
    process.env.WAQI_TOKEN
      ? safeJson<{
          status: string;
          data?: Array<{ aqi: string }>;
        }>(
          `https://api.waqi.info/map/bounds/?latlng=-90,-180,90,180&token=${process.env.WAQI_TOKEN}`,
        )
      : Promise.resolve(null),
  ]);

  const quakes = usgs?.features ?? [];
  const quakeCount = quakes.length;
  const quakeSum = quakes.reduce((s, f) => s + (f.properties.mag || 0), 0);

  const gdacsList = gdacs?.features ?? [];
  let gdacsRed = 0,
    gdacsOrange = 0,
    gdacsGreen = 0;
  for (const f of gdacsList) {
    const a = f.properties.alertlevel;
    if (a === "Red") gdacsRed++;
    else if (a === "Orange") gdacsOrange++;
    else if (a === "Green") gdacsGreen++;
  }

  const hurricaneCount = nhc?.activeStorms?.length ?? 0;

  const eonetEvents = eonet?.events ?? [];
  let wildfires = 0,
    volcanoes = 0,
    severeStorms = 0;
  for (const e of eonetEvents) {
    const cat = e.categories?.[0]?.title;
    if (cat === "Wildfires") wildfires++;
    else if (cat === "Volcanoes") volcanoes++;
    else if (cat === "Severe Storms") severeStorms++;
  }

  let waqiUnhealthy = 0;
  let waqiTotal = 0;
  if (waqi?.status === "ok" && waqi.data) {
    waqiTotal = waqi.data.length;
    for (const s of waqi.data) {
      const a = parseInt(s.aqi, 10);
      if (!Number.isNaN(a) && a > 100) waqiUnhealthy++;
    }
  }

  const score = Math.round(
    Math.max(
      40,
      Math.min(
        180,
        50 +
          Math.min(40, quakeSum * 0.15) +
          Math.min(20, gdacsRed * 5 + gdacsOrange * 2 + gdacsGreen * 0.2) +
          hurricaneCount * 5 +
          Math.min(20, wildfires * 0.3) +
          volcanoes * 3 +
          severeStorms * 2 +
          (waqiTotal > 0
            ? Math.min(15, (waqiUnhealthy / Math.max(1, waqiTotal)) * 60)
            : 0),
      ),
    ),
  );

  const severity =
    score >= 130 ? "red" : score >= 90 ? "orange" : "green";
  const color =
    severity === "red"
      ? "#ff3030"
      : severity === "orange"
        ? "#ff9b3d"
        : "#7ad36b";

  const body = {
    score,
    severity,
    color,
    signals: {
      quakeCount,
      quakeSum: Math.round(quakeSum * 10) / 10,
      gdacsRed,
      gdacsOrange,
      gdacsGreen,
      hurricaneCount,
      wildfires,
      volcanoes,
      severeStorms,
      waqiUnhealthy,
      waqiTotal,
    },
    ts: now,
  };
  cache = { data: body, ts: now };
  return NextResponse.json(body);
}

function fmtDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
