"use client";

import { WebSearchIcon } from "./icons/WebSearchIcon";
import type { FilmographyItem } from "@/types/library";
import { playPath, useLibrary } from "./LibraryProvider";

export function MissingFilmCard({ item }: { item: FilmographyItem }) {
  const { toast } = useLibrary();

  async function handleClick() {
    if (item.in_library && item.video_path) {
      const r = await playPath(item.video_path);
      if (r.ok) toast("Opening in VLC…");
      else toast(r.error || "Playback failed", "err");
      return;
    }
    window.open(item.search_url, "_blank", "noopener,noreferrer");
  }

  function openTmdb(e: React.MouseEvent) {
    e.stopPropagation();
    window.open(item.tmdb_url, "_blank", "noopener,noreferrer");
  }

  return (
    <article
      className={`card-hover relative rounded-xl overflow-hidden border cursor-pointer ${
        item.in_library
          ? "bg-[var(--surface)] border-[rgba(61,158,106,0.35)]"
          : "bg-[rgba(13,21,38,0.65)] border-dashed border-[var(--missing)] opacity-90 hover:opacity-100 hover:border-[var(--accent2-bright)]"
      }`}
      onClick={handleClick}
      onContextMenu={openTmdb}
      title={item.in_library ? "Play in VLC" : "Search the web"}
    >
      <span
        className={`absolute top-2 left-2 z-10 badge-pill ${
          item.in_library ? "badge-watched" : "badge-cc-none"
        }`}
      >
        {item.in_library ? "In library" : "Web search"}
      </span>
      {!item.in_library && (
        <span className="absolute top-2 right-2 z-10 text-[var(--accent2-bright)]">
          <WebSearchIcon size={16} />
        </span>
      )}

      <div
        className={`aspect-[2/3] bg-gradient-to-br from-[var(--surface2)] to-[var(--surface3)] flex items-center justify-center overflow-hidden ${
          !item.in_library ? "grayscale-[0.85] brightness-[0.72]" : ""
        }`}
      >
        {item.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.poster} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="text-3xl opacity-30">🎬</span>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">{item.title}</h3>
        <p className="text-xs text-[var(--muted)] mt-1">{item.year || "—"}</p>
      </div>
    </article>
  );
}
