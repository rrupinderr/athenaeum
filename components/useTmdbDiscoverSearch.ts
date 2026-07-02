"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TmdbSearchResult } from "@/types/library";
import type { TypeFilter } from "@/lib/filters";

const PAGE_SIZE = 40;

function dedupeResults(existing: TmdbSearchResult[], incoming: TmdbSearchResult[]): TmdbSearchResult[] {
  const seen = new Set(existing.map((r) => `${r.type}:${r.tmdb_id}`));
  const added = incoming.filter((r) => {
    const key = `${r.type}:${r.tmdb_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...existing, ...added];
}

export interface TmdbDiscoverSearchState {
  results: TmdbSearchResult[];
  searchedAs: string | null;
  personMatch: { id: number; name: string } | null;
  total: number | null;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMore: () => void;
}

export function useTmdbDiscoverSearch(query: string, typeFilter: TypeFilter = "all"): TmdbDiscoverSearchState {
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [searchedAs, setSearchedAs] = useState<string | null>(null);
  const [personMatch, setPersonMatch] = useState<{ id: number; name: string } | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<TmdbSearchResult[]>([]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setSearchedAs(null);
      setPersonMatch(null);
      setTotal(null);
      setHasMore(false);
      setError(null);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/tmdb/search?query=${encodeURIComponent(query.trim())}&type=${typeFilter}&limit=${PAGE_SIZE}&offset=0`
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Search failed");
          setResults([]);
          setSearchedAs(null);
          setPersonMatch(null);
          setTotal(null);
          setHasMore(false);
        } else {
          setResults(data.results || []);
          setSearchedAs(data.searched_as || null);
          setPersonMatch(data.person_match || null);
          setTotal(data.total ?? null);
          setHasMore(Boolean(data.has_more));
        }
      } catch {
        setError("Search failed");
        setResults([]);
        setSearchedAs(null);
        setPersonMatch(null);
        setTotal(null);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, typeFilter]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || query.trim().length < 2) return;

    setLoadingMore(true);
    setError(null);
    try {
      const offset = resultsRef.current.length;
      const res = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(query.trim())}&type=${typeFilter}&limit=${PAGE_SIZE}&offset=${offset}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Search failed");
      } else {
        setResults((prev) => dedupeResults(prev, data.results || []));
        setTotal(data.total ?? null);
        setHasMore(Boolean(data.has_more));
        if (data.person_match) setPersonMatch(data.person_match);
      }
    } catch {
      setError("Search failed");
    } finally {
      setLoadingMore(false);
    }
  }, [query, typeFilter, loading, loadingMore, hasMore]);

  return {
    results,
    searchedAs,
    personMatch,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
  };
}
