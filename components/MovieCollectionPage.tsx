"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { MediaTitle } from "@/types/library";
import { findMovieById, getMovieParts } from "@/lib/collection";
import { PartRow } from "./PartRow";
import { deleteMedia, explorePath, useLibrary } from "./LibraryProvider";

export function MovieCollectionPage({ movieId }: { movieId: string }) {
  const router = useRouter();
  const { library, loading, refreshLibrary, toast } = useLibrary();
  const [movie, setMovie] = useState<MediaTitle | null>(null);

  useEffect(() => {
    if (library) setMovie(findMovieById(library, movieId));
  }, [library, movieId]);

  if (loading && !library) {
    return <div className="min-h-screen flex items-center justify-center text-[var(--muted)]">Loading…</div>;
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-300">Movie not found</p>
        <Link href="/genres" className="text-[var(--accent2-bright)] text-sm">
          ← Back to library
        </Link>
      </div>
    );
  }

  const parts = getMovieParts(movie);

  async function handleDelete() {
    if (!movie) return;
    const label = movie.match_title || movie.title;
    if (!window.confirm(`Delete "${label}" and its folder from disk? This cannot be undone.`)) return;
    const partPaths = movie.parts?.map((p) => p.path) || [];
    const r = await deleteMedia(movie.id, partPaths);
    if (!r.ok) {
      toast(r.error || "Delete failed", "err");
      return;
    }
    toast("Deleted from library");
    await refreshLibrary();
    router.push("/genres");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="px-6 py-4 flex items-center justify-between gap-2 border-b border-[var(--border)]/60">
          <Link href="/genres" className="text-sm text-[var(--accent2-bright)] hover:text-[var(--accent)]">
            ← Library
          </Link>
          <div className="flex items-center gap-2">
            {movie.canonical_path && (
              <button
                type="button"
                onClick={() => explorePath(movie.canonical_path)}
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
              Delete folder
            </button>
          </div>
        </div>
        <div className="px-6 py-6 flex flex-col sm:flex-row gap-6">
          <div className="w-36 shrink-0 rounded-xl overflow-hidden border border-[var(--border)] aspect-[2/3] bg-[var(--surface2)]">
            {movie.poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={movie.poster} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🎬</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{movie.title}</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              {movie.year || "—"}
              {movie.directors?.length ? ` · ${movie.directors.join(", ")}` : ""}
              {movie.vote_average ? ` · ★ ${movie.vote_average.toFixed(1)}` : ""}
            </p>
            {movie.overview && (
              <p className="text-sm text-[var(--muted)] mt-3 line-clamp-4 leading-relaxed">{movie.overview}</p>
            )}
            <p className="text-xs text-[var(--muted)] mt-4">{parts.length} films in this collection</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-6">
        <ul className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          {parts.map((part) => (
            <PartRow key={part.path} part={part} />
          ))}
        </ul>
      </main>
    </div>
  );
}
