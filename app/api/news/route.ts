import { NextResponse } from "next/server";

export const runtime = "nodejs";

const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  "United States": [39.5, -98.35],
  "United Kingdom": [54.0, -2.0],
  China: [35.86, 104.2],
  Russia: [61.52, 105.32],
  India: [20.59, 78.96],
  Japan: [36.2, 138.25],
  Germany: [51.17, 10.45],
  France: [46.23, 2.21],
  Italy: [41.87, 12.57],
  Spain: [40.46, -3.75],
  Brazil: [-14.24, -51.93],
  Canada: [56.13, -106.35],
  Australia: [-25.27, 133.78],
  Mexico: [23.63, -102.55],
  Argentina: [-38.42, -63.62],
  "South Africa": [-30.56, 22.94],
  Egypt: [26.82, 30.8],
  "Saudi Arabia": [23.89, 45.08],
  "United Arab Emirates": [23.42, 53.85],
  Israel: [31.05, 34.85],
  Turkey: [38.96, 35.24],
  Iran: [32.43, 53.69],
  Iraq: [33.22, 43.68],
  Syria: [34.8, 38.99],
  Lebanon: [33.85, 35.86],
  Greece: [39.07, 21.82],
  Poland: [51.92, 19.15],
  Ukraine: [48.38, 31.17],
  Sweden: [60.13, 18.64],
  Norway: [60.47, 8.47],
  Finland: [61.92, 25.75],
  Denmark: [56.26, 9.5],
  Netherlands: [52.13, 5.29],
  Belgium: [50.5, 4.47],
  Switzerland: [46.82, 8.23],
  Austria: [47.52, 14.55],
  Portugal: [39.4, -8.22],
  Ireland: [53.41, -8.24],
  "Czech Republic": [49.82, 15.47],
  Czechia: [49.82, 15.47],
  Romania: [45.94, 24.97],
  Hungary: [47.16, 19.5],
  "South Korea": [35.91, 127.77],
  "North Korea": [40.34, 127.51],
  Vietnam: [14.06, 108.28],
  Thailand: [15.87, 100.99],
  Indonesia: [-0.79, 113.92],
  Philippines: [12.88, 121.77],
  Malaysia: [4.21, 101.98],
  Singapore: [1.35, 103.82],
  "New Zealand": [-40.9, 174.89],
  Pakistan: [30.38, 69.35],
  Bangladesh: [23.68, 90.36],
  "Sri Lanka": [7.87, 80.77],
  Afghanistan: [33.94, 67.71],
  Nepal: [28.39, 84.12],
  Myanmar: [21.92, 95.96],
  Cambodia: [12.57, 104.99],
  Laos: [19.86, 102.5],
  Mongolia: [46.86, 103.85],
  Taiwan: [23.7, 120.96],
  "Hong Kong": [22.32, 114.17],
  Kazakhstan: [48.02, 66.92],
  Uzbekistan: [41.38, 64.59],
  Azerbaijan: [40.14, 47.58],
  Georgia: [42.32, 43.36],
  Armenia: [40.07, 45.04],
  Chile: [-35.68, -71.54],
  Peru: [-9.19, -75.02],
  Colombia: [4.57, -74.3],
  Venezuela: [6.42, -66.59],
  Ecuador: [-1.83, -78.18],
  Bolivia: [-16.29, -63.59],
  Cuba: [21.52, -77.78],
  "Dominican Republic": [18.74, -70.16],
  Haiti: [18.97, -72.29],
  Jamaica: [18.11, -77.3],
  "Puerto Rico": [18.22, -66.59],
  Honduras: [15.2, -86.24],
  Guatemala: [15.78, -90.23],
  "Costa Rica": [9.75, -83.75],
  Panama: [8.54, -80.78],
  Nigeria: [9.08, 8.68],
  Kenya: [-0.02, 37.91],
  Ethiopia: [9.15, 40.49],
  Tanzania: [-6.37, 34.89],
  Uganda: [1.37, 32.29],
  Ghana: [7.95, -1.03],
  Morocco: [31.79, -7.09],
  Algeria: [28.03, 1.66],
  Tunisia: [33.89, 9.54],
  Libya: [26.34, 17.23],
  Sudan: [12.86, 30.22],
  Somalia: [5.15, 46.2],
  Zimbabwe: [-19.02, 29.15],
  Zambia: [-13.13, 27.85],
  Mozambique: [-18.67, 35.53],
  Angola: [-11.2, 17.87],
  Senegal: [14.5, -14.45],
  "Ivory Coast": [7.54, -5.55],
  Cameroon: [7.37, 12.35],
  "Democratic Republic of the Congo": [-4.04, 21.76],
  Bulgaria: [42.73, 25.49],
  Croatia: [45.1, 15.2],
  Slovakia: [48.67, 19.7],
  Slovenia: [46.15, 14.99],
  Serbia: [44.02, 21.01],
  Albania: [41.15, 20.17],
  Belarus: [53.71, 27.95],
  Lithuania: [55.17, 23.88],
  Latvia: [56.88, 24.6],
  Estonia: [58.6, 25.01],
};

let cache: { data: unknown; ts: number } | null = null;
const TTL = 1_800_000;
const STALE_FALLBACK_MAX_AGE = 12 * 60 * 60 * 1000;

type Article = {
  url: string;
  title: string;
  seendate: string;
  socialimage?: string;
  domain: string;
  language: string;
  sourcecountry: string;
};

async function fetchGdelt(): Promise<{ ok: true; text: string } | { ok: false; rateLimited: boolean }> {
  try {
    const r = await fetch(
      `https://api.gdeltproject.org/api/v2/doc/doc?query=%28sourcelang%3Aeng%29&mode=artlist&format=json&maxrecords=75&sort=DateDesc`,
      {
        cache: "no-store",
        headers: { "User-Agent": "Earthpulse/0.1 (https://github.com/anthropics)" },
      },
    );
    if (!r.ok) return { ok: false, rateLimited: false };
    const text = await r.text();
    if (text.startsWith("Please limit") || !text.startsWith("{")) {
      return { ok: false, rateLimited: true };
    }
    return { ok: true, text };
  } catch {
    return { ok: false, rateLimited: false };
  }
}

function staleFallback(): unknown {
  if (!cache) return { articles: [], grouped: [] };
  const age = Date.now() - cache.ts;
  if (age > STALE_FALLBACK_MAX_AGE) return { articles: [], grouped: [] };
  return { ...(cache.data as Record<string, unknown>), stale: true };
}

export async function GET() {
  const now = Date.now();
  const cachedData = cache?.data as { articles?: unknown[] } | undefined;
  const cachedHasContent = (cachedData?.articles?.length ?? 0) > 0;
  if (cache && cachedHasContent && now - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    let result = await fetchGdelt();
    if (!result.ok && result.rateLimited) {
      await new Promise((res) => setTimeout(res, 6000));
      result = await fetchGdelt();
    }
    if (!result.ok) {
      const fallback = staleFallback() as Record<string, unknown>;
      return NextResponse.json({
        ...fallback,
        rateLimited: result.rateLimited,
      });
    }
    const text = result.text;

    const data = JSON.parse(text) as { articles?: Article[] };
    const articles = (data.articles ?? []).filter((a) =>
      COUNTRY_CENTROIDS[a.sourcecountry],
    );

    const seedFor = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
      return h;
    };
    const offset = (seed: number, range: number) => {
      const r = (((Math.sin(seed) * 10000) % 1) + 1) % 1;
      return (r * 2 - 1) * range;
    };

    const groupedMap = new Map<
      string,
      {
        country: string;
        lat: number;
        lng: number;
        count: number;
        topArticles: Article[];
      }
    >();
    for (const a of articles) {
      const c = COUNTRY_CENTROIDS[a.sourcecountry];
      if (!c) continue;
      const seed = seedFor(a.sourcecountry + a.url);
      const jLat = offset(seed, 3);
      const jLng = offset(seed * 1.3, 4);
      const key = `${a.sourcecountry}-${Math.round(jLat)}-${Math.round(jLng)}`;
      const ex = groupedMap.get(key);
      if (ex) {
        ex.count++;
        if (ex.topArticles.length < 6) ex.topArticles.push(a);
      } else {
        groupedMap.set(key, {
          country: a.sourcecountry,
          lat: Math.max(-85, Math.min(85, c[0] + jLat)),
          lng: ((c[1] + jLng + 540) % 360) - 180,
          count: 1,
          topArticles: [a],
        });
      }
    }

    const grouped = Array.from(groupedMap.values());
    const body = {
      articles: articles.slice(0, 30),
      grouped,
      total: articles.length,
    };
    if (articles.length > 0) cache = { data: body, ts: now };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(staleFallback());
  }
}
