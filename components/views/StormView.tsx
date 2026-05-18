"use client";

import { motion } from "framer-motion";
import type { Storm } from "@/lib/types";
import { Stat } from "./Stat";

export function StormView({ storm }: { storm: Storm }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-xs uppercase tracking-[0.25em] text-cyan-200">
        🌀 Active storm
      </div>
      <h2 className="text-3xl font-light text-white mt-1">{storm.name}</h2>
      <div className="text-sm text-white/60 mt-1">{storm.classification}</div>
      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Wind" value={`${storm.intensity} kt`} />
        <Stat label="Pressure" value={`${storm.pressure} mb`} />
        <Stat label="Heading" value={`${storm.heading}°`} />
        <Stat label="Speed" value={`${storm.speedKt} kt`} />
        <Stat label="Latitude" value={`${storm.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${storm.lng.toFixed(2)}°`} />
      </div>
    </motion.div>
  );
}
