"use client";

import { useEffect, useRef, useState } from "react";

export function TimeScrubber({
  active,
  rangeStart,
  rangeEnd,
  scrubT,
  onChange,
  countNow,
  countTotal,
}: {
  active: boolean;
  rangeStart: number;
  rangeEnd: number;
  scrubT: number;
  onChange: (t: number) => void;
  countNow: number;
  countTotal: number;
}) {
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);
  const lastTick = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;

    function tick(now: number) {
      const dt = now - (lastTick.current || now);
      lastTick.current = now;
      const speed = (rangeEnd - rangeStart) / 30000;
      const next = scrubT + dt * speed;
      if (next >= rangeEnd) {
        onChange(rangeEnd);
        setPlaying(false);
        return;
      }
      onChange(next);
      raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      lastTick.current = 0;
    };
  }, [playing, scrubT, rangeStart, rangeEnd, onChange]);

  if (!active) return null;

  const progress = (scrubT - rangeStart) / (rangeEnd - rangeStart);
  const date = new Date(scrubT);
  const hoursAgo = (rangeEnd - scrubT) / 3_600_000;

  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-[640px] max-w-[calc(100vw-220px)] bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-3">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => {
            if (scrubT >= rangeEnd) {
              onChange(rangeStart);
            }
            setPlaying((p) => !p);
          }}
          className="w-8 h-8 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer text-xs"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-white/50 mb-1 font-mono tabular-nums">
            <span>{date.toUTCString().slice(5, 22)} UTC</span>
            <span>
              {hoursAgo < 0.05
                ? "now"
                : `${hoursAgo.toFixed(1)}h ago`}{" "}
              · <span className="text-rose-300">{countNow}</span>/{countTotal} quakes
            </span>
          </div>
          <input
            type="range"
            min={rangeStart}
            max={rangeEnd}
            value={scrubT}
            step={60_000}
            onChange={(e) => {
              setPlaying(false);
              onChange(parseInt(e.target.value, 10));
            }}
            className="w-full h-1 bg-white/15 rounded-full appearance-none cursor-pointer accent-rose-400"
            style={{
              background: `linear-gradient(to right, rgba(244,114,182,0.6) ${progress * 100}%, rgba(255,255,255,0.15) ${progress * 100}%)`,
            }}
          />
        </div>
      </div>
      <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 text-center">
        Replay · last 24 hours of seismic activity
      </div>
    </div>
  );
}
