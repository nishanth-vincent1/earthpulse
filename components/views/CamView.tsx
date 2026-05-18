"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Cam, CamType } from "@/lib/types";
import { Stat } from "./Stat";

export function CamView({ cam }: { cam: Cam }) {
  const [bust, setBust] = useState(0);
  useEffect(() => {
    if (cam.type !== "live-image" || !cam.thumbnail) return;
    const t = setInterval(() => setBust((b) => b + 1), 5000);
    return () => clearInterval(t);
  }, [cam.type, cam.thumbnail]);

  const thumbSrc =
    cam.type === "live-image" && cam.thumbnail
      ? `${cam.thumbnail}${cam.thumbnail.includes("?") ? "&" : "?"}t=${bust}`
      : null;

  const catColor: Record<string, string> = {
    volcano: "#ff6a3d",
    aurora: "#7afba7",
    wildlife: "#a8d68f",
    urban: "#ffe16a",
    space: "#a3e8ff",
    nature: "#7be4ff",
    polar: "#e8e2c7",
    geothermal: "#ff9b3d",
    astronomy: "#cdb4ff",
    highway: "#fda4af",
  };

  const typeMeta: Record<
    CamType,
    { dot: string; bg: string; text: string; label: string; cta: string }
  > = {
    livestream: {
      dot: "bg-rose-400",
      bg: "bg-rose-300/[0.05] border-rose-300/40",
      text: "text-rose-200",
      label: "Live stream",
      cta: "Open live stream →",
    },
    "live-image": {
      dot: "bg-cyan-300",
      bg: "bg-cyan-300/[0.05] border-cyan-300/40",
      text: "text-cyan-200",
      label: "Live image · refreshes every 5s",
      cta: "Open source →",
    },
    seasonal: {
      dot: "bg-amber-300",
      bg: "bg-amber-300/[0.05] border-amber-300/40",
      text: "text-amber-200",
      label: "Seasonal",
      cta: "Open source →",
    },
    "info-page": {
      dot: "bg-white/40",
      bg: "bg-white/[0.05] border-white/20",
      text: "text-white/80",
      label: "Curated link · stream lives at the source",
      cta: "Open page →",
    },
  };
  const meta = typeMeta[cam.type] ?? typeMeta["info-page"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: catColor[cam.category] ?? "#fda4af" }}
      >
        📷 {cam.category}
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {cam.name}
      </h2>

      <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
        <span
          className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${cam.type === "livestream" ? "animate-pulse" : ""}`}
        />
        <span className="text-[10px] tracking-widest uppercase text-white/70">
          {meta.label}
        </span>
      </div>

      {cam.seasonalNote && (
        <div className="mt-3 text-[11px] text-amber-200/80 leading-relaxed">
          ⚠ {cam.seasonalNote}
        </div>
      )}

      {thumbSrc ? (
        <div className="mt-4 relative rounded-lg overflow-hidden border border-white/10 bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbSrc}
            alt={cam.name}
            className="w-full max-h-72 object-cover"
          />
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
            <span className="text-[10px] text-white tracking-widest uppercase">
              Live image · 5s
            </span>
          </div>
        </div>
      ) : (
        <div
          className="mt-4 rounded-lg border border-white/10 px-4 py-8 text-center"
          style={{
            background: `linear-gradient(135deg, ${catColor[cam.category] ?? "#fda4af"}22, transparent)`,
          }}
        >
          <div className="text-4xl mb-2">📷</div>
          <div className="text-white/50 text-xs">
            {cam.type === "livestream"
              ? "Click below to open the live video"
              : cam.type === "seasonal"
                ? "Best viewed in season"
                : "Stream lives at the source"}
          </div>
        </div>
      )}

      <p className="mt-5 text-white/75 text-sm leading-relaxed font-light">
        {cam.description}
      </p>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <Stat label="Latitude" value={`${cam.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${cam.lng.toFixed(2)}°`} />
      </div>

      <a
        href={cam.stream}
        target="_blank"
        rel="noopener"
        className={`mt-6 block text-center px-4 py-3 rounded-lg border ${meta.bg} ${meta.text} hover:opacity-80 transition-opacity text-sm uppercase tracking-[0.2em] font-medium`}
      >
        {meta.cta}
      </a>
    </motion.div>
  );
}
