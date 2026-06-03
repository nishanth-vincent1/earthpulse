import type { Metadata } from "next";
import Link from "next/link";

type DayQuake = {
  id: string;
  year: number;
  mag: number;
  place: string;
  time: number;
  url: string;
  lat: number;
  lng: number;
  depth: number;
};

type DayResponse = {
  date: string;
  monthDay?: string;
  quakes: DayQuake[];
  total?: number;
};

export const dynamic = "force-dynamic";
export const revalidate = 21600; // 6h

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type USGSFeature = {
  id: string;
  properties: { mag: number; place: string; time: number; url: string };
  geometry: { coordinates: [number, number, number] };
};

async function fetchToday(): Promise<DayResponse> {
  const now = new Date();
  const targetMonth = now.getUTCMonth() + 1;
  const targetDay = now.getUTCDate();
  const mm = String(targetMonth).padStart(2, "0");
  const dd = String(targetDay).padStart(2, "0");
  const dateIso = `${now.getUTCFullYear()}-${mm}-${dd}`;
  try {
    const startYear = now.getUTCFullYear() - 100;
    const endYear = now.getUTCFullYear() - 1;
    const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startYear}-01-01&endtime=${endYear}-12-31&minmagnitude=6.5&limit=20000&orderby=magnitude`;
    const r = await fetch(usgsUrl, { next: { revalidate: 21600 } });
    if (!r.ok) return { date: dateIso, monthDay: `${mm}-${dd}`, quakes: [] };
    const data = (await r.json()) as { features: USGSFeature[] };
    const matches: DayQuake[] = [];
    for (const f of data.features) {
      const d = new Date(f.properties.time);
      if (d.getUTCMonth() + 1 !== targetMonth) continue;
      if (d.getUTCDate() !== targetDay) continue;
      matches.push({
        id: f.id,
        year: d.getUTCFullYear(),
        mag: f.properties.mag,
        place: f.properties.place,
        time: f.properties.time,
        url: f.properties.url,
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        depth: f.geometry.coordinates[2],
      });
    }
    matches.sort((a, b) => b.mag - a.mag);
    return {
      date: dateIso,
      monthDay: `${mm}-${dd}`,
      quakes: matches.slice(0, 50),
      total: matches.length,
    };
  } catch {
    return { date: dateIso, monthDay: `${mm}-${dd}`, quakes: [] };
  }
}

export const metadata: Metadata = {
  title: "On this day in Earth history — Earthpulse",
  description:
    "Significant earthquakes that struck on today's date across the past century. Updated daily.",
};

export default async function TodayPage() {
  const data = await fetchToday();
  const now = new Date(`${data.date}T00:00:00Z`);
  const monthName = MONTHS[now.getUTCMonth()];
  const day = now.getUTCDate();

  return (
    <main className="min-h-screen bg-black text-white overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-24">
        <Link
          href="/"
          className="text-[10px] uppercase tracking-[0.25em] text-white/40 hover:text-white/70 transition-colors"
        >
          ← Earthpulse
        </Link>
        <div className="text-[10px] uppercase tracking-[0.25em] text-amber-200/70 mt-4">
          On this day
        </div>
        <h1 className="text-4xl md:text-5xl font-light text-white mt-2">
          {monthName} {day}
        </h1>
        <p className="text-white/55 text-base mt-3 max-w-2xl">
          Significant earthquakes (M6.5+) that struck on this calendar day
          across the past century. Pulled from USGS Earthquake Hazards Program.
        </p>

        {data.quakes.length === 0 ? (
          <div className="mt-12 text-white/40 italic">
            No M6.5+ earthquakes on record for today&apos;s calendar date in
            the past 100 years. Earth had a quiet anniversary.
          </div>
        ) : (
          <ul className="mt-12 space-y-4">
            {data.quakes.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/?m=timetravel&y=${q.year}&lat=${q.lat.toFixed(2)}&lng=${q.lng.toFixed(2)}&alt=1.6`}
                  className="block rounded-xl border border-white/10 hover:border-white/25 p-5 transition-colors group"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="text-sm text-white/55 tabular-nums">
                      {q.year}
                    </div>
                    <div
                      className={`text-xs tracking-widest uppercase ${
                        q.mag >= 8
                          ? "text-red-300"
                          : q.mag >= 7
                            ? "text-orange-300"
                            : "text-amber-200"
                      }`}
                    >
                      M{q.mag.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-xl font-light text-white mt-1 group-hover:underline underline-offset-4">
                    {q.place}
                  </div>
                  <div className="text-[11px] text-white/40 mt-2">
                    Depth {q.depth.toFixed(0)} km · {q.lat.toFixed(2)}°,{" "}
                    {q.lng.toFixed(2)}°
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {data.total != null && data.total > data.quakes.length && (
          <div className="mt-6 text-[11px] text-white/30">
            Showing top {data.quakes.length} by magnitude of {data.total} total
            on this date.
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-white/10 text-[11px] text-white/40 leading-relaxed">
          Source · USGS Earthquake Hazards Program (FDSN event service).
          M6.5+ events from {new Date().getUTCFullYear() - 100} to{" "}
          {new Date().getUTCFullYear() - 1}.
        </div>
      </div>
    </main>
  );
}
