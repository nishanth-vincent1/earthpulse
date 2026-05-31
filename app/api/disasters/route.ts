import { NextResponse } from "next/server";

export const runtime = "nodejs";
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
    alertscore?: number;
    fromdate: string;
    todate: string;
    country?: string;
    htmldescription?: string;
    description?: string;
    source?: string;
    iscurrent?: boolean;
    severitydata?: {
      severity?: number;
      severitytext?: string;
      severityunit?: string;
    };
    affectedcountries?: Array<{ countryname?: string; iso3?: string }>;
    url?: { report?: string; details?: string };
  };
};

export async function GET() {
  try {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const url = `https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP?fromDate=${fmt(weekAgo)}&toDate=${fmt(today)}&eventlist=DR;EQ;TC;FL;VO;WF&alertlevel=Green;Orange;Red`;
    const r = await fetch(url, {
      next: { revalidate: 600 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.gdacs.org/",
      },
    });
    if (!r.ok) {
      console.error(`disasters: gdacs returned ${r.status}`);
      return NextResponse.json({ disasters: [], error: `upstream ${r.status}` });
    }
    const text = await r.text();
    let data: { features: Feature[] };
    try {
      data = JSON.parse(text);
    } catch {
      console.error(`disasters: gdacs returned non-JSON: ${text.slice(0, 200)}`);
      return NextResponse.json({ disasters: [], error: "non-json upstream" });
    }
    if (!data.features) {
      console.error(`disasters: no features in upstream response`);
      return NextResponse.json({ disasters: [], error: "no features" });
    }

    const seen = new Set<string>();
    const disasters = data.features
      .map((f) => {
        const p = f.properties;
        const key = `${p.eventid}-${p.eventtype}`;
        if (seen.has(key)) return null;
        seen.add(key);
        const sev = p.severitydata;
        const sevText =
          sev?.severitytext && sev.severitytext.trim() !== "Magnitude 0"
            ? `${sev.severitytext.trim()}${sev.severityunit ? ` ${sev.severityunit}` : ""}`.trim()
            : "";
        const affected =
          (p.affectedcountries ?? [])
            .map((c) => c.countryname || c.iso3)
            .filter((c): c is string => !!c)
            .slice(0, 8) ?? [];
        return {
          id: String(p.eventid),
          type: p.eventtype,
          typeName: TYPE_NAME[p.eventtype] ?? p.eventtype,
          name: p.name,
          alert: p.alertlevel,
          alertScore: p.alertscore ?? null,
          color: ALERT_COLOR[p.alertlevel] ?? "#cccccc",
          country: p.country ?? "",
          affectedCountries: affected,
          fromDate: p.fromdate,
          toDate: p.todate,
          description: stripHtml(p.htmldescription ?? p.description ?? ""),
          source: p.source ?? "",
          severityText: sevText,
          isCurrent: p.iscurrent === true,
          reportUrl: p.url?.report ?? "",
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
