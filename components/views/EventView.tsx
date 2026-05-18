"use client";

import { motion } from "framer-motion";
import type { EONETEvent } from "@/lib/types";
import { Stat } from "./Stat";

export function EventView({ event }: { event: EONETEvent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: event.color }}
      >
        {event.category}
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {event.title}
      </h2>
      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Latitude" value={`${event.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${event.lng.toFixed(2)}°`} />
        <Stat label="Reported" value={new Date(event.date).toLocaleDateString()} />
      </div>
      <div className="mt-8 border-t border-white/10 pt-6">
        <a
          href={event.link}
          target="_blank"
          rel="noopener"
          className="text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
        >
          NASA EONET source →
        </a>
      </div>
    </motion.div>
  );
}
