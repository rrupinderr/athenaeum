"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReactReader } from "react-reader";
import type { BookBookmark } from "@/types/library";

type FontSize = "sm" | "md" | "lg" | "xl";
type Theme = "dark" | "sepia" | "light";

const FONT_SIZES: Record<FontSize, string> = {
  sm: "90%",
  md: "100%",
  lg: "115%",
  xl: "130%",
};

const THEMES: Record<Theme, { bg: string; color: string }> = {
  dark: { bg: "#0d1526", color: "#e8ecf4" },
  sepia: { bg: "#f4ecd8", color: "#3d2b1f" },
  light: { bg: "#ffffff", color: "#111111" },
};

export default function EpubReaderClient({
  bookId,
  url,
  title,
}: {
  bookId: string;
  url: string;
  title: string;
}) {
  const [location, setLocation] = useState<string | number>(0);
  const [fontSize, setFontSize] = useState<FontSize>("md");
  const [theme, setTheme] = useState<Theme>("dark");
  const [showSettings, setShowSettings] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookBookmark[]>([]);
  const [percent, setPercent] = useState<number | null>(null);
  const percentRef = useRef<number | null>(null);
  const renditionRef = useRef<unknown>(null);

  useEffect(() => {
    fetch("/api/state")
      .then((r) => r.json())
      .then((s) => {
        const prog = s.book_progress?.[bookId];
        if (prog?.cfi) setLocation(prog.cfi);
        else if (prog?.page) setLocation(prog.page);
        if (prog?.percent != null) setPercent(prog.percent);
        setBookmarks(s.bookmarks?.[bookId] || []);
      })
      .catch(() => {});
  }, [bookId]);

  const saveProgress = useCallback(
    (cfi: string, pct?: number) => {
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookId,
          book_progress: { cfi, percent: pct, updated: new Date().toISOString() },
        }),
      }).catch(() => {});
    },
    [bookId]
  );

  const applyTheme = useCallback((rendition: { themes: { override: (name: string, value: string) => void } }) => {
      const t = THEMES[theme];
      rendition.themes.override("color", t.color);
      rendition.themes.override("background", t.bg);
      rendition.themes.override("font-size", FONT_SIZES[fontSize]);
      rendition.themes.override("line-height", "1.6");
    },
    [theme, fontSize]
  );

  const getRendition = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rendition: any) => {
      renditionRef.current = rendition;
      applyTheme(rendition);
      rendition.on("relocated", (loc: { start: { cfi: string; percentage?: number } }) => {
        if (loc?.start?.percentage != null) {
          const pct = Math.round(loc.start.percentage * 100);
          setPercent(pct);
          percentRef.current = pct;
        }
      });
    },
    [applyTheme]
  );

  useEffect(() => {
    if (renditionRef.current) applyTheme(renditionRef.current as Parameters<typeof applyTheme>[0]);
  }, [theme, fontSize, applyTheme]);

  async function addBookmark() {
    const cfi = typeof location === "string" ? location : String(location);
    if (!cfi) return;
    const label = `Bookmark ${bookmarks.length + 1}`;
    const bm: BookBookmark = {
      id: crypto.randomUUID(),
      label,
      cfi,
      created: new Date().toISOString(),
    };
    await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: bookId, bookmark_action: "add", bookmark: bm }),
    });
    setBookmarks((prev) => [...prev, bm]);
  }

  async function removeBookmark(bmId: string) {
    await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: bookId, bookmark_action: "remove", bookmark_id: bmId }),
    });
    setBookmarks((prev) => prev.filter((b) => b.id !== bmId));
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="reader-toolbar flex items-center gap-2 px-4 py-2 flex-wrap">
        <span className="text-sm font-medium truncate flex-1 min-w-0">{title}</span>
        {percent != null && <span className="text-xs text-[var(--muted)]">{percent}%</span>}
        <button
          type="button"
          className="px-2 py-1 text-xs rounded border border-[var(--border)] hover:border-[var(--accent)]"
          onClick={addBookmark}
        >
          + Bookmark
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs rounded border ${showBookmarks ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border)]"}`}
          onClick={() => setShowBookmarks((v) => !v)}
        >
          Bookmarks ({bookmarks.length})
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs rounded border ${showSettings ? "border-[var(--accent2-bright)]" : "border-[var(--border)]"}`}
          onClick={() => setShowSettings((v) => !v)}
        >
          Aa
        </button>
      </div>

      {showSettings && (
        <div className="reader-panel px-4 py-3 flex flex-wrap gap-3 text-xs border-b border-[var(--border)]">
          <div className="flex gap-1 items-center">
            <span className="text-[var(--muted)] mr-1">Size</span>
            {(["sm", "md", "lg", "xl"] as FontSize[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFontSize(s)}
                className={`px-2 py-0.5 rounded border ${fontSize === s ? "border-[var(--accent)]" : "border-[var(--border)]"}`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex gap-1 items-center">
            <span className="text-[var(--muted)] mr-1">Theme</span>
            {(["dark", "sepia", "light"] as Theme[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`px-2 py-0.5 rounded border capitalize ${theme === t ? "border-[var(--accent2-bright)]" : "border-[var(--border)]"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {showBookmarks && (
        <div className="reader-panel px-4 py-2 max-h-40 overflow-y-auto border-b border-[var(--border)]">
          {bookmarks.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">No bookmarks yet.</p>
          ) : (
            <ul className="space-y-1">
              {bookmarks.map((bm) => (
                <li key={bm.id} className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    className="flex-1 text-left truncate hover:text-[var(--accent2-bright)]"
                    onClick={() => setLocation(bm.cfi)}
                  >
                    {bm.label}
                  </button>
                  <button type="button" className="text-[var(--muted)] hover:text-[var(--accent)]" onClick={() => removeBookmark(bm.id)}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <ReactReader
          url={url}
          title={title}
          location={location}
          locationChanged={(loc: string) => {
            setLocation(loc);
            saveProgress(loc, percentRef.current ?? undefined);
          }}
          getRendition={getRendition}
        />
      </div>
    </div>
  );
}
