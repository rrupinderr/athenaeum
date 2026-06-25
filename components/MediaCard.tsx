"use client";

import { useState } from "react";
import type { MediaTitle } from "@/types/library";
import { explorePath, playPath, useLibrary } from "./LibraryProvider";
import { EpisodeModal } from "./EpisodeModal";
import { SubtitleModal } from "./SubtitleModal";

export function MediaCard({ title }: { title: MediaTitle }) {
  const { watched, favorites, toggleWatched, toggleFavorite, toast } = useLibrary();
  const [episodeOpen, setEpisodeOpen] = useState(false);
  const [subtitleOpen, setSubtitleOpen] = useState(false);

  const isWatched = watched.has(title.id);
  const isFav = favorites.has(title.id);
  const hasSubs = title.subtitles?.has_local;

  async function handlePlay() {
    if (title.type === "tv" && title.episodes && title.episodes.length > 1) {
      setEpisodeOpen(true);
      return;
    }
    const path = title.video_path || title.episodes?.[0]?.path;
    if (!path) {
      toast("No video file found", "err");
      return;
    }
    const r = await playPath(path);
    if (r.ok) toast("Opening in VLC…");
    else toast(r.error || "Playback failed", "err");
  }

  return (
    <>
      <article
        className={`group card-hover relative bg-[var(--surface)] rounded-xl overflow-hidden border cursor-pointer ${
          isFav ? "border-[rgba(255,107,138,0.35)]" : "border-transparent hover:border-[var(--border)]"
        }`}
        onClick={handlePlay}
      >
        <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className={`w-7 h-7 rounded-lg border text-xs bg-[rgba(8,8,12,0.85)] ${
              isWatched ? "text-[var(--owned)] border-[rgba(95,214,138,0.4)]" : "text-[var(--muted)] border-white/10"
            }`}
            title="Watched"
            onClick={(e) => {
              e.stopPropagation();
              toggleWatched(title.id);
            }}
          >
            ★
          </button>
          <button
            type="button"
            className={`w-7 h-7 rounded-lg border text-xs bg-[rgba(8,8,12,0.85)] ${
              isFav ? "text-[var(--fav)] border-[rgba(255,107,138,0.4)]" : "text-[var(--muted)] border-white/10"
            }`}
            title="Favorite"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(title.id);
            }}
          >
            ♥
          </button>
          <button
            type="button"
            className="w-7 h-7 rounded-lg border text-xs bg-[rgba(8,8,12,0.85)] text-[var(--muted)] border-white/10"
            title="Folder"
            onClick={(e) => {
              e.stopPropagation();
              explorePath(title.canonical_path);
            }}
          >
            📁
          </button>
        </div>

        <button
          type="button"
          className={`absolute top-2 right-2 z-10 text-[0.65rem] font-bold px-1.5 py-0.5 rounded-md border ${
            hasSubs
              ? "text-[var(--owned)] border-[rgba(95,214,138,0.4)] bg-[rgba(8,8,12,0.85)]"
              : "text-[var(--muted)] border-white/10 bg-[rgba(8,8,12,0.85)]"
          }`}
          title="Subtitles"
          onClick={(e) => {
            e.stopPropagation();
            setSubtitleOpen(true);
          }}
        >
          CC {hasSubs ? "✓" : "—"}
        </button>

        <div className="aspect-[2/3] bg-gradient-to-br from-[var(--surface2)] to-[#242433] flex items-center justify-center overflow-hidden">
          {title.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={title.poster} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-3xl opacity-30 text-[var(--muted)]">🎬</span>
          )}
        </div>

        <div className="p-3">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2">{title.title}</h3>
          <p className="text-xs text-[var(--muted)] mt-1">
            {title.year || "—"}
            {title.type === "tv" ? " · TV" : ""}
            {title.vote_average ? ` · ★ ${title.vote_average.toFixed(1)}` : ""}
          </p>
        </div>
      </article>

      {episodeOpen && title.episodes && (
        <EpisodeModal
          title={title.title}
          episodes={title.episodes}
          onClose={() => setEpisodeOpen(false)}
        />
      )}

      {subtitleOpen && (
        <SubtitleModal
          title={title.title}
          videoPath={title.video_path || title.episodes?.[0]?.path || title.canonical_path}
          hasLocal={!!hasSubs}
          onClose={() => setSubtitleOpen(false)}
          onDownloaded={() => toast("Subtitle saved")}
        />
      )}
    </>
  );
}
