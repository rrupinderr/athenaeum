"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { MediaTitle } from "@/types/library";
import { findSeriesById, seriesProgress } from "@/lib/series";
import { EpisodeRow } from "./EpisodeRow";
import { deleteMedia, explorePath, useLibrary } from "./LibraryProvider";

export function SeriesDetailPage({ seriesId }: { seriesId: string }) {
  const router = useRouter();
  const { library, loading, watched, favorites, toggleWatched, refreshLibrary, toast } = useLibrary();
  const [series, setSeries] = useState<MediaTitle | null>(null);

  useEffect(() => {
    if (library) setSeries(findSeriesById(library, seriesId));
  }, [library, seriesId]);

  if (loading && !library) {
    return <div className="min-h-screen flex items-center justify-center text-[var(--muted)]">Loading…</div>;
  }

  if (!series) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-300">Series not found</p>
        <Link href="/directors" className="text-[var(--accent2-bright)] text-sm">
          ← Back to library
        </Link>
      </div>
    );
  }

  const episodes = [...(series.episodes || [])].sort((a, b) => a.label.localeCompare(b.label));
  const progress = seriesProgress(series, watched, favorites);
  const pct = progress.total > 0 ? Math.round((progress.watchedCount / progress.total) * 100) : 0;

  async function markAllWatched() {
    for (const ep of episodes) {
      const eid = `${series!.id}::${ep.path}`;
      if (!watched.has(eid)) await toggleWatched(eid);
    }
  }

  async function handleDelete() {
    if (!series) return;
    const label = series.match_title || series.title;
    if (!window.confirm(`Delete "${label}" and its entire TV folder from disk? This cannot be undone.`)) return;
    const episodePaths = series.episodes?.map((e) => e.path) || [];
    const r = await deleteMedia(series.id, episodePaths);
    if (!r.ok) {
      toast(r.error || "Delete failed", "err");
      return;
    }
    toast("Deleted from library");
    await refreshLibrary();
    router.push("/directors");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="px-6 py-4 flex items-center justify-between gap-2 border-b border-[var(--border)]/60">
          <Link href="/directors" className="text-sm text-[var(--accent2-bright)] hover:text-[var(--accent)]">
            ← Library
          </Link>
          <div className="flex items-center gap-2">
            {series.canonical_path && (
              <button
                type="button"
                onClick={() => explorePath(series.canonical_path)}
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
              >
                Open folder
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-900/50 text-red-300 hover:bg-red-950/40"
            >
              Delete series
            </button>
          </div>
        </div>
        <div className="px-6 py-6 flex flex-col sm:flex-row gap-6">
          <div className="w-36 shrink-0 rounded-xl overflow-hidden border border-[var(--border)] aspect-[2/3] bg-[var(--surface2)]">
            {series.poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={series.poster} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">📺</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{series.title}</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              {series.year || "—"}
              {series.directors?.length ? ` · ${series.directors.join(", ")}` : ""}
              {series.vote_average ? ` · ★ ${series.vote_average.toFixed(1)}` : ""}
            </p>
            {series.overview && (
              <p className="text-sm text-[var(--muted)] mt-3 line-clamp-4 leading-relaxed">{series.overview}</p>
            )}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-1.5">
                <span>
                  {progress.watchedCount} / {progress.total} watched
                </span>
                {progress.total > 0 && progress.watchedCount < progress.total && (
                  <button
                    type="button"
                    onClick={markAllWatched}
                    className="text-[var(--accent2-bright)] hover:text-[var(--accent)]"
                  >
                    Mark all watched
                  </button>
                )}
              </div>
              <div className="h-1.5 rounded-full bg-[var(--surface3)] overflow-hidden">
                <div
                  className="h-full bg-[var(--owned)] transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="custom-scrollbar flex-1 overflow-y-auto">
        <ul>
          {episodes.map((ep) => (
            <EpisodeRow key={ep.path} seriesId={series.id} episode={ep} />
          ))}
        </ul>
        {episodes.length === 0 && (
          <p className="p-6 text-sm text-[var(--muted)]">No episodes found for this series.</p>
        )}
      </main>
    </div>
  );
}
