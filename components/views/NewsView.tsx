"use client";

import { motion } from "framer-motion";
import type { NewsGroup } from "@/lib/types";
import { formatGdeltDate } from "./_shared";

const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
  crisis: { label: "Crisis", color: "#ff5050", emoji: "🚨" },
  conflict: { label: "Conflict", color: "#ff7a30", emoji: "⚔️" },
  protest: { label: "Protest", color: "#ffb14d", emoji: "✊" },
  health: { label: "Health", color: "#d68fff", emoji: "🏥" },
  politics: { label: "Politics", color: "#5fb7ff", emoji: "🏛️" },
  economy: { label: "Economy", color: "#7af07a", emoji: "📈" },
  tech: { label: "Tech", color: "#7be4ff", emoji: "💻" },
  environment: { label: "Environment", color: "#a8d68f", emoji: "🌱" },
  sports: { label: "Sports", color: "#ffe16a", emoji: "🏆" },
  other: { label: "General", color: "#cdd3dc", emoji: "📰" },
};

export function NewsView({ group }: { group: NewsGroup }) {
  const cat = CATEGORY_META[group.primaryCategory ?? "other"] ?? CATEGORY_META.other;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: cat.color }}
      >
        {cat.emoji} Headlines · {group.country}
      </div>
      <h2 className="text-2xl font-light text-white mt-1">
        {group.count} {group.count === 1 ? "story" : "stories"} trending
      </h2>
      <div className="text-white/50 text-sm mt-1">
        primarily {cat.label.toLowerCase()} · {group.country} · via GDELT
      </div>

      <ul className="mt-6 space-y-3">
        {group.topArticles.map((a) => {
          const articleCat =
            CATEGORY_META[a.category ?? "other"] ?? CATEGORY_META.other;
          return (
            <li
              key={a.url}
              className="border border-white/10 rounded-lg overflow-hidden bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noopener"
                className="block group"
              >
                {a.socialimage && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={a.socialimage}
                    alt=""
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="p-3">
                  <div className="flex gap-1.5 flex-wrap mb-1.5">
                    <span
                      className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color: articleCat.color,
                        background: `${articleCat.color}1a`,
                      }}
                    >
                      {articleCat.emoji} {articleCat.label}
                    </span>
                    {typeof a.tone === "number" && Math.abs(a.tone) >= 3 && (
                      <span
                        className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          color: a.tone < 0 ? "#ff8888" : "#88ddaa",
                          background:
                            a.tone < 0
                              ? "rgba(255,80,80,0.12)"
                              : "rgba(120,255,160,0.12)",
                        }}
                      >
                        {a.tone < 0 ? "↓" : "↑"} tone {a.tone.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-white group-hover:underline leading-snug line-clamp-3">
                    {a.title}
                  </div>
                  {a.entities && a.entities.length > 0 && (
                    <div className="text-[10px] text-white/40 mt-1.5 line-clamp-1">
                      <span className="text-white/30">Featured:</span>{" "}
                      {a.entities.slice(0, 3).join(" · ")}
                    </div>
                  )}
                  <div className="text-[10px] text-white/40 mt-1.5 flex justify-between">
                    <span>{a.domain}</span>
                    <span>{formatGdeltDate(a.seendate)}</span>
                  </div>
                </div>
              </a>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 text-[10px] text-white/30 leading-relaxed">
        GDELT 2.0 GKG · global news graph monitoring 100+ languages, 15-min
        cadence. Categories inferred from V2Themes.
      </div>
    </motion.div>
  );
}
