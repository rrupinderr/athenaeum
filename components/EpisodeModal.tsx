"use client";

import type { Episode } from "@/types/library";
import { playPath, useLibrary } from "./LibraryProvider";

export function EpisodeModal({
  title,
  episodes,
  onClose,
}: {
  title: string;
  episodes: Episode[];
  onClose: () => void;
}) {
  const { toast } = useLibrary();

  async function play(ep: Episode) {
    const r = await playPath(ep.path);
    if (r.ok) {
      toast(`Playing ${ep.label}`);
      onClose();
    } else toast(r.error || "Playback failed", "err");
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[var(--border)] flex justify-between items-center">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" className="text-[var(--muted)] hover:text-[var(--text)]" onClick={onClose}>
            ✕
          </button>
        </div>
        <ul className="overflow-y-auto max-h-[60vh]">
          {episodes.map((ep) => (
            <li key={ep.path}>
              <button
                type="button"
                className="w-full text-left px-5 py-3 hover:bg-[var(--surface2)] text-sm border-b border-[var(--border)]/50"
                onClick={() => play(ep)}
              >
                {ep.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
