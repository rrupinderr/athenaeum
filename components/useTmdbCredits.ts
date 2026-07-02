"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, { directors: string[]; cast: string[] }>();

export function useTmdbCredits(tmdbId: number, type: "movie" | "tv", enabled: boolean) {
  const [credits, setCredits] = useState<{ directors: string[]; cast: string[] } | null>(null);

  useEffect(() => {
    if (!enabled || !tmdbId) return;

    const key = `${type}:${tmdbId}`;
    const cached = cache.get(key);
    if (cached) {
      setCredits(cached);
      return;
    }

    let cancelled = false;
    fetch(`/api/tmdb/credits?tmdb_id=${tmdbId}&type=${type}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const value = {
          directors: data.directors || [],
          cast: data.cast || [],
        };
        cache.set(key, value);
        setCredits(value);
      })
      .catch(() => {
        if (!cancelled) setCredits({ directors: [], cast: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [tmdbId, type, enabled]);

  return credits;
}
