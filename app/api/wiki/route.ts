import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

type GeoSearchResult = {
  pageid: number;
  title: string;
  lat: number;
  lon: number;
  dist: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ articles: [] });
  }

  const geoUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=10000&gslimit=6&format=json&origin=*`;

  let geo: GeoSearchResult[] = [];
  try {
    const r = await fetch(geoUrl, {
      headers: { "User-Agent": "Earthpulse/0.1" },
      next: { revalidate: 3600 },
    });
    if (r.ok) {
      const data = (await r.json()) as {
        query?: { geosearch?: GeoSearchResult[] };
      };
      geo = data.query?.geosearch ?? [];
    }
  } catch {}

  const articles = await Promise.all(
    geo.slice(0, 5).map(async (g) => {
      try {
        const sUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(g.title)}`;
        const r = await fetch(sUrl, {
          headers: { "User-Agent": "Earthpulse/0.1" },
          next: { revalidate: 86400 },
        });
        if (!r.ok) return null;
        const s = (await r.json()) as {
          title: string;
          extract: string;
          thumbnail?: { source: string };
          content_urls?: { desktop?: { page: string } };
        };
        return {
          title: s.title,
          extract: s.extract,
          thumb: s.thumbnail?.source ?? null,
          url:
            s.content_urls?.desktop?.page ??
            `https://en.wikipedia.org/wiki/${encodeURIComponent(g.title)}`,
          lat: g.lat,
          lng: g.lon,
          distM: g.dist,
        };
      } catch {
        return null;
      }
    }),
  );

  return NextResponse.json({
    articles: articles.filter((a): a is NonNullable<typeof a> => a !== null),
  });
}
