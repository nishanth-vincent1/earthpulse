import { NextResponse } from "next/server";

export const runtime = "nodejs";

let cache: { data: unknown; ts: number } | null = null;
const TTL = 600_000;

async function safeJson<T>(
  url: string,
  headers?: Record<string, string>,
): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: "no-store", headers });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

function dedupeQuakeProximity(
  list: Array<{ time: number; lat: number; lng: number; mag: number }>,
): typeof list {
  const out: typeof list = [];
  for (const q of list) {
    const dup = out.find((u) => {
      if (Math.abs(u.time - q.time) > 3 * 60_000) return false;
      const dLat = Math.abs(u.lat - q.lat);
      const dLng = Math.abs(u.lng - q.lng);
      if (dLat > 1.5 || dLng > 1.5) return false;
      const km =
        Math.sqrt(dLat * dLat + dLng * dLng) *
        111 *
        Math.cos((u.lat * Math.PI) / 180);
      if (km > 80) return false;
      if (Math.abs(u.mag - q.mag) > 0.5) return false;
      return true;
    });
    if (!dup) out.push(q);
  }
  return out;
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < TTL) return NextResponse.json(cache.data);

  const aqicnBounds: Array<[number, number, number, number]> = [
    [-90, -180, 0, 0],
    [-90, 0, 0, 180],
    [0, -180, 90, 0],
    [0, 0, 90, 180],
  ];

  const [usgs, emsc, gdacs, nhc, eonet, firms, aqicnQuadrants, openaq] =
    await Promise.all([
      safeJson<{
        features: Array<{
          properties: { mag: number; time: number };
          geometry: { coordinates: [number, number, number] };
        }>;
      }>(
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
      ),
      safeJson<{
        features: Array<{
          properties: {
            mag: number;
            time: string;
            lat: number;
            lon: number;
          };
        }>;
      }>(
        `https://www.seismicportal.eu/fdsnws/event/1/query?starttime=${new Date(now - 24 * 3600 * 1000).toISOString().slice(0, 19)}&minmagnitude=2.5&format=json&limit=500`,
        { Accept: "application/json" },
      ),
      safeJson<{ features: Array<{ properties: { alertlevel: string } }> }>(
        `https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP?fromDate=${fmtDate(now - 7 * 86400000)}&toDate=${fmtDate(now)}&eventlist=DR;EQ;TC;FL;VO;WF&alertlevel=Green;Orange;Red`,
        {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
          Referer: "https://www.gdacs.org/",
        },
      ),
      safeJson<{
        activeStorms?: Array<{
          intensity?: number;
          intensityMPH?: number;
          classification?: string;
        }>;
      }>("https://www.nhc.noaa.gov/CurrentStorms.json"),
      safeJson<{ events: Array<{ categories: Array<{ title: string }> }> }>(
        "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=15&limit=300",
      ),
      // FIRMS: fetch the raw CSV ourselves and count rows (only with key)
      process.env.NASA_FIRMS_KEY
        ? fetch(
            `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${process.env.NASA_FIRMS_KEY}/VIIRS_NOAA20_NRT/world/2`,
            { cache: "no-store" },
          )
            .then((r) => (r.ok ? r.text() : null))
            .catch(() => null)
        : Promise.resolve(null),
      // AQICN four-quadrant fetch
      process.env.WAQI_TOKEN
        ? Promise.all(
            aqicnBounds.map(async ([a, b, c, d]) => {
              const r = await safeJson<{
                status: string;
                data?: Array<{ aqi: string }>;
              }>(
                `https://api.waqi.info/map/bounds/?latlng=${a},${b},${c},${d}&token=${process.env.WAQI_TOKEN}`,
              );
              return r?.status === "ok" ? (r.data ?? []) : [];
            }),
          )
        : Promise.resolve([] as Array<Array<{ aqi: string }>>),
      process.env.OPENAQ_API_KEY
        ? safeJson<{
            results?: Array<{ datetime: { utc: string }; value: number }>;
          }>(
            "https://api.openaq.org/v3/parameters/2/latest?limit=1000",
            { "X-API-Key": process.env.OPENAQ_API_KEY, Accept: "application/json" },
          )
        : Promise.resolve(null),
    ]);

  // --- Earthquakes (USGS + EMSC merged, M5+ only for stress signal) ---
  const usgsQuakes = (usgs?.features ?? []).map((f) => ({
    time: f.properties.time,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    mag: f.properties.mag,
  }));
  const emscQuakes = (emsc?.features ?? []).map((f) => ({
    time: new Date(f.properties.time).getTime(),
    lat: f.properties.lat,
    lng: f.properties.lon,
    mag: f.properties.mag,
  }));
  const mergedQuakes = dedupeQuakeProximity([...usgsQuakes, ...emscQuakes]);
  const significantQuakes = mergedQuakes.filter((q) => (q.mag ?? 0) >= 5);
  const quakeCount = significantQuakes.length;
  const quakeSum = significantQuakes.reduce(
    (s, q) => s + (q.mag || 0),
    0,
  );

  // --- GDACS disasters ---
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

  // --- Hurricanes (cat 3+ only — 111 mph / 96 kt threshold) ---
  const hurricaneCount = (nhc?.activeStorms ?? []).filter((s) => {
    const mph =
      s.intensityMPH ??
      (typeof s.intensity === "number" ? s.intensity * 1.151 : 0);
    return mph >= 111;
  }).length;

  // --- Wildfires: cluster only SIGNIFICANT FIRMS hot pixels into "fire
  // events" by 1° grid (~111km). Significant = vegetation (type=0),
  // non-low confidence, AND FRP >= 100 MW (large + megafire scale).
  // Drops agricultural burning, small ground fires, and industrial flares.
  let wildfires = 0;
  if (firms) {
    const lines = firms.trim().split(/\r?\n/);
    if (lines.length > 1) {
      const header = lines[0].split(",");
      const iLat = header.indexOf("latitude");
      const iLng = header.indexOf("longitude");
      const iConf = header.indexOf("confidence");
      const iType = header.indexOf("type");
      const iFrp = header.indexOf("frp");
      const clusters = new Set<string>();
      for (let i = 1; i < lines.length; i++) {
        const c = lines[i].split(",");
        if (iConf >= 0 && c[iConf] === "l") continue;
        if (iType >= 0) {
          const t = parseInt(c[iType]);
          if (!Number.isNaN(t) && t !== 0) continue;
        }
        if (iFrp >= 0) {
          const frp = parseFloat(c[iFrp]);
          if (!Number.isNaN(frp) && frp < 100) continue;
        }
        const lat = parseFloat(c[iLat]);
        const lng = parseFloat(c[iLng]);
        if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
        clusters.add(`${Math.round(lat)}-${Math.round(lng)}`);
      }
      wildfires = clusters.size;
    }
  } else {
    const eonetEvents = eonet?.events ?? [];
    for (const e of eonetEvents) {
      if (e.categories?.[0]?.title === "Wildfires") wildfires++;
    }
  }

  // --- Volcanoes + severe storms from EONET (unchanged) ---
  const eonetEvents = eonet?.events ?? [];
  let volcanoes = 0,
    severeStorms = 0;
  for (const e of eonetEvents) {
    const cat = e.categories?.[0]?.title;
    if (cat === "Volcanoes") volcanoes++;
    else if (cat === "Severe Storms") severeStorms++;
  }

  // --- Air quality (AQICN + OpenAQ merged) ---
  const aqicnFlat = (aqicnQuadrants ?? []).flat();
  const aqicnSeen = new Set<string>();
  let waqiUnhealthy = 0;
  let waqiTotal = 0;
  for (const s of aqicnFlat) {
    const a = parseInt(s.aqi, 10);
    if (Number.isNaN(a)) continue;
    const key = `aqicn-${(s as { uid?: number }).uid ?? `${a}-${Math.random()}`}`;
    if (aqicnSeen.has(key)) continue;
    aqicnSeen.add(key);
    waqiTotal++;
    if (a > 100) waqiUnhealthy++;
  }
  if (openaq?.results) {
    const cutoff = now - 24 * 3600 * 1000;
    for (const m of openaq.results) {
      const ts = new Date(m.datetime.utc).getTime();
      if (Number.isNaN(ts) || ts < cutoff) continue;
      if (m.value < 0) continue;
      const aqi = pm25ToAQI(m.value);
      if (aqi == null) continue;
      waqiTotal++;
      if (aqi > 100) waqiUnhealthy++;
    }
  }

  // Score formula: count only significant events as "stress signals".
  // - quakeSum is now sum of M5+ magnitudes only (typically 50-100/day
  //   globally; ΣM 60-150). Weight 0.25 means 100 ΣM → +25.
  // - GDACS contribution: Red + Orange only (Green = background, dropped).
  //   Cap at 25 so 3 red events still register.
  // - Hurricanes: cat 3+ only, each adds 6 (so 1 major hurricane = +6,
  //   2 simultaneous = +12).
  // - Wildfires: clustered + FRP ≥100MW (large+mega). Typical = 50-200
  //   clusters; weight 0.15 → 50 fires +7.5, 200 fires +20 capped.
  // - AQ uses ratio of unhealthy stations (cap +15).
  const score = Math.round(
    Math.max(
      40,
      Math.min(
        180,
        50 +
          Math.min(40, quakeSum * 0.25) +
          Math.min(25, gdacsRed * 7 + gdacsOrange * 3) +
          hurricaneCount * 6 +
          Math.min(20, wildfires * 0.15) +
          volcanoes * 3 +
          severeStorms * 2 +
          (waqiTotal > 0
            ? Math.min(
                15,
                (waqiUnhealthy / Math.max(1, waqiTotal)) * 60,
              )
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

// EPA AQI breakpoints for PM2.5 (µg/m³ → AQI 0–500)
function pm25ToAQI(pm25: number): number | null {
  if (pm25 < 0 || !Number.isFinite(pm25)) return null;
  const bp: Array<[number, number, number, number]> = [
    [0.0, 12.0, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 500.4, 301, 500],
  ];
  for (const [cLow, cHigh, aLow, aHigh] of bp) {
    if (pm25 >= cLow && pm25 <= cHigh) {
      return Math.round(
        ((aHigh - aLow) / (cHigh - cLow)) * (pm25 - cLow) + aLow,
      );
    }
  }
  return pm25 > 500 ? 500 : null;
}
