import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { STORIES, getStory } from "@/lib/stories";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return STORIES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) return { title: "Story not found — Earthpulse" };
  const title = `${story.title} — Earthpulse`;
  const description = story.lead;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: story.heroImage, width: 1280, height: 720 }],
      type: "article",
      publishedTime: story.date,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [story.heroImage],
    },
  };
}

export default async function StoryPage({ params }: Params) {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) notFound();

  const liveUrl = buildLiveUrl(story);
  const formattedDate = new Date(story.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-black text-white overflow-y-auto">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={story.heroImage}
        alt={story.title}
        className="w-full h-[42vh] object-cover opacity-80"
      />
      <div className="max-w-3xl mx-auto px-6 -mt-32 relative pb-20">
        <div className="rounded-2xl bg-black/85 backdrop-blur-xl border border-white/10 p-8 md:p-12 shadow-2xl">
          <Link
            href="/"
            className="text-[10px] uppercase tracking-[0.25em] text-white/40 hover:text-white/70 transition-colors"
          >
            ← Earthpulse
          </Link>
          <div className="mt-4 text-[10px] uppercase tracking-[0.25em] text-amber-200/70">
            Field journal
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-white mt-2 leading-tight">
            {story.title}
          </h1>
          <div className="text-white/55 text-base mt-2 italic">
            {story.subtitle}
          </div>
          <div className="text-white/40 text-sm mt-1">
            {formattedDate} · {story.region}
          </div>

          <p className="text-amber-50/90 text-lg leading-relaxed mt-8 font-light italic border-l-2 border-amber-200/40 pl-5">
            {story.lead}
          </p>

          <div className="mt-8 space-y-5 text-white/85 text-base leading-relaxed">
            {story.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={liveUrl}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-200/15 border border-amber-200/40 text-amber-100 hover:bg-amber-200/25 transition-colors text-sm tracking-wide"
            >
              Open on the interactive globe →
            </Link>
            <a
              href={story.wikipediaUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/15 text-white/75 hover:bg-white/10 transition-colors text-sm tracking-wide"
            >
              Read full account on Wikipedia →
            </a>
          </div>

          <div className="text-[10px] text-white/30 mt-3">
            Photo: {story.heroCredit}
          </div>

          <div className="mt-10 pt-6 border-t border-white/10">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">
              More stories
            </div>
            <ul className="space-y-3">
              {STORIES.filter((s) => s.slug !== story.slug)
                .slice(0, 4)
                .map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/story/${s.slug}`}
                      className="block group hover:bg-white/[0.03] -mx-2 px-2 py-2 rounded transition-colors"
                    >
                      <div className="text-sm text-white group-hover:underline">
                        {s.title}
                      </div>
                      <div className="text-[11px] text-white/45 mt-0.5">
                        {s.region} · {new Date(s.date).getFullYear()}
                      </div>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

function buildLiveUrl(s: {
  modeId: string;
  year?: number;
  lat: number;
  lng: number;
  altitude: number;
}): string {
  const params = new URLSearchParams();
  params.set("m", s.modeId);
  if (s.year != null) params.set("y", String(s.year));
  params.set("lat", s.lat.toFixed(3));
  params.set("lng", s.lng.toFixed(3));
  params.set("alt", s.altitude.toFixed(2));
  return `/?${params.toString()}`;
}
