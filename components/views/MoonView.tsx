"use client";

import { motion } from "framer-motion";
import type { Moon } from "@/lib/types";
import { Stat } from "./Stat";

function daysFromNow(iso: string): number {
  const d = (new Date(iso).getTime() - Date.now()) / 86_400_000;
  return Math.max(0, Math.round(d));
}

export function MoonView({ moon }: { moon: Moon }) {
  const illumPct = Math.round(moon.illumination * 100);
  const distance = `${Math.round(moon.distanceKm).toLocaleString()} km`;
  const fullIn = daysFromNow(moon.nextFullMoon);
  const newIn = daysFromNow(moon.nextNewMoon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-6xl mb-2">{moon.phaseEmoji}</div>
      <div className="text-xs uppercase tracking-[0.25em] text-indigo-200/80">
        Sublunar point · live
      </div>
      <h2 className="text-3xl font-light text-white mt-1">{moon.phaseName}</h2>
      <div className="text-white/50 text-sm mt-1">
        Right now, the Moon is overhead at {moon.lat.toFixed(2)}°, {moon.lng.toFixed(2)}°
      </div>

      <div
        className="mt-5 px-5 py-4 rounded-xl border border-indigo-300/20 bg-indigo-300/[0.04]"
      >
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
          Illumination
        </div>
        <div className="text-4xl font-light text-white tabular-nums">
          {illumPct}%
        </div>
        <div className="text-white/55 text-xs mt-1">
          Day {moon.ageDays.toFixed(1)} of the lunar cycle (29.5 days)
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Distance from Earth" value={distance} />
        <Stat label="Latitude" value={`${moon.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${moon.lng.toFixed(2)}°`} />
        <Stat
          label="Next full moon"
          value={fullIn === 0 ? "tonight" : `in ${fullIn}d`}
        />
        <Stat
          label="Next new moon"
          value={newIn === 0 ? "today" : `in ${newIn}d`}
        />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        The Moon orbits Earth every ~27.3 days, but the synodic month (one
        cycle of phases) is ~29.5 days because Earth is also moving around the
        Sun. The Moon's distance varies between ~362,600 km (perigee) and
        ~405,400 km (apogee). It pulls Earth's oceans up by ~0.5 m at high
        tide.
      </div>

      <a
        href="https://moon.nasa.gov/moon-in-motion/moon-phases/"
        target="_blank"
        rel="noopener"
        className="mt-3 block text-sm text-indigo-200/80 hover:text-indigo-200 underline-offset-4 hover:underline"
      >
        NASA · Moon phases →
      </a>
    </motion.div>
  );
}
