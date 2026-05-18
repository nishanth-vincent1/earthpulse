import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 86400;

type GBIFMatch = { usageKey?: number; matchType?: string };
type GBIFIucnCategory = {
  category?: string;
  code?: string;
  scientificName?: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  EX: "Extinct",
  EW: "Extinct in the Wild",
  CR: "Critically Endangered",
  EN: "Endangered",
  VU: "Vulnerable",
  NT: "Near Threatened",
  LC: "Least Concern",
  DD: "Data Deficient",
  NE: "Not Evaluated",
};

const CATEGORY_COLOR: Record<string, string> = {
  EX: "#000000",
  EW: "#542344",
  CR: "#d81e05",
  EN: "#fc7f3f",
  VU: "#f9e814",
  NT: "#cce226",
  LC: "#60c659",
  DD: "#9ca3af",
  NE: "#6b7280",
};

function shortCode(category: string): string {
  if (!category) return "NE";
  if (category.length <= 3) return category;
  const k = category.toUpperCase().replace(/_/g, " ");
  if (k === "LEAST CONCERN") return "LC";
  if (k === "NEAR THREATENED") return "NT";
  if (k === "VULNERABLE") return "VU";
  if (k === "ENDANGERED") return "EN";
  if (k === "CRITICALLY ENDANGERED") return "CR";
  if (k === "EXTINCT IN THE WILD") return "EW";
  if (k === "EXTINCT") return "EX";
  if (k === "DATA DEFICIENT") return "DD";
  return "NE";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  if (!name) return NextResponse.json({ status: null });

  try {
    const matchUrl = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`;
    const matchRes = await fetch(matchUrl, { next: { revalidate: 86400 } });
    if (!matchRes.ok) return NextResponse.json({ status: null });
    const m = (await matchRes.json()) as GBIFMatch;
    if (!m.usageKey) return NextResponse.json({ status: null });

    const catUrl = `https://api.gbif.org/v1/species/${m.usageKey}/iucnRedListCategory`;
    const catRes = await fetch(catUrl, { next: { revalidate: 86400 } });
    if (!catRes.ok) return NextResponse.json({ status: null });
    const c = (await catRes.json()) as GBIFIucnCategory;

    if (!c.category || c.category === "NOT_EVALUATED") {
      return NextResponse.json({ status: null });
    }

    const code = shortCode(c.category);
    return NextResponse.json({
      status: {
        code,
        label: CATEGORY_LABEL[code] ?? c.category,
        color: CATEGORY_COLOR[code] ?? "#6b7280",
        scientific: c.scientificName ?? name,
        source: "GBIF mirror of IUCN Red List",
      },
    });
  } catch {
    return NextResponse.json({ status: null });
  }
}
