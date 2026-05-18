"use client";

import { motion } from "framer-motion";
import type { Ship } from "@/lib/types";
import { Stat } from "./Stat";

export function ShipView({ ship }: { ship: Ship }) {
  const knots = ship.sog ?? 0;
  const headingDeg = ship.heading < 511 ? ship.heading : ship.cog;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🚢</div>
      <div className="text-xs uppercase tracking-[0.25em] text-cyan-300">
        Live vessel · AIS
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {ship.name}
      </h2>
      <div className="text-white/50 text-sm font-mono mt-1">
        MMSI {ship.mmsi}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Speed" value={`${knots.toFixed(1)} kt`} />
        <Stat label="Heading" value={`${Math.round(headingDeg)}°`} />
        <Stat label="Latitude" value={`${ship.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${ship.lng.toFixed(2)}°`} />
        {ship.time && (
          <Stat
            label="Reported"
            value={new Date(ship.time).toLocaleString()}
          />
        )}
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        Source · AISStream.io · live vessel positions broadcast over AIS
        (Automatic Identification System) by ships ≥300 GT, all passenger
        vessels, and most commercial fishing boats globally.
      </div>
      <a
        href={`https://www.marinetraffic.com/en/ais/details/ships/mmsi:${ship.mmsi}`}
        target="_blank"
        rel="noopener"
        className="mt-3 block text-sm text-cyan-300 hover:underline"
      >
        Look up on MarineTraffic →
      </a>
    </motion.div>
  );
}
