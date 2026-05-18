"use client";

import { motion } from "framer-motion";
import type { HistoricalEruption } from "@/lib/types";
import { Stat } from "./Stat";

export function EruptionView({ eruption }: { eruption: HistoricalEruption }) {
  const veiColor =
    eruption.vei == null
      ? "#9ca3af"
      : eruption.vei >= 6
        ? "#ff5050"
        : eruption.vei >= 4
          ? "#ff9b3d"
          : eruption.vei >= 2
            ? "#ffe16a"
            : "#7ad36b";
  const dateLabel = [
    eruption.year,
    eruption.month ? String(eruption.month).padStart(2, "0") : null,
    eruption.day ? String(eruption.day).padStart(2, "0") : null,
  ]
    .filter(Boolean)
    .join("-");
  const wikiUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(
    `${eruption.name} volcano ${eruption.year} eruption`,
  )}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🌋</div>
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: veiColor }}
      >
        Historic eruption · {dateLabel}
      </div>
      <h2 className="text-3xl font-light text-white mt-1">{eruption.name}</h2>
      <div className="text-white/50 text-sm mt-1">
        {eruption.location || eruption.country}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat
          label="VEI"
          value={eruption.vei != null ? `${eruption.vei}/8` : "—"}
        />
        <Stat
          label="Deaths"
          value={
            eruption.deaths != null && eruption.deaths > 0
              ? eruption.deaths.toLocaleString()
              : "—"
          }
        />
        {eruption.morphology && (
          <Stat label="Type" value={eruption.morphology} />
        )}
        {eruption.elevation != null && (
          <Stat label="Elevation" value={`${eruption.elevation} m`} />
        )}
        <Stat label="Latitude" value={`${eruption.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${eruption.lng.toFixed(2)}°`} />
        {eruption.damageM != null && eruption.damageM > 0 && (
          <Stat label="Damage" value={`$${eruption.damageM}M`} />
        )}
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        Source · NOAA NCEI Significant Volcanic Eruptions database. VEI
        (Volcanic Explosivity Index) is logarithmic: 0 non-explosive, 8
        mega-colossal. Pinatubo 1991 was a 6, Tambora 1815 a 7.
      </div>
      <a
        href={wikiUrl}
        target="_blank"
        rel="noopener"
        className="mt-3 block text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
      >
        Read on Wikipedia →
      </a>
    </motion.div>
  );
}
