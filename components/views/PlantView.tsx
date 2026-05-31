"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Plant } from "@/lib/types";
import { Stat } from "./Stat";
import { IucnBadge, useIucnStatus, formatObs } from "./_shared";

type WikiSummary = { extract: string; url: string };

export function PlantView({ plant }: { plant: Plant }) {
  const obscured = plant.obscured === true;
  const status = useIucnStatus(plant.scientific);
  const [wiki, setWiki] = useState<WikiSummary | null>(null);
  const [wikiLoading, setWikiLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setWiki(null);
    setWikiLoading(true);
    setActivePhoto(0);

    async function loadWiki() {
      const tryNames = [plant.scientific, plant.common].filter(Boolean);
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
  }, [plant.scientific, plant.common]);

  const photos =
    plant.photos && plant.photos.length > 0
      ? plant.photos
      : plant.photo
        ? [plant.photo]
        : [];
  const heroPhoto = photos[activePhoto] ?? photos[0] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-5xl mb-2">{plant.emoji}</div>
      <div className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">
        Threatened plant · {plant.group}
      </div>
      <h2 className="text-3xl font-light text-white mt-1">{plant.common}</h2>
      <div className="text-white/50 text-sm italic mt-1">
        {plant.scientific}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {obscured && (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-300/30 bg-amber-300/[0.05]">
            <span className="text-[10px] tracking-widest uppercase text-amber-200/80">
              🛡 Sensitive · location obscured
            </span>
          </div>
        )}
        <IucnBadge status={status} />
      </div>

      {heroPhoto && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={heroPhoto}
          alt={plant.common}
          className="w-full mt-4 rounded-lg border border-white/10 max-h-72 object-cover"
        />
      )}

      {photos.length > 1 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-thin">
          {photos.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActivePhoto(i)}
              className={`shrink-0 rounded-md border overflow-hidden transition-all cursor-pointer ${
                i === activePhoto
                  ? "border-emerald-300/70"
                  : "border-white/10 opacity-60 hover:opacity-100"
              }`}
              aria-label={`Photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-14 h-14 object-cover" />
            </button>
          ))}
        </div>
      )}

      {plant.observer && (
        <div className="mt-3 text-[11px] text-white/50">
          📸 Observed by{" "}
          <span className="text-white/70">{plant.observer}</span> · iNaturalist
          contributor (CC)
        </div>
      )}

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
        <Stat
          label={obscured ? "Latitude (≈)" : "Latitude"}
          value={`${plant.lat.toFixed(2)}°`}
        />
        <Stat
          label={obscured ? "Longitude (≈)" : "Longitude"}
          value={`${plant.lng.toFixed(2)}°`}
        />
        {plant.observed && (
          <Stat label="Observed" value={formatObs(plant.observed, obscured)} />
        )}
        {plant.place && <Stat label="Place" value={plant.place} />}
      </div>

      <div className="mt-6 border-t border-white/10 pt-6 flex flex-col gap-2">
        <a
          href={plant.uri}
          target="_blank"
          rel="noopener"
          className="text-sm text-emerald-300 hover:underline"
        >
          View this observation on iNaturalist →
        </a>
        {plant.taxonId && (
          <a
            href={`https://www.inaturalist.org/taxa/${plant.taxonId}`}
            target="_blank"
            rel="noopener"
            className="text-sm text-emerald-300/80 hover:underline"
          >
            Browse all sightings of this species →
          </a>
        )}
      </div>

      <div className="mt-3 text-[10px] text-white/30 leading-relaxed">
        Research-grade observation · iNaturalist (CC contributors) · species
        context from Wikipedia. Only threatened plant taxa are shown here.
        About 40% of the world&apos;s plant species are at some level of
        extinction risk.
        {obscured && (
          <>
            {" "}
            iNaturalist obscures exact location and date for sensitive species
            to protect them from poachers.
          </>
        )}
      </div>
    </motion.div>
  );
}
