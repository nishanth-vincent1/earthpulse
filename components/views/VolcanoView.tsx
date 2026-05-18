"use client";

import { motion } from "framer-motion";
import type { Volcano } from "@/lib/types";
import { Stat } from "./Stat";

export function VolcanoView({ volcano }: { volcano: Volcano }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🌋</div>
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: volcano.color }}
      >
        {volcano.alertLevel} · {volcano.colorCode}
      </div>
      <h2 className="text-3xl font-light text-white mt-1">{volcano.name}</h2>
      <div className="text-white/50 text-sm mt-1">{volcano.observatory}</div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Alert level" value={volcano.alertLevel} />
        <Stat label="Aviation code" value={volcano.colorCode} />
        <Stat label="Latitude" value={`${volcano.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${volcano.lng.toFixed(2)}°`} />
        <Stat
          label="Last notice"
          value={new Date(volcano.sentUtc).toLocaleString()}
        />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        Source · USGS Volcano Hazards Program. Color codes follow the Aviation
        Color Code system: GREEN normal · YELLOW unrest · ORANGE
        heightened/escalating · RED imminent or ongoing eruption with
        significant ash. Currently US-monitored volcanoes only (AVO/HVO/CVO).
      </div>
      {volcano.noticeUrl && (
        <a
          href={volcano.noticeUrl}
          target="_blank"
          rel="noopener"
          className="mt-3 block text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
        >
          USGS notice →
        </a>
      )}
    </motion.div>
  );
}
