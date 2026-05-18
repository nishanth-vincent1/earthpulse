"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Stat } from "./Stat";
import { dayLength } from "./_shared";

export function SunView({
  liveSun,
  now,
}: {
  liveSun: { lat: number; lng: number };
  now: number;
}) {
  const [overhead, setOverhead] = useState<{
    country: string | null;
    countryCode: string | null;
    flag: string | null;
    isOcean: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/place?lat=${liveSun.lat}&lng=${liveSun.lng}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setOverhead({
          country: d.place?.country ?? null,
          countryCode: d.place?.countryCode ?? null,
          flag: d.country?.flag ?? null,
          isOcean: !!d.place?.isOcean,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [liveSun.lat, liveSun.lng]);

  const declination = liveSun.lat;
  const date = new Date(now);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - yearStart) / 86_400_000);

  const season = (() => {
    if (declination > 20) return "Northern summer · near solstice";
    if (declination > 5) return "Northern late spring / early summer";
    if (declination > -5) return "Near equinox";
    if (declination > -20) return "Northern late autumn / early winter";
    return "Northern winter · near solstice";
  })();

  const equinoxes = [80, 173, 266, 355];
  let next = equinoxes.find((d) => d > dayOfYear);
  if (next == null) next = equinoxes[0] + 365;
  const daysToNext = next - dayOfYear;
  const nextLabel =
    next % 365 === 80
      ? "March equinox"
      : next % 365 === 173
        ? "June solstice"
        : next % 365 === 266
          ? "September equinox"
          : "December solstice";

  const overheadLabel = !overhead
    ? "Locating…"
    : overhead.isOcean
      ? "Over open ocean"
      : `${overhead.flag ?? ""} ${overhead.country ?? "—"}`.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">☀️</div>
      <div className="text-xs uppercase tracking-[0.25em] text-amber-200/80">
        Subsolar point · live
      </div>
      <h2 className="text-3xl font-light text-white mt-1">
        Where the sun is overhead
      </h2>
      <div className="text-white/50 text-sm mt-1">
        Right now, directly above {overheadLabel}.
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Latitude" value={`${liveSun.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${liveSun.lng.toFixed(2)}°`} />
        <Stat
          label="Declination"
          value={`${declination >= 0 ? "+" : ""}${declination.toFixed(2)}°`}
        />
        <Stat label="Day of year" value={`${dayOfYear} / 365`} />
        <Stat label={`Next ${nextLabel}`} value={`${daysToNext}d`} />
        <Stat label="Sun moves" value="~15° west / hr" />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        {season}. The subsolar point is the spot where the sun is exactly
        overhead — the only place on Earth right now where a vertical pole
        casts no shadow. It traces a sine wave between the Tropic of Cancer
        (+23.5°) and Tropic of Capricorn (−23.5°) over the year, and crosses
        the equator at the equinoxes.
      </div>

      <div className="mt-3 text-[11px] text-white/55 leading-relaxed">
        At the subsolar point, day length is {dayLength(declination, declination).toFixed(1)}h. At the equator
        it&apos;s 12.0h year-round. At {(60).toFixed(0)}°N, day length today is{" "}
        {dayLength(60, declination).toFixed(1)}h.
      </div>

      <a
        href="https://www.timeanddate.com/worldclock/sunearth.html"
        target="_blank"
        rel="noopener"
        className="mt-3 block text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
      >
        Sunrise / sunset everywhere on Earth →
      </a>
    </motion.div>
  );
}
