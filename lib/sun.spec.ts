import { describe, it, expect } from "vitest";
import { subsolar, terminator } from "./sun";

describe("subsolar", () => {
  it("places the sun on the equator at the equinoxes (~Mar 20)", () => {
    const equinox = new Date(Date.UTC(2026, 2, 20, 12, 0, 0));
    const s = subsolar(equinox);
    expect(Math.abs(s.lat)).toBeLessThan(2);
  });

  it("places the sun near Tropic of Cancer at June solstice", () => {
    const solstice = new Date(Date.UTC(2026, 5, 21, 12, 0, 0));
    const s = subsolar(solstice);
    expect(s.lat).toBeGreaterThan(22);
    expect(s.lat).toBeLessThan(24);
  });

  it("places the sun near Tropic of Capricorn at December solstice", () => {
    const solstice = new Date(Date.UTC(2026, 11, 21, 12, 0, 0));
    const s = subsolar(solstice);
    expect(s.lat).toBeLessThan(-22);
    expect(s.lat).toBeGreaterThan(-24);
  });

  it("places the subsolar longitude near 0 at UTC noon", () => {
    const t = new Date(Date.UTC(2026, 5, 1, 12, 0, 0));
    const s = subsolar(t);
    expect(Math.abs(s.lng)).toBeLessThan(1);
  });

  it("places the subsolar longitude near -180/+180 at UTC midnight", () => {
    const t = new Date(Date.UTC(2026, 5, 1, 0, 0, 0));
    const s = subsolar(t);
    expect(Math.abs(Math.abs(s.lng) - 180)).toBeLessThan(1);
  });

  it("wraps longitude into [-180, 180]", () => {
    for (let h = 0; h < 24; h++) {
      const t = new Date(Date.UTC(2026, 5, 1, h, 0, 0));
      const s = subsolar(t);
      expect(s.lng).toBeGreaterThanOrEqual(-180);
      expect(s.lng).toBeLessThanOrEqual(180);
    }
  });
});

describe("terminator", () => {
  it("returns N+1 points for N segments", () => {
    const t = terminator({ lat: 0, lng: 0 }, 100);
    expect(t.length).toBe(101);
  });

  it("returns coordinates within valid lat/lng ranges", () => {
    const t = terminator({ lat: 23, lng: -45 }, 100);
    for (const [lat, lng] of t) {
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
    }
  });

  it("first and last point are equal (closed loop)", () => {
    const t = terminator({ lat: 0, lng: 0 }, 50);
    expect(t[0][0]).toBeCloseTo(t[t.length - 1][0], 5);
    expect(t[0][1]).toBeCloseTo(t[t.length - 1][1], 5);
  });
});
