import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 86400;

type Item = {
  id: number;
  year: number;
  month?: number;
  day?: number;
  name: string;
  location?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  morphology?: string;
  vei?: number;
  deaths?: number;
  deathsTotal?: number;
  damageMillionsDollars?: number;
  damageMillionsDollarsTotal?: number;
  significant?: boolean;
  eruption?: boolean;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : NaN;
  if (Number.isNaN(year) || year < 1500 || year > new Date().getFullYear()) {
    return NextResponse.json({ year: null, eruptions: [] });
  }

  try {
    const url = `https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/volcanoes?minYear=${year}&maxYear=${year}`;
    const r = await fetch(url, { next: { revalidate: 86400 } });
    if (!r.ok) return NextResponse.json({ year, eruptions: [] });
    const data = (await r.json()) as { items: Item[] };

    const eruptions = (data.items ?? [])
      .filter(
        (it) =>
          typeof it.latitude === "number" &&
          typeof it.longitude === "number" &&
          it.eruption !== false,
      )
      .map((it) => ({
        id: `histErupt-${it.id}`,
        name: it.name,
        location: it.location ?? "",
        country: it.country ?? "",
        lat: it.latitude!,
        lng: it.longitude!,
        elevation: it.elevation,
        morphology: it.morphology,
        vei: it.vei,
        deaths: it.deathsTotal ?? it.deaths,
        damageM: it.damageMillionsDollarsTotal ?? it.damageMillionsDollars,
        year: it.year,
        month: it.month,
        day: it.day,
      }))
      .sort(
        (a, b) =>
          (b.vei ?? -1) - (a.vei ?? -1) || (b.deaths ?? 0) - (a.deaths ?? 0),
      );

    return NextResponse.json({ year, eruptions });
  } catch {
    return NextResponse.json({ year, eruptions: [] });
  }
}
