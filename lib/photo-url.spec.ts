import { describe, it, expect } from "vitest";
import { inatToMedium } from "./photo-url";

describe("inatToMedium", () => {
  it("transforms iNat square.jpg to medium.jpg", () => {
    expect(
      inatToMedium(
        "https://inaturalist-open-data.s3.amazonaws.com/photos/650589992/square.jpg",
      ),
    ).toBe(
      "https://inaturalist-open-data.s3.amazonaws.com/photos/650589992/medium.jpg",
    );
  });

  it("preserves query strings", () => {
    expect(
      inatToMedium(
        "https://static.inaturalist.org/photos/123/square.jpg?v=2",
      ),
    ).toBe("https://static.inaturalist.org/photos/123/medium.jpg?v=2");
  });

  it("works with PNG", () => {
    expect(inatToMedium("https://x/photos/1/square.png")).toBe(
      "https://x/photos/1/medium.png",
    );
  });

  it("does not transform if not a square thumbnail", () => {
    expect(inatToMedium("https://x/photos/1/medium.jpg")).toBe(
      "https://x/photos/1/medium.jpg",
    );
  });

  it("returns null for null/undefined", () => {
    expect(inatToMedium(null)).toBeNull();
    expect(inatToMedium(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(inatToMedium("")).toBeNull();
  });
});
