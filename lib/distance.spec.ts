import { describe, it, expect } from "vitest";
import { haversineKm, pathDistanceKm } from "./distance";

describe("haversineKm", () => {
  it("returns 0 for identical points", () => {
    expect(haversineKm([42.36, -71.05], [42.36, -71.05])).toBe(0);
  });

  it("computes ~5570km for NYC to London", () => {
    const nyc: [number, number] = [40.7128, -74.006];
    const london: [number, number] = [51.5072, -0.1276];
    const d = haversineKm(nyc, london);
    expect(d).toBeGreaterThan(5500);
    expect(d).toBeLessThan(5600);
  });

  it("computes ~9000km for SF to Tokyo", () => {
    const sf: [number, number] = [37.77, -122.42];
    const tokyo: [number, number] = [35.69, 139.69];
    const d = haversineKm(sf, tokyo);
    expect(d).toBeGreaterThan(8200);
    expect(d).toBeLessThan(8400);
  });

  it("is symmetric", () => {
    const a: [number, number] = [10, 20];
    const b: [number, number] = [-30, 40];
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 5);
  });
});

describe("pathDistanceKm", () => {
  it("returns 0 for empty or single-point paths", () => {
    expect(pathDistanceKm([])).toBe(0);
    expect(pathDistanceKm([[0, 0]])).toBe(0);
  });

  it("sums segment-by-segment", () => {
    const path: Array<[number, number]> = [
      [0, 0],
      [0, 1],
      [0, 2],
    ];
    const expected = haversineKm([0, 0], [0, 1]) + haversineKm([0, 1], [0, 2]);
    expect(pathDistanceKm(path)).toBeCloseTo(expected, 5);
  });
});
