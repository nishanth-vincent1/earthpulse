import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 600;

const TYPE_NAME: Record<string, string> = {
  EQ: "Earthquake",
  TC: "Tropical Cyclone",
  FL: "Flood",
  VO: "Volcano",
  DR: "Drought",
  WF: "Wildfire",
};

const ALERT_COLOR: Record<string, string> = {
  Red: "#ff3b3b",
  Orange: "#ff9b3d",
  Green: "#7ad36b",
};

type Feature = {
  geometry: { coordinates: [number, number] };
  properties: {
    eventid: number | string;
    eventtype: string;
    name: string;
    alertlevel: string;
    fromdate: string;
    todate: string;
    country?: string;
    htmldescription?: string;
    description?: string;
  };
};

export async function GET() {
  try {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const url = `https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP?fromDate=${fmt(weekAgo)}&toDate=${fmt(today)}&eventlist=DR;EQ;TC;FL;VO;WF&alertlevel=Green;Orange;Red`;
    const r = await fetch(url, { next: { revalidate: 600 } });
    if (!r.ok) return NextResponse.json({ disasters: [] });
    const data = (await r.json()) as { features: Feature[] };

    const seen = new Set<string>();
    const disasters = data.features
      .map((f) => {
        const p = f.properties;
        const key = `${p.eventid}-${p.eventtype}`;
        if (seen.has(key)) return null;
        seen.add(key);
        return {
          id: String(p.eventid),
          type: p.eventtype,
          typeName: TYPE_NAME[p.eventtype] ?? p.eventtype,
          name: p.name,
          alert: p.alertlevel,
          color: ALERT_COLOR[p.alertlevel] ?? "#cccccc",
          country: p.country ?? "",
          fromDate: p.fromdate,
          toDate: p.todate,
          description: stripHtml(p.htmldescription ?? p.description ?? ""),
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);

    return NextResponse.json({ disasters });
  } catch {
    return NextResponse.json({ disasters: [] });
  }
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}
