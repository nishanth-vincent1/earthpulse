import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 1800;

type LL2Launch = {
  id: string;
  name: string;
  net: string;
  status: { name: string; abbrev: string };
  pad: {
    name: string;
    latitude: string;
    longitude: string;
    location: { name: string };
  };
  mission: { name?: string; description?: string; orbit?: { name?: string } } | null;
  rocket: { configuration: { name: string; family?: string } };
  image: string | null;
  launch_service_provider: { name: string };
};

export async function GET() {
  try {
    const r = await fetch(
      "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=8&hide_recent_previous=true&format=json",
      { next: { revalidate: 1800 } },
    );
    if (!r.ok) return NextResponse.json({ launches: [] });
    const data = (await r.json()) as { results: LL2Launch[] };

    const launches = data.results
      .filter((l) => l.pad.latitude && l.pad.longitude)
      .map((l) => ({
        id: l.id,
        name: l.name,
        net: l.net,
        status: l.status.name,
        pad: l.pad.location.name,
        provider: l.launch_service_provider.name,
        rocket: l.rocket.configuration.name,
        mission: l.mission?.description ?? null,
        orbit: l.mission?.orbit?.name ?? null,
        image: l.image,
        lat: parseFloat(l.pad.latitude),
        lng: parseFloat(l.pad.longitude),
      }));

    return NextResponse.json({ launches });
  } catch {
    return NextResponse.json({ launches: [] });
  }
}
