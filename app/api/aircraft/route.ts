import { NextResponse } from "next/server";

export const runtime = "nodejs";

let cache: { data: unknown; ts: number } | null = null;
const TTL = 60_000;

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  const headers: Record<string, string> = {};
  const user = process.env.OPENSKY_USER;
  const pass = process.env.OPENSKY_PASS;
  if (user && pass) {
    headers["Authorization"] =
      "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  }

  try {
    const r = await fetch("https://opensky-network.org/api/states/all", {
      cache: "no-store",
      headers,
    });

    if (r.status === 429) {
      const stale = cache?.data;
      const body = {
        ...(stale ?? { aircraft: [], total: 0 }),
        rateLimited: true,
      };
      return NextResponse.json(body);
    }

    if (!r.ok) {
      return NextResponse.json({ aircraft: [], total: 0 });
    }

    const data = (await r.json()) as { states: Array<Array<unknown>> | null };
    const states = data.states ?? [];

    const aircraft = states
      .map((s) => ({
        icao: s[0] as string,
        callsign: ((s[1] as string) ?? "").trim(),
        country: s[2] as string,
        lng: s[5] as number | null,
        lat: s[6] as number | null,
        altM: s[7] as number | null,
        onGround: s[8] as boolean,
        velocity: s[9] as number | null,
        heading: s[10] as number | null,
      }))
      .filter(
        (a) =>
          a.lat !== null &&
          a.lng !== null &&
          a.altM !== null &&
          !a.onGround &&
          a.altM > 6000,
      );

    const max = 500;
    const sampled =
      aircraft.length > max
        ? aircraft.filter((_, i) => i % Math.ceil(aircraft.length / max) === 0)
        : aircraft;

    const body = { aircraft: sampled, total: aircraft.length };
    cache = { data: body, ts: now };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ aircraft: [], total: 0 });
  }
}
