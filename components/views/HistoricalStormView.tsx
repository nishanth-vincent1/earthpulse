"use client";

import { motion } from "framer-motion";
import type { HistoricalStorm } from "@/lib/types";
import { Stat } from "./Stat";
import { stormCategoryColor } from "./_shared";

export function HistoricalStormView({ storm }: { storm: HistoricalStorm }) {
  const start = storm.track[0];
  const end = storm.track[storm.track.length - 1];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🌀</div>
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: stormCategoryColor(storm.peakWindKt) }}
      >
        {storm.category} · {storm.basin} · {storm.year}
      </div>
      <h2 className="text-3xl font-light text-white mt-1">{storm.name}</h2>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Peak wind" value={`${storm.peakWindKt} kt`} />
        <Stat label="Track points" value={storm.track.length.toString()} />
        {start && (
          <Stat label="First seen" value={start.date} />
        )}
        {end && <Stat label="Last seen" value={end.date} />}
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        Source · NOAA HURDAT2 (Hurricane Database, Atlantic + East Pacific best
        track). Each storm includes 6-hourly position fixes from genesis to
        dissipation. Data goes back to 1851 (Atlantic) and 1949 (East Pacific).
      </div>
    </motion.div>
  );
}
