"use client";

import { motion } from "framer-motion";
import type { Cetacean } from "@/lib/types";
import { Stat } from "./Stat";
import { IucnBadge, useIucnStatus, formatObs } from "./_shared";

export function CetaceanView({ cetacean }: { cetacean: Cetacean }) {
  const obscured = cetacean.obscured === true;
  const status = useIucnStatus(cetacean.scientific);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🐋</div>
      <div className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">
        Cetacean sighting
      </div>
      <h2 className="text-3xl font-light text-white mt-1">{cetacean.common}</h2>
      <div className="text-white/50 text-sm italic mt-1">
        {cetacean.scientific}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {obscured && (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-300/30 bg-amber-300/[0.05]">
            <span className="text-[10px] tracking-widest uppercase text-amber-200/80">
              🛡 Sensitive · location obscured
            </span>
          </div>
        )}
        <IucnBadge status={status} />
      </div>
      {cetacean.photo && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={cetacean.photo}
          alt={cetacean.common}
          className="w-full mt-4 rounded-lg border border-white/10 max-h-64 object-cover"
        />
      )}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat
          label={obscured ? "Latitude (≈)" : "Latitude"}
          value={`${cetacean.lat.toFixed(2)}°`}
        />
        <Stat
          label={obscured ? "Longitude (≈)" : "Longitude"}
          value={`${cetacean.lng.toFixed(2)}°`}
        />
        {cetacean.observed && (
          <Stat
            label="Observed"
            value={formatObs(cetacean.observed, obscured)}
          />
        )}
        {cetacean.place && <Stat label="Place" value={cetacean.place} />}
      </div>
      <div className="mt-6 border-t border-white/10 pt-6">
        <a
          href={cetacean.uri}
          target="_blank"
          rel="noopener"
          className="text-sm text-cyan-300 hover:underline"
        >
          View on iNaturalist →
        </a>
      </div>
    </motion.div>
  );
}
