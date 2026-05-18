# Earthpulse — A Living Earth

**Live demo → [earthpulse-teal.vercel.app](https://earthpulse-teal.vercel.app/?m=live)**

A 3D globe that overlays real-time and historical planetary data from **30+ public APIs** — earthquakes, ocean buoys, aircraft, animal sightings, aurora, submarine cables, news headlines, exoplanets and more — into a single explorable surface. Built with Next.js + react-globe.gl.

```bash
pnpm install
pnpm dev      # → http://localhost:3000
```

---

## What it does

Each of the **11 modes** is a different lens on the planet:

| Mode                    | Layers default-on                                                                | Vibe                                          |
| ----------------------- | -------------------------------------------------------------------------------- | --------------------------------------------- |
| 🌍 **Live Earth**       | sample migrations, ISS + crew, sun + terminator                                  | quiet ambient default; opt-in to more         |
| 🐋 **Wildlife**         | curated migrations, live cetaceans, charismatic megafauna sightings, terminator  | global wildlife pulse                         |
| 🔥 **Tonight on Earth** | quakes, EONET events, GDACS disasters, FIRMS fires, hurricanes, news, terminator | what's shaking & burning right now            |
| 🛰 **Look Up**          | ISS + crew, aircraft, terminator, launches, aurora oval                          | the sky overhead                              |
| 🌊 **Ocean**            | tides, hurricanes, cetaceans, animals, NDBC buoys, terminator                    | seven seas                                    |
| 🌳 **Conservation**     | animals, wildlife, cetaceans, fires, EONET events, terminator                    | wildlife + pressures                          |
| 📖 **Tell Me a Story**  | terminator only                                                                  | click anywhere → Wikipedia + Claude narration |
| 🌐 **Internet**         | submarine cables, terminator                                                     | data spine of the planet                      |
| ⏰ **Time Travel**      | terminator + year scrubber 1900→now                                              | replay 126 years of M6+ earthquakes           |
| 📷 **Live Cams**        | curated public livestreams + Caltrans CCTV                                       | see Earth right now                           |

Click any icon → a side panel opens with details, photos, narration. Click any open ocean → place panel with country, weather, nearby Wikipedia, satellites overhead, wildlife observed.

---

## Setup

### Required

```bash
pnpm install
pnpm dev
```

### Optional API keys

The app **degrades gracefully** when keys are missing — affected layers just show a small "needs key" hint in the credits footer. Drop these into `.env.local`:

```bash
# Claude narration on click (Field note bar)
ANTHROPIC_API_KEY=

# NASA APOD — DEMO_KEY works for low traffic
NASA_API_KEY=DEMO_KEY

# NASA FIRMS wildfire hotspots
NASA_FIRMS_KEY=

# N2YO satellite tracking (Look Up mode)
N2YO_KEY=

# OpenSky aircraft — anonymous tier is rate-limited to ~100 calls/day.
# Register at opensky-network.org for a much higher quota.
OPENSKY_USER=
OPENSKY_PASS=

# eBird notable bird sightings
EBIRD_KEY=

# AISStream live ship traffic (route stub, full WebSocket integration TBD)
AIS_STREAM_KEY=

# IUCN Red List threat status
IUCN_TOKEN=
```

See [`.env.local.example`](.env.local.example) for sources.

---

## Data sources (30+)

| Layer                                          | Source                        | Auth                      |
| ---------------------------------------------- | ----------------------------- | ------------------------- |
| Live earthquakes                               | USGS GeoJSON feed             | none                      |
| Historical earthquakes 1900-now                | USGS FDSN event service       | none                      |
| Natural events (wildfires, ice, storms)        | NASA EONET                    | none                      |
| Global disasters (floods, droughts, etc)       | GDACS                         | none                      |
| US/Atlantic hurricanes                         | NOAA NHC `CurrentStorms.json` | none                      |
| Wildfire hotspots (VIIRS)                      | NASA FIRMS                    | free key                  |
| Aurora oval + Kp                               | NOAA SWPC OVATION             | none                      |
| Global precipitation radar                     | RainViewer                    | none                      |
| Ocean buoys + tsunami DART                     | NOAA NDBC                     | none                      |
| Tide gauges                                    | NOAA Tides & Currents         | none                      |
| Live aircraft                                  | OpenSky Network               | none / basic auth         |
| ISS position                                   | wheretheiss.at                | none                      |
| Astronauts in space                            | Open Notify                   | none                      |
| Satellites above                               | N2YO                          | free key                  |
| Rocket launches                                | Launch Library 2              | none                      |
| Submarine cables                               | TeleGeography                 | none                      |
| Bird sightings (audio)                         | iNaturalist                   | none                      |
| Cetacean sightings                             | iNaturalist (taxon `Cetacea`) | none                      |
| Wildlife sightings (9 megafauna taxa)          | iNaturalist                   | none                      |
| Notable bird sightings                         | eBird                         | free key                  |
| Species occurrence (terrestrial + marine)      | GBIF + OBIS                   | none                      |
| Live ships                                     | AISStream                     | free key (WebSocket, TBD) |
| Endangered species status                      | IUCN Red List                 | free token                |
| News pulse                                     | GDELT 2.0 DOC API             | none (rate-limited)       |
| Habitable-zone exoplanets                      | NASA Exoplanet Archive (TAP)  | none                      |
| Near-Earth Object firehose                     | Minor Planet Center NEOCP     | none                      |
| Reverse geocoding                              | BigDataCloud                  | none                      |
| Country info                                   | REST Countries                | none                      |
| Weather                                        | Open-Meteo                    | none                      |
| Nearby Wikipedia articles                      | Wikipedia GeoSearch + REST    | none                      |
| Astronomy Picture of the Day                   | NASA APOD                     | DEMO_KEY                  |
| AI narration                                   | Claude API (Haiku 4.5)        | API key                   |
| Highway CCTV                                   | Caltrans D4/7/11/12           | none                      |
| Curated livecams (volcanoes, wildlife, aurora) | hand-picked                   | none                      |

The "Sample migrations" layer is a hand-curated `public/data/animal-tracks.json` — reasonable but illustrative trajectories of well-known tagged animals (Mary Lee the Great White, Plymouth the Snowy Owl, etc). It's _not_ live GPS — the panel shows a yellow "Sample path" badge to be honest about that. For verified live wildlife, enable the Wildlife layer (iNaturalist).

---

## Project structure

```
app/
  api/                  # Edge / Node route handlers, one per data source
    aircraft/           # OpenSky proxy with rate-limit + cache + auth
    aurora/             # NOAA SWPC ovation + Kp
    birds/              # iNat by lat/lng
    buoys/              # NDBC active stations
    buoy/               # NDBC realtime (per-station)
    cables/             # TeleGeography submarine cables
    cams/               # Caltrans + curated cams.json
    cetaceans/          # iNat (taxon Cetacea)
    disasters/          # GDACS
    earthquakes/        # USGS live
    events/             # NASA EONET
    exoplanets/         # NASA Exoplanet Archive (TAP)
    firms/              # NASA FIRMS wildfires
    hurricanes/         # NOAA NHC
    iucn/               # IUCN Red List
    launches/           # Launch Library 2
    narrate/            # Claude narration
    neos/               # MPC NEOCP
    news/               # GDELT 2.0
    place/              # BigDataCloud + Open-Meteo + REST Countries
    quakes-historical/  # USGS archive (year-keyed)
    rain/               # RainViewer
    satellites-above/   # N2YO
    ships/              # AISStream stub
    species/            # GBIF + OBIS combined
    tides/              # NOAA Tides
    wiki/               # Wikipedia GeoSearch + summary
    wildlife/           # iNat across 9 megafauna taxa
  page.tsx              # mounts <LivingEarth />
  layout.tsx
  globals.css

components/
  LivingEarth.tsx       # the globe + side panel + telemetry (the centerpiece)
  ModeSwitcher.tsx      # top-center pill bar
  SearchBar.tsx         # /-shortcut search across loaded layers
  HeartRate.tsx         # Earth's pulse BPM gauge
  TimeScrubber.tsx      # last 24h quake replay slider
  YearScrubber.tsx      # 1900→now historical year slider
  ApodBadge.tsx         # NASA APOD corner widget
  RainBadge.tsx         # animated radar replay
  CosmosBadge.tsx       # exoplanets + NEOs combined modal

lib/
  modes.ts              # mode definitions + LayerKey union
  sun.ts                # subsolar point + terminator great-circle math
  distance.ts           # haversine + path distance
  photo-url.ts          # iNat square→medium thumbnail transform
  news-jitter.ts        # deterministic per-article position jitter
  buoy-parse.ts         # NDBC realtime text parser
  neo-parse.ts          # MPC NEOCP fixed-width parser

public/
  data/
    animal-tracks.json  # 6 curated migration paths
    cams.json           # 20 curated public livecams

docs/
  research/             # research documents from agent runs
```

---

## Architecture

### Modes framework

A **mode** declares which layers default-on and an atmosphere accent color. Defined in `lib/modes.ts`. The mode switcher (top-center) sets these defaults; users can still toggle individual layers from the panel after.

### Lazy loading

Layers fetch **on demand**, not on page load. `useEffect`s gated by `layers.X` ensure that — for example — the FIRMS wildfire CSV only downloads when the wildfires layer is first activated. Subsequent toggles use the in-memory cache (no re-fetch). A `loadOnce` ref prevents duplicate inflight requests.

### Two icon strategies

- **Categorical low-volume layers** (animals, EONET events, GDACS disasters, launches, hurricanes, cetaceans, wildlife, curated cams, news, ISS, sun) → rendered via `htmlElementsData` with **emoji icons** that scale on hover and have category-specific glyphs.
- **High-volume layers** (aircraft 500+, fires 1500+, aurora 2800+, tide gauges 575+, highway cams 175+, buoys 450+) → rendered as colored points via `pointsData` for performance.

Aircraft are a special case — `htmlElementsData` rendered with the ✈ glyph rotated to match each plane's heading, tinted by altitude.

### Click-handling caveat

`react-globe.gl` raycasts the canvas independently of DOM event flow, so clicking an icon would trigger BOTH the icon's click handler AND `onGlobeClick` (which fires `selectPlace`). A `iconClickedAt` ref stamps `Date.now()` on every icon click; `onGlobeClick` short-circuits if an icon was clicked within the last 350ms.

### Graceful key degradation

For optional-key APIs (FIRMS, N2YO, eBird, IUCN, AISStream, Anthropic), the route returns `{ ...empty, needsKey: true }` when the env var is missing. The UI surfaces a small footer hint instead of breaking. Same pattern for rate-limit responses (OpenSky 429, GDELT cooldown).

### iNaturalist privacy

For threatened species (`obscured: true` in iNat response), the side panel:

- Shows date as month + year only (e.g. "April 2026" instead of "4/28/2026")
- Marks lat/lng as approximate ("Latitude (≈)")
- Displays a yellow **🛡 Sensitive species · location & date obscured** badge
- Adds a footnote explaining why iNat obscures these (poacher protection)

Real coordinates are still randomized within iNat's ~25km privacy box upstream — we just signal that to the user.

---

## Adding a new layer

1. **Create the route** in `app/api/<name>/route.ts`. Cache, handle rate limits, gracefully return empty when keys are missing. Use Edge runtime where possible.
2. **Add the LayerKey** to the union in `lib/modes.ts` and to each mode's defaults if it should be on by default in any mode.
3. **Fetch in `LivingEarth.tsx`** with a lazy `useEffect` gated by `layers.<key>`:
   ```ts
   useEffect(() => {
     if (!layers.foo) return;
     loadOnce("foo", () => {
       fetch("/api/foo")
         .then((r) => r.json())
         .then((d) => setFoo(d.items ?? []));
     });
   }, [layers.foo]);
   ```
4. **Decide rendering**: if low-volume + per-item meaningful, add to `htmlData` with `_icon` and `_label`; if high-volume + clustering OK, add to `allPoints` with a `kind` discriminator.
5. **Wire the click handler**: add a `selectFoo` function and an `else if (d.kind === "foo") selectFoo(d as Foo)` branch.
6. **Add a side panel view** if needed (see `WildlifeView`, `LaunchView` for templates).
7. **Layer toggle entry**: add `{ key: "foo", label: "Foo", color: "#hex" }` to the items array in `LayerToggle`.
8. **Search**: add hits to the `searchHits` useMemo so users can find them via `/`.
9. **Test the helpers**: parse logic, transforms, etc go in `lib/<name>-parse.ts` with a `<name>-parse.spec.ts` next to them.

---

## Tech stack

- **Next.js 16.2** (Turbopack, App Router, mix of Edge and Node runtimes)
- **React 19**
- **react-globe.gl 2.x** wrapping **Three.js**
- **Tailwind CSS 4**
- **Framer Motion** for panel transitions
- **Vitest 3** for tests
- **Claude Haiku 4.5** for narration

---

## Tests

```bash
pnpm test          # one-shot
pnpm test:watch    # auto-rerun on file change
pnpm test:ui       # Vitest browser UI
```

51 focused tests across 7 files cover the parsing, math, and transforms where bugs would actually hurt:

- **lib/sun.spec.ts** — subsolar point at equinox/solstice, terminator polygon validity
- **lib/distance.spec.ts** — haversine NYC↔London (~5570km) and SF↔Tokyo (~9000km), symmetry, path summing
- **lib/photo-url.spec.ts** — iNat thumbnail transform `square.jpg` → `medium.jpg`
- **lib/news-jitter.spec.ts** — deterministic per-URL coordinate jitter staying within ±range
- **lib/buoy-parse.spec.ts** — NDBC realtime text parser, sentinel-value (`MM`, `999.0`, `9999`) handling
- **lib/neo-parse.spec.ts** — MPC NEOCP fixed-width parser including negative declination
- **lib/modes.spec.ts** — Live Earth defaults to a minimal layer set; each mode covers every LayerKey

The test suite caught and fixed three latent bugs during its first run:

- NEO score field was being read at the wrong column position (always returned 0)
- NEO declination slice dropped the leading minus sign (always returned positive)
- News jitter formula could exceed `±range` for negative seeds because JS `%` preserves sign

That's exactly what unit tests are for — these would have shipped silently otherwise.

---

## Known limitations

- **Migrations** are static curated paths, not live GPS (clearly badged in the panel)
- **OpenSky** anonymous tier rate-limits us to ~100 calls/day. Add credentials to `.env.local` for production-scale use.
- **GDELT** rate-limits aggressively. The route gracefully returns `rateLimited: true` and shows an orange footer hint when throttled.
- **AISStream** route is a stub — full WebSocket integration is TBD.
- **GDELT positioning** is country-centroid + deterministic per-article jitter. True per-article geocoding requires a paid API.
- **Mobile**: the experience works but isn't tuned. The panel goes full-width on small screens. WebGL globe + 6,000+ rendered objects pushes mid-range mobile hardware.
- **No accessibility pass yet.** WebGL + lots of motion + color-coded data; not currently usable for keyboard or screen-reader users.
- **No tests** for the giant `LivingEarth.tsx` component — it's exploratory UI; tests would mostly be implementation-coupled. Pure logic was extracted into `lib/` and that _is_ tested.

---

## Research documents

Three multi-phase research runs are saved under [`docs/research/`](docs/research/):

- [`novel-apis-wave-3.md`](docs/research/novel-apis-wave-3.md) — 14 verified-working candidates across 6 themes (Wikimedia EventStreams, UK NESO grid, Wikidata SPARQL, etc.)
- [`wave-4-directions.md`](docs/research/wave-4-directions.md) — APIs + UX/experience patterns + technical capabilities + ranked top picks

Both were probed live; dead/gated endpoints are explicitly listed with proof.

---

## License

MIT — see project root.

Data and APIs remain property of their respective providers; please respect each one's ToS for production use.
