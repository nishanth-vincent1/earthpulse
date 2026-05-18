export function inatToMedium(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/\/square\.(jpe?g|png)/i, "/medium.$1");
}
