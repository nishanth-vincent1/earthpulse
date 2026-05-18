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

export function parseNumber(s: string | undefined): number | null {
  if (!s || s === "MM" || s === "999.0" || s === "9999") return null;
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

export function parseBuoyText(text: string): BuoyReadings | null {
  const lines = text.split(/\r?\n/);
  const dataLines = lines.filter((l) => l && !l.startsWith("#")).slice(0, 1);
  if (dataLines.length === 0) return null;
  const cols = dataLines[0].split(/\s+/);
  if (cols.length < 5) return null;
  return {
    observed: `${cols[0]}-${cols[1]}-${cols[2]} ${cols[3]}:${cols[4]} UTC`,
    windDir: parseNumber(cols[5]),
    windSpeed: parseNumber(cols[6]),
    gust: parseNumber(cols[7]),
    waveHeight: parseNumber(cols[8]),
    dominantPeriod: parseNumber(cols[9]),
    avgPeriod: parseNumber(cols[10]),
    meanWaveDir: parseNumber(cols[11]),
    pressure: parseNumber(cols[12]),
    airTemp: parseNumber(cols[13]),
    waterTemp: parseNumber(cols[14]),
    dewPoint: parseNumber(cols[15]),
  };
}
