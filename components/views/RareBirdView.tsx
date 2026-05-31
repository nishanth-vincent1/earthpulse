"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { RareBird } from "@/lib/types";
import { Stat } from "./Stat";
import { IucnBadge, useIucnStatus } from "./_shared";

type WikiSummary = { extract: string; url: string };

export function RareBirdView({ bird }: { bird: RareBird }) {
  const status = useIucnStatus(bird.scientific);
  const [wiki, setWiki] = useState<WikiSummary | null>(null);
  const [wikiLoading, setWikiLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setWiki(null);
    setWikiLoading(true);

    async function loadWiki() {
      const tryNames = [bird.scientific, bird.common].filter(Boolean);
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
            type?: string;
          };
          if (d.type === "disambiguation") continue;
          if (d.extract && !cancelled) {
            setWiki({
              extract: d.extract,
              url: d.content_urls?.desktop?.page ?? "#",
            });
            break;
          }
        } catch {
          // try next name
        }
      }
      if (!cancelled) setWikiLoading(false);
    }
    loadWiki();
    return () => {
      cancelled = true;
    };
  }, [bird.scientific, bird.common]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {!bird.photo && <div className="text-5xl mb-2">{bird.emoji ?? "🐦"}</div>}
      <div className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
        Rare bird sighting
      </div>
      <h2 className="text-3xl font-light text-white mt-1">{bird.common}</h2>
      <div className="text-white/50 text-sm italic mt-1">{bird.scientific}</div>
      {bird.photo && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={bird.photo}
          alt={bird.common}
          className="w-full mt-4 rounded-lg border border-white/10 max-h-72 object-cover"
        />
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {bird.reviewed ? (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-300/40 bg-emerald-300/[0.05]">
            <span className="text-[10px] tracking-widest uppercase text-emerald-200">
              ✓ Reviewer-confirmed
            </span>
          </div>
        ) : !bird.validated ? (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-300/40 bg-amber-300/[0.05]">
            <span className="text-[10px] tracking-widest uppercase text-amber-200">
              ⏳ Pending review
            </span>
          </div>
        ) : null}
        <IucnBadge status={status} />
      </div>

      {(wikiLoading || wiki) && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
            About this species
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
        <Stat label="Count" value={bird.count.toString()} />
        <Stat
          label="Observed"
          value={new Date(bird.observed).toLocaleDateString()}
        />
        <Stat label="Latitude" value={`${bird.lat.toFixed(2)}°`} />
        <Stat label="Longitude" value={`${bird.lng.toFixed(2)}°`} />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
          Location
        </div>
        <p className="text-white/80 text-sm leading-relaxed">{bird.location}</p>
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 flex flex-col gap-2">
        {bird.speciesCode && (
          <a
            href={`https://ebird.org/species/${bird.speciesCode}`}
            target="_blank"
            rel="noopener"
            className="text-sm text-emerald-300 hover:underline"
          >
            Browse this species on eBird →
          </a>
        )}
        {bird.speciesCode && (
          <a
            href={`https://media.ebird.org/catalog?taxonCode=${bird.speciesCode}&mediaType=audio`}
            target="_blank"
            rel="noopener"
            className="text-sm text-emerald-300/80 hover:underline"
          >
            🔊 Listen on Macaulay Library →
          </a>
        )}
        {bird.locId && (
          <a
            href={`https://ebird.org/hotspot/${bird.locId}`}
            target="_blank"
            rel="noopener"
            className="text-sm text-emerald-300/80 hover:underline"
          >
            View this hotspot on eBird →
          </a>
        )}
      </div>

      <div className="mt-3 text-[10px] text-white/30 leading-relaxed">
        Source · eBird (Cornell Lab of Ornithology). &quot;Notable&quot;
        sightings are flagged by editors as rare or unusual for the location
        and time of year. Last 14 days. Species context from Wikipedia.
      </div>
    </motion.div>
  );
}
