export type StarRecord = {
  name: string;
  ra: number;
  dec: number;
  mag: number;
  constellation: string;
  distanceLy: number;
  spectralClass: string;
  color: string;
  blurb: string;
};

const C = {
  O_BLUE: "#9bb0ff",
  B_BLUE_WHITE: "#aabfff",
  A_WHITE: "#f5f8ff",
  F_YELLOW_WHITE: "#fff7e0",
  G_YELLOW: "#ffe6a0",
  K_ORANGE: "#ffb874",
  M_RED: "#ff7a55",
};

export const STARS: StarRecord[] = [
  {
    name: "Sirius",
    ra: 6.7525,
    dec: -16.7161,
    mag: -1.46,
    constellation: "Canis Major",
    distanceLy: 8.6,
    spectralClass: "A1V",
    color: C.A_WHITE,
    blurb:
      "Brightest star in Earth's night sky. The Egyptians timed their calendar to its heliacal rising.",
  },
  {
    name: "Canopus",
    ra: 6.3992,
    dec: -52.6957,
    mag: -0.74,
    constellation: "Carina",
    distanceLy: 310,
    spectralClass: "A9II",
    color: C.F_YELLOW_WHITE,
    blurb:
      "Second-brightest star. A yellow-white supergiant; spacecraft use it for navigation.",
  },
  {
    name: "Arcturus",
    ra: 14.2611,
    dec: 19.1825,
    mag: -0.05,
    constellation: "Boötes",
    distanceLy: 37,
    spectralClass: "K1.5III",
    color: C.K_ORANGE,
    blurb:
      "Brightest star in the Northern Hemisphere. An old orange giant moving through our galaxy at high speed.",
  },
  {
    name: "Vega",
    ra: 18.6156,
    dec: 38.7837,
    mag: 0.03,
    constellation: "Lyra",
    distanceLy: 25,
    spectralClass: "A0V",
    color: C.A_WHITE,
    blurb:
      "Pole star ~12,000 BCE and again ~13,727 CE thanks to Earth's axial precession.",
  },
  {
    name: "Capella",
    ra: 5.2778,
    dec: 45.9981,
    mag: 0.08,
    constellation: "Auriga",
    distanceLy: 43,
    spectralClass: "G3III",
    color: C.G_YELLOW,
    blurb:
      "Actually four stars: two pairs of yellow giants orbiting their common center of mass.",
  },
  {
    name: "Rigel",
    ra: 5.2422,
    dec: -8.2017,
    mag: 0.13,
    constellation: "Orion",
    distanceLy: 860,
    spectralClass: "B8Ia",
    color: C.B_BLUE_WHITE,
    blurb:
      "Blue supergiant in Orion's foot. Burns about 120,000× brighter than the Sun.",
  },
  {
    name: "Procyon",
    ra: 7.6553,
    dec: 5.2250,
    mag: 0.34,
    constellation: "Canis Minor",
    distanceLy: 11.5,
    spectralClass: "F5IV",
    color: C.F_YELLOW_WHITE,
    blurb: "One of our closest stellar neighbors. Has a white dwarf companion.",
  },
  {
    name: "Betelgeuse",
    ra: 5.9197,
    dec: 7.4071,
    mag: 0.5,
    constellation: "Orion",
    distanceLy: 642,
    spectralClass: "M1-M2Ia",
    color: C.M_RED,
    blurb:
      "Red supergiant. Will go supernova within ~100,000 years — when it does, it'll be visible in daylight.",
  },
  {
    name: "Achernar",
    ra: 1.6286,
    dec: -57.2367,
    mag: 0.46,
    constellation: "Eridanus",
    distanceLy: 139,
    spectralClass: "B6Vep",
    color: C.B_BLUE_WHITE,
    blurb:
      "The flattest known star — spinning so fast its equator is 50% wider than its poles.",
  },
  {
    name: "Altair",
    ra: 19.8464,
    dec: 8.8683,
    mag: 0.77,
    constellation: "Aquila",
    distanceLy: 16.7,
    spectralClass: "A7V",
    color: C.A_WHITE,
    blurb:
      "Spins once every 9 hours (the Sun takes 25 days). Forms the Summer Triangle with Vega and Deneb.",
  },
  {
    name: "Aldebaran",
    ra: 4.5987,
    dec: 16.5093,
    mag: 0.85,
    constellation: "Taurus",
    distanceLy: 65,
    spectralClass: "K5III",
    color: C.K_ORANGE,
    blurb:
      "The Bull's eye. An orange giant 44× the Sun's diameter. Pioneer 10 will pass near it in 2 million years.",
  },
  {
    name: "Spica",
    ra: 13.4199,
    dec: -11.1614,
    mag: 0.97,
    constellation: "Virgo",
    distanceLy: 250,
    spectralClass: "B1V",
    color: C.O_BLUE,
    blurb:
      "A binary system of two hot blue stars whirling around each other every 4 days.",
  },
  {
    name: "Antares",
    ra: 16.4901,
    dec: -26.4319,
    mag: 0.96,
    constellation: "Scorpius",
    distanceLy: 550,
    spectralClass: "M1.5Iab",
    color: C.M_RED,
    blurb:
      "The Scorpion's heart. A red supergiant so vast its surface would extend past Mars' orbit if placed at the Sun.",
  },
  {
    name: "Pollux",
    ra: 7.7553,
    dec: 28.0262,
    mag: 1.14,
    constellation: "Gemini",
    distanceLy: 33.7,
    spectralClass: "K0III",
    color: C.K_ORANGE,
    blurb:
      "An orange giant with a confirmed exoplanet (Pollux b) about twice Jupiter's mass.",
  },
  {
    name: "Deneb",
    ra: 20.6906,
    dec: 45.2803,
    mag: 1.25,
    constellation: "Cygnus",
    distanceLy: 2615,
    spectralClass: "A2Ia",
    color: C.A_WHITE,
    blurb:
      "One of the most luminous stars known. Marks the tail of the Swan, top of the Northern Cross.",
  },
  {
    name: "Regulus",
    ra: 10.1395,
    dec: 11.9672,
    mag: 1.4,
    constellation: "Leo",
    distanceLy: 79,
    spectralClass: "B8IVn",
    color: C.B_BLUE_WHITE,
    blurb:
      "The Heart of the Lion. Spins so fast it's nearly oblate — a flattened ellipsoid.",
  },
  {
    name: "Acrux",
    ra: 12.4433,
    dec: -63.0991,
    mag: 0.76,
    constellation: "Crux",
    distanceLy: 320,
    spectralClass: "B0.5IV",
    color: C.O_BLUE,
    blurb:
      "Bottom star of the Southern Cross. Closest first-magnitude star to the South Pole.",
  },
  {
    name: "Polaris",
    ra: 2.5303,
    dec: 89.2641,
    mag: 1.98,
    constellation: "Ursa Minor",
    distanceLy: 433,
    spectralClass: "F7Ib",
    color: C.F_YELLOW_WHITE,
    blurb:
      "The North Star. Lies less than 1° from the celestial pole — sailors and travelers have steered by it for millennia.",
  },
];

export function gmstDegrees(date: Date): number {
  const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const days = (date.getTime() - J2000) / 86_400_000;
  const gmstHours = 18.697374558 + 24.06570982441908 * days;
  const normalized = ((gmstHours % 24) + 24) % 24;
  return normalized * 15;
}

export function substellarPoint(
  raHours: number,
  decDegrees: number,
  date: Date,
): { lat: number; lng: number } {
  const raDeg = raHours * 15;
  const gmst = gmstDegrees(date);
  let lng = raDeg - gmst;
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return { lat: decDegrees, lng };
}
