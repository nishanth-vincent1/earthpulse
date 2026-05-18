"use client";

import { motion } from "framer-motion";
import type { Tornado } from "@/lib/types";
import { Stat } from "./Stat";

export function TornadoView({ tornado }: { tornado: Tornado }) {
  const expiresMs = new Date(tornado.expires).getTime();
  const remainingMin = Math.max(0, Math.round((expiresMs - Date.now()) / 60000));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🌪</div>
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: tornado.color }}
      >
        {tornado.event} · {tornado.severity}
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {tornado.headline}
      </h2>
      <div className="text-white/50 text-sm mt-1">{tornado.senderName}</div>

      {tornado.isWarning && remainingMin > 0 && (
        <div
          className="mt-5 px-5 py-4 rounded-xl border"
          style={{
            borderColor: tornado.color + "55",
            background: `linear-gradient(135deg, ${tornado.color}22, transparent)`,
          }}
        >
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
            Active for
          </div>
          <div
            className="text-3xl font-light tabular-nums"
            style={{ color: tornado.color }}
          >
            {remainingMin}m
          </div>
          <div className="text-white/60 text-sm mt-1">
            until {new Date(tornado.expires).toLocaleTimeString()}
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-white/10 pt-6">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
          Areas affected
        </div>
        <p className="text-white/80 text-sm leading-relaxed">
          {tornado.areaDesc}
        </p>
      </div>

      {tornado.instruction && (
        <div className="mt-5 border-t border-white/10 pt-5">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
            Take action
          </div>
          <p className="text-white/85 text-sm leading-relaxed font-light whitespace-pre-line">
            {tornado.instruction}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat
          label="Issued"
          value={new Date(tornado.sent).toLocaleTimeString()}
        />
        <Stat
          label="Expires"
          value={new Date(tornado.expires).toLocaleTimeString()}
        />
        <Stat label="Latitude" value={`${tornado.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${tornado.lng.toFixed(2)}°`} />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        Source · NWS Storm Prediction Center via api.weather.gov. Tornado
        Warnings are issued for confirmed or radar-indicated tornadoes; Watches
        cover broader areas where conditions favor tornado development. US-only
        live feed.
      </div>
    </motion.div>
  );
}
