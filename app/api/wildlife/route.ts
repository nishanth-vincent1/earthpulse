import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 1800;

const TAXA: Array<{ id: number; category: string; emoji: string }> = [
  { id: 47273, category: "Sharks & rays", emoji: "🦈" },
  { id: 372234, category: "Sea turtles", emoji: "🐢" },
  { id: 372843, category: "Seals & sea lions", emoji: "🦭" },
  { id: 41636, category: "Bears", emoji: "🐻" },
  { id: 41962, category: "Big cats", emoji: "🐆" },
  { id: 43692, category: "Elephants", emoji: "🐘" },
  { id: 43341, category: "Rhinos", emoji: "🦏" },
  { id: 26039, category: "Crocodilians", emoji: "🐊" },
  { id: 43579, category: "Gorillas", emoji: "🦍" },
];

type Obs = {
  id: number;
  taxon: { id?: number; name: string; preferred_common_name?: string };
  place_guess?: string;
  observed_on?: string;
  geojson?: { coordinates: [number, number] };
  photos: Array<{ url?: string }>;
  uri: string;
  obscured?: boolean;
  taxon_geoprivacy?: string | null;
  geoprivacy?: string | null;
  user?: { login?: string; name?: string };
};

export async function GET() {
  try {
    const responses = await Promise.all(
      TAXA.map((t) =>
        fetch(
          `https://api.inaturalist.org/v1/observations?taxon_id=${t.id}&quality_grade=research&per_page=12&order=desc&order_by=observed_on&geo=true`,
          { next: { revalidate: 1800 } },
        )
          .then((r) => (r.ok ? r.json() : { results: [] }))
          .catch(() => ({ results: [] })),
      ),
    );

    const sightings: Array<{
      id: string;
      common: string;
      scientific: string;
      category: string;
      emoji: string;
      place: string;
      observed: string;
      obscured: boolean;
      lat: number;
      lng: number;
      photo: string | null;
      photos: string[];
      uri: string;
      observer: string;
      taxonId: number | null;
    }> = [];

    responses.forEach((data, i) => {
      const meta = TAXA[i];
      const results = (data as { results?: Obs[] }).results ?? [];
      for (const o of results) {
        if (!o.geojson?.coordinates) continue;
        const isObscured =
          o.obscured === true ||
          o.taxon_geoprivacy === "obscured" ||
          o.taxon_geoprivacy === "private" ||
          o.geoprivacy === "obscured" ||
          o.geoprivacy === "private";
        sightings.push({
          id: `wild-${o.id}`,
          common: o.taxon.preferred_common_name ?? o.taxon.name,
          scientific: o.taxon.name,
          category: meta.category,
          emoji: meta.emoji,
          place: o.place_guess ?? "",
          observed: o.observed_on ?? "",
          obscured: isObscured,
          lat: o.geojson.coordinates[1],
          lng: o.geojson.coordinates[0],
          photo: o.photos?.[0]?.url
            ? o.photos[0].url.replace(/\/square\.(jpe?g|png)/i, "/medium.$1")
            : null,
          photos: (o.photos ?? [])
            .slice(0, 4)
            .map((p) =>
              (p.url ?? "").replace(/\/square\.(jpe?g|png)/i, "/medium.$1"),
            )
            .filter(Boolean),
          uri: o.uri,
          observer: o.user?.name || o.user?.login || "",
          taxonId: o.taxon.id ?? null,
        });
      }
    });

    return NextResponse.json({ sightings });
  } catch {
    return NextResponse.json({ sightings: [] });
  }
}
