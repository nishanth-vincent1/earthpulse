"use client";

import { useEffect, useRef, useState } from "react";

export function YearScrubber({
  active,
  year,
  onChange,
  summary,
  loading,
}: {
  active: boolean;
  year: number;
  onChange: (y: number) => void;
  summary: string;
  loading: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);
  const lastTick = useRef<number>(0);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!playing) return;
    function tick(now: number) {
      const dt = now - (lastTick.current || now);
      lastTick.current = now;
      if (dt > 600) {
        if (year >= currentYear) {
          setPlaying(false);
          return;
        }
        onChange(year + 1);
        lastTick.current = now;
      }
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      lastTick.current = 0;
    };
  }, [playing, year, currentYear, onChange]);

  if (!active) return null;

  const progress = (year - 1900) / (currentYear - 1900);

  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-[680px] max-w-[calc(100vw-220px)] bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-3">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => {
            if (year >= currentYear) onChange(1900);
            setPlaying((p) => !p);
          }}
          className="w-8 h-8 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer text-xs"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-white/50 mb-1 font-mono tabular-nums">
            <span className="text-amber-200/70 text-base font-light leading-none">
              {year}
            </span>
            <span>
              {loading ? "loading…" : summary || "no historical layers on"}
            </span>
          </div>
          <input
            type="range"
            min={1900}
            max={currentYear}
            value={year}
            step={1}
            onChange={(e) => {
              setPlaying(false);
              onChange(parseInt(e.target.value, 10));
            }}
            className="w-full h-1 bg-white/15 rounded-full appearance-none cursor-pointer accent-amber-300"
            style={{
              background: `linear-gradient(to right, rgba(251,191,36,0.6) ${progress * 100}%, rgba(255,255,255,0.15) ${progress * 100}%)`,
            }}
          />
        </div>
      </div>
      <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 text-center">
        Time travel · 1900 → {currentYear}
      </div>
    </div>
  );
}
