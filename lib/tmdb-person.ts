import type { TmdbSearchResult } from "@/types/library";
import { sortTmdbResultsByYear } from "@/lib/tmdb-search";

const TMDB_BASE = "https://api.themoviedb.org/3";
const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

export interface PersonMatch {
  id: number;
  name: string;
}

interface TmdbPersonHit {
  id: number;
  name?: string;
  popularity?: number;
}

interface TmdbCreditItem {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  overview?: string | null;
  vote_average?: number | null;
  popularity?: number | null;
  job?: string;
  department?: string;
}

function yearFromDate(d?: string): number | null {
  if (!d || d.length < 4) return null;
  const y = parseInt(d.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

function normalizeCredit(h: TmdbCreditItem, type: "movie" | "tv"): TmdbSearchResult | null {
  if (!h.id) return null;
  const title = type === "movie" ? h.title : h.name;
  if (!title) return null;
  const date = type === "movie" ? h.release_date : h.first_air_date;
  return {
    tmdb_id: h.id,
    title,
    year: yearFromDate(date),
    type,
    poster: h.poster_path ? `${POSTER_BASE}${h.poster_path}` : null,
    overview: h.overview ?? null,
    vote_average: h.vote_average ?? null,
  };
}

export function looksLikePersonName(query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return true;
  return words.length === 1 && words[0].length >= 3;
}

export function nameSimilarity(a: string, b: string): number {
  const na = a.trim().toLowerCase();
  const nb = b.trim().toLowerCase();
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wa = new Set(na.split(/\s+/));
  const wb = new Set(nb.split(/\s+/));
  let overlap = 0;
  for (const w of wa) {
    if (wb.has(w)) overlap++;
  }
  return overlap / Math.max(wa.size, wb.size, 1);
}

export async function searchPerson(
  query: string,
  apiKey: string,
  limit = 3
): Promise<PersonMatch[]> {
  const url = `${TMDB_BASE}/search/person?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || [])
    .slice(0, limit)
    .map((p: TmdbPersonHit) => ({ id: p.id, name: p.name || "Unknown" }));
}

export async function personToDiscoverResults(
  personId: number,
  apiKey: string,
  typeFilter: string
): Promise<TmdbSearchResult[]> {
  const url = `${TMDB_BASE}/person/${personId}/combined_credits?api_key=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];

  const data = await res.json();
  const cast = (data.cast || []) as TmdbCreditItem[];
  const crew = (data.crew || []) as TmdbCreditItem[];
  const directing = crew.filter((c) => c.job === "Director" || c.department === "Directing");

  const raw: TmdbSearchResult[] = [];

  for (const c of [...cast, ...directing]) {
    const mt = c.media_type;
    if (mt !== "movie" && mt !== "tv") continue;
    if (typeFilter === "movie" && mt !== "movie") continue;
    if (typeFilter === "tv" && mt !== "tv") continue;
    const norm = normalizeCredit(c, mt);
    if (norm) raw.push(norm);
  }

  const seen = new Set<string>();
  const deduped: TmdbSearchResult[] = [];
  for (const r of raw) {
    const key = `${r.type}:${r.tmdb_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }

  return sortTmdbResultsByYear(deduped);
}

export function titleResultsWeak(results: TmdbSearchResult[], query: string): boolean {
  if (results.length === 0) return true;
  const q = query.trim().toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return results.length < 3;
  const top = results.slice(0, 5);
  const anyMatch = top.some((r) => {
    const title = r.title.toLowerCase();
    return words.some((w) => title.includes(w));
  });
  return !anyMatch;
}
