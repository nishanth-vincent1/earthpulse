"use client";

import { motion } from "framer-motion";
import type { Fire } from "@/lib/types";
import { Stat } from "./Stat";

const TYPE_LABEL: Record<number, { label: string; emoji: string }> = {
  0: { label: "Vegetation fire", emoji: "🌳" },
  1: { label: "Active volcano", emoji: "🌋" },
  2: { label: "Industrial / static source", emoji: "🏭" },
  3: { label: "Offshore source", emoji: "🛢" },
};

const SATELLITE_NAME: Record<string, string> = {
  N: "Suomi NPP",
  N20: "NOAA-20 (JPSS-1)",
  N21: "NOAA-21 (JPSS-2)",
  "1": "NOAA-20 (JPSS-1)",
};

function fireSizeLabel(frp: number): string {
  if (frp >= 1000) return "Megafire";
  if (frp >= 500) return "Very large";
  if (frp >= 100) return "Large";
  if (frp >= 30) return "Moderate";
  if (frp >= 10) return "Small";
  return "Minor";
}

function fireSizeColor(frp: number): string {
  if (frp >= 500) return "text-red-300";
  if (frp >= 100) return "text-orange-300";
  if (frp >= 30) return "text-amber-300";
  return "text-yellow-200/80";
}

function formatTimeAgo(date: string, time?: string): string {
  if (!date) return "";
  // FIRMS acq_time is HHMM, acq_date is YYYY-MM-DD
  const t = time?.padStart(4, "0") ?? "0000";
  const iso = `${date}T${t.slice(0, 2)}:${t.slice(2, 4)}:00Z`;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "";
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)} min ago`;
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function confidenceLabel(c?: string): { label: string; color: string } | null {
  if (!c) return null;
  switch (c.toLowerCase()) {
    case "h":
    case "high":
      return { label: "High confidence", color: "#7af07a" };
    case "n":
    case "nominal":
      return { label: "Nominal confidence", color: "#ffe16a" };
    case "l":
    case "low":
      return { label: "Low confidence", color: "#ff9b3d" };
    default:
      return { label: `Confidence: ${c}`, color: "#cdd3dc" };
  }
}

export function FireView({ fire }: { fire: Fire }) {
  const isEonet = !!fire.title;
  const sizeLabel = fire.frp != null ? fireSizeLabel(fire.frp) : null;
  const sizeColor =
    fire.frp != null ? fireSizeColor(fire.frp) : "text-orange-300";
  const conf = confidenceLabel(fire.confidence);
  const detectionType = fire.type != null ? TYPE_LABEL[fire.type] : null;
  const satelliteName = fire.satellite
    ? (SATELLITE_NAME[fire.satellite] ?? fire.satellite)
    : null;
  const timeAgo =
    !isEonet && fire.acqDate ? formatTimeAgo(fire.acqDate, fire.acqTime) : null;
  const tempCelsius =
    !isEonet && fire.bright != null ? Math.round(fire.bright - 273.15) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🔥</div>
      <div className={`text-xs uppercase tracking-[0.25em] ${sizeColor}`}>
        {sizeLabel ? `${sizeLabel} fire` : "Active wildfire"}
        {!isEonet && fire.frp != null && ` · ${Math.round(fire.frp)} MW`}
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {fire.title ?? "Satellite fire detection"}
      </h2>
      {timeAgo && (
        <div className="text-white/50 text-sm mt-1">Detected {timeAgo}</div>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {isEonet && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-300/30 bg-amber-300/[0.05] text-[10px] tracking-widest uppercase text-amber-200/80">
            ⚠ US-named event · EONET feed
          </span>
        )}
        {conf && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] tracking-widest uppercase"
            style={{
              borderColor: `${conf.color}55`,
              background: `${conf.color}15`,
              color: conf.color,
            }}
          >
            ✓ {conf.label}
          </span>
        )}
        {detectionType && detectionType.label !== "Vegetation fire" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-300/30 bg-purple-300/[0.06] text-[10px] tracking-widest uppercase text-purple-200/80">
            {detectionType.emoji} {detectionType.label}
          </span>
        )}
        {fire.daynight && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] tracking-widest uppercase text-white/60">
            {fire.daynight === "D" ? "☀ Daytime" : "🌙 Night"} detection
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Latitude" value={`${fire.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${fire.lng.toFixed(2)}°`} />
        {!isEonet && fire.frp != null && (
          <Stat
            label="Fire radiative power"
            value={`${Math.round(fire.frp)} MW`}
          />
        )}
        {!isEonet && fire.bright != null && (
          <Stat
            label="Brightness"
            value={`${Math.round(fire.bright)} K${tempCelsius != null ? ` · ${tempCelsius}°C` : ""}`}
          />
        )}
        {!isEonet && fire.bright5 != null && !Number.isNaN(fire.bright5) && (
          <Stat
            label="Band 5 brightness"
            value={`${Math.round(fire.bright5)} K`}
          />
        )}
        {fire.date && (
          <Stat
            label="Reported"
            value={new Date(fire.date).toLocaleDateString()}
          />
        )}
        {satelliteName && <Stat label="Detected by" value={satelliteName} />}
      </div>

      {!isEonet && fire.frp != null && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1.5">
            What FRP means
          </div>
          <div className="text-sm text-white/80 leading-relaxed">
            Fire Radiative Power is the heat output of the fire pixel.{" "}
            {fire.frp < 30
              ? "Under 30 MW typically suggests a small ground fire or burn pile."
              : fire.frp < 100
                ? "30–100 MW is a moderate wildfire — possibly fast-moving."
                : fire.frp < 500
                  ? "100–500 MW is a large active wildfire generating significant smoke."
                  : "Above 500 MW is a major megafire — likely visible from space and producing pyrocumulus clouds."}
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        {isEonet ? (
          <>
            Source · NASA EONET (Earth Observatory Natural Event Tracker).
            Names and dates are reported by the responsible US agency.
            <br />
            <br />
            <span className="text-amber-200/70">
              EONET only tracks named US wildfires. To see global satellite hot
              pixels (Australia, Brazil, Canada, Europe, Asia, Africa) get a
              free key at{" "}
              <a
                href="https://firms.modaps.eosdis.nasa.gov/api/map_key"
                target="_blank"
                rel="noopener"
                className="underline"
              >
                firms.modaps.eosdis.nasa.gov
              </a>{" "}
              and add{" "}
              <code className="text-amber-100">NASA_FIRMS_KEY</code> to
              <code className="text-amber-100"> .env.local</code>.
            </span>
          </>
        ) : (
          <>
            Source · NASA FIRMS (VIIRS satellite hot pixel detections).
            Brightness in Kelvin (subtract 273 for °C); Fire Radiative Power
            in megawatts. Confidence and detection type from the FIRMS
            classifier. Updated every ~3 hours.
          </>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {fire.link && (
          <a
            href={fire.link}
            target="_blank"
            rel="noopener"
            className="text-sm text-orange-300 hover:underline"
          >
            View on NASA EONET →
          </a>
        )}
        {!isEonet && (
          <a
            href={`https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@${fire.lng},${fire.lat},10z`}
            target="_blank"
            rel="noopener"
            className="text-sm text-orange-300/85 hover:underline"
          >
            View nearby hot pixels on FIRMS map →
          </a>
        )}
      </div>
    </motion.div>
  );
}
