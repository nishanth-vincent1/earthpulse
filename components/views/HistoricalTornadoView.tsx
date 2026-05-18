"use client";

import { motion } from "framer-motion";
import type { HistoricalTornado } from "@/lib/types";
import { Stat } from "./Stat";

const EF_COLOR = (ef: number) => {
  if (ef >= 5) return "#9c27e3";
  if (ef === 4) return "#ff3030";
  if (ef === 3) return "#ff7a30";
  if (ef === 2) return "#ffba30";
  if (ef === 1) return "#ffe16a";
  return "#9bd2ff";
};

const EF_BLURB: Record<number, string> = {
  0: "Light damage · 65–85 mph winds. Tree branches snapped, signs damaged.",
  1: "Moderate damage · 86–110 mph. Roof shingles peeled, mobile homes damaged.",
  2: "Considerable damage · 111–135 mph. Roofs torn off, mobile homes destroyed, large trees uprooted.",
  3: "Severe damage · 136–165 mph. Entire stories of well-built homes destroyed, heavy cars lifted off ground.",
  4: "Devastating damage · 166–200 mph. Well-built homes leveled, structures with weak foundations blown some distance.",
  5: "Incredible damage · 200+ mph. Strong frame houses leveled and swept away, trees debarked.",
};

export function HistoricalTornadoView({
  tornado,
}: {
  tornado: HistoricalTornado;
}) {
  const efLabel = tornado.ef >= 0 ? `EF${tornado.ef}` : "Unrated";
  const color = tornado.ef >= 0 ? EF_COLOR(tornado.ef) : "#9ca3af";
  const blurb = tornado.ef >= 0 ? EF_BLURB[tornado.ef] : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🌪</div>
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color }}
      >
        Historic tornado · {efLabel}
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {tornado.state} · {tornado.date}
      </h2>

      <div
        className="mt-5 px-5 py-4 rounded-xl border"
        style={{
          borderColor: color + "55",
          background: `linear-gradient(135deg, ${color}22, transparent)`,
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
          Fujita rating
        </div>
        <div className="text-4xl font-light" style={{ color }}>
          {efLabel}
        </div>
        {blurb && (
          <p className="text-white/75 text-sm leading-relaxed font-light mt-2">
            {blurb}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat
          label="Path length"
          value={`${tornado.lengthMi.toFixed(1)} mi`}
        />
        <Stat label="Path width" value={`${tornado.widthYd} yd`} />
        <Stat
          label="Fatalities"
          value={tornado.fat > 0 ? tornado.fat.toLocaleString() : "—"}
        />
        <Stat
          label="Injuries"
          value={tornado.inj > 0 ? tornado.inj.toLocaleString() : "—"}
        />
        <Stat
          label="Start"
          value={`${tornado.slat.toFixed(2)}°, ${tornado.slon.toFixed(2)}°`}
        />
        <Stat
          label="End"
          value={`${tornado.elat.toFixed(2)}°, ${tornado.elon.toFixed(2)}°`}
        />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        Source · NOAA SPC Severe Weather Database. The Fujita scale (F)
        rated tornadoes 1950-2007; the Enhanced Fujita scale (EF) replaced it
        in 2007 with damage-based criteria. US-only — comprehensive global
        tornado data does not exist.
      </div>
    </motion.div>
  );
}
