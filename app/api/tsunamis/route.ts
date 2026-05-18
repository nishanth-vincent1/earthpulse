import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 300;

const FEEDS = [
  {
    url: "https://www.tsunami.gov/events/xml/PAAQAtom.xml",
    center: "NTWC",
    centerName: "National Tsunami Warning Center · Palmer, AK",
  },
  {
    url: "https://www.tsunami.gov/events/xml/PHEBAtom.xml",
    center: "PTWC",
    centerName: "Pacific Tsunami Warning Center · Honolulu, HI",
  },
];

const SEVERITY_RANK: Record<string, number> = {
  Warning: 4,
  Advisory: 3,
  Watch: 2,
  Information: 1,
};

const SEVERITY_COLOR: Record<string, string> = {
  Warning: "#ff3030",
  Advisory: "#ff7a30",
  Watch: "#ffba30",
  Information: "#7be4ff",
};

type Tsunami = {
  id: string;
  center: string;
  centerName: string;
  title: string;
  category: string;
  rank: number;
  color: string;
  note: string;
  bulletinUrl: string | null;
  sent: string;
  lat: number;
  lng: number;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function pick(re: RegExp, s: string): string | null {
  const m = s.match(re);
  return m ? m[1].trim() : null;
}

function parseEntry(
  entry: string,
  feed: { center: string; centerName: string },
): Tsunami | null {
  const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/, entry);
  const id = pick(/<id[^>]*>([\s\S]*?)<\/id>/, entry);
  const updated = pick(/<updated[^>]*>([\s\S]*?)<\/updated>/, entry);
  const latStr = pick(/<geo:lat[^>]*>([\s\S]*?)<\/geo:lat>/, entry);
  const lngStr = pick(/<geo:long[^>]*>([\s\S]*?)<\/geo:long>/, entry);
  const summaryRaw = pick(/<summary[^>]*>([\s\S]*?)<\/summary>/, entry);
  const summary = summaryRaw ? stripTags(summaryRaw) : "";
  const bulletinUrl = pick(
    /<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/,
    entry,
  );

  if (!title || !id) return null;
  if (!latStr || !lngStr) return null;
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  const titleLower = title.toLowerCase();
  if (
    titleLower.includes("cancel") ||
    titleLower.includes("supersed") ||
    titleLower.includes("test")
  ) {
    return null;
  }

  const categoryMatch = summary.match(/Category:\s*([A-Za-z]+)/);
  const category = categoryMatch ? categoryMatch[1] : "Information";
  const noteMatch = summary.match(/Note:\s*\*?\s*(.+?)(?:Definition:|$)/);
  const note = noteMatch ? noteMatch[1].trim() : "";

  return {
    id,
    center: feed.center,
    centerName: feed.centerName,
    title,
    category,
    rank: SEVERITY_RANK[category] ?? 0,
    color: SEVERITY_COLOR[category] ?? "#9ca3af",
    note,
    bulletinUrl,
    sent: updated ?? new Date().toISOString(),
    lat,
    lng,
  };
}

function parseFeed(
  xml: string,
  feed: { center: string; centerName: string },
): Tsunami[] {
  const out: Tsunami[] = [];
  const matches = xml.matchAll(/<entry[\s\S]*?<\/entry>/g);
  for (const m of matches) {
    const t = parseEntry(m[0], feed);
    if (t) out.push(t);
  }
  return out;
}

export async function GET() {
  try {
    const results = await Promise.all(
      FEEDS.map(async (feed) => {
        try {
          const r = await fetch(feed.url, { next: { revalidate: 300 } });
          if (!r.ok) return [];
          const xml = await r.text();
          return parseFeed(xml, feed);
        } catch {
          return [];
        }
      }),
    );

    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const all = results
      .flat()
      .filter((t) => {
        const sent = new Date(t.sent).getTime();
        return Number.isFinite(sent) && sent >= cutoff;
      })
      .sort(
        (a, b) =>
          b.rank - a.rank ||
          new Date(b.sent).getTime() - new Date(a.sent).getTime(),
      );

    const seen = new Set<string>();
    const tsunamis = all.filter((t) => {
      const key = `${t.lat.toFixed(2)}-${t.lng.toFixed(2)}-${t.category}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ tsunamis });
  } catch {
    return NextResponse.json({ tsunamis: [] });
  }
}
