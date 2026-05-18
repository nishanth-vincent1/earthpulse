import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 1800;

type EONETEvent = {
  id: string;
  title: string;
  categories: Array<{ id: string; title: string }>;
  geometry: Array<{
    date: string;
    type: string;
    coordinates: number[] | number[][];
  }>;
};

type EONETFull = EONETEvent & { link?: string };

async function loadEonetWildfires(): Promise<
  Array<{
    lat: number;
    lng: number;
    bright: number;
    frp: number;
    title?: string;
    date?: string;
    link?: string;
    id?: string;
  }>
> {
  try {
    const r = await fetch(
      "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=15&limit=200&category=wildfires",
      { next: { revalidate: 600 } },
    );
    if (!r.ok) return [];
    const data = (await r.json()) as { events: EONETFull[] };
    const out: Array<{
      lat: number;
      lng: number;
      bright: number;
      frp: number;
      title?: string;
      date?: string;
      link?: string;
      id?: string;
    }> = [];
    for (const e of data.events) {
      const last = e.geometry[e.geometry.length - 1];
      if (last?.type !== "Point") continue;
      const [lng, lat] = last.coordinates as number[];
      out.push({
        lat,
        lng,
        bright: 320,
        frp: 50,
        title: e.title,
        date: last.date,
        link: e.link,
        id: e.id,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export async function GET() {
  const key = process.env.NASA_FIRMS_KEY;

  if (!key) {
    const fires = await loadEonetWildfires();
    return NextResponse.json({
      fires,
      total: fires.length,
      needsKey: true,
      source: "eonet-fallback",
    });
  }

  try {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/VIIRS_SNPP_NRT/world/1`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) {
      const fires = await loadEonetWildfires();
      return NextResponse.json({
        fires,
        total: fires.length,
        source: "eonet-fallback",
      });
    }
    const csv = await r.text();
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length < 2) {
      const fires = await loadEonetWildfires();
      return NextResponse.json({
        fires,
        total: fires.length,
        source: "eonet-fallback",
      });
    }

    const header = lines[0].split(",");
    const idxLat = header.indexOf("latitude");
    const idxLng = header.indexOf("longitude");
    const idxBright = header.indexOf("bright_ti4");
    const idxFrp = header.indexOf("frp");
    const idxConf = header.indexOf("confidence");

    const all: Array<{ lat: number; lng: number; bright: number; frp: number }> = [];
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(",");
      if (c[idxConf] === "l") continue;
      const lat = parseFloat(c[idxLat]);
      const lng = parseFloat(c[idxLng]);
      const bright = parseFloat(c[idxBright]);
      const frp = parseFloat(c[idxFrp]);
      if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
      all.push({ lat, lng, bright, frp });
    }

    const max = 500;
    const sampled =
      all.length > max
        ? all.filter((_, i) => i % Math.ceil(all.length / max) === 0)
        : all;

    return NextResponse.json({
      fires: sampled,
      total: all.length,
      source: "firms",
    });
  } catch {
    const fires = await loadEonetWildfires();
    return NextResponse.json({
      fires,
      total: fires.length,
      source: "eonet-fallback",
    });
  }
}
