import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

type GBIFRecord = {
  species?: string;
  scientificName?: string;
  vernacularName?: string;
  kingdom?: string;
  class?: string;
  phylum?: string;
  eventDate?: string;
  decimalLatitude?: number;
  decimalLongitude?: number;
  basisOfRecord?: string;
  media?: Array<{ identifier?: string; type?: string }>;
};

type OBISRecord = {
  scientificName?: string;
  kingdom?: string;
  class?: string;
  eventDate?: string;
  decimalLatitude?: number;
  decimalLongitude?: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ terrestrial: [], marine: [] });
  }

  const dLat = 0.5;
  const dLng = 0.5;

  const [gbif, obis] = await Promise.all([
    fetch(
      `https://api.gbif.org/v1/occurrence/search?decimalLatitude=${(lat - dLat).toFixed(2)},${(lat + dLat).toFixed(2)}&decimalLongitude=${(lng - dLng).toFixed(2)},${(lng + dLng).toFixed(2)}&hasCoordinate=true&limit=40&mediaType=StillImage`,
      { next: { revalidate: 3600 } },
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null) as Promise<{ results: GBIFRecord[] } | null>,
    fetch(
      `https://api.obis.org/v3/occurrence?decimallatitude=${lat.toFixed(2)}&decimallongitude=${lng.toFixed(2)}&size=20`,
      { next: { revalidate: 3600 } },
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null) as Promise<{ results: OBISRecord[] } | null>,
  ]);

  const terrestrial: Array<{
    species: string;
    kingdom: string;
    class: string;
    photo: string | null;
    date: string | null;
  }> = [];
  const seenSp = new Set<string>();
  for (const r of gbif?.results ?? []) {
    const sp = r.species ?? r.scientificName;
    if (!sp || seenSp.has(sp)) continue;
    seenSp.add(sp);
    const photo = r.media?.find((m) => m.type === "StillImage")?.identifier ?? null;
    terrestrial.push({
      species: sp,
      kingdom: r.kingdom ?? "",
      class: r.class ?? "",
      photo,
      date: r.eventDate ?? null,
    });
    if (terrestrial.length >= 8) break;
  }

  const marine: Array<{
    species: string;
    kingdom: string;
    class: string;
    date: string | null;
  }> = [];
  const seenMar = new Set<string>();
  for (const r of obis?.results ?? []) {
    const sp = r.scientificName;
    if (!sp || seenMar.has(sp)) continue;
    seenMar.add(sp);
    marine.push({
      species: sp,
      kingdom: r.kingdom ?? "",
      class: r.class ?? "",
      date: r.eventDate ?? null,
    });
    if (marine.length >= 8) break;
  }

  return NextResponse.json({ terrestrial, marine });
}
