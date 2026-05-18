"use client";

import { motion } from "framer-motion";
import type { AirStation } from "@/lib/types";
import { Stat } from "./Stat";

export function AirView({ station }: { station: AirStation }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">💨</div>
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: station.color }}
      >
        Air quality · {station.severity}
      </div>
      <h2 className="text-3xl font-light text-white mt-1 leading-snug">
        {station.name}
      </h2>

      <div
        className="mt-5 px-5 py-4 rounded-xl border"
        style={{
          borderColor: station.color + "55",
          background: `linear-gradient(135deg, ${station.color}22, transparent)`,
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
          AQI
        </div>
        <div
          className="text-5xl font-light tabular-nums"
          style={{ color: station.color }}
        >
          {station.aqi}
        </div>
        <div className="text-sm text-white/60 mt-1">{station.severity}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <Stat label="Latitude" value={`${station.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${station.lng.toFixed(2)}°`} />
        {station.time && <Stat label="Reported" value={station.time} />}
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        Source · World Air Quality Index project (aqicn.org). AQI is the US EPA
        standard. 0–50 Good · 51–100 Moderate · 101–150 Unhealthy for sensitive
        groups · 151–200 Unhealthy · 201–300 Very unhealthy · 301+ Hazardous.
      </div>
      <a
        href={`https://aqicn.org/station/@${station.uid}`}
        target="_blank"
        rel="noopener"
        className="mt-3 block text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
      >
        View on AQICN →
      </a>
    </motion.div>
  );
}
