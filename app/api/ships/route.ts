import { NextResponse } from "next/server";
import WebSocket from "ws";

export const runtime = "nodejs";

type Ship = {
  mmsi: number;
  name: string;
  lat: number;
  lng: number;
  cog: number;
  sog: number;
  heading: number;
  shipType: number;
  time: string;
};

let cache: { ships: Ship[]; total: number; ts: number } | null = null;
const TTL = 30_000;

function listenForSnapshot(key: string, durationMs: number): Promise<Ship[]> {
  return new Promise((resolve) => {
    const ships = new Map<number, Ship>();
    let settled = false;
    let timer: NodeJS.Timeout | null = null;

    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

    const finish = () => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {}
      if (timer) clearTimeout(timer);
      resolve(Array.from(ships.values()));
    };

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          APIKey: key,
          BoundingBoxes: [
            [
              [-90, -180],
              [90, 180],
            ],
          ],
          FilterMessageTypes: ["PositionReport"],
        }),
      );
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.MessageType !== "PositionReport") return;
        const r = msg.Message?.PositionReport;
        const meta = msg.MetaData ?? {};
        if (!r || typeof r.Latitude !== "number" || typeof r.Longitude !== "number")
          return;
        ships.set(r.UserID, {
          mmsi: r.UserID,
          name: ((meta.ShipName ?? "") as string).trim() || `MMSI ${r.UserID}`,
          lat: r.Latitude,
          lng: r.Longitude,
          cog: r.Cog ?? 0,
          sog: r.Sog ?? 0,
          heading: r.TrueHeading ?? 511,
          shipType: r.NavigationalStatus ?? 0,
          time: meta.time_utc ?? "",
        });
      } catch {}
    });

    ws.on("close", finish);
    ws.on("error", finish);

    timer = setTimeout(finish, durationMs);
  });
}

export async function GET() {
  const key = process.env.AIS_STREAM_KEY;
  if (!key) {
    return NextResponse.json({ ships: [], needsKey: true });
  }

  const now = Date.now();
  if (cache && now - cache.ts < TTL) {
    return NextResponse.json({ ships: cache.ships, total: cache.total });
  }

  try {
    const all = await listenForSnapshot(key, 7000);
    const max = 300;
    const sampled =
      all.length > max
        ? all.filter((_, i) => i % Math.ceil(all.length / max) === 0)
        : all;

    cache = { ships: sampled, total: all.length, ts: now };
    return NextResponse.json({ ships: sampled, total: all.length });
  } catch {
    return NextResponse.json({ ships: [], total: 0 });
  }
}
