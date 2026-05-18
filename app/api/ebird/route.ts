import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 1800;

type Obs = {
  speciesCode: string;
  comName: string;
  sciName: string;
  locId: string;
  locName: string;
  obsDt: string;
  howMany?: number;
  lat: number;
  lng: number;
  obsValid: boolean;
  obsReviewed: boolean;
};

function birdEmoji(commonName: string): string {
  const n = commonName.toLowerCase();
  if (/\bowl\b/.test(n)) return "🦉";
  if (
    /\b(eagle|hawk|falcon|buzzard|harrier|kestrel|kite|osprey|caracara|vulture|condor|sparrowhawk|goshawk)\b/.test(
      n,
    )
  )
    return "🦅";
  if (/\bpenguin\b/.test(n)) return "🐧";
  if (/\bflamingo\b/.test(n)) return "🦩";
  if (
    /\b(parrot|macaw|parakeet|lory|lorikeet|cockatoo|cockatiel|conure|amazon)\b/.test(
      n,
    )
  )
    return "🦜";
  if (
    /\b(duck|goose|geese|swan|teal|mallard|merganser|scoter|pintail|wigeon|shoveler|goldeneye|bufflehead|gadwall|harlequin|garganey)\b/.test(
      n,
    )
  )
    return "🦆";
  if (/\b(turkey|pheasant|grouse|quail|chukar|partridge|peafowl|peacock|chachalaca|guan|curassow)\b/.test(n))
    return "🦃";
  if (
    /\b(heron|egret|bittern|stork|crane|ibis|spoonbill|jabiru|jacana|limpkin)\b/.test(
      n,
    )
  )
    return "🪿";
  if (/\b(dove|pigeon)\b/.test(n)) return "🕊";
  if (/\b(rooster|chicken|hen|junglefowl)\b/.test(n)) return "🐓";
  return "🐦";
}

const REGIONS = [
  "US",
  "CA",
  "MX",
  "BR",
  "AR",
  "GB",
  "FR",
  "DE",
  "ES",
  "IT",
  "NL",
  "SE",
  "FI",
  "RU",
  "TR",
  "IN",
  "CN",
  "JP",
  "AU",
  "NZ",
  "ZA",
  "KE",
  "PE",
  "CL",
  "ID",
  "TH",
  "PH",
];

let cache: { sightings: unknown[]; ts: number } | null = null;
const TTL = 1_800_000;

const photoCache = new Map<string, string | null>();

async function inatPhoto(sciName: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(sciName)}&rank=species&per_page=1`,
      { cache: "no-store" },
    );
    if (!r.ok) return null;
    const data = (await r.json()) as {
      results?: Array<{ default_photo?: { medium_url?: string } }>;
    };
    return data.results?.[0]?.default_photo?.medium_url ?? null;
  } catch {
    return null;
  }
}

async function wikiPhoto(sciName: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(sciName)}`,
      {
        headers: { "User-Agent": "Earthpulse/0.1" },
        cache: "no-store",
      },
    );
    if (!r.ok) return null;
    const d = (await r.json()) as {
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
    };
    return d.thumbnail?.source ?? d.originalimage?.source ?? null;
  } catch {
    return null;
  }
}

async function fetchPhotoUrl(sciName: string): Promise<string | null> {
  if (photoCache.has(sciName)) return photoCache.get(sciName) ?? null;
  let url = await inatPhoto(sciName);
  if (!url) url = await wikiPhoto(sciName);
  photoCache.set(sciName, url);
  return url;
}

export async function GET() {
  const apiKey = process.env.EBIRD_KEY;
  if (!apiKey) {
    return NextResponse.json({ sightings: [], needsKey: true });
  }

  const now = Date.now();
  if (cache && now - cache.ts < TTL) {
    return NextResponse.json({ sightings: cache.sightings });
  }

  try {
    const responses = await Promise.all(
      REGIONS.map((region) =>
        fetch(
          `https://api.ebird.org/v2/data/obs/${region}/recent/notable?back=14&maxResults=15`,
          {
            headers: { "X-eBirdApiToken": apiKey },
            cache: "no-store",
          },
        )
          .then((r) => (r.ok ? (r.json() as Promise<Obs[]>) : []))
          .catch(() => []),
      ),
    );

    const seen = new Set<string>();
    const sightings = responses
      .flat()
      .filter((o): o is Obs => !!o && typeof o.lat === "number")
      .map((o) => {
        const id = `${o.speciesCode}-${o.locId}-${o.obsDt}`;
        return { ...o, id };
      })
      .filter((o) => {
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      })
      .map((o) => ({
        id: o.id,
        common: o.comName,
        scientific: o.sciName,
        emoji: birdEmoji(o.comName),
        location: o.locName,
        observed: o.obsDt,
        count: o.howMany ?? 1,
        lat: o.lat,
        lng: o.lng,
        validated: o.obsValid,
        reviewed: o.obsReviewed,
      }));

    const uniqueSci = Array.from(new Set(sightings.map((s) => s.scientific)));
    const photos = await Promise.all(uniqueSci.map((sn) => fetchPhotoUrl(sn)));
    const photoMap = new Map(uniqueSci.map((sn, i) => [sn, photos[i]]));
    const enriched = sightings.map((s) => ({
      ...s,
      photo: photoMap.get(s.scientific) ?? null,
    }));

    cache = { sightings: enriched, ts: now };
    return NextResponse.json({ sightings: enriched });
  } catch {
    return NextResponse.json({ sightings: [] });
  }
}
