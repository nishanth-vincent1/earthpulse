"use client";

import { motion } from "framer-motion";
import type { Disaster } from "@/lib/types";
import { Stat } from "./Stat";

const ICON: Record<string, string> = {
  EQ: "🪨",
  TC: "🌀",
  FL: "🌊",
  VO: "🌋",
  WF: "🔥",
  DR: "🏜",
};

export function DisasterView({ disaster }: { disaster: Disaster }) {
  const alertBgMap: Record<string, string> = {
    Red: "rgba(255,59,59,0.14)",
    Orange: "rgba(255,155,61,0.14)",
    Green: "rgba(122,211,107,0.12)",
  };
  const alertBg = alertBgMap[disaster.alert] ?? "rgba(255,255,255,0.06)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">{ICON[disaster.type] ?? "⚠"}</div>
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: disaster.color }}
      >
        {disaster.alert} alert · {disaster.typeName}
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {disaster.name}
      </h2>
      {disaster.country && (
        <div className="text-white/50 text-sm mt-1">{disaster.country}</div>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] tracking-widest uppercase"
          style={{
            borderColor: `${disaster.color}66`,
            background: alertBg,
            color: disaster.color,
          }}
        >
          {disaster.alert.toUpperCase()}
          {disaster.alertScore != null && (
            <> · score {disaster.alertScore.toFixed(1)}</>
          )}
        </span>
        {disaster.isCurrent && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyan-300/30 bg-cyan-300/[0.08] text-[10px] tracking-widest uppercase text-cyan-200">
            🔴 Active event
          </span>
        )}
        {disaster.severityText && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/15 bg-white/[0.05] text-[10px] tracking-widest uppercase text-white/80">
            📊 {disaster.severityText}
          </span>
        )}
        {disaster.source && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] tracking-widest uppercase text-white/60">
            via {disaster.source}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Latitude" value={`${disaster.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${disaster.lng.toFixed(2)}°`} />
        <Stat
          label="From"
          value={new Date(disaster.fromDate).toLocaleDateString()}
        />
        {disaster.toDate && (
          <Stat
            label="To"
            value={new Date(disaster.toDate).toLocaleDateString()}
          />
        )}
      </div>

      {disaster.affectedCountries && disaster.affectedCountries.length > 1 && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
            Affected countries
          </div>
          <div className="flex flex-wrap gap-1.5">
            {disaster.affectedCountries.map((c) => (
              <span
                key={c}
                className="text-[11px] px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-white/75"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {disaster.description && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
            Bulletin
          </div>
          <p className="text-white/75 text-sm leading-relaxed font-light">
            {disaster.description}
          </p>
        </div>
      )}

      {disaster.reportUrl && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <a
            href={disaster.reportUrl}
            target="_blank"
            rel="noopener"
            className="text-sm text-white/70 hover:text-white underline-offset-4 hover:underline"
          >
            Full GDACS report →
          </a>
        </div>
      )}

      <div className="mt-3 text-[10px] text-white/30 leading-relaxed">
        Source · GDACS (Global Disaster Alerting and Coordination System) ·
        alerts aggregated from USGS, JRC, GLOFAS, FEWS NET, and others.
      </div>
    </motion.div>
  );
}
