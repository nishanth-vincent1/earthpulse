"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { RainFrame } from "@/components/RainBadge";

export function RainView({ frames }: { frames: RainFrame[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (frames.length === 0) return;
    setIdx(0);
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % frames.length);
    }, 600);
    return () => clearInterval(t);
  }, [frames.length]);

  if (frames.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="text-5xl mb-2">🌧</div>
        <div className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">
          Loading radar…
        </div>
      </motion.div>
    );
  }

  const current = frames[idx];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🌧</div>
      <div className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">
        Global precipitation radar · live
      </div>
      <h2 className="text-2xl font-light text-white mt-1">
        Last {Math.round((frames.length * 10) / 60) || 1} hours of rain on Earth
      </h2>

      <div className="relative aspect-square mt-5 bg-slate-950 rounded-xl overflow-hidden border border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="//unpkg.com/three-globe/example/img/earth-night.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.time}
          src={current.tile0}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/70">
            {new Date(current.time).toUTCString().slice(5, 22)} UTC
          </div>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-300 transition-all"
              style={{
                width: `${((idx + 1) / frames.length) * 100}%`,
              }}
            />
          </div>
          <div className="text-[10px] text-white/50 tabular-nums">
            {idx + 1}/{frames.length}
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        Source · RainViewer global radar network — meteorological radar from
        over 1,000 sites worldwide. {frames.length} frames at 10-minute
        intervals, refreshed every 5 minutes.
      </div>
      <a
        href="https://www.rainviewer.com"
        target="_blank"
        rel="noopener"
        className="mt-3 block text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
      >
        Open RainViewer →
      </a>
    </motion.div>
  );
}
