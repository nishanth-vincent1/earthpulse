"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Bookmark } from "@/lib/bookmarks";

export function BookmarksDrawer({
  bookmarks,
  onPick,
  onRemove,
}: {
  bookmarks: Bookmark[];
  onPick: (b: Bookmark) => void;
  onRemove: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (bookmarks.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="pointer-events-auto fixed top-72 right-6 z-30 group flex items-center gap-2 bg-black/60 backdrop-blur-md border border-rose-400/30 rounded-full pl-1 pr-3 py-1 hover:border-rose-400/60 transition-colors cursor-pointer"
      >
        <span className="w-7 h-7 rounded-full bg-rose-400/20 flex items-center justify-center text-rose-300">
          ♥
        </span>
        <div className="text-left">
          <div className="text-[9px] uppercase tracking-[0.2em] text-rose-300/70 leading-none">
            Saved
          </div>
          <div className="text-[11px] text-white/80 leading-tight">
            {bookmarks.length}{" "}
            {bookmarks.length === 1 ? "bookmark" : "bookmarks"}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 cursor-pointer"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="cursor-default max-w-2xl w-full max-h-[85vh] flex flex-col bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden"
            >
              <div className="px-6 pt-6 pb-3 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-rose-300/60">
                    Your bookmarks
                  </div>
                  <h2 className="text-2xl font-light text-white mt-1">
                    Saved on this device
                  </h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/40 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
                <ul className="space-y-2">
                  {bookmarks.map((b) => (
                    <li
                      key={b.key}
                      className="px-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] flex items-center gap-3 group"
                    >
                      <span className="text-2xl shrink-0 w-8 text-center">
                        {b.emoji ?? "📍"}
                      </span>
                      <button
                        onClick={() => {
                          onPick(b);
                          setOpen(false);
                        }}
                        className="flex-1 text-left cursor-pointer min-w-0"
                      >
                        <div className="text-sm text-white truncate">
                          {b.title}
                        </div>
                        {b.subtitle && (
                          <div className="text-[11px] text-white/50 truncate">
                            {b.subtitle}
                          </div>
                        )}
                        <div className="text-[10px] text-white/30 mt-0.5">
                          {b.lat.toFixed(2)}°, {b.lng.toFixed(2)}° · saved{" "}
                          {timeAgo(b.savedAt)}
                        </div>
                      </button>
                      <button
                        onClick={() => onRemove(b.key)}
                        aria-label="Remove bookmark"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-rose-300 cursor-pointer text-sm shrink-0"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
