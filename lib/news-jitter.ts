export function seedFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

export function jitterOffset(seed: number, range: number): number {
  const r = (((Math.sin(seed) * 10000) % 1) + 1) % 1;
  return (r * 2 - 1) * range;
}

export function jitterCoord(
  baseLat: number,
  baseLng: number,
  seed: number,
  latRange: number,
  lngRange: number,
): [number, number] {
  const jLat = jitterOffset(seed, latRange);
  const jLng = jitterOffset(seed * 1.3, lngRange);
  const lat = Math.max(-85, Math.min(85, baseLat + jLat));
  const lng = ((baseLng + jLng + 540) % 360) - 180;
  return [lat, lng];
}
