"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Volcano } from "@/lib/types";
import { Stat } from "./Stat";

type WikiSummary = { extract: string; url: string; thumbnail?: string };

const COLOR_CODE_BG: Record<string, string> = {
  GREEN: "rgba(122,211,107,0.12)",
  YELLOW: "rgba(255,225,106,0.14)",
  ORANGE: "rgba(255,155,61,0.15)",
  RED: "rgba(255,80,80,0.16)",
};

const COLOR_CODE_LABEL: Record<string, string> = {
  GREEN: "Normal · typical non-eruptive behavior",
  YELLOW: "Advisory · signs of unrest above background",
  ORANGE: "Watch · escalating unrest or minor eruption",
  RED: "Warning · imminent or ongoing significant eruption",
};

export function VolcanoView({ volcano }: { volcano: Volcano }) {
  const [wiki, setWiki] = useState<WikiSummary | null>(null);
  const [wikiLoading, setWikiLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setWiki(null);
    setWikiLoading(true);

    async function loadWiki() {
      // Try several name variants
      const tryNames = [
        volcano.name,
        `${volcano.name} (volcano)`,
        `Mount ${volcano.name}`,
      ];
      for (const name of tryNames) {
        try {
          const r = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
            { headers: { Accept: "application/json" } },
          );
          if (!r.ok) continue;
          const d = (await r.json()) as {
            extract?: string;
            content_urls?: { desktop?: { page?: string } };
            thumbnail?: { source?: string };
            type?: string;
          };
          if (d.type === "disambiguation") continue;
          if (d.extract && !cancelled) {
            setWiki({
              extract: d.extract,
              url: d.content_urls?.desktop?.page ?? "#",
              thumbnail: d.thumbnail?.source,
            });
            break;
          }
        } catch {
          // try next variant
        }
      }
      if (!cancelled) setWikiLoading(false);
    }
    loadWiki();
    return () => {
      cancelled = true;
    };
  }, [volcano.name]);

  const colorBg = COLOR_CODE_BG[volcano.colorCode] ?? "rgba(255,255,255,0.05)";
  const colorLabel = COLOR_CODE_LABEL[volcano.colorCode];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">🌋</div>
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: volcano.color }}
      >
        {volcano.alertLevel} · {volcano.colorCode}
      </div>
      <h2 className="text-3xl font-light text-white mt-1">{volcano.name}</h2>
      <div className="text-white/50 text-sm mt-1">{volcano.observatory}</div>

      <div className="flex flex-wrap gap-2 mt-3">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] tracking-widest uppercase"
          style={{
            borderColor: `${volcano.color}66`,
            background: colorBg,
            color: volcano.color,
          }}
        >
          ✈ Aviation · {volcano.colorCode}
        </span>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/15 bg-white/[0.04] text-[10px] tracking-widest uppercase text-white/80"
        >
          🚨 Ground · {volcano.alertLevel}
        </span>
      </div>

      {colorLabel && (
        <div className="mt-3 text-xs text-white/60 leading-relaxed">
          {colorLabel}.
        </div>
      )}

      {wiki?.thumbnail && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={wiki.thumbnail}
          alt={volcano.name}
          className="w-full mt-4 rounded-lg border border-white/10 max-h-64 object-cover"
        />
      )}

      {(wikiLoading || wiki) && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
            About {volcano.name}
          </div>
          {wikiLoading && (
            <div className="text-sm text-white/40 italic">
              Loading from Wikipedia…
            </div>
          )}
          {wiki && (
            <>
              <p className="text-sm text-white/80 leading-relaxed line-clamp-6">
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

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat label="Alert level" value={volcano.alertLevel} />
        <Stat label="Aviation code" value={volcano.colorCode} />
        <Stat label="Latitude" value={`${volcano.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${volcano.lng.toFixed(2)}°`} />
        <Stat
          label="Last notice"
          value={new Date(volcano.sentUtc).toLocaleString()}
        />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 flex flex-col gap-2">
        {volcano.noticeUrl && (
          <a
            href={volcano.noticeUrl}
            target="_blank"
            rel="noopener"
            className="text-sm text-white/70 hover:text-white underline-offset-4 hover:underline"
          >
            USGS notice →
          </a>
        )}
        {volcano.vnum && (
          <a
            href={`https://volcano.si.edu/volcano.cfm?vn=${volcano.vnum}`}
            target="_blank"
            rel="noopener"
            className="text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
          >
            Smithsonian Global Volcanism Program →
          </a>
        )}
      </div>

      <div className="mt-3 text-[11px] text-white/55 leading-relaxed">
        Source · USGS Volcano Hazards Program. Color codes follow the Aviation
        Color Code system: GREEN normal · YELLOW unrest · ORANGE
        heightened/escalating · RED imminent or ongoing eruption with
        significant ash. Currently US-monitored volcanoes only (AVO/HVO/CVO).
        Volcano context from Wikipedia.
      </div>
    </motion.div>
  );
}
