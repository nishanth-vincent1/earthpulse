"use client";

import { motion } from "framer-motion";
import type { Quake } from "@/lib/types";
import { Stat } from "./Stat";

export function QuakeView({ quake }: { quake: Quake }) {
  const sev =
    quake.mag >= 7
      ? "Major"
      : quake.mag >= 6
        ? "Strong"
        : quake.mag >= 5
          ? "Moderate"
          : quake.mag >= 4
            ? "Light"
            : "Minor";
  const sevColor =
    quake.mag >= 6
      ? "text-red-300"
      : quake.mag >= 4
        ? "text-orange-300"
        : "text-amber-200";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🪨</div>
      <div className={`text-xs uppercase tracking-[0.25em] ${sevColor}`}>
        {sev} earthquake · M{quake.mag.toFixed(1)}
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {quake.place}
      </h2>
      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Magnitude" value={quake.mag.toFixed(1)} />
        <Stat
          label="Depth"
          value={
            quake.depth != null ? `${quake.depth.toFixed(1)} km` : "—"
          }
        />
        <Stat label="Latitude" value={`${quake.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${quake.lng.toFixed(2)}°`} />
        <Stat label="When" value={new Date(quake.time).toLocaleString()} />
      </div>
      {quake.url && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <a
            href={quake.url}
            target="_blank"
            rel="noopener"
            className="text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
          >
            USGS event page →
          </a>
        </div>
      )}
    </motion.div>
  );
}
