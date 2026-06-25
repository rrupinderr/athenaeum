"use client";

import { useEffect, useState } from "react";
import type { SubtitleRow } from "@/types/library";

export function SubtitleModal({
  title,
  videoPath,
  hasLocal,
  onClose,
  onDownloaded,
}: {
  title: string;
  videoPath: string;
  hasLocal: boolean;
  onClose: () => void;
  onDownloaded: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SubtitleRow[]>([]);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/subtitles/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: videoPath }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search failed");
        if (!cancelled) setRows(data.results || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [videoPath]);

  async function download(row: SubtitleRow) {
    setDownloading(row.fileId);
    try {
      const res = await fetch("/api/subtitles/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: videoPath, fileId: row.fileId, language: row.language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Download failed");
      onDownloaded();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[var(--border)] flex justify-between items-start gap-4">
          <div>
            <h2 className="font-semibold">Subtitles — {title}</h2>
            <p className="text-xs text-[var(--muted)] mt-1">
              {hasLocal ? "Local subtitles found" : "No local .srt yet"} · OpenSubtitles search
            </p>
          </div>
          <button type="button" className="text-[var(--muted)]" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-sm text-[var(--muted)]">Searching…</p>}
          {error && (
            <p className="text-sm text-red-300 bg-red-950/40 border border-red-900 rounded-lg p-3">
              {error}
              {error.toLowerCase().includes("block") && (
                <span className="block mt-2 text-xs">Try a VPN if your ISP blocks OpenSubtitles.</span>
              )}
            </p>
          )}
          {!loading && !error && rows.length === 0 && (
            <p className="text-sm text-[var(--muted)]">No subtitles found.</p>
          )}
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.fileId}
                className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)]/60"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{row.release}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {row.language} · {row.downloads} downloads
                    {row.flags ? ` · ${row.flags}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={downloading === row.fileId}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-black text-xs font-bold disabled:opacity-50"
                  onClick={() => download(row)}
                >
                  {downloading === row.fileId ? "…" : "Get"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
