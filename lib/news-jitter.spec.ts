import { describe, it, expect } from "vitest";
import { seedFromString, jitterOffset, jitterCoord } from "./news-jitter";

describe("seedFromString", () => {
  it("is deterministic for the same string", () => {
    expect(seedFromString("hello")).toBe(seedFromString("hello"));
  });

  it("produces different seeds for different strings", () => {
    expect(seedFromString("a")).not.toBe(seedFromString("b"));
  });

  it("returns 0 for empty string", () => {
    expect(seedFromString("")).toBe(0);
  });
});

describe("jitterOffset", () => {
  it("stays within ±range", () => {
    for (let i = 0; i < 1000; i++) {
      const o = jitterOffset(i, 5);
      expect(o).toBeGreaterThanOrEqual(-5);
      expect(o).toBeLessThanOrEqual(5);
    }
  });

  it("is deterministic", () => {
    expect(jitterOffset(42, 3)).toBe(jitterOffset(42, 3));
  });
});

describe("jitterCoord", () => {
  it("keeps lat within [-85, 85]", () => {
    const seeds = [10, 100, 1000, 10000, -50];
    for (const s of seeds) {
      const [lat] = jitterCoord(80, 0, s, 10, 10);
      expect(lat).toBeGreaterThanOrEqual(-85);
      expect(lat).toBeLessThanOrEqual(85);
    }
  });

  it("wraps lng across antimeridian", () => {
    const [, lng] = jitterCoord(0, 178, seedFromString("a"), 0, 5);
    expect(lng).toBeGreaterThanOrEqual(-180);
    expect(lng).toBeLessThanOrEqual(180);
  });

  it("returns the same coord for the same URL/seed (deterministic per article)", () => {
    const seedA = seedFromString("United States" + "https://x.com/a");
    const seedB = seedFromString("United States" + "https://x.com/a");
    const a = jitterCoord(40, -100, seedA, 3, 4);
    const b = jitterCoord(40, -100, seedB, 3, 4);
    expect(a).toEqual(b);
  });

  it("returns different coords for different URLs in same country", () => {
    const a = jitterCoord(
      40,
      -100,
      seedFromString("United States" + "https://x.com/a"),
      3,
      4,
    );
    const b = jitterCoord(
      40,
      -100,
      seedFromString("United States" + "https://x.com/b"),
      3,
      4,
    );
    expect(a).not.toEqual(b);
  });
});
