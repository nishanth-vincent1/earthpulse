import { gmstDegrees } from "./stars";

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export type MoonState = {
  lat: number;
  lng: number;
  illumination: number;
  phaseName: string;
  phaseEmoji: string;
  ageDays: number;
  distanceKm: number;
  nextFullMoon: Date;
  nextNewMoon: Date;
};

const SYNODIC_MONTH = 29.530588853;

function daysSinceJ2000(date: Date): number {
  const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  return (date.getTime() - J2000) / 86_400_000;
}

function moonEcliptic(date: Date) {
  const D = daysSinceJ2000(date);
  const L = ((218.316 + 13.176396 * D) % 360 + 360) % 360;
  const M = ((134.963 + 13.064993 * D) % 360 + 360) % 360;
  const F = ((93.272 + 13.229350 * D) % 360 + 360) % 360;
  const lambda = L + 6.289 * Math.sin(M * DEG);
  const beta = 5.128 * Math.sin(F * DEG);
  const distanceKm = 385001 - 20905 * Math.cos(M * DEG);
  return { lambda, beta, distanceKm };
}

function eclipticToEquatorial(lambdaDeg: number, betaDeg: number) {
  const eps = 23.4397 * DEG;
  const lambda = lambdaDeg * DEG;
  const beta = betaDeg * DEG;
  const sinDec =
    Math.sin(beta) * Math.cos(eps) +
    Math.cos(beta) * Math.sin(eps) * Math.sin(lambda);
  const dec = Math.asin(sinDec);
  const ra = Math.atan2(
    Math.sin(lambda) * Math.cos(eps) - Math.tan(beta) * Math.sin(eps),
    Math.cos(lambda),
  );
  let raDeg = ra * RAD;
  if (raDeg < 0) raDeg += 360;
  return { raDeg, decDeg: dec * RAD };
}

function sunEclipticLambda(date: Date): number {
  const D = daysSinceJ2000(date);
  const M = ((357.5291 + 0.98560028 * D) % 360 + 360) % 360;
  const C =
    1.9148 * Math.sin(M * DEG) +
    0.02 * Math.sin(2 * M * DEG) +
    0.0003 * Math.sin(3 * M * DEG);
  return ((280.4665 + 0.98564736 * D + C) % 360 + 360) % 360;
}

export function moonState(date: Date): MoonState {
  const { lambda: moonLambda, beta, distanceKm } = moonEcliptic(date);
  const sunLambda = sunEclipticLambda(date);

  const elong = (((moonLambda - sunLambda) % 360) + 360) % 360;
  const illumination = (1 - Math.cos(elong * DEG)) / 2;
  const ageDays = (elong / 360) * SYNODIC_MONTH;

  const phaseName =
    ageDays < 1.85 || ageDays > 27.69
      ? "New moon"
      : ageDays < 5.54
        ? "Waxing crescent"
        : ageDays < 9.23
          ? "First quarter"
          : ageDays < 12.92
            ? "Waxing gibbous"
            : ageDays < 16.61
              ? "Full moon"
              : ageDays < 20.3
                ? "Waning gibbous"
                : ageDays < 23.99
                  ? "Last quarter"
                  : "Waning crescent";

  const phaseEmoji =
    ageDays < 1.85 || ageDays > 27.69
      ? "🌑"
      : ageDays < 5.54
        ? "🌒"
        : ageDays < 9.23
          ? "🌓"
          : ageDays < 12.92
            ? "🌔"
            : ageDays < 16.61
              ? "🌕"
              : ageDays < 20.3
                ? "🌖"
                : ageDays < 23.99
                  ? "🌗"
                  : "🌘";

  const { raDeg, decDeg } = eclipticToEquatorial(moonLambda, beta);
  const gmst = gmstDegrees(date);
  let lng = raDeg - gmst;
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;

  const daysToFull = ((180 - elong + 360) % 360) / 360 * SYNODIC_MONTH;
  const daysToNew = ((360 - elong) % 360) / 360 * SYNODIC_MONTH;
  const nextFullMoon = new Date(date.getTime() + daysToFull * 86_400_000);
  const nextNewMoon = new Date(date.getTime() + daysToNew * 86_400_000);

  return {
    lat: decDeg,
    lng,
    illumination,
    phaseName,
    phaseEmoji,
    ageDays,
    distanceKm,
    nextFullMoon,
    nextNewMoon,
  };
}
