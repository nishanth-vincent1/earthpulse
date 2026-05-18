export function subsolar(date: Date): { lat: number; lng: number } {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = (date.getTime() - start) / 86400000;
  const declRad = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);
  const utcHours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  let lng = -(utcHours - 12) * 15;
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return { lat: declRad, lng };
}

export function terminator(
  sun: { lat: number; lng: number },
  n: number = 180,
): Array<[number, number]> {
  const phi0 = (sun.lat * Math.PI) / 180;
  const lam0 = (sun.lng * Math.PI) / 180;

  const points: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * 2 * Math.PI;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    const sinPhi =
      Math.cos(phi0) * sinT + 0;
    const cosPhi = Math.sqrt(Math.max(0, 1 - sinPhi * sinPhi));
    const lat = (Math.asin(sinPhi) * 180) / Math.PI;
    const dLng = Math.atan2(cosT, -Math.sin(phi0) * sinT);
    let lngRad = lam0 + dLng;
    while (lngRad > Math.PI) lngRad -= 2 * Math.PI;
    while (lngRad < -Math.PI) lngRad += 2 * Math.PI;
    const lng = (lngRad * 180) / Math.PI;
    void cosPhi;
    points.push([lat, lng]);
  }
  return points;
}
