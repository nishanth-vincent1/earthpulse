"use client";

import { useEffect, useState } from "react";

export { Stat } from "./Stat";

export function dayLength(latDeg: number, declDeg: number): number {
  const lat = (latDeg * Math.PI) / 180;
  const decl = (declDeg * Math.PI) / 180;
  const cosH = -Math.tan(lat) * Math.tan(decl);
  if (cosH >= 1) return 0;
  if (cosH <= -1) return 24;
  const h = Math.acos(cosH);
  return (2 * h * 180) / Math.PI / 15;
}

export function formatObs(d: string, obscured: boolean): string {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  if (obscured) {
    return dt.toLocaleString("default", { month: "long", year: "numeric" });
  }
  return dt.toLocaleDateString();
}

export function formatGdeltDate(s: string): string {
  if (!s || s.length < 8) return s;
  const clean = s.replace(/[TZ]/g, "");
  const yr = clean.slice(0, 4);
  const mo = clean.slice(4, 6);
  const dy = clean.slice(6, 8);
  const hr = clean.slice(8, 10) || "";
  const mn = clean.slice(10, 12) || "";
  return `${yr}-${mo}-${dy}${hr ? ` ${hr}:${mn}` : ""} UTC`;
}

export function stormCategoryColor(peakWindKt: number): string {
  if (peakWindKt >= 137) return "#9c27e3";
  if (peakWindKt >= 113) return "#ff3030";
  if (peakWindKt >= 96) return "#ff7a30";
  if (peakWindKt >= 83) return "#ffba30";
  if (peakWindKt >= 64) return "#5fb7ff";
  return "#9bd2ff";
}

export type IucnStatus = {
  code: string;
  label: string;
  color: string;
  scientific: string;
  source: string;
};

export function useIucnStatus(scientificName: string): IucnStatus | null {
  const [status, setStatus] = useState<IucnStatus | null>(null);
  useEffect(() => {
    if (!scientificName) return;
    let alive = true;
    fetch(`/api/iucn?name=${encodeURIComponent(scientificName)}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setStatus(d.status ?? null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [scientificName]);
  return status;
}

export function IucnBadge({ status }: { status: IucnStatus | null }) {
  if (!status) return null;
  return (
    <div
      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border"
      style={{
        borderColor: status.color + "55",
        background: status.color + "11",
      }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: status.color }}
      />
      <span
        className="text-[10px] tracking-widest uppercase"
        style={{ color: status.color }}
      >
        IUCN · {status.code} · {status.label}
      </span>
    </div>
  );
}
