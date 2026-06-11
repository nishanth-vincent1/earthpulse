"use client";

import { motion } from "framer-motion";
import type { Aircraft } from "@/lib/types";
import { Stat } from "./Stat";

export function AircraftView({ aircraft }: { aircraft: Aircraft }) {
  const callsign = aircraft.callsign?.trim();
  const altFt = aircraft.altM != null ? aircraft.altM / 0.3048 : null;
  const fl = altFt != null ? Math.round(altFt / 100) : null;
  const kt = aircraft.velocity != null ? aircraft.velocity / 0.514444 : null;
  const kmh = aircraft.velocity != null ? aircraft.velocity * 3.6 : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div
        className="mb-3"
        style={{ transform: `rotate(${aircraft.heading ?? 0}deg)` }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" width="40" height="40" fill="#ffe16a">
          <path d="M22 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S11 2.67 11 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" />
        </svg>
      </div>
      <div className="text-xs uppercase tracking-[0.25em] text-amber-200">
        Live aircraft · ADS-B
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug font-mono">
        {callsign || aircraft.icao || "Unknown flight"}
      </h2>
      <div className="text-white/50 text-sm mt-1">
        {aircraft.acType ? `${aircraft.acType} · ` : ""}
        {aircraft.reg ? aircraft.reg : `ICAO ${aircraft.icao}`}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat
          label="Altitude"
          value={
            altFt != null
              ? `${Math.round(altFt).toLocaleString()} ft${fl != null ? ` · FL${fl}` : ""}`
              : "—"
          }
        />
        <Stat
          label="Ground speed"
          value={
            kt != null
              ? `${Math.round(kt)} kt · ${Math.round(kmh ?? 0)} km/h`
              : "—"
          }
        />
        <Stat
          label="Heading"
          value={aircraft.heading != null ? `${Math.round(aircraft.heading)}°` : "—"}
        />
        {aircraft.reg && <Stat label="Registration" value={aircraft.reg} />}
        {aircraft.acType && <Stat label="Type" value={aircraft.acType} />}
        <Stat label="ICAO 24-bit" value={aircraft.icao.toUpperCase()} />
        <Stat label="Latitude" value={`${aircraft.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${aircraft.lng.toFixed(2)}°`} />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        Source · live ADS-B positions via adsb.lol (community receiver network,
        ODbL). Position, altitude, speed and track are broadcast by the aircraft
        transponder; registration and type are looked up from the ICAO address.
      </div>
      <a
        href={`https://globe.adsb.lol/?icao=${aircraft.icao}`}
        target="_blank"
        rel="noopener"
        className="mt-3 block text-sm text-amber-200 hover:underline"
      >
        Track on adsb.lol →
      </a>
      {callsign && (
        <a
          href={`https://www.flightaware.com/live/flight/${encodeURIComponent(callsign)}`}
          target="_blank"
          rel="noopener"
          className="mt-1.5 block text-sm text-amber-200 hover:underline"
        >
          Look up {callsign} on FlightAware →
        </a>
      )}
    </motion.div>
  );
}
