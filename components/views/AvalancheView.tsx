"use client";

import { motion } from "framer-motion";
import type { Avalanche } from "@/lib/types";

export function AvalancheView({ zone }: { zone: Avalanche }) {
  const dangerLabel = zone.danger.charAt(0).toUpperCase() + zone.danger.slice(1);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🏔</div>
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: zone.color }}
      >
        Avalanche danger · {dangerLabel}
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {zone.name}
      </h2>
      <div className="text-white/50 text-sm mt-1">
        {zone.center} · {zone.state}
      </div>

      <div
        className="mt-5 px-5 py-4 rounded-xl border"
        style={{
          borderColor: zone.color + "55",
          background: `linear-gradient(135deg, ${zone.color}22, transparent)`,
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
          Today's rating
        </div>
        <div
          className="text-3xl font-light"
          style={{ color: zone.color }}
        >
          {dangerLabel}
        </div>
      </div>

      {zone.travelAdvice && (
        <div className="mt-5 border-t border-white/10 pt-5">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
            Travel advice
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            {zone.travelAdvice}
          </p>
        </div>
      )}

      <div className="mt-6 text-[11px] text-white/55 leading-relaxed">
        Source · avalanche.org (US Forest Service Avalanche Centers). Five-tier
        North American scale: Low · Moderate · Considerable · High · Extreme.
        Active during the snow season; many zones show "no rating" in summer.
      </div>
      {zone.forecastUrl && (
        <a
          href={zone.forecastUrl}
          target="_blank"
          rel="noopener"
          className="mt-3 block text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
        >
          Full forecast →
        </a>
      )}
    </motion.div>
  );
}
