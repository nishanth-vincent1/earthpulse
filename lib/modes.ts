export type LayerKey =
  | "quakes"
  | "events"
  | "iss"
  | "aircraft"
  | "terminator"
  | "launches"
  | "hurricanes"
  | "disasters"
  | "fires"
  | "lightning"
  | "tides"
  | "aurora"
  | "cetaceans"
  | "cables"
  | "cams"
  | "news"
  | "newsCrisis"
  | "newsConflict"
  | "newsPolitics"
  | "newsEconomy"
  | "newsHealth"
  | "newsTech"
  | "buoys"
  | "wildlife"
  | "airquality"
  | "ships"
  | "rareBirds"
  | "avalanches"
  | "volcanoes"
  | "rain"
  | "tsunamis"
  | "tornadoes"
  | "plants"
  | "stars"
  | "moon"
  | "trueColor";

export type Mode = {
  id: string;
  label: string;
  icon: string;
  blurb: string;
  accent: string;
  layers: Record<LayerKey, boolean>;
  atmosphereColor: string;
};

const noLayers: Record<LayerKey, boolean> = {
  quakes: false,
  events: false,
  iss: false,
  aircraft: false,
  terminator: false,
  launches: false,
  hurricanes: false,
  disasters: false,
  fires: false,
  lightning: false,
  tides: false,
  aurora: false,
  cetaceans: false,
  cables: false,
  cams: false,
  news: false,
  newsCrisis: false,
  newsConflict: false,
  newsPolitics: false,
  newsEconomy: false,
  newsHealth: false,
  newsTech: false,
  buoys: false,
  wildlife: false,
  airquality: false,
  ships: false,
  rareBirds: false,
  avalanches: false,
  volcanoes: false,
  rain: false,
  tsunamis: false,
  tornadoes: false,
  plants: false,
  stars: false,
  moon: false,
  trueColor: false,
};

export const MODES: Mode[] = [
  {
    id: "live",
    label: "Live Earth",
    icon: "🌍",
    blurb: "The ISS overhead and the sun overhead. Toggle layers to bring more to life.",
    accent: "#6ec5ff",
    layers: {
      ...noLayers,
      iss: true,
      terminator: true,
    },
    atmosphereColor: "#6ec5ff",
  },
  {
    id: "migrations",
    label: "Wildlife",
    icon: "🐋",
    blurb: "Curated migration paths plus live wildlife sightings reported worldwide today.",
    accent: "#5fb7ff",
    layers: {
      ...noLayers,
      cetaceans: true,
      wildlife: true,
      rareBirds: true,
      terminator: true,
    },
    atmosphereColor: "#5fb7ff",
  },
  {
    id: "tonight",
    label: "Tonight on Earth",
    icon: "🔥",
    blurb: "Earthquakes, wildfires, floods and storms shaking the planet right now.",
    accent: "#ff6a3d",
    layers: {
      ...noLayers,
      quakes: true,
      events: true,
      disasters: true,
      fires: true,
      lightning: true,
      hurricanes: true,
      news: true,
      volcanoes: true,
      avalanches: true,
      rain: true,
      tsunamis: true,
      tornadoes: true,
      terminator: true,
    },
    atmosphereColor: "#ff6a3d",
  },
  {
    id: "ocean",
    label: "Ocean",
    icon: "🌊",
    blurb: "Tides, marine life, and storms over the seven seas.",
    accent: "#4dc9ff",
    layers: {
      ...noLayers,
      tides: true,
      hurricanes: true,
      cetaceans: true,
      buoys: true,
      ships: true,
      rain: true,
      tsunamis: true,
      terminator: true,
    },
    atmosphereColor: "#4dc9ff",
  },
  {
    id: "conservation",
    label: "Conservation",
    icon: "🌳",
    blurb: "Wildlife, biodiversity, and the pressures on the living world.",
    accent: "#7ad36b",
    layers: {
      ...noLayers,
      wildlife: true,
      cetaceans: true,
      plants: true,
      fires: true,
      events: true,
      terminator: true,
    },
    atmosphereColor: "#7ad36b",
  },
  {
    id: "timetravel",
    label: "Time Travel",
    icon: "⏰",
    blurb: "Replay a century of seismic history. Drag the year slider.",
    accent: "#fbbf24",
    layers: { ...noLayers, terminator: true, quakes: true, hurricanes: true },
    atmosphereColor: "#fbbf24",
  },
  {
    id: "internet",
    label: "Internet",
    icon: "🌐",
    blurb: "The submarine cables that carry 99% of intercontinental data.",
    accent: "#7be4ff",
    layers: { ...noLayers, cables: true, terminator: true },
    atmosphereColor: "#7be4ff",
  },
  {
    id: "cams",
    label: "Live Cams",
    icon: "📷",
    blurb: "See what the planet looks like right now — volcanoes, wildlife, cities, space.",
    accent: "#fda4af",
    layers: { ...noLayers, cams: true, terminator: true },
    atmosphereColor: "#fda4af",
  },
  {
    id: "story",
    label: "Tell Me a Story",
    icon: "📖",
    blurb: "Click anywhere. Wikipedia and Claude write you a moment.",
    accent: "#ffd47a",
    layers: { ...noLayers, terminator: true },
    atmosphereColor: "#ffd47a",
  },
];

export const DEFAULT_MODE_ID = "live";

export function modeById(id: string): Mode {
  return MODES.find((m) => m.id === id) ?? MODES[0];
}
