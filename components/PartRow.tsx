"use client";

import type { Episode } from "@/types/library";
import { playPath, useLibrary } from "./LibraryProvider";

export function PartRow({ part }: { part: Episode }) {
  const { toast } = useLibrary();
  const filename = part.path.split(/[/\\]/).pop() || part.path;

  async function play() {
    const r = await playPath(part.path);
    if (r.ok) toast(`Playing ${part.label}`);
    else toast(r.error || "Playback failed", "err");
  }

  return (
    <li className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)]/50 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{part.label}</p>
        <p className="text-xs text-[var(--muted)] truncate">{filename}</p>
      </div>
      <button
        type="button"
        onClick={play}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-dim)] transition-colors shrink-0"
      >
        Play
      </button>
    </li>
  );
}
