import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ac = {
  icao: string;
  callsign: string;
  country: string;
  lng: number | null;
  lat: number | null;
  altM: number | null;
  onGround: boolean;
  velocity: number | null;
  heading: number | null;
};

let cache: { data: unknown; ts: number } | null = null;
const TTL = 60_000;

// --- Primary source: adsb.lol -------------------------------------------------
// Free community ADS-B feed, no credentials, and (unlike anonymous OpenSky) it
// serves datacenter IPs — but it throttles by request volume, so we use a few
// wide-radius tiles (each ~300-500 aircraft) over the busiest airspace rather
// than many small ones, run in small batches, and merge/dedupe by ICAO hex.
const ADSB_RADIUS_NM = 1000;
const ADSB_ANCHORS: Array<[number, number]> = [
  [40, -100], // North America
  [10, -75], // Caribbean / N South America
  [-25, -52], // South America
  [48, 8], // Europe
  [52, 30], // eastern Europe
  [28, 48], // Middle East / Gulf
  [25, 80], // India
  [33, 116], // East China
  [36, 138], // Japan / Korea
  [3, 110], // SE Asia
  [-30, 145], // Australia
  [28, 26], // North Africa
];

function mapAdsb(ac: Record<string, unknown>): Ac {
  const altBaro = ac.alt_baro;
  const onGround = altBaro === "ground";
  const altFt =
    typeof altBaro === "number"
      ? altBaro
      : typeof ac.alt_geom === "number"
        ? (ac.alt_geom as number)
        : null;
  const gs = typeof ac.gs === "number" ? (ac.gs as number) : null;
  return {
    icao: (ac.hex as string) ?? "",
    callsign: ((ac.flight as string) ?? "").trim(),
    country: "", // readsb feeds don't carry origin country
    lng: typeof ac.lon === "number" ? (ac.lon as number) : null,
    lat: typeof ac.lat === "number" ? (ac.lat as number) : null,
    altM: altFt != null ? altFt * 0.3048 : null,
    onGround,
    velocity: gs != null ? gs * 0.514444 : null, // knots → m/s
    heading: typeof ac.track === "number" ? (ac.track as number) : null,
  };
}

async function fetchTile([lat, lon]: [number, number]): Promise<
  Array<Record<string, unknown>>
> {
  try {
    const r = await fetch(
      `https://api.adsb.lol/v2/point/${lat}/${lon}/${ADSB_RADIUS_NM}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
        // adsb.lol blocks generic/empty User-Agents (Node's default fetch UA
        // gets connection-refused); a descriptive UA is required.
        headers: {
          "User-Agent": "earthpulse/1.0 (+https://earthpulse-teal.vercel.app)",
        },
      },
    );
    if (!r.ok) return [];
    const d = (await r.json()) as { ac?: Array<Record<string, unknown>> };
    return d.ac ?? [];
  } catch {
    return [];
  }
}

async function fetchAdsbLol(): Promise<Ac[] | null> {
  try {
    // Run in small batches rather than one big burst — adsb.lol throttles a
    // single IP that fires many concurrent requests at once.
    const BATCH = 4;
    const merged: Array<Record<string, unknown>> = [];
    for (let i = 0; i < ADSB_ANCHORS.length; i += BATCH) {
      const group = ADSB_ANCHORS.slice(i, i + BATCH);
      const results = await Promise.all(group.map(fetchTile));
      for (const r of results) merged.push(...r);
      if (i + BATCH < ADSB_ANCHORS.length) {
        await new Promise((res) => setTimeout(res, 250));
      }
    }
    if (merged.length === 0) return null; // total failure → let caller fall back
    const seen = new Set<string>();
    const out: Ac[] = [];
    for (const raw of merged) {
      const hex = raw.hex as string;
      if (!hex || seen.has(hex)) continue;
      seen.add(hex);
      out.push(mapAdsb(raw));
    }
    return out;
  } catch {
    return null;
  }
}

// --- Fallback source: OpenSky (OAuth2 client-credentials) ---------------------
// Create an API client at https://opensky-network.org/my-opensky/account →
// "API Clients" and set OPENSKY_CLIENT_ID + OPENSKY_CLIENT_SECRET.
const TOKEN_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
let tokenCache: { token: string; exp: number } | null = null;

async function getToken(): Promise<string | null> {
  const id = process.env.OPENSKY_CLIENT_ID;
  const secret = process.env.OPENSKY_CLIENT_SECRET;
  if (!id || !secret) return null;
  const now = Date.now();
  if (tokenCache && now < tokenCache.exp) return tokenCache.token;
  try {
    const r = await fetch(TOKEN_URL, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: id,
        client_secret: secret,
      }),
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { access_token?: string; expires_in?: number };
    if (!d.access_token) return null;
    tokenCache = {
      token: d.access_token,
      exp: now + ((d.expires_in ?? 1800) - 60) * 1000,
    };
    return tokenCache.token;
  } catch {
    return null;
  }
}

async function fetchOpenSky(): Promise<Ac[] | null> {
  const headers: Record<string, string> = {};
  const token = await getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const r = await fetch("https://opensky-network.org/api/states/all", {
      cache: "no-store",
      headers,
    });
    if (!r.ok) return null;
    const data = (await r.json()) as { states: Array<Array<unknown>> | null };
    return (data.states ?? []).map((s) => ({
      icao: s[0] as string,
      callsign: ((s[1] as string) ?? "").trim(),
      country: s[2] as string,
      lng: s[5] as number | null,
      lat: s[6] as number | null,
      altM: s[7] as number | null,
      onGround: s[8] as boolean,
      velocity: s[9] as number | null,
      heading: s[10] as number | null,
    }));
  } catch {
    return null;
  }
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  let raw = await fetchAdsbLol();
  if (!raw) raw = await fetchOpenSky();

  if (!raw) {
    // Both sources unavailable — serve stale if we have it, else flag it.
    const stale = cache?.data;
    return NextResponse.json(
      stale ?? { aircraft: [], total: 0, rateLimited: true },
    );
  }

  const aircraft = raw.filter(
    (a) =>
      a.lat !== null &&
      a.lng !== null &&
      a.altM !== null &&
      !a.onGround &&
      a.altM > 6000,
  );

  const max = 500;
  // Evenly spread the picks so we keep ~exactly `max` (an integer stride would
  // overshoot — e.g. 671 items / stride 2 → only 336).
  const sampled =
    aircraft.length > max
      ? Array.from(
          { length: max },
          (_, k) => aircraft[Math.floor((k * aircraft.length) / max)],
        )
      : aircraft;

  const body = { aircraft: sampled, total: aircraft.length };
  cache = { data: body, ts: now };
  return NextResponse.json(body);
}
