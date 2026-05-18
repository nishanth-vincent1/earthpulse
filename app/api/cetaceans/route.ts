import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 1800;

type INatObs = {
  id: number;
  taxon: { name: string; preferred_common_name?: string };
  place_guess?: string;
  observed_on?: string;
  geojson?: { coordinates: [number, number] };
  photos: Array<{ url?: string }>;
  uri: string;
  obscured?: boolean;
  taxon_geoprivacy?: string | null;
  geoprivacy?: string | null;
};

export async function GET() {
  try {
    const r = await fetch(
      "https://api.inaturalist.org/v1/observations?taxon_id=152871&quality_grade=research&per_page=80&order=desc&order_by=observed_on&geo=true",
      { next: { revalidate: 1800 } },
    );
    if (!r.ok) return NextResponse.json({ sightings: [] });
    const data = (await r.json()) as { results: INatObs[] };

    const sightings = data.results
      .filter((o) => o.geojson?.coordinates)
      .slice(0, 60)
      .map((o) => ({
        id: String(o.id),
        common: o.taxon.preferred_common_name ?? o.taxon.name,
        scientific: o.taxon.name,
        place: o.place_guess ?? "",
        observed: o.observed_on ?? "",
        obscured:
          o.obscured === true ||
          o.taxon_geoprivacy === "obscured" ||
          o.taxon_geoprivacy === "private" ||
          o.geoprivacy === "obscured" ||
          o.geoprivacy === "private",
        lat: o.geojson!.coordinates[1],
        lng: o.geojson!.coordinates[0],
        photo: o.photos?.[0]?.url
          ? o.photos[0].url.replace(/\/square\.(jpe?g|png)/i, "/medium.$1")
          : null,
        uri: o.uri,
      }));

    return NextResponse.json({ sightings });
  } catch {
    return NextResponse.json({ sightings: [] });
  }
}
