"use client";

import { useEffect, useState } from "react";
import type { MediaTitle } from "@/types/library";
import { isMultiPartMovie } from "@/lib/collection";
import { playPath, useLibrary } from "./LibraryProvider";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function MovieRouletteModal({
  open,
  onClose,
  pool,
  scopeLabel,
}: {
  open: boolean;
  onClose: () => void;
  pool: MediaTitle[];
  scopeLabel: string;
}) {
  const { toggleWatched, toast } = useLibrary();
  const [spinning, setSpinning] = useState(false);
  const [picks, setPicks] = useState<MediaTitle[]>([]);
  const [spinPoster, setSpinPoster] = useState<string | null>(null);
  const [spinTitle, setSpinTitle] = useState("");

  useEffect(() => {
    if (!open) {
      setPicks([]);
      setSpinning(false);
      setSpinPoster(null);
      setSpinTitle("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || pool.length === 0) return;

    let cancelled = false;

    async function runSpin() {
      setSpinning(true);
      setPicks([]);
      const count = Math.min(5, pool.length);
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);
      const frames = 28;

      for (let i = 0; i < frames; i++) {
        if (cancelled) return;
        const item =
          i >= frames - 5
            ? selected[(i - (frames - 5)) % selected.length]
            : pool[Math.floor(Math.random() * pool.length)];
        setSpinPoster(item.poster || null);
        setSpinTitle(item.title + (item.year ? ` (${item.year})` : ""));
        await sleep(55 + i * 6);
      }

      if (!cancelled) {
        setPicks(selected);
        setSpinning(false);
      }
    }

    runSpin();
    return () => {
      cancelled = true;
    };
  }, [open, pool]);

  if (!open) return null;

  async function playMovie(movie: MediaTitle) {
    if (isMultiPartMovie(movie)) {
      window.location.href = `/movies/${encodeURIComponent(movie.id)}`;
      return;
    }
    const path = movie.video_path || movie.parts?.[0]?.path;
    if (!path) {
      toast("No video file found", "err");
      return;
    }
    const r = await playPath(path);
    if (r.ok) {
      await toggleWatched(movie.id);
      toast("Opening in VLC…");
    } else {
      toast(r.error || "Playback failed", "err");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--accent)]">Movie Roulette</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">{scopeLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--text)] text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-6 flex flex-col items-center gap-3 min-h-[220px]">
          <div className="w-28 aspect-[2/3] rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface2)] flex items-center justify-center">
            {spinPoster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={spinPoster} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl opacity-30">🎬</span>
            )}
          </div>
          <p className="text-sm font-medium text-center line-clamp-2">{spinTitle || "Spinning…"}</p>
        </div>

        {!spinning && picks.length > 0 && (
          <div className="px-5 pb-5">
            <h3 className="text-sm font-semibold text-[var(--accent)] mb-3">Top {picks.length}</h3>
            <ul className="space-y-2">
              {picks.map((movie, i) => (
                <li key={movie.id}>
                  <button
                    type="button"
                    onClick={() => playMovie(movie)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface2)] text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-[var(--accent)] w-6 shrink-0">#{i + 1}</span>
                    <div className="w-11 h-16 shrink-0 rounded overflow-hidden bg-[var(--surface2)]">
                      {movie.poster ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={movie.poster} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg opacity-30">🎬</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{movie.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {movie.year || "—"} · {movie.primary_genre} · click to play
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
