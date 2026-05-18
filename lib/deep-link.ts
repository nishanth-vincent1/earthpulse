export type DeepLinkSelection =
  | { kind: "place"; lat: number; lng: number }
  | { kind: string; id: string };

export type DeepLinkState = {
  modeId?: string;
  selection?: DeepLinkSelection;
};

export function encodeDeepLink(state: DeepLinkState): string {
  const params = new URLSearchParams();
  if (state.modeId) params.set("m", state.modeId);
  if (state.selection) {
    if ("lat" in state.selection) {
      params.set("sel", "place");
      params.set("lat", state.selection.lat.toFixed(4));
      params.set("lng", state.selection.lng.toFixed(4));
    } else {
      params.set("sel", `${state.selection.kind}:${state.selection.id}`);
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function parseDeepLink(search: string): DeepLinkState {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const out: DeepLinkState = {};
  const m = params.get("m");
  if (m) out.modeId = m;
  const sel = params.get("sel");
  if (sel === "place") {
    const lat = parseFloat(params.get("lat") ?? "");
    const lng = parseFloat(params.get("lng") ?? "");
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      out.selection = { kind: "place", lat, lng };
    }
  } else if (sel) {
    const idx = sel.indexOf(":");
    if (idx > 0) {
      out.selection = { kind: sel.slice(0, idx), id: sel.slice(idx + 1) };
    }
  }
  return out;
}

export function fullShareUrl(state: DeepLinkState): string {
  if (typeof window === "undefined") return encodeDeepLink(state);
  return `${window.location.origin}${window.location.pathname}${encodeDeepLink(state)}`;
}
