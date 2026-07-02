import { NextRequest, NextResponse } from "next/server";
import { buildSearchVariants, sortTmdbResultsByYear } from "@/lib/tmdb-search";
import {
  looksLikePersonName,
  nameSimilarity,
  personToDiscoverResults,
  searchPerson,
  titleResultsWeak,
} from "@/lib/tmdb-person";
import type { TmdbSearchResult } from "@/types/library";

const TMDB_BASE = "https://api.themoviedb.org/3";
const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

interface TmdbMovieHit {
  id: number;
  title?: string;
  release_date?: string;
  poster_path?: string | null;
  overview?: string | null;
  vote_average?: number | null;
}

interface TmdbTvHit {
  id: number;
  name?: string;
  first_air_date?: string;
  poster_path?: string | null;
  overview?: string | null;
  vote_average?: number | null;
}

interface TmdbMultiHit {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  overview?: string | null;
  vote_average?: number | null;
}

function yearFromDate(d?: string): number | null {
  if (!d || d.length < 4) return null;
  const y = parseInt(d.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

function normalizeMovie(m: TmdbMovieHit): TmdbSearchResult {
  return {
    tmdb_id: m.id,
    title: m.title || "Untitled",
    year: yearFromDate(m.release_date),
    type: "movie",
    poster: m.poster_path ? `${POSTER_BASE}${m.poster_path}` : null,
    overview: m.overview ?? null,
    vote_average: m.vote_average ?? null,
  };
}

function normalizeTv(t: TmdbTvHit): TmdbSearchResult {
  return {
    tmdb_id: t.id,
    title: t.name || "Untitled",
    year: yearFromDate(t.first_air_date),
    type: "tv",
    poster: t.poster_path ? `${POSTER_BASE}${t.poster_path}` : null,
    overview: t.overview ?? null,
    vote_average: t.vote_average ?? null,
  };
}

function normalizeMulti(h: TmdbMultiHit): TmdbSearchResult | null {
  if (h.media_type === "movie") {
    return normalizeMovie({
      id: h.id,
      title: h.title,
      release_date: h.release_date,
      poster_path: h.poster_path,
      overview: h.overview,
      vote_average: h.vote_average,
    });
  }
  if (h.media_type === "tv") {
    return normalizeTv({
      id: h.id,
      name: h.name,
      first_air_date: h.first_air_date,
      poster_path: h.poster_path,
      overview: h.overview,
      vote_average: h.vote_average,
    });
  }
  return null;
}

function dedupeResults(results: TmdbSearchResult[]): TmdbSearchResult[] {
  const seen = new Set<string>();
  const out: TmdbSearchResult[] = [];
  for (const r of results) {
    const key = `${r.type}:${r.tmdb_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

async function searchMovies(query: string, apiKey: string): Promise<TmdbSearchResult[]> {
  const url = `${TMDB_BASE}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map(normalizeMovie);
}

async function searchTv(query: string, apiKey: string): Promise<TmdbSearchResult[]> {
  const url = `${TMDB_BASE}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map(normalizeTv);
}

async function searchMulti(query: string, apiKey: string): Promise<TmdbSearchResult[]> {
  const url = `${TMDB_BASE}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || [])
    .map((h: TmdbMultiHit) => normalizeMulti(h))
    .filter((r: TmdbSearchResult | null): r is TmdbSearchResult => r != null);
}

async function searchOnce(
  query: string,
  apiKey: string,
  type: string
): Promise<TmdbSearchResult[]> {
  if (type === "movie") return searchMovies(query, apiKey);
  if (type === "tv") return searchTv(query, apiKey);
  const [multi, movies, tv] = await Promise.all([
    searchMulti(query, apiKey),
    searchMovies(query, apiKey),
    searchTv(query, apiKey),
  ]);
  return dedupeResults([...multi, ...movies, ...tv]);
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB_API_KEY is not configured" }, { status: 429 });
  }

  const query = req.nextUrl.searchParams.get("query")?.trim() || "";
  const type = req.nextUrl.searchParams.get("type") || "all";
  const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "40", 10) || 40));
  const offset = Math.max(0, parseInt(req.nextUrl.searchParams.get("offset") || "0", 10) || 0);

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    let results: TmdbSearchResult[] = [];
    let searchedAs = query;
    let personMatch: { id: number; name: string } | undefined;

    for (const variant of buildSearchVariants(query)) {
      const hit = await searchOnce(variant, apiKey, type);
      if (hit.length > 0) {
        results = hit;
        searchedAs = variant;
        break;
      }
    }

    if (looksLikePersonName(query)) {
      const persons = await searchPerson(searchedAs, apiKey, 3);
      const topPerson = persons[0];
      const shouldMergePerson =
        topPerson &&
        (titleResultsWeak(results, query) || nameSimilarity(query, topPerson.name) >= 0.6);

      if (shouldMergePerson) {
        const personResults = await personToDiscoverResults(topPerson.id, apiKey, type);
        results = dedupeResults([...personResults, ...results]);
        personMatch = { id: topPerson.id, name: topPerson.name };
      }
    }

    results = sortTmdbResultsByYear(results);

    const total = results.length;
    const page = results.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    const payload: {
      results: TmdbSearchResult[];
      searched_as?: string;
      person_match?: { id: number; name: string };
      total?: number;
      has_more?: boolean;
    } = { results: page };

    if (personMatch || total > limit) {
      payload.total = total;
      payload.has_more = hasMore;
    }

    if (searchedAs.toLowerCase() !== query.toLowerCase()) {
      payload.searched_as = searchedAs;
    }
    if (personMatch) {
      payload.person_match = personMatch;
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "TMDB search failed" }, { status: 502 });
  }
}
