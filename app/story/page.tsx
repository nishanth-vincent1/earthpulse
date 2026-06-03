import type { Metadata } from "next";
import Link from "next/link";
import { STORIES } from "@/lib/stories";

export const metadata: Metadata = {
  title: "Stories — Earthpulse",
  description:
    "Field journals of significant Earth events — earthquakes, eruptions, hurricanes, fires, and tsunamis that shaped the planet.",
};

export default function StoriesIndexPage() {
  return (
    <main className="min-h-screen bg-black text-white overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-24">
        <Link
          href="/"
          className="text-[10px] uppercase tracking-[0.25em] text-white/40 hover:text-white/70 transition-colors"
        >
          ← Earthpulse
        </Link>
        <h1 className="text-4xl md:text-5xl font-light text-white mt-4">
          Field journals
        </h1>
        <p className="text-white/55 text-base mt-3 max-w-2xl leading-relaxed">
          Curated stories of significant Earth events — written to be read,
          then explored on the interactive globe.
        </p>

        <ul className="mt-12 space-y-8">
          {STORIES.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/story/${s.slug}`}
                className="block group rounded-xl overflow-hidden border border-white/10 hover:border-white/25 transition-colors"
              >
                <div className="flex flex-col md:flex-row">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.heroImage}
                    alt={s.title}
                    className="md:w-64 md:shrink-0 h-48 md:h-auto object-cover"
                  />
                  <div className="p-5 md:p-6 flex-1">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-amber-200/60">
                      {new Date(s.date).getFullYear()} ·{" "}
                      {new Date(s.date).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-2xl font-light text-white mt-1.5 group-hover:underline underline-offset-4">
                      {s.title}
                    </div>
                    <div className="text-white/55 text-sm italic mt-1">
                      {s.subtitle}
                    </div>
                    <div className="text-[12px] text-white/40 mt-1">
                      {s.region}
                    </div>
                    <p className="text-white/75 text-sm leading-relaxed mt-3 line-clamp-3">
                      {s.lead}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
