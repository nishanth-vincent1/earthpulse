export type Story = {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  region: string;
  lat: number;
  lng: number;
  altitude: number;
  modeId: string;
  year?: number;
  scrubTimestamp?: number;
  selectionParam?: string;
  heroImage: string;
  heroCredit: string;
  /** First paragraph shown above the fold. ~2-3 sentences. */
  lead: string;
  /** Full narrative — markdown-ish paragraphs (no rendering library, plain text per paragraph). */
  body: string[];
  /** Layer keys that should be on when the story opens on the live globe. */
  layers: string[];
  /** Wikipedia article URL for "Read more" link. */
  wikipediaUrl: string;
};

export const STORIES: Story[] = [
  {
    slug: "tohoku-2011",
    title: "Tōhoku Earthquake & Tsunami",
    subtitle: "M9.1 · The day the Pacific Plate slipped 80 meters",
    date: "2011-03-11",
    region: "Sendai, Japan",
    lat: 38.3,
    lng: 142.4,
    altitude: 1.6,
    modeId: "timetravel",
    year: 2011,
    heroImage:
      "https://upload.wikimedia.org/wikipedia/commons/2/2a/SH-60B_helicopter_flies_over_Sendai.jpg",
    heroCredit: "U.S. Navy / Wikimedia Commons (public domain)",
    lead:
      "At 14:46 local time on March 11, 2011, the Pacific Plate slipped beneath the Okhotsk Plate by as much as 80 meters along a 500-kilometer rupture — the fourth-largest earthquake ever recorded. Six minutes later, a tsunami nearly 40 meters tall overtopped seawalls along the Sanriku coast.",
    body: [
      "The magnitude 9.1 event released energy equivalent to roughly 600 million Hiroshima bombs. Honshu shifted 2.4 meters east. Japan's main island moved permanently closer to North America. Earth's axis itself tilted by an estimated 17 centimeters.",
      "The tsunami inundated 561 square kilometers of coastline within 90 minutes. The Fukushima Daiichi nuclear plant's seawall — designed for waves up to 10 meters — was overtopped by a 14-meter wave that flooded backup generators, triggering a station blackout and three core meltdowns over the following days.",
      "Roughly 19,759 people died. 2,553 remain missing. The economic damage of around $235 billion makes it the costliest natural disaster in recorded history.",
      "The USGS PAGER system rated the quake's potential impact as RED within 30 minutes — the highest alert level — and tsunami warnings reached the entire Pacific Rim within an hour, from Hawaii to Chile.",
    ],
    layers: ["quakes", "tsunamis", "terminator"],
    wikipediaUrl:
      "https://en.wikipedia.org/wiki/2011_T%C5%8Dhoku_earthquake_and_tsunami",
  },
  {
    slug: "eyjafjallajokull-2010",
    title: "Eyjafjallajökull Eruption",
    subtitle: "The volcano that grounded Europe",
    date: "2010-04-14",
    region: "Iceland",
    lat: 63.63,
    lng: -19.62,
    altitude: 1.5,
    modeId: "timetravel",
    year: 2010,
    heroImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Eyjafjallajokull-April-17.JPG/1920px-Eyjafjallajokull-April-17.JPG",
    heroCredit: "Sverrir Þór / Wikimedia Commons (CC BY-SA 3.0)",
    lead:
      "When Eyjafjallajökull's glaciated summit cracked open in April 2010, the ash plume it sent into the jet stream grounded 95,000 flights and cost the airline industry $1.7 billion. It was the largest closure of European airspace since World War II.",
    body: [
      "The eruption was modest by Icelandic standards — VEI 4, similar to Mount St. Helens 1980. What made it consequential was geography: the volcano sat directly under the North Atlantic jet stream, and the molten lava meeting glacial ice produced unusually fine, glassy ash that stays airborne for days.",
      "Between April 15 and April 23, almost the entire upper-airspace network from Iceland to Eastern Europe was closed to commercial aviation. 10 million passengers were stranded. Container shipping rates surged. Kenyan flower farmers — whose product depends on overnight air freight to European florists — lost $1.3 million per day.",
      "The eruption also catalyzed a permanent change in how aviation authorities respond to ash. Pre-2010, the rule was zero ash tolerance. Post-2010, the EASA introduced a tiered system based on ash density — recognizing that the old rule, applied literally, would close European airspace far too often.",
      "Eyjafjallajökull stopped erupting on June 22, 2010. Its larger neighbor Katla, which historically erupts in tandem with it, has not yet.",
    ],
    layers: ["volcanoes", "events", "terminator"],
    wikipediaUrl:
      "https://en.wikipedia.org/wiki/2010_eruptions_of_Eyjafjallaj%C3%B6kull",
  },
  {
    slug: "katrina-2005",
    title: "Hurricane Katrina",
    subtitle: "Cat 5 in the Gulf, the levees that didn't hold",
    date: "2005-08-29",
    region: "New Orleans, Louisiana",
    lat: 29.95,
    lng: -90.07,
    altitude: 1.5,
    modeId: "timetravel",
    year: 2005,
    heroImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Katrina_2005-08-28_1700Z.jpg/1920px-Katrina_2005-08-28_1700Z.jpg",
    heroCredit: "NASA / Wikimedia Commons (public domain)",
    lead:
      "Hurricane Katrina made landfall in southeast Louisiana on August 29, 2005, as a Category 3 storm. The storm surge — up to 8.5 meters in some places — overwhelmed New Orleans' levee system. 80% of the city flooded. 1,833 people died.",
    body: [
      "Katrina was a Category 5 over the Gulf of Mexico with peak winds of 280 km/h. It weakened to Cat 3 by landfall, but the storm surge was generated when it was still Cat 5 — and storm surge takes hours to dissipate.",
      "53 federal levees and floodwalls failed in 50 different places. Most were not overtopped — they collapsed from the *pressure* of water against substandard construction. The most catastrophic failure was at the 17th Street Canal, which breached around 9:30 AM CDT, flooding Lakeview within hours.",
      "The federal response was widely judged a failure. The Superdome and Convention Center, designated as refuges of last resort, housed 30,000+ people for five days without adequate water, food, sanitation, or evacuation.",
      "Total damage: $186 billion (in 2025 dollars). Katrina is still the costliest hurricane in U.S. history. The city's population in 2005 was 484,000; in 2025 it remains around 376,000 — Katrina permanently displaced roughly a quarter of New Orleans.",
    ],
    layers: ["hurricanes", "terminator"],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Hurricane_Katrina",
  },
  {
    slug: "black-summer-2020",
    title: "Australian Black Summer",
    subtitle: "When the continent caught fire",
    date: "2020-01-04",
    region: "New South Wales, Australia",
    lat: -34.0,
    lng: 150.0,
    altitude: 1.7,
    modeId: "timetravel",
    year: 2020,
    heroImage:
      "https://upload.wikimedia.org/wikipedia/commons/5/54/2019-20_Australia_Bushfires_season_montage.png",
    heroCredit: "Multiple contributors / Wikimedia Commons (CC BY-SA)",
    lead:
      "From June 2019 through March 2020, wildfires consumed 24 million hectares of southeast Australia — an area larger than England. 33 people died directly. Up to three billion animals were displaced or killed. The smoke circumnavigated the globe.",
    body: [
      "The fires were driven by Australia's hottest and driest year on record. From mid-October 2019, conditions across NSW and Victoria reached IFI (Index of Fire Intensity) levels that hadn't been seen since the 2009 Black Saturday fires. By Christmas, simultaneous fires in NSW, Victoria, and South Australia had merged into mega-complexes covering thousands of square kilometers.",
      "Pyrocumulus clouds — fire-generated thunderstorms — became routine. Several pyroCb systems generated their own lightning, igniting new fires kilometers ahead of the main front. The Currowan Fire alone burned 499,621 hectares over 74 days.",
      "Smoke plumes rose into the stratosphere and crossed the Pacific to South America within 7 days, then continued east around the planet. NASA Worldview satellite imagery showed the plume circling the globe by January 14, 2020 — a meteorological event with no precedent in the satellite era.",
      "An estimated 3 billion vertebrate animals were killed or displaced — including 60,000 koalas on Kangaroo Island alone, where the resident population collapsed from 50,000 to fewer than 10,000.",
    ],
    layers: ["fires", "events", "terminator"],
    wikipediaUrl: "https://en.wikipedia.org/wiki/2019%E2%80%9320_Australian_bushfire_season",
  },
  {
    slug: "sumatra-2004",
    title: "Indian Ocean Tsunami",
    subtitle: "The day the world's plates shifted by 15 meters",
    date: "2004-12-26",
    region: "Sumatra, Indonesia",
    lat: 3.3,
    lng: 95.85,
    altitude: 1.6,
    modeId: "timetravel",
    year: 2004,
    heroImage:
      "https://upload.wikimedia.org/wikipedia/commons/8/80/US_Navy_050102-N-9593M-040_A_village_near_the_coast_of_Sumatra_lays_in_ruin_after_the_Tsunami_that_struck_South_East_Asia.jpg",
    heroCredit: "U.S. Navy / Wikimedia Commons (public domain)",
    lead:
      "On December 26, 2004, the Indian Plate slid 15 meters beneath the Burma Plate along a 1,300-kilometer rupture off the coast of Sumatra. The resulting tsunami killed 230,000 people in 14 countries — the deadliest tsunami in recorded history.",
    body: [
      "The M9.1 quake ruptured the longest fault segment ever recorded — from Sumatra all the way to the Andaman Islands. The seafloor displaced vertically by up to 5 meters, displacing roughly 30 cubic kilometers of seawater.",
      "Waves reached the coast of Sumatra within 15 minutes. The Indonesian province of Aceh — the closest landfall — suffered 167,000 deaths. The town of Banda Aceh was virtually erased.",
      "The tsunami crossed the entire Indian Ocean within 7 hours, killing people on the coasts of Thailand, Sri Lanka, India, the Maldives, Somalia, Kenya, and Tanzania. There was no warning system. In 2005, the international community fast-tracked the Indian Ocean Tsunami Warning System, modeled on the Pacific version that had existed since 1949.",
      "Earth's day became 2.68 microseconds shorter. The North Pole shifted by 2.5 centimeters. The planet's overall shape became very slightly less oblate.",
    ],
    layers: ["quakes", "tsunamis", "terminator"],
    wikipediaUrl:
      "https://en.wikipedia.org/wiki/2004_Indian_Ocean_earthquake_and_tsunami",
  },
];

export function getStory(slug: string): Story | undefined {
  return STORIES.find((s) => s.slug === slug);
}
