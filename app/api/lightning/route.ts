import { NextResponse } from "next/server";
// jsfive is a pure-JS HDF5 reader — GLM L2 LCFA files are netCDF-4 (HDF5),
// which the classic-only netcdfjs cannot read.
import * as jsfive from "jsfive";

export const runtime = "nodejs";
export const revalidate = 0;

// GLM product_time is "seconds since 2000-01-01 12:00:00 UTC" (J2000 epoch).
const J2000_UNIX = 946728000; // unix seconds for 2000-01-01 12:00:00 UTC

type SatCfg = {
  bucket: string;
  label: "GOES-East" | "GOES-West";
};

// GOES-19 = current GOES-East (Americas/Atlantic), GOES-18 = GOES-West (Pacific).
const SATS: SatCfg[] = [
  { bucket: "noaa-goes19", label: "GOES-East" },
  { bucket: "noaa-goes18", label: "GOES-West" },
];

type Strike = {
  lat: number;
  lng: number;
  energy: number;
  sat: string;
  time: string;
};

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

function utcParts(d: Date): { year: number; doy: number; hour: number } {
  const year = d.getUTCFullYear();
  const start = Date.UTC(year, 0, 0);
  const doy = Math.floor((d.getTime() - start) / 86400000);
  return { year, doy, hour: d.getUTCHours() };
}

async function listKeys(bucket: string, prefix: string): Promise<string[]> {
  const url = `https://${bucket}.s3.amazonaws.com/?list-type=2&prefix=${encodeURIComponent(
    prefix,
  )}`;
  const r = await fetch(url, { next: { revalidate: 20 } });
  if (!r.ok) return [];
  const xml = await r.text();
  const keys: string[] = [];
  const re = /<Key>([^<]+)<\/Key>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) keys.push(m[1]);
  return keys;
}

// Most-recent `count` LCFA object keys for a satellite. LCFA filenames sort
// chronologically by start time, so lexicographic sort == time order. We scan
// the current UTC hour and fall back into the previous hour at the top of the
// hour when the current prefix is still empty.
async function latestKeys(sat: SatCfg, count: number): Promise<string[]> {
  const now = new Date();
  const collected: string[] = [];
  for (let back = 0; back < 2 && collected.length < count; back++) {
    const d = new Date(now.getTime() - back * 3600_000);
    const { year, doy, hour } = utcParts(d);
    const prefix = `GLM-L2-LCFA/${year}/${pad(doy, 3)}/${pad(hour, 2)}/`;
    const keys = await listKeys(sat.bucket, prefix);
    collected.push(...keys);
  }
  collected.sort();
  return collected.slice(-count);
}

async function parseFile(
  bucket: string,
  key: string,
  label: string,
): Promise<Strike[]> {
  const r = await fetch(`https://${bucket}.s3.amazonaws.com/${key}`, {
    next: { revalidate: 20 },
  });
  if (!r.ok) return [];
  const ab = await r.arrayBuffer();
  const f = new jsfive.File(ab, key);
  const lat = f.get("flash_lat")?.value as number[] | undefined;
  const lon = f.get("flash_lon")?.value as number[] | undefined;
  const energy = f.get("flash_energy")?.value as number[] | undefined;
  const ptime = (f.get("product_time")?.value as number[] | undefined)?.[0];
  if (!lat || !lon) return [];
  const unixMs = ptime != null ? (J2000_UNIX + ptime) * 1000 : Date.now();
  const iso = new Date(unixMs).toISOString();
  const out: Strike[] = [];
  for (let i = 0; i < lat.length; i++) {
    const la = lat[i];
    const lo = lon[i];
    if (!Number.isFinite(la) || !Number.isFinite(lo)) continue;
    if (la < -90 || la > 90 || lo < -180 || lo > 180) continue;
    out.push({
      lat: la,
      lng: lo,
      energy: energy ? energy[i] : 0,
      sat: label,
      time: iso,
    });
  }
  return out;
}

export async function GET() {
  try {
    const perSat = await Promise.all(
      SATS.map(async (sat) => {
        const keys = await latestKeys(sat, 2); // ~40s window per satellite
        const files = await Promise.all(
          keys.map((k) => parseFile(sat.bucket, k, sat.label)),
        );
        return files.flat();
      }),
    );

    const all = perSat.flat();
    const max = 250;
    const sampled =
      all.length > max
        ? all.filter((_, i) => i % Math.ceil(all.length / max) === 0)
        : all;

    return NextResponse.json({
      strikes: sampled,
      total: all.length,
      counts: { east: perSat[0]?.length ?? 0, west: perSat[1]?.length ?? 0 },
      source: "goes-glm",
    });
  } catch (e) {
    return NextResponse.json({
      strikes: [],
      total: 0,
      source: "error",
      message: String(e),
    });
  }
}
