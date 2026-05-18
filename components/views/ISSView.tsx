"use client";

import { motion } from "framer-motion";
import type { ISS, Astro } from "@/lib/types";
import { Stat } from "./Stat";

export function ISSView({
  iss,
  liveIss,
  astros,
}: {
  iss: ISS;
  liveIss: ISS | null;
  astros: Astro[];
}) {
  const current = liveIss ?? iss;
  const orbitsPerDay = 15.5;
  const issAstros = astros.filter((a) =>
    /ISS|International/i.test(a.craft ?? ""),
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🛰️</div>
      <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
        Live · 408 km up · {orbitsPerDay} orbits/day
      </div>
      <h2 className="text-3xl font-light text-white mt-1">
        International Space Station
      </h2>
      <div className="text-white/50 text-sm mt-1">
        Currently over {current.lat.toFixed(2)}°, {current.lng.toFixed(2)}°
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Altitude" value={`${Math.round(current.alt)} km`} />
        <Stat
          label="Velocity"
          value={`${Math.round(current.velocity).toLocaleString()} km/h`}
        />
        <Stat label="Latitude" value={`${current.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${current.lng.toFixed(2)}°`} />
        <Stat label="Orbits / day" value={`${orbitsPerDay}`} />
        <Stat label="Crew on board" value={`${issAstros.length}`} />
      </div>

      {astros.length > 0 && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-3">
            {astros.length} humans in orbit right now
          </div>
          <ul className="space-y-1.5">
            {astros.map((a) => (
              <li
                key={`${a.name}-${a.craft}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-white/85">{a.name}</span>
                <span className="text-white/40 text-[11px] uppercase tracking-widest">
                  {a.craft}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        Source · wheretheiss.at (position) · Open Notify (crew). Position
        updates every 5 seconds. The ISS orbits Earth every ~93 minutes at
        ~28,000 km/h, low enough that residual atmosphere drags it down a
        couple of kilometers per month — periodic reboosts keep it up.
      </div>

      <a
        href="https://spotthestation.nasa.gov/sightings/"
        target="_blank"
        rel="noopener"
        className="mt-3 block text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
      >
        See it pass overhead from your location →
      </a>
    </motion.div>
  );
}
