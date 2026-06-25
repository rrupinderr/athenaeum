"use client";

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
          ? "bg-[var(--surface)] border-[rgba(95,214,138,0.35)]"
          : "bg-[rgba(20,20,28,0.65)] border-dashed border-[rgba(106,122,142,0.55)] opacity-90 hover:opacity-100 hover:border-[var(--accent2)]"
      }`}
      onClick={handleClick}
      onContextMenu={openTmdb}
    >
      <span
        className={`absolute top-2 left-2 z-10 text-[0.58rem] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md border bg-[rgba(8,8,12,0.85)] ${
          item.in_library
            ? "text-[var(--owned)] border-[rgba(95,214,138,0.4)]"
            : "text-[var(--missing)] border-[rgba(106,122,142,0.45)]"
        }`}
      >
        {item.in_library ? "In library" : "Not in library"}
      </span>

      <div
        className={`aspect-[2/3] bg-gradient-to-br from-[var(--surface2)] to-[#242433] flex items-center justify-center overflow-hidden ${
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
