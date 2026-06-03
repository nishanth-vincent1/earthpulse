import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 600;

export async function GET() {
  try {
    const [ovationRes, kpRes, plasmaRes] = await Promise.all([
      fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json", {
        next: { revalidate: 600 },
      }),
      fetch(
        "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json",
        { next: { revalidate: 300 } },
      ),
      fetch(
        "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json",
        { next: { revalidate: 300 } },
      ),
    ]);

    if (!ovationRes.ok) {
      return NextResponse.json({ points: [], kp: null });
    }

    const ovation = (await ovationRes.json()) as {
      "Forecast Time": string;
      coordinates: Array<[number, number, number]>;
    };

    const points = ovation.coordinates
      .filter((c, i) => c[2] >= 15 && i % 3 === 0)
      .map((c) => {
        let lng = c[0];
        if (lng > 180) lng -= 360;
        return { lng, lat: c[1], strength: c[2] };
      });

    let kp: number | null = null;
    if (kpRes.ok) {
      const kpData = (await kpRes.json()) as Array<{ kp_index: number }>;
      const last = kpData[kpData.length - 1];
      kp = last?.kp_index ?? null;
    }

    // Solar wind plasma: [["time_tag","density","speed","temperature"], ...rows]
    // Find the latest row with both density and speed defined.
    let solarWindSpeed: number | null = null;
    let solarWindDensity: number | null = null;
    let solarWindTime: string | null = null;
    if (plasmaRes.ok) {
      const plasma = (await plasmaRes.json()) as Array<Array<string | null>>;
      for (let i = plasma.length - 1; i >= 1; i--) {
        const row = plasma[i];
        if (row && row[1] && row[2]) {
          solarWindDensity = parseFloat(row[1]);
          solarWindSpeed = parseFloat(row[2]);
          solarWindTime = row[0] as string;
          break;
        }
      }
    }

    return NextResponse.json({
      points,
      kp,
      forecastTime: ovation["Forecast Time"],
      solarWindSpeed,
      solarWindDensity,
      solarWindTime,
    });
  } catch {
    return NextResponse.json({ points: [], kp: null });
  }
}
