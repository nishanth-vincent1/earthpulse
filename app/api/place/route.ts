import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const WMO: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Heavy showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  const [geo, weather] = await Promise.all([
    fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { next: { revalidate: 86400 } },
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m,is_day`,
      { next: { revalidate: 600 } },
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  const place = {
    country: geo?.countryName?.replace(/\s*\(the\)\s*$/i, "") ?? null,
    countryCode: geo?.countryCode ?? null,
    city: geo?.city || geo?.locality || null,
    region: geo?.principalSubdivision ?? null,
    isOcean: !geo?.countryCode,
  };

  const w = weather?.current ?? null;
  const wx = w
    ? {
        tempC: w.temperature_2m,
        windKph: w.wind_speed_10m,
        humidity: w.relative_humidity_2m,
        condition: WMO[w.weather_code] ?? "Unknown",
        isDay: w.is_day === 1,
      }
    : null;

  let countryDetails = null;
  if (place.countryCode) {
    try {
      const r = await fetch(
        `https://restcountries.com/v3.1/alpha/${place.countryCode}?fields=flag,capital,population,languages,region,subregion`,
        { next: { revalidate: 86400 } },
      );
      if (r.ok) {
        const arr = await r.json();
        const c = Array.isArray(arr) ? arr[0] : arr;
        countryDetails = {
          flag: c?.flag ?? null,
          capital: c?.capital?.[0] ?? null,
          population: c?.population ?? null,
          languages: c?.languages ? Object.values(c.languages) : [],
          region: c?.subregion ?? c?.region ?? null,
        };
      }
    } catch {}
  }

  return NextResponse.json({ place, weather: wx, country: countryDetails });
}
