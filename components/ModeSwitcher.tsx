"use client";

import { motion } from "framer-motion";
import { MODES, type Mode } from "@/lib/modes";

export function ModeSwitcher({
  current,
  onChange,
}: {
  current: string;
  onChange: (m: Mode) => void;
}) {
  return (
    <div className="pointer-events-auto fixed top-6 left-1/2 -translate-x-1/2 z-30 max-w-[calc(100vw-24px)]">
      <div className="flex gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-1 overflow-x-auto scrollbar-thin scroll-smooth">
        {MODES.map((m) => {
          const active = m.id === current;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m)}
              className={`relative shrink-0 px-3 py-1.5 text-xs rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
                active ? "text-black" : "text-white/60 hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="modepill"
                  transition={{ type: "spring", damping: 22, stiffness: 280 }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: m.accent }}
                />
              )}
              <span className="relative">{m.icon}</span>
              <span className="relative tracking-wider uppercase font-medium">
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
