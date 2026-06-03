"use client";

import { motion } from "framer-motion";
import type { LightningStrike } from "@/lib/types";
import { Stat } from "./Stat";

function secondsAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "—";
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 90) return `${s} seconds ago`;
  return `${Math.round(s / 60)} min ago`;
}

// flash_energy is a relative optical-energy count, not calibrated joules — so
// we describe it qualitatively rather than pretending it's a physical unit.
function energyTier(e: number): { label: string; color: string } {
  if (e >= 500) return { label: "Very bright flash", color: "#ffffff" };
  if (e >= 150) return { label: "Bright flash", color: "#dbeeff" };
  if (e >= 40) return { label: "Moderate flash", color: "#bfe6ff" };
  return { label: "Faint flash", color: "#9fc7e8" };
}

export function LightningView({ strike }: { strike: LightningStrike }) {
  const tier = energyTier(strike.energy);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">⚡</div>
      <div className="text-xs uppercase tracking-[0.25em] text-sky-200/80">
        Lightning flash · {strike.sat} GLM
      </div>
      <h2
        className="text-2xl font-light mt-1 leading-snug"
        style={{ color: tier.color }}
      >
        {tier.label}
      </h2>
      <div className="text-white/50 text-sm mt-1">
        Detected {secondsAgo(strike.time)}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Latitude" value={`${strike.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${strike.lng.toFixed(2)}°`} />
        <Stat label="Relative energy" value={`${Math.round(strike.energy)}`} />
        <Stat label="Detected by" value={strike.sat} />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
          What you&apos;re seeing
        </div>
        <p className="text-sm text-white/70 leading-relaxed">
          The Geostationary Lightning Mapper (GLM) is a camera aboard NOAA&apos;s
          GOES weather satellites that stares at the Western Hemisphere from
          ~36,000 km up and records the optical flash of lightning — in-cloud and
          cloud-to-ground alike — day and night, about 500 times per second. Each
          point here is a single <em>flash</em> detected in the last ~40 seconds.
        </p>
      </div>

      <div className="mt-4 border border-white/10 rounded-xl p-4 bg-white/[0.02]">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
          Coverage
        </div>
        <p className="text-sm text-white/70 leading-relaxed">
          GOES-East (GOES-19) and GOES-West (GOES-18) together see the Americas,
          the Atlantic, and the eastern Pacific — roughly a full hemisphere.
          Lightning over Europe, Africa, and Asia falls outside the GOES field of
          view and won&apos;t appear here.
        </p>
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 flex flex-col gap-2">
        <a
          href="https://www.goes-r.gov/spacesegment/glm.html"
          target="_blank"
          rel="noopener"
          className="text-sm text-sky-300 hover:underline"
        >
          About the GOES Lightning Mapper →
        </a>
      </div>

      <div className="mt-3 text-[10px] text-white/30 leading-relaxed">
        Source · NOAA GOES-R GLM L2 (LCFA) via the NOAA Open Data Dissemination
        program on AWS. New observations every 20 seconds. Public domain.
      </div>
    </motion.div>
  );
}
