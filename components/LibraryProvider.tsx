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
import type { LibraryData } from "@/types/library";

interface LibraryContextValue {
  library: LibraryData | null;
  loading: boolean;
  error: string | null;
  watched: Set<string>;
  favorites: Set<string>;
  refreshLibrary: () => Promise<void>;
  toggleWatched: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
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

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const toggleWatched = useCallback(
    async (id: string) => {
      const next = !watched.has(id);
      setWatched((prev) => {
        const s = new Set(prev);
        if (next) s.add(id);
        else s.delete(id);
        return s;
      });
      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, watched: next }),
      });
    },
    [watched]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const next = !favorites.has(id);
      setFavorites((prev) => {
        const s = new Set(prev);
        if (next) s.add(id);
        else s.delete(id);
        return s;
      });
      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, favorite: next }),
      });
    },
    [favorites]
  );

  const value = useMemo(
    () => ({
      library,
      loading,
      error,
      watched,
      favorites,
      refreshLibrary,
      toggleWatched,
      toggleFavorite,
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
      refreshLibrary,
      toggleWatched,
      toggleFavorite,
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
