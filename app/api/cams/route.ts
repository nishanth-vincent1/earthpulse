import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CaltransCCTV = {
  cctv: {
    location: {
      locationName: string;
      nearbyPlace: string;
      county: string;
      route: string;
      latitude: string;
      longitude: string;
    };
    inService: string;
    imageData: {
      streamingVideoURL?: string;
      static?: { currentImageURL?: string };
    };
  };
};

type CamType = "livestream" | "live-image" | "seasonal" | "info-page";

type Cam = {
  id: string;
  name: string;
  category: string;
  type: CamType;
  seasonalNote?: string;
  lat: number;
  lng: number;
  description: string;
  thumbnail: string | null;
  stream: string;
};

let cache: { data: { cams: Cam[]; total: number }; ts: number } | null = null;
const TTL = 600_000;

async function loadCaltrans(): Promise<Cam[]> {
  const districts = ["d4", "d7", "d11", "d12"];
  const all = await Promise.all(
    districts.map(async (d) => {
      try {
        const url = `https://cwwp2.dot.ca.gov/data/${d}/cctv/cctvStatus${d.toUpperCase()}.json`;
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) return [];
        const data = (await r.json()) as { data: CaltransCCTV[] };
        return data.data
          .filter(
            (e) =>
              e.cctv.inService === "true" &&
              e.cctv.imageData?.static?.currentImageURL &&
              e.cctv.location.latitude &&
              e.cctv.location.longitude,
          )
          .map((e): Cam => {
            const loc = e.cctv.location;
            const id = `caltrans-${d}-${loc.locationName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
            return {
              id,
              name: loc.locationName,
              category: "highway",
              type: "live-image",
              lat: parseFloat(loc.latitude),
              lng: parseFloat(loc.longitude),
              description: `Caltrans CCTV near ${loc.nearbyPlace}, ${loc.county} County · Route ${loc.route}`,
              thumbnail: e.cctv.imageData.static!.currentImageURL!,
              stream: e.cctv.imageData.static!.currentImageURL!,
            };
          });
      } catch {
        return [];
      }
    }),
  );
  return all.flat();
}

async function loadCurated(): Promise<Cam[]> {
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const file = path.join(process.cwd(), "public", "data", "cams.json");
    const raw = await fs.readFile(file, "utf-8");
    const data = JSON.parse(raw) as { cams: Cam[] };
    return data.cams;
  } catch {
    return [];
  }
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  const [curated, caltrans] = await Promise.all([loadCurated(), loadCaltrans()]);

  const max = 200;
  const sampledCaltrans =
    caltrans.length > max
      ? caltrans.filter((_, i) => i % Math.ceil(caltrans.length / max) === 0)
      : caltrans;

  const cams = [...curated, ...sampledCaltrans];
  const body = { cams, total: cams.length, caltransTotal: caltrans.length };
  cache = { data: body, ts: now };
  return NextResponse.json(body);
}
