"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Launch } from "@/lib/types";
import { Stat } from "./Stat";

export function LaunchView({ launch }: { launch: Launch }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(launch.net).getTime() - Date.now();
  const past = ms < 0;
  const abs = Math.abs(ms);
  const d = Math.floor(abs / 86400000);
  const h = Math.floor((abs % 86400000) / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  const countdown = d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
  void tick;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-xs uppercase tracking-[0.25em] text-amber-300">
        🚀 Upcoming launch
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {launch.name}
      </h2>
      {launch.image && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={launch.image}
          alt={launch.name}
          className="w-full mt-4 rounded-lg border border-white/10 max-h-48 object-cover"
        />
      )}
      <div className="mt-5 px-4 py-3 border border-amber-300/30 rounded-lg bg-amber-300/[0.04]">
        <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300/70 mb-1">
          {past ? "Lifted off" : "T minus"}
        </div>
        <div className="text-2xl font-light text-white tabular-nums">
          {countdown}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <Stat label="Provider" value={launch.provider} />
        <Stat label="Rocket" value={launch.rocket} />
        <Stat label="Pad" value={launch.pad} />
        {launch.orbit && <Stat label="Orbit" value={launch.orbit} />}
        <Stat label="Status" value={launch.status} />
      </div>
      {launch.mission && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
            Mission
          </div>
          <p className="text-white/75 text-sm leading-relaxed font-light">
            {launch.mission}
          </p>
        </div>
      )}
    </motion.div>
  );
}
