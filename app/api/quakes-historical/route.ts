import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 86400;

type Feature = {
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : NaN;
  if (Number.isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
    return NextResponse.json({ year: null, quakes: [] });
  }

  const minMag = year < 1970 ? 7 : year < 2000 ? 6.5 : 6;

  try {
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${year}-01-01&endtime=${year}-12-31&minmagnitude=${minMag}&limit=400&orderby=magnitude`;
    const r = await fetch(url, { next: { revalidate: 86400 } });
    if (!r.ok) return NextResponse.json({ year, quakes: [] });
    const data = (await r.json()) as { features: Feature[] };

    const quakes = data.features.map((f) => ({
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

    return NextResponse.json({ year, minMag, quakes });
  } catch {
    return NextResponse.json({ year, quakes: [] });
  }
}
