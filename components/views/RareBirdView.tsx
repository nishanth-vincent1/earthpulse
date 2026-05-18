"use client";

import { motion } from "framer-motion";
import type { RareBird } from "@/lib/types";
import { Stat } from "./Stat";
import { IucnBadge, useIucnStatus } from "./_shared";

export function RareBirdView({ bird }: { bird: RareBird }) {
  const status = useIucnStatus(bird.scientific);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {!bird.photo && <div className="text-5xl mb-2">{bird.emoji ?? "🐦"}</div>}
      <div className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
        Rare bird sighting
      </div>
      <h2 className="text-3xl font-light text-white mt-1">{bird.common}</h2>
      <div className="text-white/50 text-sm italic mt-1">{bird.scientific}</div>
      {bird.photo && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={bird.photo}
          alt={bird.common}
          className="w-full mt-4 rounded-lg border border-white/10 max-h-64 object-cover"
        />
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {bird.reviewed ? (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-300/40 bg-emerald-300/[0.05]">
            <span className="text-[10px] tracking-widest uppercase text-emerald-200">
              ✓ Reviewer-confirmed
            </span>
          </div>
        ) : !bird.validated ? (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-300/40 bg-amber-300/[0.05]">
            <span className="text-[10px] tracking-widest uppercase text-amber-200">
              ⏳ Pending review
            </span>
          </div>
        ) : null}
        <IucnBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Count" value={bird.count.toString()} />
        <Stat
          label="Observed"
          value={new Date(bird.observed).toLocaleDateString()}
        />
        <Stat label="Latitude" value={`${bird.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${bird.lng.toFixed(2)}°`} />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
          Location
        </div>
        <p className="text-white/80 text-sm leading-relaxed">{bird.location}</p>
      </div>

      <div className="mt-6 text-[10px] text-white/30 leading-relaxed">
        Source · eBird (Cornell Lab of Ornithology). "Notable" sightings are
        flagged by editors as rare or unusual for the location and time of
        year. Last 14 days.
      </div>
    </motion.div>
  );
}
