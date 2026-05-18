"use client";

import { motion } from "framer-motion";
import type { Tsunami } from "@/lib/types";
import { Stat } from "./Stat";

const SEVERITY_BLURB: Record<string, string> = {
  Warning:
    "Take immediate action. A dangerous tsunami is imminent, expected, or occurring. Move to high ground or inland.",
  Advisory:
    "Strong currents and waves dangerous to those in or near the water. Stay off beaches and out of harbors.",
  Watch:
    "Tsunami may later impact this area. Stay tuned and be prepared to act.",
  Information:
    "An earthquake has been detected, but no tsunami threat exists for this region.",
};

export function TsunamiView({ tsunami }: { tsunami: Tsunami }) {
  const sev = tsunami.category;
  const blurb = SEVERITY_BLURB[sev] ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🌊</div>
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: tsunami.color }}
      >
        Tsunami {sev}
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {tsunami.title}
      </h2>
      <div className="text-white/50 text-sm mt-1">{tsunami.centerName}</div>

      <div
        className="mt-5 px-5 py-4 rounded-xl border"
        style={{
          borderColor: tsunami.color + "55",
          background: `linear-gradient(135deg, ${tsunami.color}22, transparent)`,
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
          Status
        </div>
        <div className="text-3xl font-light" style={{ color: tsunami.color }}>
          {sev}
        </div>
        {blurb && (
          <p className="text-white/75 text-sm leading-relaxed font-light mt-2">
            {blurb}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Latitude" value={`${tsunami.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${tsunami.lng.toFixed(2)}°`} />
        <Stat
          label="Bulletin issued"
          value={new Date(tsunami.sent).toLocaleString()}
        />
        <Stat label="Issued by" value={tsunami.center} />
      </div>

      {tsunami.note && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
            Note
          </div>
          <p className="text-white/75 text-sm leading-relaxed font-light">
            {tsunami.note}
          </p>
        </div>
      )}

      <div className="mt-6 border-t border-white/10 pt-6 text-[11px] text-white/55 leading-relaxed">
        Source · NOAA Tsunami Warning Centers (NTWC Palmer + PTWC Honolulu).
        Bulletins update on detection of a tsunamigenic earthquake. Most
        bulletins are <em>Information</em> statements (no threat); active{" "}
        <em>Warnings</em> and <em>Advisories</em> are rare and call for
        immediate action.
      </div>
      {tsunami.bulletinUrl && (
        <a
          href={tsunami.bulletinUrl}
          target="_blank"
          rel="noopener"
          className="mt-3 block text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
        >
          Read full bulletin →
        </a>
      )}
    </motion.div>
  );
}
