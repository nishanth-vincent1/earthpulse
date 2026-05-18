import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

type INatObs = {
  taxon: { name: string; preferred_common_name?: string };
  place_guess?: string;
  observed_on?: string;
  sounds: Array<{ file_url?: string; attribution?: string }>;
  photos: Array<{ url?: string }>;
  uri: string;
  id: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  const radii = [50, 200, 500];
  let recordings: ReturnType<typeof shape> = [];

  for (const radius of radii) {
    const url = `https://api.inaturalist.org/v1/observations?taxon_id=3&lat=${lat}&lng=${lng}&radius=${radius}&sounds=true&quality_grade=research&per_page=20&order=desc&order_by=created_at`;

    try {
      const r = await fetch(url, { next: { revalidate: 1800 } });
      if (!r.ok) continue;
      const data = (await r.json()) as { results: INatObs[] };
      recordings = shape(data.results);
      if (recordings.length >= 4) break;
    } catch {
      continue;
    }
  }

  return NextResponse.json({ recordings });
}

function shape(results: INatObs[]) {
  const seen = new Set<string>();
  const out = [];
  for (const r of results) {
    const sound = r.sounds?.find((s) => s.file_url);
    if (!sound?.file_url) continue;
    const taxonName = r.taxon?.name;
    if (!taxonName || seen.has(taxonName)) continue;
    seen.add(taxonName);
    out.push({
      id: String(r.id),
      name: r.taxon.preferred_common_name ?? taxonName,
      scientific: taxonName,
      place: r.place_guess ?? "",
      observed: r.observed_on ?? "",
      audio: sound.file_url,
      attribution: sound.attribution ?? "",
      photo: r.photos?.[0]?.url
        ? r.photos[0].url.replace(/\/square\.(jpe?g|png)/i, "/medium.$1")
        : null,
      uri: r.uri,
    });
    if (out.length >= 8) break;
  }
  return out;
}
