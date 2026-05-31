"use client";

import { motion } from "framer-motion";
import type {
  PlaceInfo,
  Recording,
  Satellite,
  Species,
  WikiArticle,
} from "@/lib/types";
import { Stat } from "./Stat";

export function PlaceView({
  lat,
  lng,
  birds,
  birdsLoading,
  placeInfo,
  placeLoading,
  wiki,
  wikiLoading,
  species,
  speciesLoading,
  satellites,
  satellitesNeedKey,
  playingId,
  onPlay,
  narration,
  narrationLoading,
}: {
  lat: number;
  lng: number;
  birds: Recording[];
  birdsLoading: boolean;
  placeInfo: PlaceInfo | null;
  placeLoading: boolean;
  wiki: WikiArticle[];
  wikiLoading: boolean;
  species: { terrestrial: Species[]; marine: Species[] };
  speciesLoading: boolean;
  satellites: Satellite[];
  satellitesNeedKey: boolean;
  playingId: string | null;
  onPlay: (r: Recording) => void;
  narration: string | null;
  narrationLoading: boolean;
}) {
  const heading = placeInfo?.place.city
    ? placeInfo.place.city
    : placeInfo?.place.country
      ? placeInfo.place.country
      : `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;

  const sub =
    placeInfo?.place.country && placeInfo.place.city
      ? `${placeInfo.place.region ? placeInfo.place.region + ", " : ""}${placeInfo.place.country}`
      : placeInfo?.place.isOcean
        ? "Open ocean"
        : `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;

  // Pull a hero image from the first nearby Wikipedia article that has one.
  const heroWiki = wiki.find((w) => !!w.thumb);
  const restOfWiki = heroWiki ? wiki.filter((w) => w !== heroWiki) : wiki;

  // Drop-cap the first letter of narration when present
  const narrationFirstChar = narration?.[0] ?? "";
  const narrationRest = narration?.slice(1) ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* HERO */}
      {heroWiki?.thumb && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={heroWiki.thumb}
          alt={heroWiki.title}
          className="w-full h-40 object-cover rounded-lg border border-white/10 mb-5"
        />
      )}

      <div className="text-[10px] uppercase tracking-[0.25em] text-amber-200/60">
        {placeLoading ? "Locating…" : "Field journal"}
      </div>
      <h2 className="text-4xl font-light text-white mt-1 leading-tight flex items-center gap-3">
        {placeInfo?.country?.flag && (
          <span className="text-3xl">{placeInfo.country.flag}</span>
        )}
        <span className="truncate">{heading}</span>
      </h2>
      <div className="text-white/55 text-sm mt-1">{sub}</div>

      {/* NARRATION — pull quote, drop cap */}
      {(narrationLoading || narration) && (
        <motion.div
          key={narration ?? "loading"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative mt-5 mb-2 pl-5 pr-1"
        >
          <div
            className="absolute left-0 top-1 bottom-1 w-[2px] rounded"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,209,71,0.7), rgba(255,209,71,0.05))",
            }}
          />
          {narrationLoading ? (
            <div className="text-white/50 text-sm italic">
              Composing a field note…
            </div>
          ) : (
            <p className="text-amber-50/85 text-[15px] leading-relaxed font-light italic">
              <span className="float-left text-4xl leading-[0.85] pr-1.5 pt-1 text-amber-200/85 not-italic font-serif">
                {narrationFirstChar}
              </span>
              {narrationRest}
            </p>
          )}
        </motion.div>
      )}

      {placeInfo?.weather && (
        <div className="mt-6 border border-white/10 rounded-xl p-4 bg-white/[0.02]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
            Right now
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-light text-white">
              {Math.round(placeInfo.weather.tempC)}°C
            </div>
            <div className="text-sm text-white/60">
              {placeInfo.weather.condition}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <Stat
              label="Wind"
              value={`${Math.round(placeInfo.weather.windKph)} km/h`}
            />
            <Stat label="Humidity" value={`${placeInfo.weather.humidity}%`} />
            <Stat
              label="Time"
              value={placeInfo.weather.isDay ? "day" : "night"}
            />
          </div>
        </div>
      )}

      {placeInfo?.country && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {placeInfo.country.capital && (
            <Stat label="Capital" value={placeInfo.country.capital} />
          )}
          {placeInfo.country.population && (
            <Stat
              label="Population"
              value={placeInfo.country.population.toLocaleString()}
            />
          )}
          {placeInfo.country.region && (
            <Stat label="Region" value={placeInfo.country.region} />
          )}
          {placeInfo.country.languages.length > 0 && (
            <Stat
              label="Languages"
              value={placeInfo.country.languages.slice(0, 2).join(", ")}
            />
          )}
        </div>
      )}

      {satellites.length > 0 && (
        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
            Satellites overhead now
          </div>
          <ul className="space-y-1.5">
            {satellites.slice(0, 8).map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 text-sm text-white/80"
              >
                <span>{s.emoji}</span>
                <span className="flex-1 truncate">{s.name}</span>
                <span className="text-[10px] text-white/40 tabular-nums">
                  {Math.round(s.alt)} km
                </span>
              </li>
            ))}
          </ul>
          <div className="text-[10px] text-white/30 mt-2">
            via N2YO · {satellites.length} tracked
          </div>
        </div>
      )}
      {satellitesNeedKey && (
        <div className="mt-4 px-3 py-2 border border-cyan-300/20 bg-cyan-300/[0.03] rounded text-[10px] text-cyan-200/60">
          Satellite layer needs N2YO_KEY in .env.local
        </div>
      )}

      {(speciesLoading || species.terrestrial.length > 0 || species.marine.length > 0) && (
        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
            Wildlife observed nearby
          </div>
          {speciesLoading && (
            <div className="text-white/40 text-sm">querying GBIF & OBIS…</div>
          )}
          {species.terrestrial.length > 0 && (
            <ul className="space-y-2">
              {species.terrestrial.slice(0, 6).map((s) => (
                <li key={s.species} className="flex items-center gap-3">
                  {s.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={s.photo}
                      alt=""
                      className="shrink-0 w-9 h-9 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-300/10 border border-emerald-300/20 flex items-center justify-center text-emerald-300/70 text-[10px]">
                      {s.class?.[0] ?? "·"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white italic truncate">
                      {s.species}
                    </div>
                    <div className="text-[10px] text-white/40 truncate">
                      {s.kingdom}
                      {s.class ? ` · ${s.class}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {species.marine.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/60 mb-2">
                Marine (OBIS)
              </div>
              <ul className="space-y-1">
                {species.marine.slice(0, 5).map((s) => (
                  <li
                    key={s.species}
                    className="flex items-center gap-2 text-[12px] text-white/70 italic"
                  >
                    <span className="text-cyan-300/60">~</span>
                    {s.species}
                    {s.class && (
                      <span className="text-white/30 not-italic text-[10px]">
                        {s.class}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="text-[10px] text-white/30 mt-3">
            via GBIF (2B+ records) and OBIS (marine)
          </div>
        </div>
      )}

      {(wikiLoading || restOfWiki.length > 0 || heroWiki) && (
        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
            Stories nearby
          </div>
          {wikiLoading && (
            <div className="text-white/40 text-sm">searching Wikipedia…</div>
          )}
          <ul className="space-y-3">
            {/* Show hero article first (already used image) — without re-showing the image */}
            {heroWiki && (
              <li key={heroWiki.title + "-hero"}>
                <a
                  href={heroWiki.url}
                  target="_blank"
                  rel="noopener"
                  className="block group"
                >
                  <div className="text-sm text-white group-hover:underline">
                    {heroWiki.title}
                  </div>
                  <div className="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">
                    {heroWiki.extract}
                  </div>
                  <div className="text-[10px] text-white/30 mt-0.5">
                    {Math.round(heroWiki.distM)}m away · pictured above
                  </div>
                </a>
              </li>
            )}
            {restOfWiki.map((w) => (
              <li key={w.title}>
                <a
                  href={w.url}
                  target="_blank"
                  rel="noopener"
                  className="flex items-start gap-3 group"
                >
                  {w.thumb && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={w.thumb}
                      alt=""
                      className="shrink-0 w-14 h-14 rounded-md object-cover border border-white/10"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white group-hover:underline truncate">
                      {w.title}
                    </div>
                    <div className="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">
                      {w.extract}
                    </div>
                    <div className="text-[10px] text-white/30 mt-0.5">
                      {Math.round(w.distM)}m away
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 border-t border-white/10 pt-6">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
          Birds nearby
        </div>
        {birdsLoading && <div className="text-white/40 text-sm">listening…</div>}
        {!birdsLoading && birds.length === 0 && (
          <div className="text-white/40 text-sm">
            No recent recordings within ~500km.
          </div>
        )}
        <ul className="space-y-3">
          {birds.map((b) => (
            <li key={b.id} className="flex items-center gap-3 group">
              <button
                onClick={() => onPlay(b)}
                className={`shrink-0 w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  playingId === b.id
                    ? "bg-white text-black border-white"
                    : "border-white/30 text-white/70 hover:border-white hover:text-white"
                }`}
                aria-label={`Play ${b.name}`}
              >
                {playingId === b.id ? "■" : "▶"}
              </button>
              {b.photo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={b.photo}
                  alt={b.name}
                  className="shrink-0 w-10 h-10 rounded-full object-cover border border-white/10"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white truncate">{b.name}</div>
                <div className="text-[11px] text-white/40 truncate italic">
                  {b.scientific}
                  {b.place ? ` · ${b.place}` : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
