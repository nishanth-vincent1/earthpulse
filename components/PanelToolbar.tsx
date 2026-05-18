"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function PanelToolbar({
  shareUrl,
  isSaved,
  canSave,
  onToggleSave,
}: {
  shareUrl: string | null;
  isSaved: boolean;
  canSave: boolean;
  onToggleSave: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <div className="absolute top-4 right-16 z-40 flex items-center gap-2">
      {canSave && (
        <button
          onClick={onToggleSave}
          aria-label={isSaved ? "Remove bookmark" : "Save bookmark"}
          title={isSaved ? "Remove bookmark" : "Save"}
          className={`w-10 h-10 rounded-full border backdrop-blur-md cursor-pointer flex items-center justify-center text-base transition-colors ${
            isSaved
              ? "border-rose-400/60 bg-rose-400/15 text-rose-300 hover:bg-rose-400/25"
              : "border-white/20 bg-black/70 text-white/70 hover:bg-white/15 hover:border-white/40 hover:text-white"
          }`}
        >
          {isSaved ? "♥" : "♡"}
        </button>
      )}
      {shareUrl && (
        <div className="relative">
          <button
            onClick={copy}
            aria-label="Share link"
            title="Copy share link"
            className="w-10 h-10 rounded-full border border-white/20 bg-black/70 backdrop-blur-md hover:bg-white/15 hover:border-white/40 cursor-pointer flex items-center justify-center text-white/80 hover:text-white text-sm transition-colors"
          >
            🔗
          </button>
          <AnimatePresence>
            {copied && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-1 right-0 px-2 py-1 rounded bg-emerald-400/90 text-black text-[10px] uppercase tracking-widest whitespace-nowrap"
              >
                Link copied
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
