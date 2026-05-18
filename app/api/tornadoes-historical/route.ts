import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 86400;

const CSV_URL =
  "https://www.spc.noaa.gov/wcm/data/1950-2023_actual_tornadoes.csv";

const COL = {
  yr: 1,
  mo: 2,
  dy: 3,
  date: 4,
  time: 5,
  st: 7,
  mag: 10,
  inj: 11,
  fat: 12,
  loss: 13,
  slat: 15,
  slon: 16,
  elat: 17,
  elon: 18,
  len: 19,
  wid: 20,
};

type Slim = {
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : NaN;
  if (Number.isNaN(year) || year < 1950 || year > 2023) {
    return NextResponse.json({ year: null, tornadoes: [] });
  }

  try {
    const r = await fetch(CSV_URL, { cache: "no-store" });
    if (!r.ok) return NextResponse.json({ year, tornadoes: [] });
    const text = await r.text();

    const tornadoes: Slim[] = [];
    const lines = text.split("\n");
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const cols = line.split(",");
      const yr = parseInt(cols[COL.yr], 10);
      if (yr !== year) continue;
      const slat = parseFloat(cols[COL.slat]);
      const slon = parseFloat(cols[COL.slon]);
      let elat = parseFloat(cols[COL.elat]);
      let elon = parseFloat(cols[COL.elon]);
      if (!Number.isFinite(slat) || !Number.isFinite(slon)) continue;
      if (slat === 0 && slon === 0) continue;
      if (!Number.isFinite(elat) || elat === 0) elat = slat;
      if (!Number.isFinite(elon) || elon === 0) elon = slon;
      const ef = parseInt(cols[COL.mag], 10);
      const inj = parseInt(cols[COL.inj], 10) || 0;
      const fat = parseInt(cols[COL.fat], 10) || 0;
      const lengthMi = parseFloat(cols[COL.len]) || 0;
      const widthYd = parseFloat(cols[COL.wid]) || 0;
      tornadoes.push({
        id: `tornado-${yr}-${cols[0]}`,
        year: yr,
        date: cols[COL.date],
        state: cols[COL.st],
        ef: Number.isFinite(ef) && ef >= 0 ? ef : -1,
        inj,
        fat,
        slat,
        slon,
        elat,
        elon,
        lengthMi,
        widthYd,
      });
    }

    tornadoes.sort(
      (a, b) => b.ef - a.ef || b.fat - a.fat || b.lengthMi - a.lengthMi,
    );

    return NextResponse.json({ year, tornadoes });
  } catch {
    return NextResponse.json({ year, tornadoes: [] });
  }
}
