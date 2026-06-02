"use client";

import { motion } from "framer-motion";

export type PulseData = {
  score: number;
  severity: "green" | "orange" | "red";
  color: string;
  signals: {
    quakeCount: number;
    quakeSum: number;
    gdacsRed: number;
    gdacsOrange: number;
    gdacsGreen: number;
    hurricaneCount: number;
    wildfires: number;
    volcanoes: number;
    severeStorms: number;
    waqiUnhealthy: number;
    waqiTotal: number;
  };
};

function fmt(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(0)}K`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function HeartRate({ pulse }: { pulse: PulseData | null }) {
  if (!pulse) {
    return (
      <div className="pointer-events-none">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
          Earth's pulse
        </div>
        <div className="flex items-center gap-2">
          <div className="text-white/30 text-base leading-none">♥</div>
          <div className="text-white/40 text-lg font-light tabular-nums leading-none">
            —
          </div>
        </div>
        <div className="text-[9px] text-white/30 mt-1">measuring…</div>
      </div>
    );
  }

  const beatDuration = 60 / pulse.score;
  const sig = pulse.signals;
  const severityLabel =
    pulse.severity === "red"
      ? "Stressed"
      : pulse.severity === "orange"
        ? "Active"
        : "Calm";

  return (
    <div className="pointer-events-none">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
        Earth's pulse
      </div>
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.25, 1] }}
          transition={{
            duration: beatDuration,
            repeat: Infinity,
            times: [0, 0.18, 1],
            ease: "easeOut",
          }}
          style={{ color: pulse.color }}
          className="text-base leading-none"
        >
          ♥
        </motion.div>
        <div
          className="text-lg font-light tabular-nums leading-none"
          style={{ color: pulse.color }}
        >
          {pulse.score}
        </div>
        <div
          className="text-[10px] tracking-widest uppercase"
          style={{ color: pulse.color, opacity: 0.7 }}
        >
          {severityLabel}
        </div>
      </div>
      <div className="text-[9px] text-white/40 mt-1 leading-snug">
        {sig.quakeCount > 0 && (
          <>
            🪨 {fmt(sig.quakeCount)} M5+ quakes
            {sig.quakeSum > 0 && (
              <span className="text-white/30">
                {" "}
                ({Math.round(sig.quakeSum * 10) / 10} ΣM)
              </span>
            )}{" "}
            ·{" "}
          </>
        )}
        {(sig.gdacsRed > 0 || sig.gdacsOrange > 0) && (
          <>
            ⚠{" "}
            {sig.gdacsRed > 0 && (
              <span className="text-red-300">{sig.gdacsRed}R</span>
            )}
            {sig.gdacsRed > 0 && sig.gdacsOrange > 0 && " "}
            {sig.gdacsOrange > 0 && (
              <span className="text-orange-300">{sig.gdacsOrange}O</span>
            )}{" "}
            disasters ·{" "}
          </>
        )}
        {sig.hurricaneCount > 0 && (
          <>🌀 {sig.hurricaneCount} cat 3+ hurricane{sig.hurricaneCount === 1 ? "" : "s"} · </>
        )}
        {sig.wildfires > 0 && <>🔥 {fmt(sig.wildfires)} major fires · </>}
        {sig.volcanoes > 0 && <>🌋 {sig.volcanoes} volcanoes · </>}
        {sig.waqiTotal > 0 && (
          <>
            💨 {fmt(sig.waqiUnhealthy)}/{fmt(sig.waqiTotal)} unhealthy AQ
          </>
        )}
      </div>
      <div className="text-[9px] text-white/25 mt-1.5 leading-relaxed max-w-[280px]">
        Significant events only · M5+ quakes, red/orange disasters,
        cat 3+ hurricanes, ≥100MW wildfires
      </div>
    </div>
  );
}
