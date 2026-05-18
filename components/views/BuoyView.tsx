"use client";

import { motion } from "framer-motion";
import type { Buoy, BuoyReadings } from "@/lib/types";
import { Stat } from "./Stat";

export function BuoyView({
  buoy,
  readings,
  loading,
}: {
  buoy: Buoy;
  readings: BuoyReadings | null;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">{buoy.dart ? "⚠" : "🛟"}</div>
      <div className="text-xs uppercase tracking-[0.25em] text-cyan-300">
        {buoy.dart ? "DART tsunami buoy" : "Ocean buoy"}
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {buoy.name || `Station ${buoy.id}`}
      </h2>
      <div className="text-white/50 text-sm mt-1">
        NDBC #{buoy.id} · {buoy.owner}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Latitude" value={`${buoy.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${buoy.lng.toFixed(2)}°`} />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
          Real-time readings
        </div>

        {loading && <div className="text-white/40 text-sm">connecting…</div>}

        {!loading && !readings && (
          <div className="text-white/40 text-sm">
            No real-time data published by this station.
          </div>
        )}

        {readings && (
          <>
            <div className="text-[10px] text-white/40 mb-3 font-mono">
              observed {readings.observed}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {readings.waveHeight !== null && (
                <Stat label="Wave height" value={`${readings.waveHeight} m`} />
              )}
              {readings.dominantPeriod !== null && (
                <Stat
                  label="Dominant period"
                  value={`${readings.dominantPeriod}s`}
                />
              )}
              {readings.windSpeed !== null && (
                <Stat
                  label="Wind"
                  value={`${(readings.windSpeed * 1.94384).toFixed(0)} kt`}
                />
              )}
              {readings.windDir !== null && (
                <Stat label="Wind dir" value={`${readings.windDir}°`} />
              )}
              {readings.gust !== null && (
                <Stat
                  label="Gust"
                  value={`${(readings.gust * 1.94384).toFixed(0)} kt`}
                />
              )}
              {readings.waterTemp !== null && (
                <Stat label="Water temp" value={`${readings.waterTemp}°C`} />
              )}
              {readings.airTemp !== null && (
                <Stat label="Air temp" value={`${readings.airTemp}°C`} />
              )}
              {readings.pressure !== null && (
                <Stat label="Pressure" value={`${readings.pressure} hPa`} />
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-6 text-[10px] text-white/30 leading-relaxed">
        NOAA National Data Buoy Center · refresh every ~10 minutes.
      </div>
    </motion.div>
  );
}
