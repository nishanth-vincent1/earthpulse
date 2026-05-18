export type Bookmark = {
  key: string;
  kind: string;
  id: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  lat: number;
  lng: number;
  savedAt: number;
};

const STORAGE_KEY = "earthpulse:bookmarks";

export function loadBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Bookmark[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(bookmarks: Bookmark[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {}
}

export function bookmarkKey(kind: string, id: string): string {
  return `${kind}:${id}`;
}

export function addBookmark(b: Bookmark, current: Bookmark[]): Bookmark[] {
  if (current.some((x) => x.key === b.key)) return current;
  const next = [b, ...current];
  saveBookmarks(next);
  return next;
}

export function removeBookmark(key: string, current: Bookmark[]): Bookmark[] {
  const next = current.filter((b) => b.key !== key);
  saveBookmarks(next);
  return next;
}

export function isBookmarked(key: string, list: Bookmark[]): boolean {
  return list.some((b) => b.key === key);
}
