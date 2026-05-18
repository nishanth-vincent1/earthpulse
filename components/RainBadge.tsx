"use client";

import { useEffect, useState } from "react";

export type RainFrame = { time: number; tile0: string; tile1: string };

export function useRainFrames(enabled: boolean) {
  const [frames, setFrames] = useState<RainFrame[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch("/api/rain")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setFrames(d.frames ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return frames;
}

export function RainPill({
  frames,
  onClick,
}: {
  frames: RainFrame[];
  onClick: () => void;
}) {
  if (frames.length === 0) return null;
  const latest = frames[frames.length - 1];
  return (
    <button
      onClick={onClick}
      className="pointer-events-auto fixed top-20 right-6 z-30 group flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full pl-1 pr-3 py-1 hover:border-cyan-200/40 transition-colors cursor-pointer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={latest.tile0}
        alt=""
        className="w-7 h-7 rounded-full object-cover bg-slate-900"
      />
      <div className="text-left">
        <div className="text-[9px] uppercase tracking-[0.2em] text-cyan-200/60 leading-none">
          RainViewer · live
        </div>
        <div className="text-[11px] text-white/80 leading-tight">
          Global radar
        </div>
      </div>
    </button>
  );
}
