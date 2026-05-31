import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 0;

type PredictionRow = { t: string; v: string; type: "H" | "L" };
type WaterLevelRow = { t: string; v: string; s?: string; q?: string };
type WaterTempRow = { t: string; v: string };

const NOAA = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

function buildUrl(params: Record<string, string>): string {
  const qs = new URLSearchParams(params);
  return `${NOAA}?${qs.toString()}`;
}

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const common = {
    station: id,
    datum: "MLLW",
    time_zone: "lst_ldt",
    units: "english",
    format: "json",
  };

  try {
    const [predResp, levelResp, tempResp] = await Promise.all([
      fetch(
        buildUrl({
          ...common,
          date: "today",
          product: "predictions",
          interval: "hilo",
        }),
        { cache: "no-store" },
      ),
      fetch(
        buildUrl({
          ...common,
          date: "latest",
          product: "water_level",
        }),
        { cache: "no-store" },
      ),
      fetch(
        buildUrl({
          ...common,
          date: "latest",
          product: "water_temperature",
        }),
        { cache: "no-store" },
      ),
    ]);

    const predictions: PredictionRow[] = predResp.ok
      ? (((await predResp.json()) as { predictions?: PredictionRow[] })
          .predictions ?? [])
      : [];

    const levelData = levelResp.ok
      ? ((await levelResp.json()) as {
          data?: WaterLevelRow[];
          metadata?: { name?: string; lat?: string; lon?: string };
        })
      : { data: [] };
    const latest = levelData.data?.[0];

    const tempData = tempResp.ok
      ? ((await tempResp.json()) as { data?: WaterTempRow[] })
      : { data: [] };
    const latestTemp = tempData.data?.[0];

    // Find next high and next low from predictions
    const now = Date.now();
    const futureHiLo = predictions
      .map((p) => ({
        ts: new Date(p.t.replace(" ", "T")).getTime(),
        type: p.type,
        feet: parseFloat(p.v),
        time: p.t,
      }))
      .filter((p) => !Number.isNaN(p.ts));
    const nextHigh = futureHiLo
      .filter((p) => p.type === "H" && p.ts > now)
      .sort((a, b) => a.ts - b.ts)[0];
    const nextLow = futureHiLo
      .filter((p) => p.type === "L" && p.ts > now)
      .sort((a, b) => a.ts - b.ts)[0];

    return NextResponse.json({
      stationId: id,
      stationName: levelData.metadata?.name ?? null,
      current: latest
        ? {
            time: latest.t,
            feet: parseFloat(latest.v),
            quality: latest.q ?? null,
          }
        : null,
      nextHigh: nextHigh
        ? { time: nextHigh.time, feet: nextHigh.feet }
        : null,
      nextLow: nextLow ? { time: nextLow.time, feet: nextLow.feet } : null,
      todayHiLo: futureHiLo.map((p) => ({
        time: p.time,
        feet: p.feet,
        type: p.type,
      })),
      waterTempF: latestTemp ? parseFloat(latestTemp.v) : null,
      waterTempTime: latestTemp?.t ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "fetch failed", message: String(e) },
      { status: 500 },
    );
  }
}
