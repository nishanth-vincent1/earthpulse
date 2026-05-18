export type HurdatTrackPoint = {
  date: string;
  time: string;
  recordType: string;
  status: string;
  lat: number;
  lng: number;
  maxWindKt: number;
  pressureMb: number | null;
};

export type HurdatStorm = {
  id: string;
  basin: string;
  number: string;
  year: number;
  name: string;
  trackCount: number;
  peakWindKt: number;
  category: string;
  track: HurdatTrackPoint[];
};

const STATUS_NAMES: Record<string, string> = {
  TD: "Tropical depression",
  TS: "Tropical storm",
  HU: "Hurricane",
  EX: "Extratropical cyclone",
  SD: "Subtropical depression",
  SS: "Subtropical storm",
  LO: "Low",
  WV: "Tropical wave",
  DB: "Disturbance",
};

function parseLat(s: string): number {
  const n = parseFloat(s);
  return s.trim().endsWith("S") ? -n : n;
}

function parseLng(s: string): number {
  const n = parseFloat(s);
  return s.trim().endsWith("W") ? -n : n;
}

export function categoryFromWind(kt: number): string {
  if (kt >= 137) return "Cat 5";
  if (kt >= 113) return "Cat 4";
  if (kt >= 96) return "Cat 3";
  if (kt >= 83) return "Cat 2";
  if (kt >= 64) return "Cat 1";
  if (kt >= 34) return "Tropical storm";
  return "Tropical depression";
}

export function parseHurdat2(text: string): HurdatStorm[] {
  const lines = text.split(/\r?\n/);
  const storms: HurdatStorm[] = [];
  let cur: HurdatStorm | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = line.split(",").map((c) => c.trim());
    if (cells[0].match(/^[A-Z]{2}\d{6}$/)) {
      if (cur) storms.push(cur);
      const id = cells[0];
      const basin = id.slice(0, 2);
      const number = id.slice(2, 4);
      const year = parseInt(id.slice(4, 8), 10);
      const name = cells[1];
      const count = parseInt(cells[2], 10) || 0;
      cur = {
        id,
        basin,
        number,
        year,
        name,
        trackCount: count,
        peakWindKt: 0,
        category: "Tropical depression",
        track: [],
      };
    } else if (cur && cells.length >= 7) {
      const wind = parseInt(cells[6], 10) || 0;
      const pressure = parseInt(cells[7], 10);
      const point: HurdatTrackPoint = {
        date: cells[0],
        time: cells[1],
        recordType: cells[2],
        status: cells[3],
        lat: parseLat(cells[4]),
        lng: parseLng(cells[5]),
        maxWindKt: wind,
        pressureMb:
          Number.isFinite(pressure) && pressure > 0 ? pressure : null,
      };
      cur.track.push(point);
      if (wind > cur.peakWindKt) cur.peakWindKt = wind;
    }
  }
  if (cur) storms.push(cur);

  for (const s of storms) {
    s.category = categoryFromWind(s.peakWindKt);
  }
  return storms;
}

export { STATUS_NAMES };
