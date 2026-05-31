import { NextResponse } from "next/server";
import JSZip from "jszip";

export const runtime = "nodejs";
export const revalidate = 0;
export const maxDuration = 30;

type Article = {
  url: string;
  title: string;
  seendate: string;
  socialimage?: string;
  domain: string;
  language: string;
  sourcecountry: string;
  themes: string[];
  entities: string[];
  category: string;
  tone: number;
};

type NewsGroup = {
  country: string;
  lat: number;
  lng: number;
  count: number;
  tone: number;
  primaryCategory: string;
  topArticles: Article[];
};

let cache: { data: unknown; ts: number } | null = null;
const TTL = 30 * 60 * 1000;
const STALE_FALLBACK_MAX_AGE = 12 * 60 * 60 * 1000;

const CATEGORY_PRIORITY: Array<{ name: string; patterns: RegExp[] }> = [
  {
    name: "crisis",
    patterns: [
      /^NATURAL_DISASTER/, /^CRISISLEX/, /^DISASTER_/, /^EARTHQUAKE/,
      /^FLOOD/, /^DROUGHT/, /^TSUNAMI/, /^WILDFIRE/, /^STORM/, /^FAMINE/,
      /^REFUGEES/, /^EVACUATION/, /^HUMANITARIAN/, /MANMADE_DISASTER/,
    ],
  },
  {
    name: "conflict",
    patterns: [
      /^KILL$/, /^WOUND$/, /^ARMEDCONFLICT/, /^MILITARY_/, /^MILITARY$/,
      /^REBELLION/, /^TERROR/, /^WAR/, /^ATTACK/, /^VIOLENCE/, /^BOMB/,
      /^WEAPONS/, /^SOLDIERS/,
    ],
  },
  {
    name: "protest",
    patterns: [/^PROTEST/, /^STRIKE/, /^RIOT/, /^DEMONSTRATION/, /^UNREST/],
  },
  {
    name: "health",
    patterns: [
      /^HEALTH/, /^MEDICAL/, /^DISEASE/, /^EPIDEMIC/, /^PANDEMIC/,
      /^HOSPITAL/, /^VIRUS/, /^OUTBREAK/,
    ],
  },
  {
    name: "politics",
    patterns: [
      /^ELECTION/, /^LEADER$/, /^GOV_/, /^POLITICAL/, /^DIPLOMACY/,
      /^NEGOTIATION/, /^PARLIAMENT/, /^SANCTION/, /^TREATY/, /^EMBASSY/,
    ],
  },
  {
    name: "economy",
    patterns: [
      /^ECON_/, /^TAX_/, /^TRADE$/, /^TRADE_/, /^INFLATION/, /^MARKET/,
      /^BANK/, /^STOCK/, /^FINANCIAL/, /^BUDGET/, /^DEBT/,
    ],
  },
  {
    name: "tech",
    patterns: [
      /^TECH_/, /^TECHNOLOGY/, /TECHNOLOGY$/, /^INTERNET/, /^SOFTWARE/,
      /^CYBER/, /^AI_/, /^ARTIFICIAL_INTELLIGENCE/, /^SOCIAL_MEDIA/,
      /^CRYPTO/, /^BLOCKCHAIN/, /^BITCOIN/, /^STARTUP/, /^ROBOTICS/,
      /^WB_133_/, /^WB_2024_/, /^WB_678_/,
      /^SCITECH/, /^INNOVATION/, /^DATA_PRIVACY/, /^HACK/,
      /TELECOM/, /SMARTPHONE/, /^MOBILE_/, /^APPLE_/, /^GOOGLE_/,
      /^MICROSOFT_/, /^META_/, /^TESLA_/, /^OPENAI/,
    ],
  },
  {
    name: "environment",
    patterns: [
      /^ENV_/, /^CLIMATE/, /^POLLUTION/, /^EMISSIONS/, /^DEFORESTATION/,
      /^BIODIVERSITY/, /^WILDLIFE/, /^CONSERVATION/,
    ],
  },
  {
    name: "sports",
    patterns: [/^SPORTS/, /^OLYMPIC/, /^WORLDCUP/, /^TOURNAMENT/],
  },
];

function categorizeFromThemes(themes: string[]): string {
  for (const cat of CATEGORY_PRIORITY) {
    for (const theme of themes) {
      if (cat.patterns.some((p) => p.test(theme))) return cat.name;
    }
  }
  return "other";
}

function extractTitle(extrasXml: string, fallbackUrl: string): string {
  const m = extrasXml.match(/<PAGE_TITLE>([\s\S]*?)<\/PAGE_TITLE>/);
  let title = m?.[1]?.trim() ?? "";
  if (!title) title = extractTitleFromUrl(fallbackUrl);
  // Strip "| Source Name" suffixes that pollute titles
  title = title.replace(/\s*[\|–—-]\s*[^|]{1,40}$/, "").trim();
  return title.slice(0, 200);
}

function extractTitleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const segs = u.pathname
      .split("/")
      .filter(
        (s) =>
          s && s.length > 4 && !/^\d+$/.test(s) &&
          !["news", "world", "article", "story", "archive", "archives"].includes(s.toLowerCase()),
      );
    if (segs.length === 0) return "";
    let slug = segs[segs.length - 1]
      .replace(/\.(html?|asp|php|aspx|md|cms|stm|jsp)$/i, "")
      .replace(/[-_]+/g, " ")
      .trim();
    if (/^[\d.\s]+$/.test(slug)) return "";
    if (slug.split(/\s+/).length < 3) return "";
    return slug.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 200);
  } catch {
    return "";
  }
}

function parseFirstLocation(locationsStr: string): { lat: number; lng: number; country: string } | null {
  if (!locationsStr) return null;
  // V1Locations format: "Type#FullName#CountryCode#ADM1#Lat#Long#FeatureID;..."
  // Prefer specific (Type 4 = city) over country (Type 1)
  const entries = locationsStr.split(";").filter(Boolean);
  let best: { lat: number; lng: number; country: string; type: number } | null = null;
  for (const entry of entries) {
    const parts = entry.split("#");
    if (parts.length < 6) continue;
    const type = parseInt(parts[0]);
    const lat = parseFloat(parts[4]);
    const lng = parseFloat(parts[5]);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) continue;
    const fullName = parts[1] || "";
    const country = fullName.split(",").pop()?.trim() || parts[2] || "Unknown";
    const candidate = { lat, lng, country, type };
    if (!best || candidate.type > best.type) best = candidate;
  }
  return best;
}

function parseThemes(themesStr: string, maxThemes = 8): string[] {
  if (!themesStr) return [];
  const seen = new Set<string>();
  for (const raw of themesStr.split(";")) {
    const t = raw.split(",")[0]?.trim();
    if (t) seen.add(t);
    if (seen.size >= maxThemes) break;
  }
  return Array.from(seen);
}

function parseEntities(allNamesStr: string, maxEntities = 4): string[] {
  if (!allNamesStr) return [];
  const seen = new Set<string>();
  for (const raw of allNamesStr.split(";")) {
    const name = raw.split(",")[0]?.trim();
    if (name && name.length >= 3 && /^[A-Z]/.test(name)) seen.add(name);
    if (seen.size >= maxEntities) break;
  }
  return Array.from(seen);
}

function parseTone(toneStr: string): number {
  if (!toneStr) return 0;
  const v = parseFloat(toneStr.split(",")[0]);
  return isNaN(v) ? 0 : v;
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function fetchGkg(): Promise<Array<{ article: Article; lat: number; lng: number }>> {
  const lastUpdate = await fetch(
    "http://data.gdeltproject.org/gdeltv2/lastupdate.txt",
    { cache: "no-store" },
  );
  if (!lastUpdate.ok) throw new Error(`lastupdate ${lastUpdate.status}`);
  const updateText = await lastUpdate.text();

  // Line 3 = GKG file
  const gkgLine = updateText.split("\n")[2] ?? "";
  const gkgUrl = gkgLine.split(" ")[2];
  if (!gkgUrl?.includes("gkg.csv.zip")) {
    throw new Error("could not parse lastupdate.txt GKG line");
  }

  const zipResp = await fetch(gkgUrl, { cache: "no-store" });
  if (!zipResp.ok) throw new Error(`gkg zip ${zipResp.status}`);
  const zipBuf = await zipResp.arrayBuffer();

  const zip = await JSZip.loadAsync(zipBuf);
  const csvEntry = Object.values(zip.files)[0];
  if (!csvEntry) throw new Error("gkg zip empty");
  const csvText = await csvEntry.async("string");

  const rows: Array<{ article: Article; lat: number; lng: number }> = [];
  const seenUrls = new Set<string>();
  const lines = csvText.split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split("\t");
    if (cols.length < 27) continue;

    const url = cols[4];
    if (!url || seenUrls.has(url)) continue;

    const loc = parseFirstLocation(cols[9]);
    if (!loc) continue;

    const extrasXml = cols[26] ?? "";
    const title = extractTitle(extrasXml, url);
    if (!title || title.length < 10) continue;

    // Skip non-Latin titles (very rough heuristic for English/Western European)
    const latinChars = title.match(/[A-Za-z]/g)?.length ?? 0;
    if (latinChars < title.length * 0.5) continue;

    seenUrls.add(url);

    const themes = parseThemes(cols[7]);
    const entities = parseEntities(cols[23]);
    const tone = parseTone(cols[15]);
    const category = categorizeFromThemes(themes);
    const socialimage = cols[18]?.trim() || undefined;

    rows.push({
      lat: loc.lat,
      lng: loc.lng,
      article: {
        url,
        title,
        seendate: cols[1] ?? "",
        socialimage,
        domain: cols[3] || domainFromUrl(url),
        language: "ENG",
        sourcecountry: loc.country,
        themes,
        entities,
        category,
        tone,
      },
    });

    if (rows.length >= 600) break;
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
    const rows = await fetchGkg();

    type GroupAccum = NewsGroup & {
      _toneSum: number;
      _categoryCounts: Record<string, number>;
    };
    const groupedMap = new Map<string, GroupAccum>();
    for (const r of rows) {
      const keyLat = Math.round(r.lat / 6) * 6;
      const keyLng = Math.round(r.lng / 6) * 6;
      const key = `${keyLat}-${keyLng}`;
      const ex = groupedMap.get(key);
      const cat = r.article.category;
      if (ex) {
        ex.count++;
        ex._toneSum += r.article.tone;
        ex.tone = ex._toneSum / ex.count;
        ex._categoryCounts[cat] = (ex._categoryCounts[cat] ?? 0) + 1;
        if (ex.topArticles.length < 6) ex.topArticles.push(r.article);
      } else {
        groupedMap.set(key, {
          country: r.article.sourcecountry,
          lat: r.lat,
          lng: r.lng,
          count: 1,
          tone: r.article.tone,
          primaryCategory: cat,
          _toneSum: r.article.tone,
          _categoryCounts: { [cat]: 1 },
          topArticles: [r.article],
        });
      }
    }

    // Determine primaryCategory per group as mode of article categories
    const grouped: NewsGroup[] = Array.from(groupedMap.values())
      .map(({ _toneSum, _categoryCounts, ...g }) => {
        const sorted = Object.entries(_categoryCounts).sort(
          (a, b) => b[1] - a[1],
        );
        return { ...g, primaryCategory: sorted[0]?.[0] ?? "other" };
      })
      .sort((a, b) => b.count - a.count);

    const articles = rows.map((r) => r.article);
    const data = { articles, grouped, rateLimited: false };
    cache = { data, ts: now };
    return NextResponse.json(data);
  } catch (e) {
    console.error("news GKG fetch failed:", e);
    const fallback = staleFallback() as Record<string, unknown>;
    return NextResponse.json({ ...fallback, rateLimited: false });
  }
}
