"use client";

import { motion } from "framer-motion";
import type { Fire } from "@/lib/types";
import { Stat } from "./Stat";

export function FireView({ fire }: { fire: Fire }) {
  const isEonet = !!fire.title;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🔥</div>
      <div className="text-xs uppercase tracking-[0.25em] text-orange-300">
        Active wildfire
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {fire.title ?? "Fire detection"}
      </h2>
      {isEonet && (
        <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-300/30 bg-amber-300/[0.05]">
          <span className="text-[10px] tracking-widest uppercase text-amber-200/80">
            ⚠ US-only feed · EONET fallback
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Latitude" value={`${fire.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${fire.lng.toFixed(2)}°`} />
        {fire.date && (
          <Stat
            label="Reported"
            value={new Date(fire.date).toLocaleDateString()}
          />
        )}
        {!isEonet && fire.bright != null && (
          <Stat
            label="Brightness"
            value={`${Math.round(fire.bright)} K`}
          />
        )}
        {!isEonet && fire.frp != null && (
          <Stat
            label="Fire power"
            value={`${Math.round(fire.frp)} MW`}
          />
        )}
      </div>

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
          "Source · NASA FIRMS (VIIRS satellite hot pixel). Brightness in Kelvin; Fire Radiative Power in megawatts. Updated every ~3 hours."
        )}
      </div>

      {fire.link && (
        <div className="mt-6">
          <a
            href={fire.link}
            target="_blank"
            rel="noopener"
            className="text-sm text-orange-300 hover:underline"
          >
            View on NASA EONET →
          </a>
        </div>
      )}
    </motion.div>
  );
}
