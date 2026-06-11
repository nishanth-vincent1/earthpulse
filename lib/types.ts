export type Recording = {
  id: string;
  name: string;
  scientific: string;
  place: string;
  observed: string;
  audio: string;
  attribution: string;
  photo: string | null;
  uri: string;
};

export type Quake = {
  id: string;
  mag: number;
  place: string;
  time: number;
  url: string;
  detail?: string;
  lat: number;
  lng: number;
  depth: number;
  felt?: number | null;
  cdi?: number | null;
  mmi?: number | null;
  alert?: string | null;
  status?: string | null;
  tsunami?: boolean;
  sig?: number | null;
  magType?: string | null;
  type?: string;
  nst?: number | null;
  source?: "usgs" | "emsc";
  agency?: string | null;
  // Number of quakes represented by this marker after spatial clustering
  // (1 = a lone quake; >1 = a mainshock/swarm head with nearby aftershocks).
  clusterCount?: number;
};

export type EONETEvent = {
  id: string;
  title: string;
  category: string;
  color: string;
  link: string;
  date: string;
  lat: number;
  lng: number;
};

export type Aircraft = {
  icao: string;
  callsign: string;
  country: string;
  lng: number;
  lat: number;
  altM: number;
  velocity: number | null;
  heading: number | null;
  reg?: string | null; // tail/registration (ADS-B feeds only)
  acType?: string | null; // aircraft type code, e.g. "B738"
};

export type Launch = {
  id: string;
  name: string;
  net: string;
  status: string;
  pad: string;
  provider: string;
  rocket: string;
  mission: string | null;
  orbit: string | null;
  image: string | null;
  lat: number;
  lng: number;
};

export type Storm = {
  id: string;
  name: string;
  classification: string;
  intensity: string;
  pressure: string;
  lat: number;
  lng: number;
  heading: number;
  speedKt: number;
};

export type Disaster = {
  id: string;
  type: string;
  typeName: string;
  name: string;
  alert: string;
  alertScore?: number | null;
  color: string;
  country: string;
  affectedCountries?: string[];
  fromDate: string;
  toDate: string;
  description: string;
  source?: string;
  severityText?: string;
  isCurrent?: boolean;
  reportUrl?: string;
  lat: number;
  lng: number;
};

export type Fire = {
  lat: number;
  lng: number;
  bright: number;
  frp: number;
  title?: string;
  date?: string;
  link?: string;
  id?: string;
  confidence?: string;
  acqDate?: string;
  acqTime?: string;
  satellite?: string;
  daynight?: string;
  type?: number;
  bright5?: number;
  source?: string;
};

export type TideStation = {
  id: string;
  name: string;
  state?: string;
  lat: number;
  lng: number;
};

export type TideData = {
  stationId: string;
  stationName: string | null;
  current: { time: string; feet: number; quality: string | null } | null;
  nextHigh: { time: string; feet: number } | null;
  nextLow: { time: string; feet: number } | null;
  todayHiLo: Array<{ time: string; feet: number; type: "H" | "L" }>;
  waterTempF: number | null;
  waterTempTime: string | null;
};

export type Satellite = {
  id: number;
  name: string;
  category: string;
  emoji: string;
  lat: number;
  lng: number;
  alt: number;
};

export type Species = {
  species: string;
  kingdom: string;
  class: string;
  photo?: string | null;
  date: string | null;
};

export type AuroraPoint = { lat: number; lng: number; strength: number };

export type Cetacean = {
  id: string;
  common: string;
  scientific: string;
  place: string;
  observed: string;
  obscured?: boolean;
  lat: number;
  lng: number;
  photo: string | null;
  uri: string;
};

export type Moon = {
  lat: number;
  lng: number;
  illumination: number;
  phaseName: string;
  phaseEmoji: string;
  ageDays: number;
  distanceKm: number;
  nextFullMoon: string;
  nextNewMoon: string;
};

export type Star = {
  name: string;
  constellation: string;
  mag: number;
  distanceLy: number;
  blurb: string;
  spectralClass: string;
  color: string;
  lat: number;
  lng: number;
};

export type Plant = {
  id: string;
  common: string;
  scientific: string;
  group: string;
  emoji: string;
  place: string;
  observed: string;
  obscured?: boolean;
  lat: number;
  lng: number;
  photo: string | null;
  photos?: string[];
  uri: string;
  observer?: string;
  taxonId?: number | null;
};

export type Wildlife = {
  id: string;
  common: string;
  scientific: string;
  category: string;
  emoji: string;
  place: string;
  observed: string;
  obscured?: boolean;
  lat: number;
  lng: number;
  photo: string | null;
  photos?: string[];
  uri: string;
  observer?: string;
  taxonId?: number | null;
};

export type AirStation = {
  id: string;
  uid: number;
  name: string;
  lat: number;
  lng: number;
  aqi: number;
  time: string | null;
  severity: string;
  color: string;
  source?: "aqicn" | "openaq";
};

export type LightningStrike = {
  id: string;
  lat: number;
  lng: number;
  energy: number;
  sat: string;
  time: string;
};

export type Avalanche = {
  id: string;
  name: string;
  center: string;
  state: string;
  danger: string;
  color: string;
  rank: number;
  travelAdvice: string;
  forecastUrl: string | null;
  offSeason: boolean;
  lat: number;
  lng: number;
};

export type Volcano = {
  id: string;
  name: string;
  observatory: string;
  observatoryAbbr: string;
  vnum: string;
  colorCode: string;
  alertLevel: string;
  color: string;
  noticeUrl: string;
  sentUtc: string;
  lat: number;
  lng: number;
};

export type RareBird = {
  id: string;
  common: string;
  scientific: string;
  emoji: string;
  photo: string | null;
  location: string;
  observed: string;
  count: number;
  lat: number;
  lng: number;
  validated: boolean;
  reviewed: boolean;
  speciesCode?: string;
  locId?: string;
};

export type Ship = {
  mmsi: number;
  name: string;
  lat: number;
  lng: number;
  cog: number;
  sog: number;
  heading: number;
  shipType: number;
  time: string;
};

export type HistoricalStorm = {
  id: string;
  name: string;
  basin: string;
  year: number;
  peakWindKt: number;
  category: string;
  path: Array<[number, number]>;
  track: Array<{
    date: string;
    time: string;
    status: string;
    lat: number;
    lng: number;
    maxWindKt: number;
    pressureMb: number | null;
  }>;
};

export type HistoricalEruption = {
  id: string;
  name: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  elevation?: number;
  morphology?: string;
  vei?: number;
  deaths?: number;
  damageM?: number;
  year: number;
  month?: number;
  day?: number;
};

export type Cable = {
  id: string;
  name: string;
  color: string;
  path: Array<[number, number]>;
};

export type CamType = "livestream" | "live-image" | "seasonal" | "info-page";

export type Cam = {
  id: string;
  name: string;
  category: string;
  type: CamType;
  seasonalNote?: string;
  lat: number;
  lng: number;
  description: string;
  thumbnail: string | null;
  stream: string;
};

export type NewsArticle = {
  url: string;
  title: string;
  seendate: string;
  socialimage?: string;
  domain: string;
  language: string;
  sourcecountry: string;
  themes?: string[];
  entities?: string[];
  category?: string;
  tone?: number;
};

export type NewsGroup = {
  country: string;
  lat: number;
  lng: number;
  count: number;
  tone?: number;
  primaryCategory?: string;
  topArticles: NewsArticle[];
};

export type Buoy = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  owner: string;
  type: string;
  met: boolean;
  currents: boolean;
  dart: boolean;
};

export type BuoyReadings = {
  observed: string;
  windDir: number | null;
  windSpeed: number | null;
  gust: number | null;
  waveHeight: number | null;
  dominantPeriod: number | null;
  avgPeriod: number | null;
  meanWaveDir: number | null;
  pressure: number | null;
  airTemp: number | null;
  waterTemp: number | null;
  dewPoint: number | null;
};

export type WikiArticle = {
  title: string;
  extract: string;
  thumb: string | null;
  url: string;
  distM: number;
};

export type Astro = { name: string; craft: string };

export type PlaceInfo = {
  place: {
    country: string | null;
    countryCode: string | null;
    city: string | null;
    region: string | null;
    isOcean: boolean;
  };
  weather: {
    tempC: number;
    windKph: number;
    humidity: number;
    condition: string;
    isDay: boolean;
  } | null;
  country: {
    flag: string | null;
    capital: string | null;
    population: number | null;
    languages: string[];
    region: string | null;
  } | null;
};

export type ISS = { lat: number; lng: number; alt: number; velocity: number };

export type Tornado = {
  id: string;
  event: string;
  isWarning: boolean;
  severity: string;
  headline: string;
  description: string;
  instruction: string | null;
  areaDesc: string;
  sent: string;
  expires: string;
  senderName: string;
  color: string;
  lat: number;
  lng: number;
  path: Array<[number, number]> | null;
};

export type HistoricalTornado = {
  id: string;
  year: number;
  date: string;
  state: string;
  ef: number;
  inj: number;
  fat: number;
  slat: number;
  slon: number;
  elat: number;
  elon: number;
  lengthMi: number;
  widthYd: number;
};

export type Tsunami = {
  id: string;
  center: string;
  centerName: string;
  title: string;
  category: string;
  rank: number;
  color: string;
  note: string;
  bulletinUrl: string | null;
  sent: string;
  lat: number;
  lng: number;
};
