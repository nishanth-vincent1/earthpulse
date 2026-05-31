import { NextResponse } from "next/server";
import JSZip from "jszip";

export const runtime = "nodejs";
export const revalidate = 0;

type Article = {
  url: string;
  title: string;
  seendate: string;
  socialimage?: string;
  domain: string;
  language: string;
  sourcecountry: string;
};

type NewsGroup = {
  country: string;
  lat: number;
  lng: number;
  count: number;
  tone: number;
  topArticles: Article[];
};

let cache: { data: unknown; ts: number } | null = null;
const TTL = 30 * 60 * 1000;
const STALE_FALLBACK_MAX_AGE = 12 * 60 * 60 * 1000;

const FIPS_TO_NAME: Record<string, string> = {
  US: "United States", UK: "United Kingdom", CH: "China", RS: "Russia",
  IN: "India", JA: "Japan", GM: "Germany", FR: "France", IT: "Italy",
  SP: "Spain", BR: "Brazil", CA: "Canada", AS: "Australia", MX: "Mexico",
  AR: "Argentina", SF: "South Africa", EG: "Egypt", SA: "Saudi Arabia",
  AE: "United Arab Emirates", IS: "Israel", TU: "Turkey", IR: "Iran",
  IZ: "Iraq", SY: "Syria", LE: "Lebanon", GR: "Greece", PL: "Poland",
  UP: "Ukraine", SW: "Sweden", NO: "Norway", FI: "Finland", DA: "Denmark",
  NL: "Netherlands", BE: "Belgium", SZ: "Switzerland", AU: "Austria",
  PO: "Portugal", EI: "Ireland", EZ: "Czech Republic", RO: "Romania",
  HU: "Hungary", KS: "South Korea", KN: "North Korea", VM: "Vietnam",
  TH: "Thailand", ID: "Indonesia", RP: "Philippines", MY: "Malaysia",
  SN: "Singapore", NZ: "New Zealand", PK: "Pakistan", BG: "Bangladesh",
  CE: "Sri Lanka", AF: "Afghanistan", NP: "Nepal", BM: "Myanmar",
  CB: "Cambodia", LA: "Laos", MG: "Mongolia", TW: "Taiwan", HK: "Hong Kong",
  KZ: "Kazakhstan", UZ: "Uzbekistan", AJ: "Azerbaijan", GG: "Georgia",
  AM: "Armenia", CI: "Chile", PE: "Peru", CO: "Colombia", VE: "Venezuela",
  EC: "Ecuador", BL: "Bolivia", CU: "Cuba", DR: "Dominican Republic",
  KE: "Kenya", NI: "Nigeria", GH: "Ghana", MO: "Morocco", TS: "Tunisia",
  ET: "Ethiopia", UG: "Uganda", TZ: "Tanzania", ZA: "Zambia", ZI: "Zimbabwe",
  MZ: "Mozambique", AO: "Angola", SG: "Senegal", IV: "Ivory Coast",
  CM: "Cameroon", CG: "Democratic Republic of the Congo", BU: "Bulgaria",
  HR: "Croatia", LO: "Slovakia", SI: "Slovenia", SR: "Serbia", AL: "Albania",
  BO: "Belarus", LH: "Lithuania", LG: "Latvia", EN: "Estonia",
};

const SKIP_PATH_WORDS = new Set([
  "archives", "archive", "news", "world", "article", "articles",
  "story", "stories", "post", "posts", "content", "default", "index",
  "home", "front", "section", "category", "tag", "tags", "page",
  "video", "videos", "photo", "photos", "live", "latest", "blog",
]);

function extractTitleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const segs = u.pathname
      .split("/")
      .filter(
        (s) =>
          s &&
          s.length > 4 &&
          !/^\d+$/.test(s) &&
          !SKIP_PATH_WORDS.has(s.toLowerCase()),
      );
    if (segs.length === 0) return "";
    let slug = segs[segs.length - 1];
    slug = slug
      .replace(/\.(html?|asp|php|aspx|md|cms|stm|jsp)$/i, "")
      .replace(/[-_]+/g, " ")
      .trim();
    // Reject slugs that are clearly junk: pure numbers, hashes, < 3 words
    if (/^[\d.\s]+$/.test(slug)) return "";
    if (slug.split(/\s+/).length < 3) return "";
    return slug.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 140);
  } catch {
    return "";
  }
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function fetchEventsCsv(): Promise<
  Array<{ article: Article; lat: number; lng: number; tone: number }>
> {
  const lastUpdate = await fetch(
    "http://data.gdeltproject.org/gdeltv2/lastupdate.txt",
    { cache: "no-store" },
  );
  if (!lastUpdate.ok) throw new Error(`lastupdate ${lastUpdate.status}`);
  const updateText = await lastUpdate.text();

  const firstLine = updateText.split("\n")[0] ?? "";
  const eventsUrl = firstLine.split(" ")[2];
  if (!eventsUrl?.includes("export.CSV.zip")) {
    throw new Error("could not parse lastupdate.txt");
  }

  const zipResp = await fetch(eventsUrl, { cache: "no-store" });
  if (!zipResp.ok) throw new Error(`zip ${zipResp.status}`);
  const zipBuf = await zipResp.arrayBuffer();

  const zip = await JSZip.loadAsync(zipBuf);
  const csvEntry = Object.values(zip.files)[0];
  if (!csvEntry) throw new Error("zip empty");
  const csvText = await csvEntry.async("string");

  const rows: Array<{ article: Article; lat: number; lng: number; tone: number }> = [];
  const seenUrls = new Set<string>();
  const lines = csvText.split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split("\t");
    if (cols.length < 61) continue;

    const sourceUrl = cols[60];
    if (!sourceUrl || seenUrls.has(sourceUrl)) continue;

    const lat = parseFloat(cols[56]);
    const lng = parseFloat(cols[57]);
    if (isNaN(lat) || isNaN(lng)) continue;
    if (lat === 0 && lng === 0) continue;

    const title = extractTitleFromUrl(sourceUrl);
    if (!title) continue;

    seenUrls.add(sourceUrl);

    const fips = cols[53];
    const fullName = cols[52];
    const country =
      FIPS_TO_NAME[fips] ||
      fullName?.split(",").pop()?.trim() ||
      fips ||
      "Unknown";

    const tone = parseFloat(cols[34]);
    rows.push({
      lat,
      lng,
      tone: isNaN(tone) ? 0 : tone,
      article: {
        url: sourceUrl,
        title,
        seendate: cols[59] ?? "",
        domain: domainFromUrl(sourceUrl),
        language: "ENG",
        sourcecountry: country,
      },
    });

    if (rows.length >= 800) break;
  }

  return rows;
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
    const rows = await fetchEventsCsv();

    const groupedMap = new Map<
      string,
      NewsGroup & { _toneSum: number }
    >();
    for (const r of rows) {
      const keyLat = Math.round(r.lat / 6) * 6;
      const keyLng = Math.round(r.lng / 6) * 6;
      const key = `${keyLat}-${keyLng}`;
      const ex = groupedMap.get(key);
      if (ex) {
        ex.count++;
        ex._toneSum += r.tone;
        ex.tone = ex._toneSum / ex.count;
        if (ex.topArticles.length < 6) ex.topArticles.push(r.article);
      } else {
        groupedMap.set(key, {
          country: r.article.sourcecountry,
          lat: r.lat,
          lng: r.lng,
          count: 1,
          tone: r.tone,
          _toneSum: r.tone,
          topArticles: [r.article],
        });
      }
    }

    const grouped: NewsGroup[] = Array.from(groupedMap.values())
      .map(({ _toneSum, ...g }) => g)
      .sort((a, b) => b.count - a.count);
    const articles = rows.map((r) => r.article);

    const data = { articles, grouped, rateLimited: false };
    cache = { data, ts: now };
    return NextResponse.json(data);
  } catch (e) {
    console.error("news CSV fetch failed:", e);
    const fallback = staleFallback() as Record<string, unknown>;
    return NextResponse.json({ ...fallback, rateLimited: false });
  }
}
