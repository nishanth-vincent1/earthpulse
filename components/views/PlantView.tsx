"use client";

import { motion } from "framer-motion";
import type { Plant } from "@/lib/types";
import { Stat } from "./Stat";
import { IucnBadge, useIucnStatus, formatObs } from "./_shared";

export function PlantView({ plant }: { plant: Plant }) {
  const obscured = plant.obscured === true;
  const status = useIucnStatus(plant.scientific);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">{plant.emoji}</div>
      <div className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">
        Threatened plant · {plant.group}
      </div>
      <h2 className="text-3xl font-light text-white mt-1">{plant.common}</h2>
      <div className="text-white/50 text-sm italic mt-1">
        {plant.scientific}
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
      {plant.photo && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={plant.photo}
          alt={plant.common}
          className="w-full mt-4 rounded-lg border border-white/10 max-h-64 object-cover"
        />
      )}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat
          label={obscured ? "Latitude (≈)" : "Latitude"}
          value={`${plant.lat.toFixed(2)}°`}
        />
        <Stat
          label={obscured ? "Longitude (≈)" : "Longitude"}
          value={`${plant.lng.toFixed(2)}°`}
        />
        {plant.observed && (
          <Stat
            label="Observed"
            value={formatObs(plant.observed, obscured)}
          />
        )}
        {plant.place && <Stat label="Place" value={plant.place} />}
      </div>
      <div className="mt-6 border-t border-white/10 pt-6">
        <a
          href={plant.uri}
          target="_blank"
          rel="noopener"
          className="text-sm text-emerald-300 hover:underline"
        >
          View on iNaturalist →
        </a>
      </div>
      <div className="mt-3 text-[10px] text-white/30 leading-relaxed">
        Research-grade observation · iNaturalist (CC contributors). Only
        threatened plant taxa are shown here. About 40% of the world's plant
        species are at some level of extinction risk.
        {obscured && (
          <>
            {" "}
            iNaturalist obscures exact location and date for sensitive species
            to protect them from poachers.
          </>
        )}
      </div>
    </motion.div>
  );
}
