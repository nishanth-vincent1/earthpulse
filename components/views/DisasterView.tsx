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
      <div className="mt-6 text-[10px] text-white/30 leading-relaxed">
        Source · GDACS (Global Disaster Alerting and Coordination System)
      </div>
    </motion.div>
  );
}
