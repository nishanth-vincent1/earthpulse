import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 600;

const VOLCANO_COORDS: Record<string, [number, number]> = {
  "311120": [52.0765, -176.1109],
  "311300": [54.7554, -163.9711],
  "311240": [56.17, -158.59],
  "311070": [56.5446, -163.9703],
  "311300_alt": [55.0317, -165.9856],
  "313010": [19.4119, -155.2834],
  "313020": [19.4753, -155.6068],
  "313040": [19.6925, -155.8722],
  "321010": [46.2, -122.18],
  "321020": [46.852, -121.76],
  "321030": [45.374, -121.6943],
  "321040": [46.2058, -121.4906],
  "321050": [48.7768, -121.8131],
  "321060": [48.1116, -121.1141],
  "321090": [44.103, -121.768],
  "321110": [42.93, -122.12],
  "321130": [40.4929, -121.508],
  "321150": [41.4099, -122.1949],
  "323020": [37.7, -118.872],
  "325010": [44.43, -110.67],
  "311130": [51.9242, -179.5919],
  "311340": [56.2, -158.45],
  "311190": [54.1342, -165.9856],
  "311200": [55.42, -161.89],
  "311080": [60.0322, -153.0901],
  "311090": [60.4853, -152.7438],
  "311100": [61.299, -152.2517],
  "311110": [60.4853, -152.7438],
  "311220": [55.078, -160.587],
  "311260": [56.88, -158.18],
  "311340_alt": [58.27, -155.16],
  "311300_alt2": [58.29, -154.89],
};

const NAME_FALLBACK: Record<string, [number, number]> = {
  "Great Sitkin": [52.0765, -176.1109],
  Shishaldin: [54.7554, -163.9711],
  Kilauea: [19.4119, -155.2834],
  "Mauna Loa": [19.4753, -155.6068],
  Hualalai: [19.6925, -155.8722],
  Cleveland: [52.8222, -169.945],
  Pavlof: [55.4173, -161.8937],
  Veniaminof: [56.17, -158.59],
  Bogoslof: [53.93, -168.03],
  Akutan: [54.1342, -165.9856],
  Augustine: [59.3626, -153.435],
  Iliamna: [60.0322, -153.0901],
  Spurr: [61.299, -152.2517],
  Redoubt: [60.4853, -152.7438],
  "Mount St. Helens": [46.2, -122.18],
  "Mount Rainier": [46.852, -121.76],
  "Mount Hood": [45.374, -121.6943],
  "Mount Adams": [46.2058, -121.4906],
  "Mount Baker": [48.7768, -121.8131],
  "Glacier Peak": [48.1116, -121.1141],
  "Three Sisters": [44.103, -121.768],
  "Crater Lake": [42.93, -122.12],
  Newberry: [43.722, -121.229],
  Lassen: [40.4929, -121.508],
  "Mount Shasta": [41.4099, -122.1949],
  "Long Valley": [37.7, -118.872],
  Yellowstone: [44.43, -110.67],
};

const ALERT_COLOR: Record<string, string> = {
  GREEN: "#7ad36b",
  YELLOW: "#ffe16a",
  ORANGE: "#ff9b3d",
  RED: "#ff5050",
};

type RawVolcano = {
  obs_fullname: string;
  obs_abbr: string;
  volcano_name: string;
  vnum: string;
  color_code: string;
  alert_level: string;
  notice_url: string;
  sent_utc: string;
};

function findCoords(v: RawVolcano): [number, number] | null {
  if (VOLCANO_COORDS[v.vnum]) return VOLCANO_COORDS[v.vnum];
  if (NAME_FALLBACK[v.volcano_name]) return NAME_FALLBACK[v.volcano_name];
  for (const k of Object.keys(NAME_FALLBACK)) {
    if (
      k.toLowerCase().includes(v.volcano_name.toLowerCase()) ||
      v.volcano_name.toLowerCase().includes(k.toLowerCase())
    ) {
      return NAME_FALLBACK[k];
    }
  }
  return null;
}

export async function GET() {
  try {
    const r = await fetch(
      "https://volcanoes.usgs.gov/hans-public/api/volcano/getElevatedVolcanoes",
      { next: { revalidate: 600 } },
    );
    if (!r.ok) return NextResponse.json({ volcanoes: [] });
    const data = (await r.json()) as RawVolcano[];

    const volcanoes = data
      .map((v) => {
        const coords = findCoords(v);
        if (!coords) return null;
        return {
          id: `volc-${v.vnum}`,
          name: v.volcano_name,
          observatory: v.obs_fullname,
          observatoryAbbr: v.obs_abbr,
          vnum: v.vnum,
          colorCode: v.color_code,
          alertLevel: v.alert_level,
          color: ALERT_COLOR[v.color_code] ?? "#6b7280",
          noticeUrl: v.notice_url,
          sentUtc: v.sent_utc,
          lat: coords[0],
          lng: coords[1],
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    return NextResponse.json({ volcanoes });
  } catch {
    return NextResponse.json({ volcanoes: [] });
  }
}
