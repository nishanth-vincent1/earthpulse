import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 300;

type USGSFeature = {
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

type EMSCFeature = {
  properties: {
    unid?: string;
    source_id?: string;
    lat: number;
    lon: number;
    depth?: number;
    mag: number;
    magtype?: string;
    time: string;
    flynn_region?: string;
    auth?: string;
    evtype?: string;
  };
  geometry: { coordinates: [number, number, number] };
};

type Quake = {
  id: string;
  mag: number;
  place: string;
  time: number;
  url: string;
  detail?: string;
  lng: number;
  lat: number;
  depth: number;
  felt?: number | null;
  cdi?: number | null;
  mmi?: number | null;
  alert?: string | null;
  status?: string | null;
  tsunami?: boolean;
  sig?: number | null;
  magType?: string | null;
  type?: string;
  nst?: number | null;
  source: "usgs" | "emsc";
  agency?: string | null;
};

async function fetchUSGS(): Promise<Quake[]> {
  try {
    const r = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
      { next: { revalidate: 300 } },
    );
    if (!r.ok) return [];
    const data = (await r.json()) as { features: USGSFeature[] };
    return data.features.map((f) => ({
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
      source: "usgs" as const,
      agency: "USGS",
    }));
  } catch {
    return [];
  }
}

async function fetchEMSC(): Promise<Quake[]> {
  try {
    const start = new Date(Date.now() - 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 19);
    const r = await fetch(
      `https://www.seismicportal.eu/fdsnws/event/1/query?starttime=${start}&minmagnitude=2.5&format=json&limit=500`,
      {
        next: { revalidate: 300 },
        headers: { Accept: "application/json" },
      },
    );
    if (!r.ok) return [];
    const data = (await r.json()) as { features: EMSCFeature[] };
    return data.features.map((f) => {
      const p = f.properties;
      const id = p.unid ?? p.source_id ?? `emsc-${p.time}-${p.lat}-${p.lon}`;
      const region = p.flynn_region
        ? p.flynn_region
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : "Unknown region";
      return {
        id: `emsc-${id}`,
        mag: p.mag,
        place: region,
        time: new Date(p.time).getTime(),
        url: `https://www.emsc-csem.org/Earthquake/earthquake.php?id=${p.unid ?? p.source_id ?? ""}`,
        lng: p.lon,
        lat: p.lat,
        depth: p.depth ?? 0,
        magType: p.magtype ?? null,
        type: p.evtype === "ke" ? "earthquake" : (p.evtype ?? "earthquake"),
        source: "emsc" as const,
        agency: p.auth ?? "EMSC",
        // EMSC doesn't provide these fields — leave null so UI hides badges
        felt: null,
        cdi: null,
        mmi: null,
        alert: null,
        status: null,
        tsunami: false,
        sig: null,
        nst: null,
      };
    });
  } catch {
    return [];
  }
}

function dedupe(a: Quake[], b: Quake[]): Quake[] {
  // Prefer USGS when both report the same event.
  // Two quakes are the "same" if within ~80km AND ~3min AND magnitude within 0.5.
  const result: Quake[] = [...a];
  for (const q of b) {
    const dup = a.find((u) => {
      const dt = Math.abs(u.time - q.time);
      if (dt > 3 * 60_000) return false;
      const dLat = Math.abs(u.lat - q.lat);
      const dLng = Math.abs(u.lng - q.lng);
      if (dLat > 1.5 || dLng > 1.5) return false;
      const km =
        Math.sqrt(dLat * dLat + dLng * dLng) * 111 *
        Math.cos((u.lat * Math.PI) / 180);
      if (km > 80) return false;
      if (Math.abs(u.mag - q.mag) > 0.5) return false;
      return true;
    });
    if (!dup) result.push(q);
  }
  return result;
}

export async function GET() {
  const [usgs, emsc] = await Promise.all([fetchUSGS(), fetchEMSC()]);
  const quakes = dedupe(usgs, emsc).sort((a, b) => b.time - a.time);
  return NextResponse.json({
    quakes,
    counts: { usgs: usgs.length, emsc: emsc.length, merged: quakes.length },
  });
}
