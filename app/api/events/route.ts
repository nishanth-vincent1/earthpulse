import { NextResponse } from "next/server";

export const runtime = "edge";

type EONETEvent = {
  id: string;
  title: string;
  link: string;
  categories: Array<{ id: string; title: string }>;
  geometry: Array<{
    date: string;
    type: string;
    coordinates: number[] | number[][];
  }>;
};

const CATEGORY_COLOR: Record<string, string> = {
  Wildfires: "#ff6a3d",
  Volcanoes: "#ff3b3b",
  "Severe Storms": "#9b8cff",
  "Sea and Lake Ice": "#a3e8ff",
  Drought: "#d6a25e",
  Floods: "#4d8cff",
  Earthquakes: "#ffaa3b",
  Landslides: "#b08060",
  "Manmade Events": "#cccccc",
  "Snow Events": "#ffffff",
  "Temperature Extremes": "#ff90ad",
  "Water Color": "#3dd6c0",
};

export async function GET() {
  const r = await fetch(
    "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=15&limit=120",
    { next: { revalidate: 600 } },
  );

  if (!r.ok) return NextResponse.json({ events: [] });

  const data = (await r.json()) as { events: EONETEvent[] };

  const events = data.events
    .map((e) => {
      const last = e.geometry[e.geometry.length - 1];
      const coords =
        last.type === "Point" ? (last.coordinates as number[]) : null;
      if (!coords) return null;
      const cat = e.categories[0]?.title ?? "Other";
      return {
        id: e.id,
        title: e.title,
        category: cat,
        color: CATEGORY_COLOR[cat] ?? "#cccccc",
        link: e.link,
        date: last.date,
        lng: coords[0],
        lat: coords[1],
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  return NextResponse.json({ events });
}
