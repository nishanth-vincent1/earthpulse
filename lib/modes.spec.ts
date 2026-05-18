import { describe, it, expect } from "vitest";
import { MODES, modeById, DEFAULT_MODE_ID } from "./modes";

describe("modes", () => {
  it("includes Live Earth as the default", () => {
    expect(DEFAULT_MODE_ID).toBe("live");
    expect(MODES[0].id).toBe("live");
  });

  it("Live Earth shows just ISS + sun by default (the tour introduces the rest)", () => {
    const live = modeById("live");
    expect(live.layers.iss).toBe(true);
    expect(live.layers.terminator).toBe(true);
    expect(live.layers.quakes).toBe(false);
  });

  it("Live Earth still keeps the heaviest fetches off by default", () => {
    const live = modeById("live");
    const heavyLayers = ["fires", "aurora", "cables", "news", "ships"];
    for (const k of heavyLayers) {
      expect(live.layers[k as keyof typeof live.layers]).toBe(false);
    }
  });

  it("every mode has unique id", () => {
    const ids = MODES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every mode declares a value for every LayerKey", () => {
    const expectedKeys = Object.keys(MODES[0].layers);
    for (const m of MODES) {
      const keys = Object.keys(m.layers);
      expect(keys.sort()).toEqual(expectedKeys.sort());
    }
  });

  it("modeById returns Live Earth for unknown ids", () => {
    expect(modeById("nonexistent").id).toBe("live");
  });

  it("Tonight on Earth includes disasters and fires", () => {
    const tonight = modeById("tonight");
    expect(tonight.layers.disasters).toBe(true);
    expect(tonight.layers.fires).toBe(true);
    expect(tonight.layers.quakes).toBe(true);
  });

  it("Ocean mode includes tides and buoys", () => {
    const ocean = modeById("ocean");
    expect(ocean.layers.tides).toBe(true);
    expect(ocean.layers.buoys).toBe(true);
  });

  it("Tell Me a Story turns off all layers except terminator", () => {
    const story = modeById("story");
    const layers = story.layers;
    const enabled = Object.entries(layers).filter(([, v]) => v);
    expect(enabled).toEqual([["terminator", true]]);
  });
});
