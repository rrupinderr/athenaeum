"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BookBookmark, LibraryData, SubtitleInfo } from "@/types/library";

export interface BookProgressEntry {
  cfi?: string;
  page?: number;
  percent?: number;
  updated: string;
}

interface LibraryContextValue {
  library: LibraryData | null;
  loading: boolean;
  error: string | null;
  watched: Set<string>;
  favorites: Set<string>;
  bookProgress: Record<string, BookProgressEntry>;
  bookmarks: Record<string, BookBookmark[]>;
  subtitleOverrides: Record<string, SubtitleInfo>;
  refreshLibrary: () => Promise<void>;
  deleteMedia: (id: string, episodePaths?: string[]) => Promise<{ ok: boolean; error?: string }>;
  toggleWatched: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setSubtitleOverride: (id: string, info: SubtitleInfo) => void;
  toast: (msg: string, kind?: "ok" | "err") => void;
  toastMsg: string | null;
  toastKind: "ok" | "err";
  clearToast: () => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [bookProgress, setBookProgress] = useState<Record<string, BookProgressEntry>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, BookBookmark[]>>({});
  const [subtitleOverrides, setSubtitleOverrides] = useState<Record<string, SubtitleInfo>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastKind, setToastKind] = useState<"ok" | "err">("ok");

  const toast = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    setToastMsg(msg);
    setToastKind(kind);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const clearToast = useCallback(() => setToastMsg(null), []);

  const loadState = useCallback(async () => {
    const res = await fetch("/api/state");
    if (!res.ok) return;
    const data = await res.json();
    setWatched(new Set(data.watched || []));
    setFavorites(new Set(data.favorites || []));
    setBookProgress(data.book_progress || {});
    setBookmarks(data.bookmarks || {});
  }, []);

  const refreshLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/library");
      if (!res.ok) throw new Error(await res.text());
      setLibrary(await res.json());
      await loadState();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load library");
    } finally {
      setLoading(false);
    }
  }, [loadState]);

  const deleteMediaFn = useCallback(async (id: string, episodePaths: string[] = []) => {
    const res = await fetch("/api/media/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, episode_paths: episodePaths }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Delete failed" };
    return { ok: true };
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const toggleWatched = useCallback(async (id: string) => {
    setWatched((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, watched: s.has(id) }),
      });
      return s;
    });
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    setFavorites((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, favorite: s.has(id) }),
      });
      return s;
    });
  }, []);

  const setSubtitleOverride = useCallback((id: string, info: SubtitleInfo) => {
    setSubtitleOverrides((prev) => ({ ...prev, [id]: info }));
  }, []);

  const value = useMemo(
    () => ({
      library,
      loading,
      error,
      watched,
      favorites,
      bookProgress,
      bookmarks,
      subtitleOverrides,
      refreshLibrary,
      deleteMedia: deleteMediaFn,
      toggleWatched,
      toggleFavorite,
      setSubtitleOverride,
      toast,
      toastMsg,
      toastKind,
      clearToast,
    }),
    [
      library,
      loading,
      error,
      watched,
      favorites,
      bookProgress,
      bookmarks,
      subtitleOverrides,
      refreshLibrary,
      deleteMediaFn,
      toggleWatched,
      toggleFavorite,
      setSubtitleOverride,
      toast,
      toastMsg,
      toastKind,
      clearToast,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}

export async function playPath(path: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/play", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error || "Playback failed" };
  return { ok: true };
}

export async function explorePath(path: string): Promise<void> {
  await fetch("/api/explore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
}

export async function deleteMedia(
  id: string,
  episodePaths: string[] = []
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/media/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, episode_paths: episodePaths }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error || "Delete failed" };
  return { ok: true };
}
