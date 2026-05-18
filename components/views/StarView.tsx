"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Star } from "@/lib/types";
import { Stat } from "./Stat";

function spectralLabel(cls: string): string {
  const c = cls[0]?.toUpperCase() ?? "";
  if (c === "O") return "Blue";
  if (c === "B") return "Blue-white";
  if (c === "A") return "White";
  if (c === "F") return "Yellow-white";
  if (c === "G") return "Yellow";
  if (c === "K") return "Orange";
  if (c === "M") return "Red";
  return "—";
}

export function StarView({ star }: { star: Star }) {
  const [overhead, setOverhead] = useState<{
    country: string | null;
    flag: string | null;
    isOcean: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/place?lat=${star.lat}&lng=${star.lng}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setOverhead({
          country: d.place?.country ?? null,
          flag: d.country?.flag ?? null,
          isOcean: !!d.place?.isOcean,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [star.lat, star.lng]);

  const overheadLabel = !overhead
    ? "Locating…"
    : overhead.isOcean
      ? "Over open ocean"
      : `${overhead.flag ?? ""} ${overhead.country ?? "—"}`.trim();

  const lightYears =
    star.distanceLy >= 1000
      ? `${(star.distanceLy / 1000).toFixed(1)}k ly`
      : `${star.distanceLy} ly`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">⭐</div>
      <div className="text-xs uppercase tracking-[0.25em] text-indigo-200/80">
        Substellar point · live
      </div>
      <h2 className="text-3xl font-light text-white mt-1">{star.name}</h2>
      <div className="text-white/50 text-sm mt-1">
        {star.constellation} · directly overhead at {overheadLabel} right now
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Magnitude" value={star.mag.toFixed(2)} />
        <Stat label="Distance" value={lightYears} />
        <Stat label="Spectral class" value={star.spectralClass} />
        <Stat label="Color" value={spectralLabel(star.spectralClass)} />
        <Stat label="Latitude" value={`${star.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${star.lng.toFixed(2)}°`} />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 text-[12px] text-white/75 leading-relaxed font-light">
        {star.blurb}
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        The substellar point is the spot on Earth where this star is exactly
        overhead — at the zenith. Earth's rotation moves it ~15°
        westward each hour. The star appears at the same RA/Dec on the
        celestial sphere; the globe rotates beneath it.
      </div>
      <a
        href={`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(star.name + " star")}`}
        target="_blank"
        rel="noopener"
        className="mt-3 block text-sm text-indigo-200/80 hover:text-indigo-200 underline-offset-4 hover:underline"
      >
        Read on Wikipedia →
      </a>
    </motion.div>
  );
}
