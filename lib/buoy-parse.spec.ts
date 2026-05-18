import { describe, it, expect } from "vitest";
import { parseNumber, parseBuoyText } from "./buoy-parse";

describe("parseNumber", () => {
  it("parses real numbers", () => {
    expect(parseNumber("13.2")).toBe(13.2);
    expect(parseNumber("0")).toBe(0);
    expect(parseNumber("-5.5")).toBe(-5.5);
  });

  it("returns null for NDBC sentinel values", () => {
    expect(parseNumber("MM")).toBeNull();
    expect(parseNumber("999.0")).toBeNull();
    expect(parseNumber("9999")).toBeNull();
  });

  it("returns null for undefined / empty / NaN", () => {
    expect(parseNumber(undefined)).toBeNull();
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("not-a-number")).toBeNull();
  });
});

const SAMPLE_NDBC = `#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
2026 05 01 22 10 310  7.0  8.0    MM    MM    MM  MM 1015.1    MM  13.2    MM   MM   MM    MM
2026 05 01 22 00 300  7.0  8.0    MM    MM    MM  MM 1015.3    MM  13.2    MM   MM -0.7    MM`;

describe("parseBuoyText", () => {
  it("parses the most recent reading", () => {
    const r = parseBuoyText(SAMPLE_NDBC);
    expect(r).not.toBeNull();
    expect(r!.observed).toBe("2026-05-01 22:10 UTC");
    expect(r!.windDir).toBe(310);
    expect(r!.windSpeed).toBe(7);
    expect(r!.gust).toBe(8);
    expect(r!.pressure).toBe(1015.1);
    expect(r!.waterTemp).toBe(13.2);
    expect(r!.waveHeight).toBeNull();
    expect(r!.airTemp).toBeNull();
  });

  it("returns null on empty input", () => {
    expect(parseBuoyText("")).toBeNull();
  });

  it("returns null on header-only input (no data lines)", () => {
    expect(
      parseBuoyText(
        "#YY  MM DD hh mm WDIR\n#yr  mo dy hr mn degT",
      ),
    ).toBeNull();
  });

  it("returns null on malformed short rows", () => {
    expect(parseBuoyText("# header\n2026")).toBeNull();
  });
});
