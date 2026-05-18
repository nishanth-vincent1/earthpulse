"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type TourStep = {
  id: string;
  lat: number;
  lng: number;
  altitude: number;
  title: string;
  body: string;
  duration: number;
  enableLayers?: string[];
};

export function Tour({
  steps,
  index,
  onAdvance,
  onDone,
  onFly,
  onEnableLayers,
}: {
  steps: TourStep[];
  index: number;
  onAdvance: () => void;
  onDone: () => void;
  onFly: (lat: number, lng: number, altitude: number) => void;
  onEnableLayers: (keys: string[]) => void;
}) {
  const step = steps[index];

  useEffect(() => {
    if (!step) return;
    if (step.enableLayers && step.enableLayers.length > 0) {
      onEnableLayers(step.enableLayers);
    }
    onFly(step.lat, step.lng, step.altitude);
    const t = setTimeout(() => {
      if (index >= steps.length - 1) onDone();
      else onAdvance();
    }, step.duration * 1000);
    return () => clearTimeout(t);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute top-6 right-6 pointer-events-auto">
        <button
          onClick={onDone}
          className="text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-white border border-white/20 hover:border-white/50 rounded-full px-3 py-1.5 cursor-pointer bg-black/70 backdrop-blur-md transition-colors"
        >
          Skip tour ✕
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto bg-black/80 backdrop-blur-md border border-white/15 rounded-2xl px-7 py-5 max-w-lg text-center shadow-2xl"
        >
          <div className="text-[10px] uppercase tracking-[0.3em] text-amber-200/80 mb-2">
            {step.title}
          </div>
          <p className="text-white/90 text-base font-light leading-relaxed">
            {step.body}
          </p>
          <div className="mt-4 flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === index
                    ? "w-6 bg-amber-300"
                    : i < index
                      ? "w-1.5 bg-amber-300/40"
                      : "w-1.5 bg-white/15"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
