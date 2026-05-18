import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 1800;

const GROUPS: Array<{ id: number; group: string; emoji: string }> = [
  { id: 47217, group: "Orchids", emoji: "🌸" },
  { id: 47125, group: "Flowering plants", emoji: "🌺" },
  { id: 47903, group: "Conifers", emoji: "🌲" },
  { id: 47126, group: "Plants", emoji: "🌿" },
  { id: 121943, group: "Cycads", emoji: "🌴" },
  { id: 47331, group: "Cacti & succulents", emoji: "🌵" },
];

type Obs = {
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
    const responses = await Promise.all(
      GROUPS.map((t) =>
        fetch(
          `https://api.inaturalist.org/v1/observations?taxon_id=${t.id}&threatened=true&quality_grade=research&per_page=12&order=desc&order_by=observed_on&geo=true`,
          { next: { revalidate: 1800 } },
        )
          .then((r) => (r.ok ? r.json() : { results: [] }))
          .catch(() => ({ results: [] })),
      ),
    );

    const seen = new Set<number>();
    const sightings: Array<{
      id: string;
      common: string;
      scientific: string;
      group: string;
      emoji: string;
      place: string;
      observed: string;
      obscured: boolean;
      lat: number;
      lng: number;
      photo: string | null;
      uri: string;
    }> = [];

    responses.forEach((data, i) => {
      const meta = GROUPS[i];
      const results = (data as { results?: Obs[] }).results ?? [];
      for (const o of results) {
        if (!o.geojson?.coordinates) continue;
        if (seen.has(o.id)) continue;
        seen.add(o.id);
        const isObscured =
          o.obscured === true ||
          o.taxon_geoprivacy === "obscured" ||
          o.taxon_geoprivacy === "private" ||
          o.geoprivacy === "obscured" ||
          o.geoprivacy === "private";
        sightings.push({
          id: `plant-${o.id}`,
          common: o.taxon.preferred_common_name ?? o.taxon.name,
          scientific: o.taxon.name,
          group: meta.group,
          emoji: meta.emoji,
          place: o.place_guess ?? "",
          observed: o.observed_on ?? "",
          obscured: isObscured,
          lat: o.geojson.coordinates[1],
          lng: o.geojson.coordinates[0],
          photo: o.photos?.[0]?.url
            ? o.photos[0].url.replace(/\/square\.(jpe?g|png)/i, "/medium.$1")
            : null,
          uri: o.uri,
        });
      }
    });

    return NextResponse.json({ sightings });
  } catch {
    return NextResponse.json({ sightings: [] });
  }
}
