"use client";

import { motion } from "framer-motion";
import type { NewsGroup } from "@/lib/types";
import { formatGdeltDate } from "./_shared";

export function NewsView({ group }: { group: NewsGroup }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="text-xs uppercase tracking-[0.25em] text-orange-300">
        📰 Headlines · {group.country}
      </div>
      <h2 className="text-2xl font-light text-white mt-1">
        {group.count} {group.count === 1 ? "story" : "stories"} trending
      </h2>
      <div className="text-white/50 text-sm mt-1">
        from {group.country} via the GDELT global news graph
      </div>

      <ul className="mt-6 space-y-3">
        {group.topArticles.map((a) => (
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
                />
              )}
              <div className="p-3">
                <div className="text-sm text-white group-hover:underline leading-snug line-clamp-3">
                  {a.title}
                </div>
                <div className="text-[10px] text-white/40 mt-1.5 flex justify-between">
                  <span>{a.domain}</span>
                  <span>{formatGdeltDate(a.seendate)}</span>
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-6 text-[10px] text-white/30 leading-relaxed">
        GDELT 2.0 · global news graph monitoring 100+ languages, 15-min cadence.
      </div>
    </motion.div>
  );
}
