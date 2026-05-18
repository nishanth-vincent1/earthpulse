import { NextRequest, NextResponse } from "next/server";
import { parseHurdat2, type HurdatStorm } from "@/lib/hurdat2-parse";

export const runtime = "nodejs";

let cache: { byYear: Map<number, HurdatStorm[]>; ts: number } | null = null;
const TTL = 86_400_000;

const URLS = [
  "https://www.nhc.noaa.gov/data/hurdat/hurdat2-1851-2024-040425.txt",
  "https://www.nhc.noaa.gov/data/hurdat/hurdat2-nepac-1949-2024-040425.txt",
];

async function loadAll(): Promise<HurdatStorm[]> {
  const fetched = await Promise.all(
    URLS.map((u) =>
      fetch(u, { cache: "no-store" })
        .then((r) => (r.ok ? r.text() : ""))
        .catch(() => ""),
    ),
  );
  return fetched.flatMap((t) => parseHurdat2(t));
}

async function ensureCache() {
  const now = Date.now();
  if (cache && now - cache.ts < TTL) return cache;
  const all = await loadAll();
  const byYear = new Map<number, HurdatStorm[]>();
  for (const s of all) {
    const arr = byYear.get(s.year) ?? [];
    arr.push(s);
    byYear.set(s.year, arr);
  }
  cache = { byYear, ts: now };
  return cache;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : NaN;
  if (Number.isNaN(year)) {
    return NextResponse.json({ year: null, storms: [] });
  }

  try {
    const { byYear } = await ensureCache();
    const storms = byYear.get(year) ?? [];
    const slim = storms.map((s) => ({
      id: s.id,
      name: s.name === "UNNAMED" ? `Storm #${s.number}` : s.name,
      basin: s.basin === "AL" ? "Atlantic" : "East Pacific",
      year: s.year,
      peakWindKt: s.peakWindKt,
      category: s.category,
      path: s.track.map((p) => [p.lat, p.lng] as [number, number]),
      track: s.track.map((p) => ({
        date: `${p.date.slice(0, 4)}-${p.date.slice(4, 6)}-${p.date.slice(6, 8)}`,
        time: p.time,
        status: p.status,
        lat: p.lat,
        lng: p.lng,
        maxWindKt: p.maxWindKt,
        pressureMb: p.pressureMb,
      })),
    }));
    return NextResponse.json({ year, storms: slim, count: slim.length });
  } catch {
    return NextResponse.json({ year, storms: [] });
  }
}
