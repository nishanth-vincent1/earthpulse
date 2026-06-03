import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
// Cache for 24h since the date doesn't change often
export const revalidate = 86400;

type USGSFeature = {
  id: string;
  properties: { mag: number; place: string; time: number; url: string };
  geometry: { coordinates: [number, number, number] };
};

type DayQuake = {
  id: string;
  year: number;
  mag: number;
  place: string;
  time: number;
  url: string;
  lat: number;
  lng: number;
  depth: number;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  let target: Date;
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    target = new Date(`${dateParam}T00:00:00Z`);
  } else {
    target = new Date();
  }

  const targetMonth = target.getUTCMonth() + 1;
  const targetDay = target.getUTCDate();
  const mm = String(targetMonth).padStart(2, "0");
  const dd = String(targetDay).padStart(2, "0");

  try {
    // One sweep of all M6.5+ events in the past 100 years.
    const startYear = target.getUTCFullYear() - 100;
    const endYear = target.getUTCFullYear() - 1;
    const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startYear}-01-01&endtime=${endYear}-12-31&minmagnitude=6.5&limit=20000&orderby=magnitude`;
    const r = await fetch(usgsUrl, { next: { revalidate: 86400 } });
    if (!r.ok) {
      return NextResponse.json({ date: target.toISOString().slice(0, 10), quakes: [] });
    }
    const data = (await r.json()) as { features: USGSFeature[] };

    const matches: DayQuake[] = [];
    for (const f of data.features) {
      const d = new Date(f.properties.time);
      if (d.getUTCMonth() + 1 !== targetMonth) continue;
      if (d.getUTCDate() !== targetDay) continue;
      matches.push({
        id: f.id,
        year: d.getUTCFullYear(),
        mag: f.properties.mag,
        place: f.properties.place,
        time: f.properties.time,
        url: f.properties.url,
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        depth: f.geometry.coordinates[2],
      });
    }

    matches.sort((a, b) => b.mag - a.mag);

    return NextResponse.json({
      date: `${target.getUTCFullYear()}-${mm}-${dd}`,
      monthDay: `${mm}-${dd}`,
      quakes: matches.slice(0, 50),
      total: matches.length,
    });
  } catch (e) {
    return NextResponse.json(
      { date: target.toISOString().slice(0, 10), quakes: [], error: String(e) },
      { status: 200 },
    );
  }
}
