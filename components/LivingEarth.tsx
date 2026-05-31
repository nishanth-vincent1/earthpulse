"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { subsolar, terminator } from "@/lib/sun";
import { MODES, modeById, type LayerKey, type Mode } from "@/lib/modes";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { HeartRate, type PulseData } from "@/components/HeartRate";
import { TimeScrubber } from "@/components/TimeScrubber";
import { YearScrubber } from "@/components/YearScrubber";
import { useRainFrames, type RainFrame } from "@/components/RainBadge";
import { Tour } from "@/components/Tour";
import { useIsMobile } from "@/lib/use-is-mobile";
import { PanelToolbar } from "@/components/PanelToolbar";
import { BookmarksDrawer } from "@/components/BookmarksDrawer";
import {
  encodeDeepLink,
  parseDeepLink,
  fullShareUrl,
  type DeepLinkState,
} from "@/lib/deep-link";
import {
  loadBookmarks,
  addBookmark,
  removeBookmark,
  bookmarkKey,
  isBookmarked,
  type Bookmark,
} from "@/lib/bookmarks";
import type {
  Recording,
  Quake,
  EONETEvent,
  Aircraft,
  Launch,
  Storm,
  Disaster,
  Fire,
  TideStation,
  Satellite,
  Species,
  AuroraPoint,
  Cetacean,
  Wildlife,
  AirStation,
  Avalanche,
  Volcano,
  RareBird,
  Ship,
  HistoricalStorm,
  HistoricalEruption,
  Cable,
  Cam,
  NewsArticle,
  NewsGroup,
  Buoy,
  BuoyReadings,
  WikiArticle,
  Astro,
  PlaceInfo,
  ISS,
  Tsunami,
  Tornado,
  HistoricalTornado,
  Plant,
  Star,
  Moon,
} from "@/lib/types";
import { STARS, substellarPoint } from "@/lib/stars";
import { moonState } from "@/lib/moon";
import {
  Stat,
  stormCategoryColor,
  EventView,
  LaunchView,
  NewsView,
  BuoyView,
  CamView,
  VolcanoView,
  ISSView,
  SunView,
  RainView,
  EruptionView,
  AvalancheView,
  RareBirdView,
  ShipView,
  HistoricalStormView,
  AirView,
  FireView,
  QuakeView,
  WildlifeView,
  CetaceanView,
  DisasterView,
  StormView,
  PlaceView,
  TsunamiView,
  TornadoView,
  HistoricalTornadoView,
  PlantView,
  StarView,
  MoonView,
} from "@/components/views";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const EVENT_EMOJI: Record<string, string> = {
  Wildfires: "🔥",
  Volcanoes: "🌋",
  "Severe Storms": "🌀",
  "Sea and Lake Ice": "🧊",
  Drought: "🏜",
  Floods: "🌊",
  Earthquakes: "🪨",
  Landslides: "⛰",
  "Manmade Events": "🛢",
  "Snow Events": "❄",
  "Temperature Extremes": "🌡",
  "Water Color": "💧",
};

const DISASTER_EMOJI: Record<string, string> = {
  EQ: "🪨",
  TC: "🌀",
  FL: "🌊",
  VO: "🌋",
  WF: "🔥",
  DR: "🏜",
};

const CAM_EMOJI: Record<string, string> = {
  volcano: "🌋",
  aurora: "🌌",
  wildlife: "🦓",
  urban: "🏙",
  space: "🚀",
  nature: "💧",
  polar: "🧊",
  geothermal: "♨",
  astronomy: "🔭",
};

type Selection =
  | { kind: "place"; lat: number; lng: number }
  | { kind: "event"; event: EONETEvent }
  | { kind: "launch"; launch: Launch }
  | { kind: "storm"; storm: Storm }
  | { kind: "disaster"; disaster: Disaster }
  | { kind: "cetacean"; cetacean: Cetacean }
  | { kind: "cam"; cam: Cam }
  | { kind: "news"; group: NewsGroup }
  | { kind: "buoy"; buoy: Buoy }
  | { kind: "wildlife"; wildlife: Wildlife }
  | { kind: "quake"; quake: Quake }
  | { kind: "fire"; fire: Fire }
  | { kind: "air"; station: AirStation }
  | { kind: "histStorm"; storm: HistoricalStorm }
  | { kind: "ship"; ship: Ship }
  | { kind: "rareBird"; bird: RareBird }
  | { kind: "avalanche"; zone: Avalanche }
  | { kind: "volcano"; volcano: Volcano }
  | { kind: "histEruption"; eruption: HistoricalEruption }
  | { kind: "iss"; iss: ISS }
  | { kind: "sun"; sun: { lat: number; lng: number } }
  | { kind: "rain" }
  | { kind: "tsunami"; tsunami: Tsunami }
  | { kind: "tornado"; tornado: Tornado }
  | { kind: "histTornado"; tornado: HistoricalTornado }
  | { kind: "plant"; plant: Plant }
  | { kind: "star"; star: Star }
  | { kind: "moon"; moon: Moon }
  | null;

type Layers = Record<LayerKey, boolean>;

export default function LivingEarth() {
  const globeEl = useRef<any>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [quakes, setQuakes] = useState<Quake[]>([]);
  const [events, setEvents] = useState<EONETEvent[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [aircraftTotal, setAircraftTotal] = useState(0);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [storms, setStorms] = useState<Storm[]>([]);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [fires, setFires] = useState<Fire[]>([]);
  const [firesTotal, setFiresTotal] = useState(0);
  const [firesNeedKey, setFiresNeedKey] = useState(false);
  const [tides, setTides] = useState<TideStation[]>([]);
  const [aurora, setAurora] = useState<AuroraPoint[]>([]);
  const [kp, setKp] = useState<number | null>(null);
  const [cetaceans, setCetaceans] = useState<Cetacean[]>([]);
  const [cables, setCables] = useState<Cable[]>([]);
  const [historicalQuakes, setHistoricalQuakes] = useState<Quake[]>([]);
  const [historicalYear, setHistoricalYear] = useState<number>(
    new Date().getFullYear() - 30,
  );
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalMinMag, setHistoricalMinMag] = useState(6);
  const [historicalStorms, setHistoricalStorms] = useState<HistoricalStorm[]>(
    [],
  );
  const [historicalEruptions, setHistoricalEruptions] = useState<
    HistoricalEruption[]
  >([]);
  const [cams, setCams] = useState<Cam[]>([]);
  const [newsGroups, setNewsGroups] = useState<NewsGroup[]>([]);
  const [newsRateLimited, setNewsRateLimited] = useState(false);
  const [buoys, setBuoys] = useState<Buoy[]>([]);
  const [buoyReadings, setBuoyReadings] = useState<BuoyReadings | null>(null);
  const [buoyLoading, setBuoyLoading] = useState(false);
  const [wildlife, setWildlife] = useState<Wildlife[]>([]);
  const [airStations, setAirStations] = useState<AirStation[]>([]);
  const [airNeedsKey, setAirNeedsKey] = useState(false);
  const [ships, setShips] = useState<Ship[]>([]);
  const [shipsNeedsKey, setShipsNeedsKey] = useState(false);
  const [shipsTotal, setShipsTotal] = useState(0);
  const [rareBirds, setRareBirds] = useState<RareBird[]>([]);
  const [rareBirdsNeedsKey, setRareBirdsNeedsKey] = useState(false);
  const [avalanches, setAvalanches] = useState<Avalanche[]>([]);
  const [volcanoes, setVolcanoes] = useState<Volcano[]>([]);
  const [tsunamis, setTsunamis] = useState<Tsunami[]>([]);
  const [tornadoes, setTornadoes] = useState<Tornado[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [historicalTornadoes, setHistoricalTornadoes] = useState<
    HistoricalTornado[]
  >([]);
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [satellitesNeedKey, setSatellitesNeedKey] = useState(false);
  const [species, setSpecies] = useState<{
    terrestrial: Species[];
    marine: Species[];
  }>({ terrestrial: [], marine: [] });
  const [speciesLoading, setSpeciesLoading] = useState(false);
  const [iss, setIss] = useState<ISS | null>(null);
  const [astros, setAstros] = useState<Astro[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [now, setNow] = useState(Date.now());
  const [selection, setSelection] = useState<Selection>(null);
  const [birds, setBirds] = useState<Recording[]>([]);
  const [birdsLoading, setBirdsLoading] = useState(false);
  const [placeInfo, setPlaceInfo] = useState<PlaceInfo | null>(null);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [wiki, setWiki] = useState<WikiArticle[]>([]);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [narration, setNarration] = useState<string | null>(null);
  const [narrationLoading, setNarrationLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iconClickedAt = useRef<number>(0);
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [mode, setMode] = useState<Mode>(MODES[0]);
  const [layers, setLayers] = useState<Layers>(MODES[0].layers);
  const [tourActive, setTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [layersDrawerOpen, setLayersDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const [scrubT, setScrubT] = useState<number>(Date.now());
  const rainFrames = useRainFrames(layers.rain);

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const loaded = useRef<Set<string>>(new Set());
  const [loadingLayers, setLoadingLayers] = useState<Record<string, boolean>>(
    {},
  );
  function loadOnce(key: string, fn: () => void | Promise<unknown>) {
    if (loaded.current.has(key)) return;
    loaded.current.add(key);
    const result = fn();
    if (result && typeof (result as Promise<unknown>).finally === "function") {
      setLoadingLayers((prev) => ({ ...prev, [key]: true }));
      (result as Promise<unknown>).finally(() => {
        setLoadingLayers((prev) => ({ ...prev, [key]: false }));
      });
    }
  }

  useEffect(() => {
    fetch("/api/pulse")
      .then((r) => r.json())
      .then((d) => setPulse(d as PulseData));
    setBookmarks(loadBookmarks());

    if (typeof window !== "undefined") {
      const incoming = parseDeepLink(window.location.search);
      let initialLayers: Layers | null = null;
      if (incoming.modeId) {
        const m = MODES.find((mm) => mm.id === incoming.modeId);
        if (m) {
          setMode(m);
          initialLayers = { ...m.layers };
        }
      }
      if (incoming.selection?.kind === "place") {
        pendingPlaceRef.current = {
          lat: (incoming.selection as { lat: number; lng: number }).lat,
          lng: (incoming.selection as { lat: number; lng: number }).lng,
        };
      } else if (incoming.selection && "id" in incoming.selection) {
        pendingDeepLinkRef.current = incoming.selection;
        const layerForKind: Partial<Record<string, LayerKey>> = {
          quake: "quakes",
          event: "events",
          disaster: "disasters",
          launch: "launches",
          storm: "hurricanes",
          cetacean: "cetaceans",
          wildlife: "wildlife",
          cam: "cams",
          buoy: "buoys",
          fire: "fires",
          air: "airquality",
          rareBird: "rareBirds",
          ship: "ships",
          histStorm: "hurricanes",
        };
        const lk = layerForKind[incoming.selection.kind];
        if (lk) {
          if (!initialLayers)
            initialLayers = { ...(MODES[0].layers as Layers) };
          (initialLayers as Layers)[lk] = true;
        }
      } else {
        restoredRef.current = true;
      }
      if (initialLayers) setLayers(initialLayers);

      const params = new URLSearchParams(window.location.search);
      const forceTour = params.get("tour") === "1";
      const seenTour = localStorage.getItem("earthpulse_tour_v1");
      const hasDeepLink = !!incoming.selection;
      if (forceTour || (!seenTour && !hasDeepLink)) {
        setTourActive(true);
      }
    } else {
      restoredRef.current = true;
    }
  }, []);

  const pendingDeepLinkRef = useRef<{ kind: string; id: string } | null>(null);
  const pendingPlaceRef = useRef<{ lat: number; lng: number } | null>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!globeReady) return;
    const place = pendingPlaceRef.current;
    if (!place) return;
    pendingPlaceRef.current = null;
    selectPlace(place.lat, place.lng);
    restoredRef.current = true;
  }, [globeReady]);

  useEffect(() => {
    if (!layers.quakes && mode.id !== "tonight") return;
    loadOnce("quakes", () => {
      return fetch("/api/earthquakes")
        .then((r) => r.json())
        .then((d) => {
          setQuakes(d.quakes ?? []);
          setScrubT(Date.now());
        });
    });
  }, [layers.quakes, mode.id]);

  useEffect(() => {
    if (!layers.events) return;
    loadOnce("events", () => {
      return fetch("/api/events")
        .then((r) => r.json())
        .then((d) => setEvents(d.events ?? []));
    });
  }, [layers.events]);

  useEffect(() => {
    if (!layers.iss) return;
    loadOnce("astros", () => {
      return fetch("/api/astros")
        .then((r) => r.json())
        .then((d) => setAstros(d.people ?? []));
    });
  }, [layers.iss]);

  useEffect(() => {
    if (!layers.launches) return;
    loadOnce("launches", () => {
      return fetch("/api/launches")
        .then((r) => r.json())
        .then((d) => setLaunches(d.launches ?? []));
    });
  }, [layers.launches]);

  useEffect(() => {
    if (!layers.hurricanes) return;
    loadOnce("hurricanes", () => {
      return fetch("/api/hurricanes")
        .then((r) => r.json())
        .then((d) => setStorms(d.storms ?? []));
    });
  }, [layers.hurricanes]);

  useEffect(() => {
    if (!layers.disasters) return;
    loadOnce("disasters", () => {
      return fetch("/api/disasters")
        .then((r) => r.json())
        .then((d) => setDisasters(d.disasters ?? []));
    });
  }, [layers.disasters]);

  useEffect(() => {
    if (!layers.fires) return;
    loadOnce("fires", () => {
      return fetch("/api/firms")
        .then((r) => r.json())
        .then((d) => {
          setFires(d.fires ?? []);
          setFiresTotal(d.total ?? 0);
          setFiresNeedKey(!!d.needsKey);
        });
    });
  }, [layers.fires]);

  useEffect(() => {
    if (!layers.tides) return;
    loadOnce("tides", () => {
      return fetch("/api/tides")
        .then((r) => r.json())
        .then((d) => setTides(d.stations ?? []));
    });
  }, [layers.tides]);

  useEffect(() => {
    if (!layers.aurora) return;
    loadOnce("aurora", () => {
      return fetch("/api/aurora")
        .then((r) => r.json())
        .then((d) => {
          setAurora(d.points ?? []);
          setKp(d.kp ?? null);
        });
    });
  }, [layers.aurora]);

  useEffect(() => {
    if (!layers.cetaceans) return;
    loadOnce("cetaceans", () => {
      return fetch("/api/cetaceans")
        .then((r) => r.json())
        .then((d) => setCetaceans(d.sightings ?? []));
    });
  }, [layers.cetaceans]);

  useEffect(() => {
    if (!layers.cables) return;
    loadOnce("cables", () => {
      return fetch("/api/cables")
        .then((r) => r.json())
        .then((d) => setCables(d.cables ?? []));
    });
  }, [layers.cables]);

  useEffect(() => {
    if (!layers.cams) return;
    loadOnce("cams", () => {
      return fetch("/api/cams")
        .then((r) => r.json())
        .then((d) => setCams(d.cams ?? []));
    });
  }, [layers.cams]);

  useEffect(() => {
    if (!layers.news) return;
    loadOnce("news", () => {
      return fetch("/api/news")
        .then((r) => r.json())
        .then((d) => {
          setNewsGroups(d.grouped ?? []);
          setNewsRateLimited(!!d.rateLimited);
        });
    });
  }, [layers.news]);

  useEffect(() => {
    if (!layers.buoys) return;
    loadOnce("buoys", () => {
      return fetch("/api/buoys")
        .then((r) => r.json())
        .then((d) => setBuoys(d.buoys ?? []));
    });
  }, [layers.buoys]);

  useEffect(() => {
    if (!layers.wildlife) return;
    loadOnce("wildlife", () => {
      return fetch("/api/wildlife")
        .then((r) => r.json())
        .then((d) => setWildlife(d.sightings ?? []));
    });
  }, [layers.wildlife]);

  useEffect(() => {
    if (!layers.plants) return;
    loadOnce("plants", () => {
      return fetch("/api/plants")
        .then((r) => r.json())
        .then((d) => setPlants(d.sightings ?? []));
    });
  }, [layers.plants]);

  useEffect(() => {
    if (!layers.airquality) return;
    loadOnce("airquality", () => {
      return fetch("/api/air-quality")
        .then((r) => r.json())
        .then((d) => {
          setAirStations(d.stations ?? []);
          setAirNeedsKey(!!d.needsKey);
        });
    });
  }, [layers.airquality]);

  useEffect(() => {
    if (!layers.ships) return;
    loadOnce("ships", () => {
      return fetch("/api/ships")
        .then((r) => r.json())
        .then((d) => {
          setShips(d.ships ?? []);
          setShipsTotal(d.total ?? 0);
          setShipsNeedsKey(!!d.needsKey);
        });
    });
  }, [layers.ships]);

  useEffect(() => {
    if (!layers.rareBirds) return;
    loadOnce("rareBirds", () => {
      return fetch("/api/ebird")
        .then((r) => r.json())
        .then((d) => {
          setRareBirds(d.sightings ?? []);
          setRareBirdsNeedsKey(!!d.needsKey);
        });
    });
  }, [layers.rareBirds]);

  useEffect(() => {
    if (!layers.avalanches) return;
    loadOnce("avalanches", () => {
      return fetch("/api/avalanches")
        .then((r) => r.json())
        .then((d) => setAvalanches(d.zones ?? []));
    });
  }, [layers.avalanches]);

  useEffect(() => {
    if (!layers.volcanoes) return;
    loadOnce("volcanoes", () => {
      return fetch("/api/volcanoes")
        .then((r) => r.json())
        .then((d) => setVolcanoes(d.volcanoes ?? []));
    });
  }, [layers.volcanoes]);

  useEffect(() => {
    if (!layers.tsunamis) return;
    loadOnce("tsunamis", () => {
      return fetch("/api/tsunamis")
        .then((r) => r.json())
        .then((d) => setTsunamis(d.tsunamis ?? []));
    });
  }, [layers.tsunamis]);

  useEffect(() => {
    if (!layers.tornadoes || mode.id === "timetravel") return;
    loadOnce("tornadoes", () => {
      return fetch("/api/tornadoes")
        .then((r) => r.json())
        .then((d) => setTornadoes(d.tornadoes ?? []));
    });
  }, [layers.tornadoes, mode.id]);

  useEffect(() => {
    if (mode.id !== "timetravel" || !layers.tornadoes) return;
    fetch(`/api/tornadoes-historical?year=${historicalYear}`)
      .then((r) => r.json())
      .then((d) => setHistoricalTornadoes(d.tornadoes ?? []));
  }, [historicalYear, mode.id, layers.tornadoes]);

  useEffect(() => {
    if (mode.id !== "timetravel") return;
    setHistoricalLoading(true);
    fetch(`/api/quakes-historical?year=${historicalYear}`)
      .then((r) => r.json())
      .then((d) => {
        setHistoricalQuakes(d.quakes ?? []);
        setHistoricalMinMag(d.minMag ?? 6);
      })
      .finally(() => setHistoricalLoading(false));
  }, [historicalYear, mode.id]);

  useEffect(() => {
    if (mode.id !== "timetravel" || !layers.hurricanes) return;
    fetch(`/api/hurricanes-historical?year=${historicalYear}`)
      .then((r) => r.json())
      .then((d) => setHistoricalStorms(d.storms ?? []));
  }, [historicalYear, mode.id, layers.hurricanes]);

  useEffect(() => {
    if (mode.id !== "timetravel" || !layers.volcanoes) return;
    fetch(`/api/eruptions-historical?year=${historicalYear}`)
      .then((r) => r.json())
      .then((d) => setHistoricalEruptions(d.eruptions ?? []));
  }, [historicalYear, mode.id, layers.volcanoes]);

  useEffect(() => {
    if (!layers.iss) return;
    let timer: ReturnType<typeof setInterval>;
    async function ping() {
      try {
        const r = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
        if (!r.ok) return;
        const d = await r.json();
        setIss({
          lat: d.latitude,
          lng: d.longitude,
          alt: d.altitude,
          velocity: d.velocity,
        });
      } catch {}
    }
    ping();
    timer = setInterval(ping, 5000);
    return () => clearInterval(timer);
  }, [layers.iss]);

  const [aircraftRateLimited, setAircraftRateLimited] = useState(false);
  useEffect(() => {
    if (!layers.aircraft) return;
    let timer: ReturnType<typeof setInterval>;
    async function ping() {
      try {
        const r = await fetch("/api/aircraft");
        if (!r.ok) return;
        const d = await r.json();
        setAircraft(d.aircraft ?? []);
        setAircraftTotal(d.total ?? 0);
        setAircraftRateLimited(!!d.rateLimited);
      } catch {}
    }
    ping();
    timer = setInterval(ping, 300000);
    return () => clearInterval(timer);
  }, [layers.aircraft]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!globeEl.current || size.w === 0 || !globeReady) return;
    const g = globeEl.current;
    g.controls().autoRotateSpeed = 0.35;
    const hasPending =
      pendingDeepLinkRef.current || pendingPlaceRef.current;
    if (!hasPending && !selection) {
      g.controls().autoRotate = true;
      g.pointOfView({ lat: 20, lng: -30, altitude: 2.4 }, 0);
    } else {
      g.controls().autoRotate = false;
    }
  }, [size.w, globeReady]);

  useEffect(() => {
    if (!selection) return;
    const g = globeEl.current;
    if (!g || !g.controls) return;
    const controls = g.controls();
    if (controls) controls.autoRotate = false;
  }, [selection]);

  useEffect(() => {
    if (!selection || !globeEl.current || !globeReady) return;
    let lat: number | null = null;
    let lng: number | null = null;
    const s = selection;
    if (s.kind === "place") {
      lat = s.lat;
      lng = s.lng;
    } else if (s.kind === "event") {
      lat = s.event.lat;
      lng = s.event.lng;
    } else if (s.kind === "disaster") {
      lat = s.disaster.lat;
      lng = s.disaster.lng;
    } else if (s.kind === "launch") {
      lat = s.launch.lat;
      lng = s.launch.lng;
    } else if (s.kind === "storm") {
      lat = s.storm.lat;
      lng = s.storm.lng;
    } else if (s.kind === "cetacean") {
      lat = s.cetacean.lat;
      lng = s.cetacean.lng;
    } else if (s.kind === "wildlife") {
      lat = s.wildlife.lat;
      lng = s.wildlife.lng;
    } else if (s.kind === "cam") {
      lat = s.cam.lat;
      lng = s.cam.lng;
    } else if (s.kind === "news") {
      lat = s.group.lat;
      lng = s.group.lng;
    } else if (s.kind === "buoy") {
      lat = s.buoy.lat;
      lng = s.buoy.lng;
    } else if (s.kind === "quake") {
      lat = s.quake.lat;
      lng = s.quake.lng;
    } else if (s.kind === "fire") {
      lat = s.fire.lat;
      lng = s.fire.lng;
    } else if (s.kind === "air") {
      lat = s.station.lat;
      lng = s.station.lng;
    } else if (s.kind === "ship") {
      lat = s.ship.lat;
      lng = s.ship.lng;
    } else if (s.kind === "rareBird") {
      lat = s.bird.lat;
      lng = s.bird.lng;
    } else if (s.kind === "histStorm") {
      lat = s.storm.path[0]?.[0] ?? null;
      lng = s.storm.path[0]?.[1] ?? null;
    } else if (s.kind === "avalanche") {
      lat = s.zone.lat;
      lng = s.zone.lng;
    } else if (s.kind === "volcano") {
      lat = s.volcano.lat;
      lng = s.volcano.lng;
    } else if (s.kind === "histEruption") {
      lat = s.eruption.lat;
      lng = s.eruption.lng;
    } else if (s.kind === "iss") {
      lat = s.iss.lat;
      lng = s.iss.lng;
    } else if (s.kind === "sun") {
      lat = s.sun.lat;
      lng = s.sun.lng;
    } else if (s.kind === "tsunami") {
      lat = s.tsunami.lat;
      lng = s.tsunami.lng;
    } else if (s.kind === "tornado") {
      lat = s.tornado.lat;
      lng = s.tornado.lng;
    } else if (s.kind === "histTornado") {
      lat = s.tornado.slat;
      lng = s.tornado.slon;
    } else if (s.kind === "plant") {
      lat = s.plant.lat;
      lng = s.plant.lng;
    } else if (s.kind === "star") {
      lat = s.star.lat;
      lng = s.star.lng;
    } else if (s.kind === "moon") {
      lat = s.moon.lat;
      lng = s.moon.lng;
    }
    if (lat == null || lng == null) return;
    const targetLat = lat;
    const targetLng = lng;
    const raf = requestAnimationFrame(() => {
      flyTo(targetLat, targetLng);
    });
    return () => cancelAnimationFrame(raf);
  }, [selection, globeReady]);

  const scrubActive = mode.id === "tonight";
  const quakeRange = useMemo(() => {
    if (quakes.length === 0) return { start: now - 86_400_000, end: now };
    const times = quakes.map((q) => q.time);
    return { start: Math.min(...times), end: Math.max(...times, now) };
  }, [quakes, now]);

  const visibleQuakes = useMemo(() => {
    if (!scrubActive) return quakes;
    return quakes.filter((q) => q.time <= scrubT);
  }, [quakes, scrubT, scrubActive]);

  const sunPos = useMemo(() => subsolar(new Date(now)), [now]);
  const liveMoon = useMemo<Moon>(() => {
    const m = moonState(new Date(now));
    return {
      lat: m.lat,
      lng: m.lng,
      illumination: m.illumination,
      phaseName: m.phaseName,
      phaseEmoji: m.phaseEmoji,
      ageDays: m.ageDays,
      distanceKm: m.distanceKm,
      nextFullMoon: m.nextFullMoon.toISOString(),
      nextNewMoon: m.nextNewMoon.toISOString(),
    };
  }, [now]);

  const liveStars = useMemo<Star[]>(() => {
    const date = new Date(now);
    return STARS.map((s) => {
      const { lat, lng } = substellarPoint(s.ra, s.dec, date);
      return {
        name: s.name,
        constellation: s.constellation,
        mag: s.mag,
        distanceLy: s.distanceLy,
        blurb: s.blurb,
        spectralClass: s.spectralClass,
        color: s.color,
        lat,
        lng,
      };
    });
  }, [now]);
  const terminatorPath = useMemo(() => terminator(sunPos, 180), [sunPos]);

  useEffect(() => {
    const pending = pendingDeepLinkRef.current;
    if (!pending) return;
    if (!globeReady) return;
    let found: (() => void) | null = null;
    if (pending.kind === "quake") {
      const q = quakes.find((x) => x.id === pending.id);
      if (q) found = () => selectQuake(q);
    } else if (pending.kind === "event") {
      const e = events.find((x) => x.id === pending.id);
      if (e) found = () => selectEvent(e);
    } else if (pending.kind === "disaster") {
      const d = disasters.find((x) => x.id === pending.id);
      if (d) found = () => selectDisaster(d);
    } else if (pending.kind === "launch") {
      const l = launches.find((x) => x.id === pending.id);
      if (l) found = () => selectLaunch(l);
    } else if (pending.kind === "storm") {
      const s = storms.find((x) => x.id === pending.id);
      if (s) found = () => selectStorm(s);
    } else if (pending.kind === "cetacean") {
      const c = cetaceans.find((x) => x.id === pending.id);
      if (c) found = () => selectCetacean(c);
    } else if (pending.kind === "wildlife") {
      const w = wildlife.find((x) => x.id === pending.id);
      if (w) found = () => selectWildlife(w);
    } else if (pending.kind === "cam") {
      const c = cams.find((x) => x.id === pending.id);
      if (c) found = () => selectCam(c);
    } else if (pending.kind === "rareBird") {
      const b = rareBirds.find((x) => x.id === pending.id);
      if (b) found = () => selectRareBird(b);
    }
    if (found) {
      pendingDeepLinkRef.current = null;
      found();
      restoredRef.current = true;
    }
  }, [
    globeReady,
    quakes,
    events,
    disasters,
    launches,
    storms,
    cetaceans,
    wildlife,
    cams,
    rareBirds,
  ]);

  const currentBookmark: Bookmark | null = useMemo(() => {
    if (!selection) return null;
    const s = selection;
    if (s.kind === "place") return null;
    let id = "",
      title = "",
      subtitle = "",
      emoji = "📍",
      lat = 0,
      lng = 0;
    if (s.kind === "event") {
      id = s.event.id;
      title = s.event.title;
      subtitle = s.event.category;
      emoji = "🌍";
      lat = s.event.lat;
      lng = s.event.lng;
    } else if (s.kind === "disaster") {
      id = s.disaster.id;
      title = s.disaster.name;
      subtitle = `${s.disaster.alert} alert · ${s.disaster.typeName}`;
      emoji = "⚠";
      lat = s.disaster.lat;
      lng = s.disaster.lng;
    } else if (s.kind === "launch") {
      id = s.launch.id;
      title = s.launch.name;
      subtitle = s.launch.provider;
      emoji = "🚀";
      lat = s.launch.lat;
      lng = s.launch.lng;
    } else if (s.kind === "storm") {
      id = s.storm.id;
      title = s.storm.name;
      subtitle = s.storm.classification;
      emoji = "🌀";
      lat = s.storm.lat;
      lng = s.storm.lng;
    } else if (s.kind === "cetacean") {
      id = s.cetacean.id;
      title = s.cetacean.common;
      subtitle = s.cetacean.scientific;
      emoji = "🐋";
      lat = s.cetacean.lat;
      lng = s.cetacean.lng;
    } else if (s.kind === "wildlife") {
      id = s.wildlife.id;
      title = s.wildlife.common;
      subtitle = s.wildlife.category;
      emoji = s.wildlife.emoji ?? "🐾";
      lat = s.wildlife.lat;
      lng = s.wildlife.lng;
    } else if (s.kind === "cam") {
      id = s.cam.id;
      title = s.cam.name;
      subtitle = s.cam.category;
      emoji = "📷";
      lat = s.cam.lat;
      lng = s.cam.lng;
    } else if (s.kind === "news") {
      id = s.group.country;
      title = s.group.country;
      subtitle = `${s.group.count} headlines`;
      emoji = "📰";
      lat = s.group.lat;
      lng = s.group.lng;
    } else if (s.kind === "buoy") {
      id = s.buoy.id;
      title = s.buoy.name || `Buoy ${s.buoy.id}`;
      subtitle = `NDBC ${s.buoy.id}`;
      emoji = s.buoy.dart ? "⚠" : "🛟";
      lat = s.buoy.lat;
      lng = s.buoy.lng;
    } else if (s.kind === "quake") {
      id = s.quake.id;
      title = `M${s.quake.mag.toFixed(1)} · ${s.quake.place}`;
      subtitle = "USGS earthquake";
      emoji = "🪨";
      lat = s.quake.lat;
      lng = s.quake.lng;
    } else if (s.kind === "fire") {
      id = s.fire.id ?? `fire-${s.fire.lat.toFixed(2)}-${s.fire.lng.toFixed(2)}`;
      title = s.fire.title ?? "Active wildfire";
      subtitle = "FIRMS hot pixel";
      emoji = "🔥";
      lat = s.fire.lat;
      lng = s.fire.lng;
    } else if (s.kind === "air") {
      id = s.station.id;
      title = s.station.name;
      subtitle = `AQI ${s.station.aqi} · ${s.station.severity}`;
      emoji = "💨";
      lat = s.station.lat;
      lng = s.station.lng;
    } else if (s.kind === "histStorm") {
      id = s.storm.id;
      title = s.storm.name;
      subtitle = `${s.storm.category} · ${s.storm.year}`;
      emoji = "🌀";
      lat = s.storm.path[0]?.[0] ?? 0;
      lng = s.storm.path[0]?.[1] ?? 0;
    } else if (s.kind === "ship") {
      id = `ship-${s.ship.mmsi}`;
      title = s.ship.name;
      subtitle = `MMSI ${s.ship.mmsi}`;
      emoji = "🚢";
      lat = s.ship.lat;
      lng = s.ship.lng;
    } else if (s.kind === "rareBird") {
      id = s.bird.id;
      title = s.bird.common;
      subtitle = s.bird.scientific;
      emoji = s.bird.emoji ?? "🐦";
      lat = s.bird.lat;
      lng = s.bird.lng;
    }
    return {
      key: bookmarkKey(s.kind, id),
      kind: s.kind,
      id,
      title,
      subtitle,
      emoji,
      lat,
      lng,
      savedAt: Date.now(),
    };
  }, [selection]);

  const shareUrl = useMemo(() => {
    if (!selection) return null;
    const state: DeepLinkState = { modeId: mode.id };
    if (selection.kind === "place") {
      state.selection = {
        kind: "place",
        lat: selection.lat,
        lng: selection.lng,
      };
    } else if (currentBookmark) {
      state.selection = { kind: selection.kind, id: currentBookmark.id };
    }
    return fullShareUrl(state);
  }, [selection, mode.id, currentBookmark]);

  const isCurrentSaved = currentBookmark
    ? isBookmarked(currentBookmark.key, bookmarks)
    : false;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!restoredRef.current) return;
    const state: DeepLinkState = { modeId: mode.id };
    if (selection?.kind === "place") {
      state.selection = {
        kind: "place",
        lat: selection.lat,
        lng: selection.lng,
      };
    } else if (selection && currentBookmark) {
      state.selection = { kind: selection.kind, id: currentBookmark.id };
    }
    const url = `${window.location.pathname}${encodeDeepLink(state)}`;
    window.history.replaceState(null, "", url);
  }, [selection, mode.id, currentBookmark]);

  function toggleSaveCurrent() {
    if (!currentBookmark) return;
    if (isCurrentSaved) {
      setBookmarks(removeBookmark(currentBookmark.key, bookmarks));
    } else {
      setBookmarks(addBookmark(currentBookmark, bookmarks));
    }
  }

  function pickBookmark(b: Bookmark) {
    if (b.kind === "place") {
      selectPlace(b.lat, b.lng);
      return;
    }
    flyTo(b.lat, b.lng);
  }

  const allPoints = useMemo(() => {
    const out: Array<any> = [];
    if (layers.quakes) {
      const sourceQuakes =
        mode.id === "timetravel" ? historicalQuakes : visibleQuakes;
      out.push(
        ...sourceQuakes.map((q) => ({
          ...q,
          kind: "quake" as const,
          color: q.mag >= 6 ? "#ff3030" : q.mag >= 4 ? "#ff7a30" : "#ffba30",
        })),
      );
    }
    if (layers.fires && fires.length > 600)
      out.push(
        ...fires.map((f, i) => ({
          ...f,
          id: `fire-${i}`,
          kind: "fire" as const,
          color: "#ff5520",
        })),
      );
    if (layers.tides)
      out.push(
        ...tides.map((t) => ({
          ...t,
          kind: "tide" as const,
          color: "#4dc9ff",
        })),
      );
    if (layers.aurora)
      out.push(
        ...aurora.map((p, i) => ({
          ...p,
          id: `aurora-${i}`,
          kind: "aurora" as const,
          color:
            p.strength > 60
              ? "#7afba7"
              : p.strength > 30
                ? "#5fe690"
                : "#3ec56e",
        })),
      );
    if (layers.cams)
      out.push(
        ...cams
          .filter((c) => c.category === "highway")
          .map((c) => ({
            ...c,
            kind: "cam" as const,
            color: "#fda4af",
          })),
      );
    if (layers.buoys)
      out.push(
        ...buoys.map((b) => ({
          ...b,
          kind: "buoy" as const,
          color: b.dart ? "#ffa3c7" : "#9bd2ff",
        })),
      );
    if (layers.airquality)
      out.push(
        ...airStations.map((s) => ({
          ...s,
          kind: "air" as const,
        })),
      );
    return out;
  }, [
    fires,
    tides,
    aurora,
    cams,
    buoys,
    visibleQuakes,
    historicalQuakes,
    airStations,
    mode.id,
    layers.fires,
    layers.tides,
    layers.aurora,
    layers.cams,
    layers.buoys,
    layers.quakes,
    layers.airquality,
  ]);

  const allPaths = useMemo(() => {
    const out: Array<any> = [];
    if (layers.terminator)
      out.push({
        kind: "terminator" as const,
        path: terminatorPath,
        color: "#ffd47a",
      });
    if (layers.cables)
      out.push(
        ...cables.map((c) => ({ ...c, kind: "cable" as const })),
      );
    if (mode.id === "timetravel" && layers.hurricanes) {
      out.push(
        ...historicalStorms.map((s) => ({
          ...s,
          kind: "histStorm" as const,
          color: stormCategoryColor(s.peakWindKt),
        })),
      );
    }
    return out;
  }, [
    terminatorPath,
    cables,
    historicalStorms,
    mode.id,
    layers.terminator,
    layers.cables,
    layers.hurricanes,
  ]);

  const ringData = useMemo(() => {
    const out: Array<any> = [];
    if (mode.id === "timetravel") {
      if (layers.quakes) {
        out.push(
          ...historicalQuakes.map((q) => ({ ...q, kind: "quake" as const })),
        );
      }
    } else {
      if (layers.quakes) {
        out.push(
          ...visibleQuakes.map((q) => ({ ...q, kind: "quake" as const })),
        );
      }
      if (layers.tsunamis && tsunamis.length > 0) {
        out.push(
          ...tsunamis.map((t) => ({ ...t, kind: "tsunami" as const })),
        );
      }
      if (layers.tornadoes && tornadoes.length > 0) {
        out.push(
          ...tornadoes.map((t) => ({ ...t, kind: "tornado" as const })),
        );
      }
    }
    return out;
  }, [
    visibleQuakes,
    layers.quakes,
    layers.tsunamis,
    layers.tornadoes,
    mode.id,
    historicalQuakes,
    tsunamis,
    tornadoes,
  ]);

  const htmlData = useMemo(() => {
    const out: Array<any> = [];
    if (layers.iss && iss) out.push({ ...iss, kind: "iss" });
    if (layers.terminator) out.push({ ...sunPos, kind: "sun" });
    if (layers.moon)
      out.push({
        ...liveMoon,
        kind: "moon" as const,
        _icon: liveMoon.phaseEmoji,
        _label: `Moon · ${liveMoon.phaseName}`,
      });
    if (layers.stars)
      out.push(
        ...liveStars.map((s) => ({
          ...s,
          kind: "star" as const,
          _label: `${s.name} · ${s.constellation}`,
        })),
      );
    if (layers.events)
      out.push(
        ...events.map((e) => ({
          ...e,
          kind: "event" as const,
          _icon: EVENT_EMOJI[e.category] ?? "⚠",
          _label: `${e.title} · ${e.category}`,
        })),
      );
    if (layers.disasters)
      out.push(
        ...disasters.map((d) => ({
          ...d,
          kind: "disaster" as const,
          _icon: DISASTER_EMOJI[d.type] ?? "⚠",
          _label: `${d.name} · ${d.alert} alert`,
        })),
      );
    if (layers.launches)
      out.push(
        ...launches.map((l) => ({
          ...l,
          kind: "launch" as const,
          _icon: "🚀",
          _label: l.name,
        })),
      );
    if (layers.hurricanes)
      out.push(
        ...storms.map((s) => ({
          ...s,
          kind: "storm" as const,
          _icon: "🌀",
          _label: `${s.name} · ${s.classification}`,
        })),
      );
    if (layers.cetaceans)
      out.push(
        ...cetaceans.map((c) => ({
          ...c,
          kind: "cetacean" as const,
          _icon: "🐋",
          _label: `${c.common} · ${c.scientific}`,
        })),
      );
    if (layers.wildlife)
      out.push(
        ...wildlife.map((w) => ({
          ...w,
          kind: "wildlife" as const,
          _icon: w.emoji,
          _label: `${w.common} · ${w.category}`,
        })),
      );
    if (layers.plants)
      out.push(
        ...plants.map((p) => ({
          ...p,
          kind: "plant" as const,
          _icon: p.emoji,
          _photo: p.photo,
          _label: `${p.common} · ${p.group}`,
        })),
      );
    if (layers.cams)
      out.push(
        ...cams
          .filter((c) => c.category !== "highway")
          .map((c) => ({
            ...c,
            kind: "cam" as const,
            _icon: CAM_EMOJI[c.category] ?? "📷",
            _label: `${c.name} · ${c.category}`,
          })),
      );
    if (layers.news)
      out.push(
        ...newsGroups.map((g) => ({
          ...g,
          kind: "news" as const,
          _icon: "📰",
          _label: `${g.country} · ${g.count} headlines`,
          _scale: Math.min(1.6, 0.9 + g.count / 8),
        })),
      );
    if (layers.fires && fires.length <= 600) {
      const max = 400;
      const sample =
        fires.length > max
          ? fires.filter((_, i) => i % Math.ceil(fires.length / max) === 0)
          : fires;
      out.push(
        ...sample.map((f, i) => ({
          ...f,
          id: f.id ?? `fire-${i}`,
          kind: "fire" as const,
          _icon: "🔥",
          _label: f.title
            ? f.title
            : `Active wildfire · ${f.bright ? Math.round(f.bright) + "K" : ""}`,
        })),
      );
    }
    if (layers.aircraft)
      out.push(
        ...aircraft.map((a) => ({
          ...a,
          kind: "aircraft" as const,
          _icon: "✈",
          _label: `${a.callsign || a.icao} · ${Math.round((a.altM ?? 0) / 304.8).toLocaleString()} ft`,
          _heading: a.heading ?? 0,
        })),
      );
    if (layers.ships)
      out.push(
        ...ships.map((s) => ({
          ...s,
          id: `ship-${s.mmsi}`,
          kind: "ship" as const,
          _icon: "🚢",
          _label: `${s.name} · ${(s.sog ?? 0).toFixed(1)} kt`,
        })),
      );
    if (layers.rareBirds)
      out.push(
        ...rareBirds.map((b) => ({
          ...b,
          kind: "rareBird" as const,
          _icon: b.emoji ?? "🐦",
          _photo: b.photo,
          _label: `${b.common} · ${b.location}`,
        })),
      );
    if (layers.volcanoes && mode.id !== "timetravel")
      out.push(
        ...volcanoes.map((v) => ({
          ...v,
          kind: "volcano" as const,
          _icon: "🌋",
          _label: `${v.name} · ${v.alertLevel} (${v.colorCode})`,
        })),
      );
    if (mode.id === "timetravel" && layers.volcanoes)
      out.push(
        ...historicalEruptions.map((e) => ({
          ...e,
          kind: "histEruption" as const,
          _icon: "🌋",
          _label: `${e.name} · ${e.year}${e.vei != null ? ` · VEI ${e.vei}` : ""}`,
          _scale:
            e.vei != null
              ? Math.min(1.7, 0.85 + e.vei * 0.18)
              : 1,
        })),
      );
    if (layers.avalanches)
      out.push(
        ...avalanches
          .filter((z) => !z.offSeason && z.rank > 0)
          .map((z) => ({
            ...z,
            kind: "avalanche" as const,
            _icon: "🏔",
            _label: `${z.name} · ${z.danger}`,
          })),
      );
    if (layers.tsunamis && mode.id !== "timetravel")
      out.push(
        ...tsunamis.map((t) => ({
          ...t,
          kind: "tsunami" as const,
          _icon: "🌊",
          _label: `${t.category} · ${t.title}`,
          _scale: 1 + t.rank * 0.1,
        })),
      );
    if (layers.tornadoes && mode.id !== "timetravel")
      out.push(
        ...tornadoes.map((t) => ({
          ...t,
          kind: "tornado" as const,
          _icon: "🌪",
          _label: `${t.event} · ${t.areaDesc.split(";")[0] ?? ""}`,
          _scale: t.isWarning ? 1.2 : 1,
        })),
      );
    if (mode.id === "timetravel" && layers.tornadoes)
      out.push(
        ...historicalTornadoes
          .filter((t) => t.ef >= 2)
          .map((t) => ({
            ...t,
            lat: t.slat,
            lng: t.slon,
            kind: "histTornado" as const,
            _icon: "🌪",
            _label: `EF${t.ef} · ${t.state} · ${t.date}${t.fat > 0 ? ` · ${t.fat} dead` : ""}`,
            _scale: 0.85 + (t.ef - 1) * 0.22,
          })),
      );
    return out;
  }, [
    iss,
    sunPos,
    events,
    disasters,
    launches,
    storms,
    cetaceans,
    wildlife,
    cams,
    newsGroups,
    aircraft,
    fires,
    ships,
    rareBirds,
    avalanches,
    volcanoes,
    tsunamis,
    tornadoes,
    plants,
    liveStars,
    liveMoon,
    historicalTornadoes,
    historicalEruptions,
    mode.id,
    layers.iss,
    layers.terminator,
    layers.events,
    layers.disasters,
    layers.launches,
    layers.hurricanes,
    layers.cetaceans,
    layers.wildlife,
    layers.cams,
    layers.news,
    layers.aircraft,
    layers.fires,
    layers.ships,
    layers.rareBirds,
    layers.avalanches,
    layers.volcanoes,
    layers.tsunamis,
    layers.tornadoes,
    layers.plants,
    layers.stars,
    layers.moon,
  ]);

  function applyMode(m: Mode) {
    setMode(m);
    setLayers(m.layers);
    if (m.id === "tonight") setScrubT(quakeRange.end);
  }

  function tourFlyTo(lat: number, lng: number, altitude: number) {
    if (!globeEl.current) return;
    const c = globeEl.current.controls?.();
    if (c) c.autoRotate = false;
    globeEl.current.pointOfView({ lat, lng, altitude }, 1500);
  }

  function dismissTour() {
    setTourActive(false);
    setTourIndex(0);
    if (typeof window !== "undefined") {
      localStorage.setItem("earthpulse_tour_v1", "1");
    }
  }

  const tourSteps = useMemo(() => {
    return [
      {
        id: "welcome",
        lat: 20,
        lng: -30,
        altitude: 2.4,
        title: "Earth · Pulse",
        body: "A 3D globe of our planet, breathing in real time. Quakes shaking, planes flying, the ISS overhead. Watch.",
        duration: 4,
      },
      {
        id: "iss",
        lat: iss?.lat ?? 35,
        lng: iss?.lng ?? 140,
        altitude: 1.4,
        title: "7 humans in orbit",
        body: "The International Space Station passes here every 93 minutes at 28,000 km/h. Click the satellite for crew + altitude.",
        duration: 6,
      },
      {
        id: "ring",
        lat: 15,
        lng: 145,
        altitude: 1.7,
        title: "Pacific Ring of Fire",
        body: "Every red ring is a real earthquake from the last 24 hours. Japan, the Philippines, Indonesia — the Pacific rim shakes every day.",
        duration: 7,
        enableLayers: ["quakes"],
      },
      {
        id: "tornadoes",
        lat: 36,
        lng: -97,
        altitude: 0.9,
        title: "Tornado Alley",
        body: "Switch to Time Travel and replay 70+ years of US tornadoes — every EF5 from 1950 to today.",
        duration: 6,
      },
      {
        id: "outro",
        lat: 30,
        lng: 0,
        altitude: 2.4,
        title: "Now you",
        body: "Click anything. Toggle layers on the right. Switch modes for a different lens. → Explore.",
        duration: 4,
      },
    ];
  }, [iss]);

  function flyTo(lat: number, lng: number, opts?: { fitAltitude?: number }) {
    if (!globeEl.current) return;
    const c = globeEl.current.controls?.();
    if (c) c.autoRotate = false;
    const current = globeEl.current.pointOfView?.();
    const fit = opts?.fitAltitude ?? 1.5;
    const altitude =
      current && typeof current.altitude === "number"
        ? Math.min(current.altitude, fit)
        : fit;
    globeEl.current.pointOfView({ lat, lng, altitude }, 1500);
  }

  async function selectPlace(lat: number, lng: number) {
    setSelection({ kind: "place", lat, lng });
    setBirds([]);
    setPlaceInfo(null);
    setWiki([]);
    setNarration(null);
    setBirdsLoading(true);
    setPlaceLoading(true);
    setWikiLoading(true);

    const placePromise = fetch(
      `/api/place?lat=${lat.toFixed(3)}&lng=${lng.toFixed(3)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        setPlaceInfo(d);
        return d as PlaceInfo;
      })
      .finally(() => setPlaceLoading(false));

    const birdsPromise = fetch(
      `/api/birds?lat=${lat.toFixed(3)}&lng=${lng.toFixed(3)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        const recs = d.recordings ?? [];
        setBirds(recs);
        return recs as Recording[];
      })
      .finally(() => setBirdsLoading(false));

    fetch(`/api/wiki?lat=${lat.toFixed(3)}&lng=${lng.toFixed(3)}`)
      .then((r) => r.json())
      .then((d) => setWiki(d.articles ?? []))
      .finally(() => setWikiLoading(false));

    setSpeciesLoading(true);
    setSpecies({ terrestrial: [], marine: [] });
    fetch(`/api/species?lat=${lat.toFixed(3)}&lng=${lng.toFixed(3)}`)
      .then((r) => r.json())
      .then((d) =>
        setSpecies({
          terrestrial: d.terrestrial ?? [],
          marine: d.marine ?? [],
        }),
      )
      .finally(() => setSpeciesLoading(false));

    setSatellites([]);
    fetch(`/api/satellites-above?lat=${lat.toFixed(3)}&lng=${lng.toFixed(3)}`)
      .then((r) => r.json())
      .then((d) => {
        setSatellites(d.satellites ?? []);
        setSatellitesNeedKey(!!d.needsKey);
      });

    Promise.all([placePromise, birdsPromise]).then(([place, recs]) => {
      narrate({
        kind: "place",
        lat,
        lng,
        place,
        birds: recs.slice(0, 3).map((b) => b.name),
      });
    });
  }

  function selectEvent(ev: EONETEvent) {
    setSelection({ kind: "event", event: ev });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
    narrate({ kind: "event", event: ev });
  }

  function selectLaunch(launch: Launch) {
    setSelection({ kind: "launch", launch });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectStorm(storm: Storm) {
    setSelection({ kind: "storm", storm });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectDisaster(disaster: Disaster) {
    setSelection({ kind: "disaster", disaster });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
    narrate({ kind: "disaster", disaster });
  }

  function selectCetacean(cetacean: Cetacean) {
    setSelection({ kind: "cetacean", cetacean });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectWildlife(w: Wildlife) {
    setSelection({ kind: "wildlife", wildlife: w });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectPlant(p: Plant) {
    setSelection({ kind: "plant", plant: p });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectStar(s: Star) {
    setSelection({ kind: "star", star: s });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectMoon(m: Moon) {
    setSelection({ kind: "moon", moon: m });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectQuake(quake: Quake) {
    setSelection({ kind: "quake", quake });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectFire(fire: Fire) {
    setSelection({ kind: "fire", fire });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectAir(station: AirStation) {
    setSelection({ kind: "air", station });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectShip(ship: Ship) {
    setSelection({ kind: "ship", ship });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectRareBird(bird: RareBird) {
    setSelection({ kind: "rareBird", bird });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectAvalanche(zone: Avalanche) {
    setSelection({ kind: "avalanche", zone });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectVolcano(volcano: Volcano) {
    setSelection({ kind: "volcano", volcano });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectTsunami(tsunami: Tsunami) {
    setSelection({ kind: "tsunami", tsunami });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectTornado(tornado: Tornado) {
    setSelection({ kind: "tornado", tornado });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectHistoricalTornado(tornado: HistoricalTornado) {
    setSelection({ kind: "histTornado", tornado });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectHistEruption(eruption: HistoricalEruption) {
    setSelection({ kind: "histEruption", eruption });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectIss(issNow: ISS) {
    setSelection({ kind: "iss", iss: issNow });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectSun(sun: { lat: number; lng: number }) {
    setSelection({ kind: "sun", sun });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectRain() {
    setSelection({ kind: "rain" });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectHistoricalStorm(storm: HistoricalStorm) {
    setSelection({ kind: "histStorm", storm });
    setNarration(null);
    if (globeEl.current && storm.path.length > 0) {
      const last = storm.path[Math.floor(storm.path.length / 2)];
    }
  }

  function selectCam(cam: Cam) {
    setSelection({ kind: "cam", cam });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectNews(group: NewsGroup) {
    setSelection({ kind: "news", group });
    setNarration(null);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
  }

  function selectBuoy(buoy: Buoy) {
    setSelection({ kind: "buoy", buoy });
    setNarration(null);
    setBuoyReadings(null);
    setBuoyLoading(true);
    if (globeEl.current) {
      const _c = globeEl.current.controls?.();
      if (_c) _c.autoRotate = false;
    }
    fetch(`/api/buoy?id=${encodeURIComponent(buoy.id)}`)
      .then((r) => r.json())
      .then((d) => setBuoyReadings(d.readings ?? null))
      .finally(() => setBuoyLoading(false));
  }

  async function narrate(payload: any) {
    setNarrationLoading(true);
    try {
      const context = buildNarrationContext(payload);
      const r = await fetch("/api/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });
      const d = await r.json();
      setNarration(d.narration ?? null);
    } catch {
      setNarration(null);
    } finally {
      setNarrationLoading(false);
    }
  }

  function playBird(rec: Recording) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingId === rec.id) {
      setPlayingId(null);
      return;
    }
    const src = rec.audio.startsWith("http") ? rec.audio : `https:${rec.audio}`;
    const a = new Audio(src);
    a.play().catch(() => setPlayingId(null));
    a.onended = () => setPlayingId(null);
    audioRef.current = a;
    setPlayingId(rec.id);
  }

  function closePanel() {
    setSelection(null);
    setNarration(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
  }

  function toggleLayer(k: LayerKey) {
    setLayers((l) => ({ ...l, [k]: !l[k] }));
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <div
        className={`absolute inset-0 ${
          isMobile && (selection || layersDrawerOpen) ? "mobile-panel-open" : ""
        }`}
      >
        {size.w > 0 && (
          <Globe
            ref={globeEl}
            width={size.w}
            height={size.h}
            onGlobeReady={() => setGlobeReady(true)}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            atmosphereColor={mode.atmosphereColor}
            atmosphereAltitude={0.22}
            pathsData={allPaths}
            pathPoints={(d: any) => d.path}
            pathPointLat={(p: any) => p[0]}
            pathPointLng={(p: any) => p[1]}
            pathColor={(d: any) =>
              d.kind === "terminator"
                ? ["rgba(255,200,90,1)", "rgba(255,160,40,0.7)"]
                : d.kind === "cable"
                  ? ["rgba(123,228,255,0.65)", "rgba(123,228,255,0.15)"]
                  : d.kind === "histStorm"
                    ? [d.color, d.color + "33"]
                    : [d.color, "rgba(255,255,255,0.05)"]
            }
            pathStroke={(d: any) =>
              d.kind === "terminator"
                ? 2.4
                : d.kind === "cable"
                  ? 0.5
                  : d.kind === "histStorm"
                    ? 1.2
                    : 1.6
            }
            pathDashLength={(d: any) =>
              d.kind === "terminator"
                ? 0.06
                : d.kind === "cable"
                  ? 1
                  : d.kind === "histStorm"
                    ? 0.4
                    : 0.06
            }
            pathDashGap={(d: any) =>
              d.kind === "terminator"
                ? 0.04
                : d.kind === "cable"
                  ? 0
                  : d.kind === "histStorm"
                    ? 0.05
                    : 0.02
            }
            pathDashAnimateTime={(d: any) =>
              d.kind === "terminator"
                ? 8000
                : d.kind === "cable"
                  ? 0
                  : d.kind === "histStorm"
                    ? 6000
                    : 8000
            }
            pathPointAlt={(d: any) =>
              d.kind === "cable"
                ? 0.001
                : d.kind === "histStorm"
                  ? 0.008
                  : d.kind === "terminator"
                    ? 0.012
                    : 0.005
            }
            pathLabel={(d: any) =>
              d.kind === "histStorm"
                ? `<div style="font-family:ui-sans-serif;background:rgba(0,0,0,0.85);border:1px solid rgba(255,255,255,0.15);padding:6px 10px;border-radius:8px;color:#fff;font-size:12px"><b>🌀 ${escape(d.name)}</b><div style="opacity:0.75;font-size:11px">${escape(d.category)} · peak ${d.peakWindKt}kt</div></div>`
                : ""
            }
            onPathClick={(d: any) => {
              if (d.kind === "histStorm") {
                iconClickedAt.current = Date.now();
                selectHistoricalStorm(d as HistoricalStorm);
              }
            }}
            pointsData={allPoints}
            pointLat="lat"
            pointLng="lng"
            pointColor={(d: any) => d.color}
            pointAltitude={(d: any) =>
              d.kind === "aircraft"
                ? Math.max(0.012, (d.altM ?? 0) / 150000)
                : d.kind === "launch"
                    ? 0.025
                    : d.kind === "storm"
                      ? 0.018
                      : d.kind === "disaster"
                        ? 0.014
                        : d.kind === "fire"
                          ? 0.012
                          : d.kind === "tide"
                            ? 0.006
                            : d.kind === "aurora"
                              ? 0.002 + (d.strength / 100) * 0.012
                              : d.kind === "cetacean"
                                ? 0.012
                                : d.kind === "cam"
                                  ? 0.014
                                  : d.kind === "buoy"
                                    ? 0.008
                                    : d.kind === "quake"
                                      ? 0.003
                                      : d.kind === "air"
                                        ? 0.005
                                        : d.kind === "ship"
                                          ? 0.005
                                          : 0.01
            }
            pointRadius={(d: any) => {
              const base =
                d.kind === "aircraft"
                  ? 0.28
                  : d.kind === "launch"
                    ? 0.7
                    : d.kind === "storm"
                      ? 0.9
                      : d.kind === "disaster"
                        ? d.alert === "Red"
                          ? 0.6
                          : d.alert === "Orange"
                            ? 0.45
                            : 0.3
                        : d.kind === "fire"
                          ? Math.max(0.25, Math.min(0.6, 0.25 + (d.frp ?? 1) * 0.02))
                          : d.kind === "tide"
                            ? 0.18
                            : d.kind === "aurora"
                              ? 0.32 + (d.strength / 100) * 0.6
                              : d.kind === "cetacean"
                                ? 0.4
                                : d.kind === "cam"
                                  ? 0.5
                                  : d.kind === "buoy"
                                    ? d.dart
                                      ? 0.4
                                      : 0.22
                                    : d.kind === "quake"
                                      ? Math.max(0.25, d.mag * 0.18)
                                      : d.kind === "air"
                                        ? Math.max(0.3, Math.min(0.8, d.aqi / 200))
                                        : d.kind === "ship"
                                          ? 0.18
                                          : 0.35;
              return isMobile ? base * 1.6 : base;
            }}
            pointLabel={(d: any) => {
              if (d.kind === "aircraft") {
                const alt = Math.round((d.altM ?? 0) / 304.8);
                return tooltipMono(
                  `<b>${d.callsign || d.icao}</b> · ${alt.toLocaleString()} ft`,
                  d.country ?? "",
                );
              }
              if (d.kind === "launch") {
                return tooltip(
                  `🚀 <b>${escape(d.name)}</b>`,
                  `${escape(d.pad)} · ${formatCountdown(d.net)}`,
                );
              }
              if (d.kind === "storm") {
                return tooltip(
                  `🌀 <b>${escape(d.name)}</b>`,
                  `${escape(d.classification)} · ${escape(d.intensity)} kt`,
                );
              }
              if (d.kind === "disaster") {
                const icon =
                  d.type === "EQ"
                    ? "🪨"
                    : d.type === "TC"
                      ? "🌀"
                      : d.type === "FL"
                        ? "🌊"
                        : d.type === "VO"
                          ? "🌋"
                          : d.type === "WF"
                            ? "🔥"
                            : d.type === "DR"
                              ? "🏜"
                              : "⚠";
                return tooltip(
                  `${icon} <b>${escape(d.name)}</b>`,
                  `<span style="color:${d.color}">${d.alert}</span> · ${escape(d.typeName)}`,
                );
              }
              if (d.kind === "fire") {
                return tooltipMono(
                  `🔥 ${Math.round(d.bright)}K`,
                  `FRP ${Math.round(d.frp)} MW`,
                );
              }
              if (d.kind === "tide") {
                return tooltip(
                  `🌊 <b>${escape(d.name)}</b>`,
                  `NOAA tide gauge${d.state ? " · " + escape(d.state) : ""}`,
                );
              }
              if (d.kind === "buoy") {
                return tooltip(
                  `${d.dart ? "⚠ DART tsunami buoy" : "🛟"} <b>${escape(d.name || d.id)}</b>`,
                  `NDBC ${d.id} · ${d.dart ? "tsunami detection · " : ""}${escape(d.owner)}`,
                );
              }
              if (d.kind === "quake") {
                return tooltip(
                  `🪨 <b>M${d.mag.toFixed(1)}</b>`,
                  `${escape(d.place)}${d.depth != null ? ` · depth ${Math.round(d.depth)}km` : ""}`,
                );
              }
              if (d.kind === "air") {
                return tooltip(
                  `💨 <b>AQI ${d.aqi}</b> · ${escape(d.severity)}`,
                  escape(d.name),
                );
              }
              if (d.kind === "ship") {
                return tooltip(
                  `🚢 <b>${escape(d.name)}</b>`,
                  `${(d.sog ?? 0).toFixed(1)} kt · COG ${Math.round(d.cog ?? 0)}°`,
                );
              }
              if (d.kind === "aurora") {
                return tooltipMono(
                  `✨ AURORA ${Math.round(d.strength)}%`,
                  "NOAA SWPC OVATION",
                );
              }
              if (d.kind === "cetacean") {
                return tooltip(
                  `🐋 <b>${escape(d.common)}</b>`,
                  `<i>${escape(d.scientific)}</i>${d.observed ? " · " + d.observed : ""}`,
                );
              }
              if (d.kind === "cam") {
                return tooltip(
                  `📷 <b>${escape(d.name)}</b>`,
                  `<span style="text-transform:uppercase;letter-spacing:0.1em;font-size:9px;color:#fda4af">${escape(d.category)}</span>`,
                );
              }
              return tooltipCat(d);
            }}
            onPointClick={(d: any) => {
              iconClickedAt.current = Date.now();
              if (d.kind === "event") selectEvent(d as EONETEvent);
              else if (d.kind === "launch") selectLaunch(d as Launch);
              else if (d.kind === "storm") selectStorm(d as Storm);
              else if (d.kind === "disaster") selectDisaster(d as Disaster);
              else if (d.kind === "cetacean") selectCetacean(d as Cetacean);
              else if (d.kind === "cam") selectCam(d as Cam);
              else if (d.kind === "buoy") selectBuoy(d as Buoy);
              else if (d.kind === "quake") selectQuake(d as Quake);
              else if (d.kind === "fire") selectFire(d as Fire);
              else if (d.kind === "air") selectAir(d as AirStation);
            }}
            ringsData={ringData}
            ringLat="lat"
            ringLng="lng"
            ringMaxRadius={(d: any) =>
              d.kind === "tsunami"
                ? 6 + d.rank * 2
                : d.kind === "tornado"
                  ? d.isWarning
                    ? 4
                    : 6
                  : Math.max(2, d.mag * 1.2)
            }
            ringPropagationSpeed={(d: any) =>
              d.kind === "tsunami"
                ? 4
                : d.kind === "tornado"
                  ? d.isWarning
                    ? 3
                    : 1.5
                  : Math.max(0.6, d.mag * 0.4)
            }
            ringRepeatPeriod={(d: any) =>
              d.kind === "tsunami"
                ? 900
                : d.kind === "tornado"
                  ? d.isWarning
                    ? 700
                    : 1300
                  : 1400 - Math.min(800, d.mag * 80)
            }
            ringColor={(d: any) => {
              if (d.kind === "tsunami" || d.kind === "tornado") {
                const c = (d.color ?? "#ff3030").replace("#", "");
                const r = parseInt(c.slice(0, 2), 16);
                const g = parseInt(c.slice(2, 4), 16);
                const b = parseInt(c.slice(4, 6), 16);
                return (t: number) =>
                  `rgba(${r},${g},${b},${0.9 * (1 - t)})`;
              }
              return (t: number) => `rgba(255,80,80,${0.85 * (1 - t)})`;
            }}
            ringAltitude={0.001}
            htmlElementsData={htmlData}
            htmlLat="lat"
            htmlLng="lng"
            htmlAltitude={(d: any) =>
              d.kind === "iss"
                ? d.alt / 6371
                : d.kind === "sun"
                  ? 0.04
                  : d.kind === "launch"
                    ? 0.025
                    : d.kind === "cetacean"
                      ? 0.014
                      : d.kind === "aircraft"
                        ? Math.max(0.005, (d.altM ?? 0) / 200000)
                        : 0.012
            }
            htmlElement={(d: any) => {
              const el = document.createElement("div");
              if (d.kind === "iss") {
                el.innerHTML = `<div class="g-icon" title="ISS · click for details" style="transform:translate(-50%,-50%);font-family:ui-sans-serif;color:#fff;text-align:center;cursor:pointer;pointer-events:auto;padding:6px;transition:transform 180ms ease,filter 180ms ease;filter:drop-shadow(0 0 6px rgba(0,0,0,0.6))"><div style="font-size:20px;line-height:1">🛰️</div><div style="margin-top:2px;font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.7);text-transform:uppercase">ISS</div></div>`;
                const inner = el.firstElementChild as HTMLDivElement;
                if (inner) {
                  inner.addEventListener("mouseenter", () => {
                    inner.style.transform = "translate(-50%,-50%) scale(1.4)";
                    inner.style.filter =
                      "drop-shadow(0 0 12px rgba(163,232,255,0.6))";
                  });
                  inner.addEventListener("mouseleave", () => {
                    inner.style.transform = "translate(-50%,-50%) scale(1)";
                    inner.style.filter =
                      "drop-shadow(0 0 6px rgba(0,0,0,0.6))";
                  });
                  inner.addEventListener("pointerup", (ev) => {
                    ev.stopPropagation();
                    iconClickedAt.current = Date.now();
                    selectIss(d as ISS);
                  });
                }
                return el;
              }
              if (d.kind === "star") {
                const mag = d.mag as number;
                const color = (d.color as string) ?? "#ffffff";
                const size = Math.max(10, 22 - mag * 4);
                const glow = Math.max(4, 9 - mag);
                el.innerHTML = `<div class="g-icon" title="${(d._label ?? "").replace(/"/g, "&quot;")}" style="position:relative;transform:translate(-50%,-50%);width:${size}px;height:${size}px;background:${color};clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);filter:drop-shadow(0 0 ${glow}px ${color}) drop-shadow(0 0 ${glow * 2}px ${color}aa);cursor:pointer;pointer-events:auto;transition:transform 200ms ease"></div>`;
                const innerEl = el.firstElementChild as HTMLDivElement;
                if (innerEl) {
                  innerEl.addEventListener("mouseenter", () => {
                    innerEl.style.transform = "translate(-50%,-50%) scale(1.6)";
                  });
                  innerEl.addEventListener("mouseleave", () => {
                    innerEl.style.transform = "translate(-50%,-50%) scale(1)";
                  });
                  innerEl.addEventListener("pointerup", (ev) => {
                    ev.stopPropagation();
                    iconClickedAt.current = Date.now();
                    selectStar(d as Star);
                  });
                }
                return el;
              }
              if (d.kind === "sun") {
                el.innerHTML = `<div class="g-icon" title="Subsolar point · click for details" style="position:relative;transform:translate(-50%,-50%);width:32px;height:32px;border-radius:50%;background:radial-gradient(circle,#ffffff 0%,#fff5b8 22%,#ffd147 50%,rgba(255,189,40,0.3) 75%,rgba(255,189,40,0) 100%);box-shadow:0 0 18px 6px rgba(255,209,71,0.85),0 0 48px 18px rgba(255,180,40,0.4),0 0 96px 32px rgba(255,140,40,0.2);cursor:pointer;pointer-events:auto;transition:transform 200ms ease"></div>`;
                const inner = el.firstElementChild as HTMLDivElement;
                if (inner) {
                  inner.addEventListener("mouseenter", () => {
                    inner.style.transform = "translate(-50%,-50%) scale(1.25)";
                  });
                  inner.addEventListener("mouseleave", () => {
                    inner.style.transform = "translate(-50%,-50%) scale(1)";
                  });
                  inner.addEventListener("pointerup", (ev) => {
                    ev.stopPropagation();
                    iconClickedAt.current = Date.now();
                    selectSun({ lat: d.lat, lng: d.lng });
                  });
                }
                return el;
              }
              const emoji = d._icon ?? "•";
              const label = (d._label ?? "").replace(/"/g, "&quot;");
              const baseSize =
                d.kind === "launch"
                  ? 20
                  : d.kind === "disaster" || d.kind === "storm"
                    ? 18
                    : d.kind === "aircraft"
                      ? 12
                      : 16;
              if (d.kind === "aircraft") {
                const heading = (d._heading ?? 0) - 45;
                const tint =
                  (d.altM ?? 0) > 10000
                    ? "#ffe16a"
                    : (d.altM ?? 0) > 7500
                      ? "#fff5c2"
                      : "#ffffff";
                el.innerHTML = `<div class="g-icon" title="${label}" style="position:absolute;left:0;top:0;transform:translate(-50%,-50%) rotate(${heading}deg);font-size:${baseSize}px;line-height:1;cursor:pointer;user-select:none;color:${tint};text-shadow:0 0 3px rgba(0,0,0,0.9);transition:transform 200ms ease;will-change:transform;pointer-events:auto">✈</div>`;
              } else if (
                (d.kind === "rareBird" || d.kind === "plant") &&
                d._photo
              ) {
                const src = (d._photo as string).replace(
                  /\/(square|small)\.(jpe?g|png)/i,
                  "/medium.$2",
                );
                const borderColor =
                  d.kind === "plant"
                    ? "rgba(244,114,182,0.9)"
                    : "rgba(122,211,107,0.85)";
                const badge =
                  d.kind === "plant" && d._icon
                    ? `<span style="position:absolute;bottom:-4px;right:-4px;font-size:11px;line-height:1;background:rgba(0,0,0,0.85);border:1px solid rgba(244,114,182,0.7);border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center">${d._icon}</span>`
                    : "";
                el.innerHTML = `<div class="g-icon" title="${label}" style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:50%;border:1.5px solid ${borderColor};box-shadow:0 0 6px rgba(0,0,0,0.7),0 0 0 2px rgba(0,0,0,0.6);background:#222 center/cover url('${src}');cursor:pointer;transition:transform 180ms ease;will-change:transform;pointer-events:auto">${badge}</div>`;
              } else if (d.kind === "news") {
                const tone = (d.tone as number | undefined) ?? 0;
                const toneColor =
                  tone <= -4
                    ? "#ff5c5c"
                    : tone <= -1
                      ? "#ffa45c"
                      : tone >= 4
                        ? "#7af07a"
                        : tone >= 1
                          ? "#a8d68f"
                          : "#cdd3dc";
                const count = (d.count as number) ?? 1;
                const dotSize = Math.max(8, Math.min(28, 7 + Math.sqrt(count) * 3.5));
                const glow = Math.max(4, dotSize * 0.5);
                el.innerHTML = `<div class="g-icon" title="${label}" style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${toneColor};opacity:0.92;box-shadow:0 0 ${glow}px ${toneColor},inset 0 0 2px rgba(0,0,0,0.4);border:1px solid rgba(0,0,0,0.4);cursor:pointer;transition:transform 180ms ease;will-change:transform;pointer-events:auto"></div>`;
              } else if (d.kind === "histTornado") {
                const ef = d.ef as number;
                const efColor =
                  ef >= 5
                    ? "#9c27e3"
                    : ef === 4
                      ? "#ff3030"
                      : ef === 3
                        ? "#ff7a30"
                        : ef === 2
                          ? "#ffba30"
                          : "#9bd2ff";
                const scale = d._scale ?? 1;
                const dotSize = 10 + ef * 2;
                el.innerHTML = `<div class="g-icon" title="${label}" style="position:absolute;left:0;top:0;transform:translate(-50%,-50%) scale(${scale});cursor:pointer;user-select:none;transition:transform 180ms ease,filter 180ms ease;will-change:transform;pointer-events:auto;display:flex;align-items:center;justify-content:center;width:${dotSize * 2}px;height:${dotSize * 2}px"><span style="position:absolute;width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${efColor};box-shadow:0 0 ${4 + ef * 2}px ${efColor},0 0 2px rgba(0,0,0,0.6);opacity:0.9"></span><span style="position:relative;font-size:${baseSize - 2}px;color:#fff;text-shadow:0 0 2px rgba(0,0,0,0.95),0 0 4px ${efColor}">🌪</span></div>`;
              } else {
                el.innerHTML = `<div class="g-icon" title="${label}" style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);font-size:${baseSize}px;line-height:1;cursor:pointer;user-select:none;text-shadow:0 1px 4px rgba(0,0,0,0.85);transition:transform 180ms ease,filter 180ms ease;will-change:transform;filter:drop-shadow(0 0 6px rgba(0,0,0,0.6));pointer-events:auto;padding:6px;border-radius:50%">${emoji}</div>`;
              }
              const inner = el.firstElementChild as HTMLDivElement;
              if (inner) {
                if (d.kind === "aircraft") {
                  const heading = (d._heading ?? 0) - 45;
                  inner.addEventListener("mouseenter", () => {
                    inner.style.transform = `translate(-50%,-50%) rotate(${heading}deg) scale(1.8)`;
                  });
                  inner.addEventListener("mouseleave", () => {
                    inner.style.transform = `translate(-50%,-50%) rotate(${heading}deg) scale(1)`;
                  });
                } else {
                  inner.addEventListener("mouseenter", () => {
                    inner.style.transform =
                      "translate(-50%,-50%) scale(1.6)";
                    inner.style.filter =
                      "drop-shadow(0 0 10px rgba(255,255,255,0.4))";
                  });
                  inner.addEventListener("mouseleave", () => {
                    inner.style.transform = "translate(-50%,-50%) scale(1)";
                    inner.style.filter =
                      "drop-shadow(0 0 6px rgba(0,0,0,0.6))";
                  });
                  inner.addEventListener("pointerup", (ev) => {
                    ev.stopPropagation();
                    iconClickedAt.current = Date.now();
                    if (d.kind === "event") selectEvent(d as EONETEvent);
                    else if (d.kind === "disaster")
                      selectDisaster(d as Disaster);
                    else if (d.kind === "launch") selectLaunch(d as Launch);
                    else if (d.kind === "storm") selectStorm(d as Storm);
                    else if (d.kind === "cetacean")
                      selectCetacean(d as Cetacean);
                    else if (d.kind === "wildlife")
                      selectWildlife(d as Wildlife);
                    else if (d.kind === "cam") selectCam(d as Cam);
                    else if (d.kind === "news") selectNews(d as NewsGroup);
                    else if (d.kind === "fire") selectFire(d as Fire);
                    else if (d.kind === "ship") selectShip(d as Ship);
                    else if (d.kind === "rareBird") selectRareBird(d as RareBird);
                    else if (d.kind === "avalanche") selectAvalanche(d as Avalanche);
                    else if (d.kind === "volcano") selectVolcano(d as Volcano);
                    else if (d.kind === "histEruption")
                      selectHistEruption(d as HistoricalEruption);
                    else if (d.kind === "tsunami")
                      selectTsunami(d as Tsunami);
                    else if (d.kind === "tornado")
                      selectTornado(d as Tornado);
                    else if (d.kind === "histTornado")
                      selectHistoricalTornado(d as HistoricalTornado);
                    else if (d.kind === "plant")
                      selectPlant(d as Plant);
                    else if (d.kind === "moon")
                      selectMoon(d as Moon);
                  });
                }
              }
              return el;
            }}
            onGlobeClick={({ lat, lng }: { lat: number; lng: number }) => {
              if (Date.now() - iconClickedAt.current < 350) return;
              selectPlace(lat, lng);
            }}
          />
        )}
      </div>

      <div className="pointer-events-none absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-start">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-light tracking-[0.18em] text-white/90">
            EARTH<span className="text-white/50">·</span>PULSE
          </h1>
          <p className="text-xs text-white/50 mt-1 tracking-wider">
            {mode.blurb}
          </p>
          {mode.id === "live" && (
            <button
              onClick={() => applyMode(modeById("tonight"))}
              className="mt-2 text-[10px] uppercase tracking-[0.25em] text-amber-200/70 hover:text-amber-200 transition-colors cursor-pointer"
            >
              → Try Tonight on Earth for the full picture
            </button>
          )}
        </div>
      </div>

      <ModeSwitcher current={mode.id} onChange={applyMode} />

      <BookmarksDrawer
        bookmarks={bookmarks}
        onPick={pickBookmark}
        onRemove={(key) => setBookmarks(removeBookmark(key, bookmarks))}
      />

      {!isMobile && (
        <LayerToggle
          layers={layers}
          toggle={toggleLayer}
          mode={mode}
          loadingLayers={loadingLayers}
          onOpenRain={selectRain}
          rainAvailable={rainFrames.length > 0}
        />
      )}

      {isMobile && !layersDrawerOpen && (
        <button
          onClick={() => setLayersDrawerOpen(true)}
          className="fixed bottom-4 right-4 z-30 bg-black/70 backdrop-blur-md border border-white/15 rounded-full px-4 py-2.5 text-xs text-white/85 cursor-pointer shadow-lg flex items-center gap-2"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: mode.accent }}
          />
          Layers
        </button>
      )}

      <AnimatePresence>
        {isMobile && layersDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLayersDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 240 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.3}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setLayersDrawerOpen(false);
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl bg-zinc-950 border-t border-white/10 overflow-hidden flex flex-col"
            >
              <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/30" />
              </div>
              <div className="flex justify-between items-center px-5 pb-2 shrink-0">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Layers
                </div>
                <span
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: mode.accent }}
                >
                  {mode.label}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-6">
                <LayerToggle
                  layers={layers}
                  toggle={toggleLayer}
                  mode={mode}
                  loadingLayers={loadingLayers}
                  onOpenRain={selectRain}
                  rainAvailable={rainFrames.length > 0}
                  inline
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute top-24 left-6 z-10 space-y-4">
        <HeartRate pulse={pulse} />
        {!isMobile && (
          <Telemetry
            iss={iss}
            sun={sunPos}
            showIss={layers.iss}
            showSun={layers.terminator}
            kp={kp}
            auroraCount={aurora.length}
            showAurora={layers.aurora}
          />
        )}
      </div>

      <TimeScrubber
        active={scrubActive && mode.id !== "timetravel"}
        rangeStart={quakeRange.start}
        rangeEnd={quakeRange.end}
        scrubT={Math.min(scrubT, quakeRange.end)}
        onChange={setScrubT}
        countNow={visibleQuakes.length}
        countTotal={quakes.length}
      />

      <YearScrubber
        active={mode.id === "timetravel"}
        year={historicalYear}
        onChange={setHistoricalYear}
        summary={[
          layers.quakes
            ? `${historicalQuakes.length} M${historicalMinMag}+ quakes`
            : null,
          layers.tornadoes
            ? `${historicalTornadoes.length} tornadoes`
            : null,
          layers.volcanoes
            ? `${historicalEruptions.length} eruptions`
            : null,
          layers.hurricanes
            ? `${historicalStorms.length} storms`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        loading={historicalLoading}
      />

      <div className="pointer-events-none absolute bottom-6 left-6 z-10 text-[9px] tracking-widest text-white/30 uppercase leading-relaxed max-w-[440px] hidden md:block">
        USGS · NASA EONET · OpenSky · ISS · Open Notify · iNaturalist ·
        Open-Meteo · REST Countries · Wikipedia · Claude · NASA APOD · Launch
        Library 2 · NOAA NHC · GDACS · NASA FIRMS · NOAA Tides · N2YO · GBIF ·
        OBIS · NOAA SWPC · RainViewer · TeleGeography · USGS archive · eBird ·
        AISStream · IUCN
        {firesTotal > 0 && (
          <>
            <br />
            <span className="text-orange-300/40 normal-case tracking-normal">
              {firesTotal.toLocaleString()} active fire pixels detected by VIIRS
              in last 24h
            </span>
          </>
        )}
        {firesNeedKey && layers.fires && (
          <>
            <br />
            <span className="text-orange-300/40 normal-case tracking-normal">
              🔥 wildfires · US-only EONET fallback in use · add NASA_FIRMS_KEY
              for global VIIRS satellite coverage
            </span>
          </>
        )}
        {airNeedsKey && layers.airquality && (
          <>
            <br />
            <span className="text-purple-300/40 normal-case tracking-normal">
              💨 air quality awaiting WAQI_TOKEN · free signup at
              aqicn.org/data-platform/token
            </span>
          </>
        )}
        {shipsNeedsKey && layers.ships && (
          <>
            <br />
            <span className="text-cyan-300/40 normal-case tracking-normal">
              🚢 live ships awaiting AIS_STREAM_KEY · free signup at aisstream.io
            </span>
          </>
        )}
        {!shipsNeedsKey && layers.ships && shipsTotal > 0 && (
          <>
            <br />
            <span className="text-cyan-300/40 normal-case tracking-normal">
              🚢 {shipsTotal.toLocaleString()} ships seen in the last 7-second
              snapshot
            </span>
          </>
        )}
        {rareBirdsNeedsKey && layers.rareBirds && (
          <>
            <br />
            <span className="text-emerald-300/40 normal-case tracking-normal">
              🦉 rare birds awaiting EBIRD_KEY · free signup at
              ebird.org/api/keygen
            </span>
          </>
        )}
        {aircraftRateLimited && (
          <>
            <br />
            <span className="text-yellow-300/40 normal-case tracking-normal">
              aircraft layer rate-limited by OpenSky · add OPENSKY_USER + OPENSKY_PASS for higher quota
            </span>
          </>
        )}
        {newsRateLimited && (
          <>
            <br />
            <span className="text-orange-300/40 normal-case tracking-normal">
              news pulse rate-limited by GDELT · the layer will refresh on the next allowed call
            </span>
          </>
        )}
      </div>

      <AnimatePresence>
        {selection && (
          <motion.aside
            initial={
              isMobile ? { y: "100%", opacity: 0 } : { x: "100%", opacity: 0 }
            }
            animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={
              isMobile ? { y: "100%", opacity: 0 } : { x: "100%", opacity: 0 }
            }
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.3}
            onDragEnd={(_, info) => {
              if (isMobile && info.offset.y > 120) closePanel();
            }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className={
              isMobile
                ? "fixed bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl bg-black/95 backdrop-blur-xl border-t border-white/10 z-30 overflow-hidden flex flex-col"
                : "absolute top-0 right-0 h-full w-full sm:w-[460px] bg-black/85 backdrop-blur-xl border-l border-white/10 z-30"
            }
          >
            {isMobile && (
              <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/30" />
              </div>
            )}
            <PanelToolbar
              shareUrl={shareUrl}
              isSaved={isCurrentSaved}
              canSave={!!currentBookmark}
              onToggleSave={toggleSaveCurrent}
            />
            <button
              onClick={closePanel}
              aria-label="Close panel"
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full border border-white/20 bg-black/70 backdrop-blur-md hover:bg-white/15 hover:border-white/40 cursor-pointer flex items-center justify-center text-white/80 hover:text-white text-base transition-colors"
            >
              ✕
            </button>
            <div
              className={
                isMobile
                  ? "flex-1 overflow-y-auto scrollbar-thin overscroll-contain"
                  : "h-full overflow-y-auto scrollbar-thin"
              }
            >
              <div
                className={
                  isMobile ? "px-5 pt-12 pb-6" : "px-6 pt-16 pb-8"
                }
              >
              <Narration narration={narration} loading={narrationLoading} />

              {selection.kind === "event" && (
                <EventView key={selection.event.id} event={selection.event} />
              )}

              {selection.kind === "launch" && (
                <LaunchView key={selection.launch.id} launch={selection.launch} />
              )}

              {selection.kind === "storm" && (
                <StormView key={selection.storm.id} storm={selection.storm} />
              )}

              {selection.kind === "disaster" && (
                <DisasterView
                  key={selection.disaster.id}
                  disaster={selection.disaster}
                />
              )}

              {selection.kind === "cetacean" && (
                <CetaceanView
                  key={selection.cetacean.id}
                  cetacean={selection.cetacean}
                />
              )}

              {selection.kind === "wildlife" && (
                <WildlifeView key={selection.wildlife.id} w={selection.wildlife} />
              )}

              {selection.kind === "quake" && (
                <QuakeView key={selection.quake.id} quake={selection.quake} />
              )}

              {selection.kind === "fire" && (
                <FireView
                  key={`${selection.fire.lat}-${selection.fire.lng}-${selection.fire.id ?? ""}`}
                  fire={selection.fire}
                />
              )}

              {selection.kind === "air" && (
                <AirView key={selection.station.id} station={selection.station} />
              )}

              {selection.kind === "histStorm" && (
                <HistoricalStormView
                  key={selection.storm.id}
                  storm={selection.storm}
                />
              )}

              {selection.kind === "ship" && (
                <ShipView key={selection.ship.mmsi} ship={selection.ship} />
              )}

              {selection.kind === "rareBird" && (
                <RareBirdView key={selection.bird.id} bird={selection.bird} />
              )}

              {selection.kind === "avalanche" && (
                <AvalancheView key={selection.zone.id} zone={selection.zone} />
              )}

              {selection.kind === "volcano" && (
                <VolcanoView
                  key={selection.volcano.id}
                  volcano={selection.volcano}
                />
              )}

              {selection.kind === "histEruption" && (
                <EruptionView
                  key={selection.eruption.id}
                  eruption={selection.eruption}
                />
              )}

              {selection.kind === "iss" && (
                <ISSView
                  key="iss-panel"
                  iss={selection.iss}
                  liveIss={iss}
                  astros={astros}
                />
              )}

              {selection.kind === "sun" && (
                <SunView key="sun-panel" liveSun={sunPos} now={now} />
              )}

              {selection.kind === "rain" && (
                <RainView key="rain-panel" frames={rainFrames} />
              )}

              {selection.kind === "tsunami" && (
                <TsunamiView
                  key={selection.tsunami.id}
                  tsunami={selection.tsunami}
                />
              )}

              {selection.kind === "tornado" && (
                <TornadoView
                  key={selection.tornado.id}
                  tornado={selection.tornado}
                />
              )}

              {selection.kind === "histTornado" && (
                <HistoricalTornadoView
                  key={selection.tornado.id}
                  tornado={selection.tornado}
                />
              )}

              {selection.kind === "plant" && (
                <PlantView key={selection.plant.id} plant={selection.plant} />
              )}

              {selection.kind === "star" && (
                <StarView key={selection.star.name} star={selection.star} />
              )}

              {selection.kind === "moon" && (
                <MoonView key="moon-panel" moon={selection.moon} />
              )}

              {selection.kind === "cam" && (
                <CamView cam={selection.cam} />
              )}

              {selection.kind === "news" && (
                <NewsView group={selection.group} />
              )}

              {selection.kind === "buoy" && (
                <BuoyView
                  buoy={selection.buoy}
                  readings={buoyReadings}
                  loading={buoyLoading}
                />
              )}

              {selection.kind === "place" && (
                <PlaceView
                  lat={selection.lat}
                  lng={selection.lng}
                  birds={birds}
                  birdsLoading={birdsLoading}
                  placeInfo={placeInfo}
                  placeLoading={placeLoading}
                  wiki={wiki}
                  wikiLoading={wikiLoading}
                  species={species}
                  speciesLoading={speciesLoading}
                  satellites={satellites}
                  satellitesNeedKey={satellitesNeedKey}
                  playingId={playingId}
                  onPlay={playBird}
                />
              )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {tourActive && globeReady && (
        <Tour
          steps={tourSteps}
          index={tourIndex}
          onAdvance={() => setTourIndex((i) => i + 1)}
          onDone={dismissTour}
          onFly={tourFlyTo}
          onEnableLayers={(keys) =>
            setLayers((prev) => {
              const next = { ...prev };
              for (const k of keys) {
                if (k in next) (next as any)[k] = true;
              }
              return next;
            })
          }
        />
      )}
    </div>
  );
}

function tooltip(title: string, sub: string) {
  return `<div style="font-family:ui-sans-serif;background:rgba(0,0,0,0.85);border:1px solid rgba(255,255,255,0.15);padding:8px 12px;border-radius:8px;color:#fff;font-size:12px;max-width:260px"><div style="font-size:14px">${title}</div><div style="opacity:0.7;font-size:11px;margin-top:2px">${sub}</div></div>`;
}
function tooltipMono(title: string, sub: string) {
  return `<div style="font-family:ui-monospace;background:rgba(0,0,0,0.85);border:1px solid rgba(255,255,255,0.15);padding:6px 10px;border-radius:6px;color:#fff;font-size:11px"><b>${title}</b><div style="opacity:0.6;font-size:10px">${sub}</div></div>`;
}
function tooltipCat(d: any) {
  return `<div style="font-family:ui-sans-serif;background:rgba(0,0,0,0.85);border:1px solid rgba(255,255,255,0.15);padding:8px 12px;border-radius:8px;color:#fff;font-size:12px;max-width:240px"><div style="color:${d.color};font-size:10px;letter-spacing:0.15em;text-transform:uppercase">${d.category}</div><div style="margin-top:4px"><b>${escape(d.title)}</b></div></div>`;
}
function escape(s: string) {
  return (s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]!);
}
function formatCountdown(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "TBD";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 24) return `T-${Math.floor(h / 24)}d ${h % 24}h`;
  return `T-${h}h ${m}m`;
}

function Telemetry({
  iss,
  sun,
  showIss,
  showSun,
  kp,
  auroraCount,
  showAurora,
}: {
  iss: ISS | null;
  sun: { lat: number; lng: number };
  showIss: boolean;
  showSun: boolean;
  kp: number | null;
  auroraCount: number;
  showAurora: boolean;
}) {
  const kpLabel =
    kp === null
      ? "—"
      : kp <= 2
        ? "quiet"
        : kp <= 4
          ? "unsettled"
          : kp <= 5
            ? "minor storm"
            : kp <= 6
              ? "moderate storm"
              : kp <= 7
                ? "strong storm"
                : "severe storm";
  return (
    <div className="text-[10px] text-white/50 font-mono leading-relaxed space-y-3">
      {showSun && (
        <div>
          <span className="text-amber-200/80">☀ SUN</span> ·{" "}
          {sun.lat.toFixed(1)}°, {sun.lng.toFixed(1)}°
        </div>
      )}
      {showAurora && kp !== null && (
        <div>
          <span className="text-emerald-300/80">✨ AURORA</span> · Kp {kp.toFixed(1)}{" "}
          <span className="text-white/35">({kpLabel})</span>
          <div className="text-white/35 text-[9px]">
            {auroraCount.toLocaleString()} active oval points
          </div>
        </div>
      )}
      {showIss && iss && (
        <div>
          <div>
            🛰 ISS · {iss.lat.toFixed(2)}°, {iss.lng.toFixed(2)}°
          </div>
          <div className="text-white/35 text-[9px]">
            click satellite for crew + orbit
          </div>
        </div>
      )}
    </div>
  );
}

function Narration({
  narration,
  loading,
}: {
  narration: string | null;
  loading: boolean;
}) {
  if (!loading && !narration) return null;
  return (
    <motion.div
      key={narration ?? "loading"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="mb-6 px-4 py-3 border-l-2 border-amber-200/40 bg-amber-50/[0.02]"
    >
      <div className="text-[10px] uppercase tracking-[0.2em] text-amber-200/60 mb-1.5">
        Field note
      </div>
      {loading ? (
        <div className="text-white/40 text-sm italic">composing…</div>
      ) : (
        <p className="text-white/85 text-sm leading-relaxed font-light italic">
          {narration}
        </p>
      )}
    </motion.div>
  );
}

const TIMETRAVEL_SUPPORTED: Set<LayerKey> = new Set([
  "quakes",
  "hurricanes",
  "volcanoes",
  "tornadoes",
  "terminator",
]);

type LayerItem = { key: LayerKey; label: string; color: string };
type LayerSection = { title: string; items: LayerItem[] };

const LAYER_SECTIONS: LayerSection[] = [
  {
    title: "Sky",
    items: [
      { key: "iss", label: "ISS + crew", color: "#a3e8ff" },
      { key: "moon", label: "Moon", color: "#e0c3fc" },
      { key: "stars", label: "Bright stars", color: "#cdb4ff" },
      { key: "aurora", label: "Aurora oval", color: "#7afba7" },
      { key: "rain", label: "Rainfall radar", color: "#7be4ff" },
      { key: "launches", label: "Launches", color: "#ffb14d" },
      { key: "terminator", label: "Sun + terminator", color: "#ffd47a" },
    ],
  },
  {
    title: "Earth in motion",
    items: [
      { key: "quakes", label: "Earthquakes", color: "#ff5050" },
      { key: "volcanoes", label: "Volcanoes (USGS)", color: "#ff9b3d" },
      { key: "hurricanes", label: "Hurricanes", color: "#9bc7ff" },
      { key: "tornadoes", label: "Tornadoes (US, NWS)", color: "#ff3030" },
      { key: "fires", label: "Wildfires (FIRMS)", color: "#ff5520" },
      { key: "avalanches", label: "Avalanches (US)", color: "#ffe16a" },
      { key: "disasters", label: "Disasters (GDACS)", color: "#ff9b3d" },
      { key: "events", label: "Natural events", color: "#ff6a3d" },
    ],
  },
  {
    title: "Ocean",
    items: [
      { key: "tsunamis", label: "Tsunami warnings", color: "#ff3030" },
      { key: "tides", label: "Tide gauges", color: "#4dc9ff" },
      { key: "buoys", label: "Ocean buoys (NDBC)", color: "#9bd2ff" },
      { key: "ships", label: "Ships (AIS)", color: "#7be4ff" },
    ],
  },
  {
    title: "Wildlife",
    items: [
      { key: "wildlife", label: "Wildlife sightings", color: "#7ad36b" },
      { key: "cetaceans", label: "Whales & dolphins", color: "#7be4ff" },
      { key: "rareBirds", label: "Rare birds (eBird)", color: "#7ad36b" },
      { key: "plants", label: "Rare plants 🌸", color: "#a8d68f" },
    ],
  },
  {
    title: "Human",
    items: [
      { key: "aircraft", label: "Aircraft", color: "#ffe16a" },
      { key: "cams", label: "Live webcams", color: "#fda4af" },
      { key: "news", label: "News pulse (GDELT)", color: "#ffb14d" },
      { key: "airquality", label: "Air quality (AQICN)", color: "#a872c6" },
      { key: "cables", label: "Submarine cables", color: "#7be4ff" },
    ],
  },
];

function LayerToggle({
  layers,
  toggle,
  mode,
  loadingLayers,
  onOpenRain,
  rainAvailable,
  inline = false,
}: {
  layers: Layers;
  toggle: (k: LayerKey) => void;
  mode: Mode;
  loadingLayers: Record<string, boolean>;
  onOpenRain: () => void;
  rainAvailable: boolean;
  inline?: boolean;
}) {
  const inTimeTravel = mode.id === "timetravel";
  const visibleSections = LAYER_SECTIONS.map((section) => ({
    ...section,
    items: inTimeTravel
      ? section.items.filter((it) => TIMETRAVEL_SUPPORTED.has(it.key))
      : section.items,
  })).filter((section) => section.items.length > 0);

  return (
    <div
      className={
        inline
          ? "text-xs"
          : "absolute bottom-6 right-6 z-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 text-xs max-h-[80vh] overflow-y-auto scrollbar-thin"
      }
    >
      {!inline && (
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2 px-1 flex justify-between items-center">
          <span>Layers</span>
          <span style={{ color: mode.accent }}>{mode.label}</span>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {visibleSections.map((section) => (
          <div key={section.title}>
            <div className="text-[9px] uppercase tracking-[0.25em] text-white/30 px-2 mb-1">
              {section.title}
            </div>
            <div className="flex flex-col gap-1">
              {section.items.map((it) => {
                const isLoading = !!loadingLayers[it.key];
                const showRainOpen =
                  it.key === "rain" && layers.rain && rainAvailable;
                return (
                  <div key={it.key} className="flex flex-col">
                    <button
                      onClick={() => toggle(it.key)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                        layers[it.key]
                          ? "bg-white/5 text-white cursor-pointer"
                          : "text-white/30 hover:text-white/60 cursor-pointer"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: layers[it.key]
                            ? it.color
                            : "transparent",
                          border: `1px solid ${it.color}`,
                        }}
                      />
                      <span className="flex-1 text-left">{it.label}</span>
                      {isLoading && (
                        <span
                          aria-label="loading"
                          className="w-3 h-3 rounded-full border border-white/40 border-t-transparent animate-spin shrink-0"
                        />
                      )}
                    </button>
                    {showRainOpen && (
                      <button
                        onClick={onOpenRain}
                        className="mt-0.5 ml-6 mb-0.5 text-[10px] uppercase tracking-[0.2em] text-cyan-300/70 hover:text-cyan-200 cursor-pointer text-left"
                      >
                        Open radar →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {inTimeTravel && (
        <div className="mt-3 px-1 text-[9px] uppercase tracking-[0.2em] text-amber-200/60 leading-relaxed">
          Time travel · historical layers only
        </div>
      )}
    </div>
  );
}


function buildNarrationContext(payload: any): string {
  if (payload.kind === "event") {
    const e = payload.event as EONETEvent;
    return `Active ${e.category.toLowerCase()}: ${e.title}, ongoing at ${e.lat.toFixed(2)}°, ${e.lng.toFixed(2)}° as of ${new Date(e.date).toLocaleDateString()}.`;
  }
  if (payload.kind === "disaster") {
    const d = payload.disaster as Disaster;
    return `${d.alert} alert ${d.typeName.toLowerCase()}: ${d.name}${d.country ? ", " + d.country : ""}, beginning ${new Date(d.fromDate).toLocaleDateString()}. ${d.description.slice(0, 240)}`;
  }
  if (payload.kind === "place") {
    const p = payload.place as PlaceInfo | null;
    const lat = payload.lat as number;
    const lng = payload.lng as number;
    const birdNames: string[] = payload.birds ?? [];
    const parts: string[] = [];
    parts.push(`Location: ${lat.toFixed(2)}°, ${lng.toFixed(2)}°.`);
    if (p?.place.city)
      parts.push(
        `${p.place.city}${p.place.region ? ", " + p.place.region : ""}, ${p.place.country ?? ""}.`,
      );
    else if (p?.place.country) parts.push(`${p.place.country}.`);
    else parts.push(`Open ocean or remote.`);
    if (p?.weather)
      parts.push(
        `Weather: ${p.weather.condition.toLowerCase()}, ${Math.round(p.weather.tempC)}°C, ${p.weather.isDay ? "daytime" : "night"}.`,
      );
    if (birdNames.length > 0)
      parts.push(`Recent bird recordings here include: ${birdNames.join(", ")}.`);
    return parts.join(" ");
  }
  return "";
}

void modeById;
