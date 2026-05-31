"use client";

import { motion } from "framer-motion";
import type { TideStation, TideData } from "@/lib/types";
import { Stat } from "./Stat";

function formatTime(isoLike: string | null | undefined): string {
  if (!isoLike) return "—";
  const t = new Date(isoLike.replace(" ", "T"));
  if (Number.isNaN(t.getTime())) return isoLike;
  return t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function timeUntil(isoLike: string | null | undefined): string {
  if (!isoLike) return "";
  const t = new Date(isoLike.replace(" ", "T")).getTime();
  if (Number.isNaN(t)) return "";
  const ms = t - Date.now();
  if (ms < 0) return "";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `in ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return `in ${h}h ${m}m`;
  return `in ${Math.floor(h / 24)}d`;
}

export function TideView({
  station,
  data,
  loading,
}: {
  station: TideStation;
  data: TideData | null;
  loading: boolean;
}) {
  const cur = data?.current;
  const next = data?.nextHigh && data?.nextLow
    ? new Date(data.nextHigh.time.replace(" ", "T")) <
      new Date(data.nextLow.time.replace(" ", "T"))
      ? { ...data.nextHigh, type: "H" as const }
      : { ...data.nextLow, type: "L" as const }
    : (data?.nextHigh
        ? { ...data.nextHigh, type: "H" as const }
        : data?.nextLow
          ? { ...data.nextLow, type: "L" as const }
          : null);

  // Direction: rising if next is High, falling if next is Low
  const direction = next
    ? next.type === "H"
      ? "rising"
      : "falling"
    : null;

  // Compute today's range
  const todayLevels = data?.todayHiLo ?? [];
  const highs = todayLevels.filter((p) => p.type === "H").map((p) => p.feet);
  const lows = todayLevels.filter((p) => p.type === "L").map((p) => p.feet);
  const dayHigh = highs.length ? Math.max(...highs) : null;
  const dayLow = lows.length ? Math.min(...lows) : null;
  const dayRange = dayHigh != null && dayLow != null ? dayHigh - dayLow : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🌊</div>
      <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
        NOAA tide gauge
        {station.state ? ` · ${station.state}` : ""}
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {station.name}
      </h2>
      <div className="text-white/50 text-sm mt-1">Station ID {station.id}</div>

      {loading && (
        <div className="mt-6 text-white/40 text-sm">
          Loading live water level from NOAA…
        </div>
      )}

      {!loading && cur && (
        <div className="mt-6 border border-white/10 rounded-xl p-4 bg-white/[0.02]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
            Water level right now
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-4xl font-light text-white tabular-nums">
              {cur.feet.toFixed(2)}
            </div>
            <div className="text-sm text-white/60">ft above MLLW</div>
          </div>
          {direction && (
            <div className="mt-1 text-sm text-cyan-200/80">
              {direction === "rising" ? "↗ Tide rising" : "↘ Tide falling"}
              {next && ` — toward ${next.type === "H" ? "high" : "low"} of ${next.feet.toFixed(2)} ft ${timeUntil(next.time)}`}
            </div>
          )}
          <div className="text-[10px] text-white/30 mt-1">
            measured {formatTime(cur.time)}
            {cur.quality === "p" ? " · preliminary" : ""}
            {cur.quality === "v" ? " · verified" : ""}
          </div>
        </div>
      )}

      {!loading && data && (data.nextHigh || data.nextLow) && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {data.nextHigh && (
            <Stat
              label="Next high"
              value={`${data.nextHigh.feet.toFixed(2)} ft at ${formatTime(data.nextHigh.time)}`}
            />
          )}
          {data.nextLow && (
            <Stat
              label="Next low"
              value={`${data.nextLow.feet.toFixed(2)} ft at ${formatTime(data.nextLow.time)}`}
            />
          )}
          {data.waterTempF != null && !Number.isNaN(data.waterTempF) && (
            <Stat
              label="Water temp"
              value={`${data.waterTempF.toFixed(1)}°F · ${(((data.waterTempF - 32) * 5) / 9).toFixed(1)}°C`}
            />
          )}
          {dayRange != null && (
            <Stat
              label="Today's range"
              value={`${dayRange.toFixed(2)} ft`}
            />
          )}
        </div>
      )}

      {!loading && todayLevels.length > 0 && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
            Today&apos;s tide cycle
          </div>
          <ul className="space-y-1.5">
            {todayLevels.map((p, i) => {
              const ts = new Date(p.time.replace(" ", "T")).getTime();
              const past = ts < Date.now();
              return (
                <li
                  key={`${p.time}-${i}`}
                  className={`flex items-center gap-3 text-sm tabular-nums ${
                    past ? "text-white/40" : "text-white/85"
                  }`}
                >
                  <span
                    className={`shrink-0 w-12 text-[10px] uppercase tracking-widest ${
                      p.type === "H" ? "text-cyan-200/70" : "text-blue-300/70"
                    }`}
                  >
                    {p.type === "H" ? "▲ High" : "▼ Low"}
                  </span>
                  <span className="flex-1">{formatTime(p.time)}</span>
                  <span>{p.feet.toFixed(2)} ft</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Latitude" value={`${station.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${station.lng.toFixed(2)}°`} />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 flex flex-col gap-2">
        <a
          href={`https://tidesandcurrents.noaa.gov/stationhome.html?id=${station.id}`}
          target="_blank"
          rel="noopener"
          className="text-sm text-cyan-300 hover:underline"
        >
          NOAA station home page →
        </a>
        <a
          href={`https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=${station.id}`}
          target="_blank"
          rel="noopener"
          className="text-sm text-cyan-300/80 hover:underline"
        >
          Full tide predictions (next 7 days) →
        </a>
      </div>

      <div className="mt-3 text-[10px] text-white/30 leading-relaxed">
        Source · NOAA Tides &amp; Currents (CO-OPS) · datum MLLW (Mean Lower
        Low Water). Predictions are astronomical; actual water levels can
        differ due to wind, pressure, and storm surge.
      </div>
    </motion.div>
  );
}
