"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Quake } from "@/lib/types";
import { Stat } from "./Stat";

type WikiSummary = { extract: string; url: string };

const ALERT_META: Record<string, { label: string; color: string; bg: string }> = {
  green: {
    label: "GREEN · No expected fatalities or damage",
    color: "#7af07a",
    bg: "rgba(122,240,122,0.12)",
  },
  yellow: {
    label: "YELLOW · Some casualties or damage possible",
    color: "#ffe16a",
    bg: "rgba(255,225,106,0.14)",
  },
  orange: {
    label: "ORANGE · Significant casualties / damage likely",
    color: "#ff9b3d",
    bg: "rgba(255,155,61,0.15)",
  },
  red: {
    label: "RED · Severe impact expected",
    color: "#ff5050",
    bg: "rgba(255,80,80,0.16)",
  },
};

const MAG_TYPE_DESC: Record<string, string> = {
  mb: "body-wave magnitude · distant events",
  mw: "moment magnitude · authoritative for large quakes",
  ml: "local magnitude · Richter, regional",
  ms: "surface-wave magnitude · shallow events",
  md: "duration magnitude · local network",
  mww: "moment magnitude (W-phase)",
  mwc: "moment magnitude (centroid)",
  mwr: "moment magnitude (regional)",
};

function intensityRoman(v: number): string {
  const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const idx = Math.max(1, Math.min(10, Math.round(v))) - 1;
  return romans[idx];
}

function intensityLabel(v: number): string {
  if (v < 2) return "Not felt";
  if (v < 3) return "Weak";
  if (v < 4) return "Light";
  if (v < 5) return "Moderate";
  if (v < 6) return "Strong";
  if (v < 7) return "Very strong";
  if (v < 8) return "Severe";
  if (v < 9) return "Violent";
  return "Extreme";
}

function energyEquivalence(mag: number): string {
  // Energy in joules: log10(E) = 1.5*M + 4.8
  const joules = Math.pow(10, 1.5 * mag + 4.8);
  const tntKilotons = joules / 4.184e12;
  const hiroshima = tntKilotons / 16;
  if (tntKilotons < 0.001)
    return `~${(joules / 4.184e9).toFixed(1)} t TNT`;
  if (tntKilotons < 1)
    return `~${(tntKilotons * 1000).toFixed(0)} t TNT`;
  if (hiroshima < 0.5)
    return `~${tntKilotons.toFixed(1)} kt TNT`;
  if (hiroshima < 100)
    return `~${tntKilotons.toFixed(0)} kt TNT · ~${hiroshima.toFixed(1)} Hiroshima bombs`;
  if (hiroshima < 100000)
    return `~${(tntKilotons / 1000).toFixed(1)} Mt TNT · ~${Math.round(hiroshima).toLocaleString()} Hiroshima bombs`;
  return `~${(tntKilotons / 1000).toFixed(0)} Mt TNT`;
}

function timeAgo(time: number): string {
  const ms = Date.now() - time;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function extractRegion(place: string): string | null {
  // "72 km NW of Port-Vila, Vanuatu" → "Vanuatu"
  // "100 km W of Anchorage, Alaska" → "Alaska"
  // "Central California" → "California"
  const parts = place.split(",").map((s) => s.trim());
  const last = parts[parts.length - 1];
  if (last && last.length > 2 && !/^\d/.test(last)) return last;
  return null;
}

export function QuakeView({ quake }: { quake: Quake }) {
  const [wiki, setWiki] = useState<WikiSummary | null>(null);
  const [wikiLoading, setWikiLoading] = useState(true);

  const region = extractRegion(quake.place);

  useEffect(() => {
    let cancelled = false;
    setWiki(null);
    setWikiLoading(true);
    if (!region) {
      setWikiLoading(false);
      return;
    }
    async function loadWiki() {
      try {
        const r = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(region!)}`,
          { headers: { Accept: "application/json" } },
        );
        if (!r.ok) {
          if (!cancelled) setWikiLoading(false);
          return;
        }
        const d = (await r.json()) as {
          extract?: string;
          content_urls?: { desktop?: { page?: string } };
          type?: string;
        };
        if (d.type === "disambiguation" || !d.extract) {
          if (!cancelled) setWikiLoading(false);
          return;
        }
        if (!cancelled) {
          setWiki({
            extract: d.extract,
            url: d.content_urls?.desktop?.page ?? "#",
          });
          setWikiLoading(false);
        }
      } catch {
        if (!cancelled) setWikiLoading(false);
      }
    }
    loadWiki();
    return () => {
      cancelled = true;
    };
  }, [region]);

  const sev =
    quake.mag >= 7
      ? "Major"
      : quake.mag >= 6
        ? "Strong"
        : quake.mag >= 5
          ? "Moderate"
          : quake.mag >= 4
            ? "Light"
            : "Minor";
  const sevColor =
    quake.mag >= 6
      ? "text-red-300"
      : quake.mag >= 4
        ? "text-orange-300"
        : "text-amber-200";

  const alert = quake.alert ? ALERT_META[quake.alert] : null;
  const shake = quake.mmi ?? quake.cdi ?? null;
  const eventTypeLabel =
    quake.type && quake.type !== "earthquake"
      ? quake.type.replace(/_/g, " ")
      : null;
  const magTypeKey = quake.magType?.toLowerCase();
  const magTypeDesc = magTypeKey ? MAG_TYPE_DESC[magTypeKey] : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🪨</div>
      <div className={`text-xs uppercase tracking-[0.25em] ${sevColor}`}>
        {sev} earthquake · M{quake.mag.toFixed(1)}
        {quake.magType ? ` (${quake.magType})` : ""}
      </div>
      <h2 className="text-2xl font-light text-white mt-1 leading-snug">
        {quake.place}
      </h2>
      <div className="text-white/50 text-sm mt-1">{timeAgo(quake.time)}</div>

      <div className="flex flex-wrap gap-2 mt-3">
        {quake.tsunami && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyan-300/40 bg-cyan-300/[0.08] text-[10px] tracking-widest uppercase text-cyan-200">
            🌊 Tsunami threat flagged
          </span>
        )}
        {alert && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] tracking-widest uppercase"
            style={{
              borderColor: `${alert.color}66`,
              background: alert.bg,
              color: alert.color,
            }}
          >
            🚨 PAGER · {quake.alert?.toUpperCase()}
          </span>
        )}
        {quake.status === "automatic" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-300/30 bg-amber-300/[0.06] text-[10px] tracking-widest uppercase text-amber-200/80">
            ⏳ Auto-detected · pending review
          </span>
        )}
        {quake.status === "reviewed" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-300/30 bg-emerald-300/[0.06] text-[10px] tracking-widest uppercase text-emerald-200/80">
            ✓ Reviewed by USGS seismologist
          </span>
        )}
        {quake.source === "emsc" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-300/30 bg-blue-300/[0.06] text-[10px] tracking-widest uppercase text-blue-200/80">
            🇪🇺 EMSC {quake.agency && quake.agency !== "EMSC" ? `· ${quake.agency}` : ""}
          </span>
        )}
        {eventTypeLabel && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-300/30 bg-purple-300/[0.06] text-[10px] tracking-widest uppercase text-purple-200/80">
            ⚠ {eventTypeLabel}
          </span>
        )}
      </div>

      {alert && (
        <div className="mt-3 text-xs text-white/60 leading-relaxed">
          {alert.label}. USGS PAGER provides rapid impact estimates within
          ~30 minutes of an event.
        </div>
      )}

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1.5">
          Energy released
        </div>
        <div className="text-sm text-white/85 leading-relaxed">
          {energyEquivalence(quake.mag)}
        </div>
        <div className="text-[10px] text-white/40 mt-1">
          log₁₀(E) = 1.5 × M + 4.8 (in joules)
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat
          label={`Magnitude${quake.magType ? ` (${quake.magType})` : ""}`}
          value={quake.mag.toFixed(1)}
        />
        <Stat
          label="Depth"
          value={
            quake.depth != null ? `${quake.depth.toFixed(1)} km` : "—"
          }
        />
        {shake !== null && (
          <Stat
            label="Shake intensity"
            value={`${intensityRoman(shake)} · ${intensityLabel(shake)}`}
          />
        )}
        {quake.felt != null && quake.felt > 0 && (
          <Stat
            label="Felt reports"
            value={`${quake.felt.toLocaleString()} people`}
          />
        )}
        {quake.sig != null && (
          <Stat label="USGS significance" value={quake.sig.toString()} />
        )}
        {quake.nst != null && (
          <Stat label="Stations" value={quake.nst.toString()} />
        )}
        <Stat label="Latitude" value={`${quake.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${quake.lng.toFixed(2)}°`} />
        <Stat label="When" value={new Date(quake.time).toLocaleString()} />
      </div>

      {magTypeDesc && (
        <div className="mt-3 text-[10px] text-white/40 leading-relaxed">
          Magnitude type {quake.magType}: {magTypeDesc}.
        </div>
      )}

      {(wikiLoading || wiki) && region && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
            About {region}
          </div>
          {wikiLoading && (
            <div className="text-sm text-white/40 italic">
              Loading from Wikipedia…
            </div>
          )}
          {wiki && (
            <>
              <p className="text-sm text-white/80 leading-relaxed line-clamp-5">
                {wiki.extract}
              </p>
              <a
                href={wiki.url}
                target="_blank"
                rel="noopener"
                className="mt-2 inline-block text-xs text-emerald-300 hover:underline"
              >
                Read on Wikipedia →
              </a>
            </>
          )}
        </div>
      )}

      <div className="mt-6 border-t border-white/10 pt-6 flex flex-col gap-2">
        {quake.url && (
          <a
            href={quake.url}
            target="_blank"
            rel="noopener"
            className="text-sm text-white/70 hover:text-white underline-offset-4 hover:underline"
          >
            {quake.source === "emsc"
              ? "EMSC event page →"
              : "USGS event page →"}
          </a>
        )}
        {quake.source !== "emsc" && quake.url && (
          <a
            href={`${quake.url}/dyfi`}
            target="_blank"
            rel="noopener"
            className="text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
          >
            Did you feel it? Report on USGS →
          </a>
        )}
        {quake.source === "emsc" && (
          <a
            href="https://www.seismicportal.eu/testimonies-ui.html"
            target="_blank"
            rel="noopener"
            className="text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
          >
            Did you feel it? Report via EMSC LastQuake →
          </a>
        )}
      </div>

      <div className="mt-3 text-[10px] text-white/30 leading-relaxed">
        Source ·{" "}
        {quake.source === "emsc"
          ? "EMSC (European-Mediterranean Seismological Centre). EMSC aggregates reports from regional networks across Europe, North Africa, and the Middle East — often the fastest source for EU events."
          : "USGS Earthquake Hazards Program · M2.5+ events from past 24h. Felt reports + Community Decimal Intensity (CDI) are crowd-sourced; MMI is computed from instrument data."}{" "}
        Region context from Wikipedia.
      </div>
    </motion.div>
  );
}
