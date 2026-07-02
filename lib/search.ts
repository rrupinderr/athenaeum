import type { Book, LibraryData, MediaTitle } from "@/types/library";

export interface SearchHit {
  id: string;
  kind: "movie" | "tv" | "book";
  title: string;
  year?: number | null;
  context: string;
  item: MediaTitle | Book;
}

export function haystackMedia(t: MediaTitle): string {
  return [
    t.title,
    t.folder_name,
    t.year,
    ...(t.directors || []),
    ...(t.genres || []),
    t.primary_genre,
    t.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function haystackBook(b: Book): string {
  return [b.title, b.author, b.format, b.collection, b.folder_path].filter(Boolean).join(" ").toLowerCase();
}

export function collectMedia(library: LibraryData): MediaTitle[] {
  const seen = new Set<string>();
  const out: MediaTitle[] = [];
  for (const index of [library.directors, library.genres]) {
    for (const key of Object.keys(index)) {
      for (const t of index[key].titles || []) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          out.push(t);
        }
      }
    }
  }
  return out;
}

export function collectBooks(library: LibraryData): Book[] {
  const out: Book[] = [];
  for (const key of Object.keys(library.books?.authors || {})) {
    out.push(...(library.books.authors[key].books || []));
  }
  return out;
}

/** Filter sidebar bucket labels (director names, genre names, etc.) by substring. */
/** Substring filter for main title grids while typing (no minimum length). */
export function filterMediaByQuery(titles: MediaTitle[], query: string): MediaTitle[] {
  const q = query.trim().toLowerCase();
  if (!q) return titles;
  return titles.filter((t) => haystackMedia(t).includes(q));
}

export function filterSidebarLabels(items: string[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((label) => label.toLowerCase().includes(q));
}

export function searchMedia(library: LibraryData, query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const t of collectMedia(library)) {
    if (!haystackMedia(t).includes(q)) continue;
    const ctx = t.directors?.length ? t.directors.join(", ") : t.primary_genre || t.type;
    hits.push({ id: t.id, kind: t.type, title: t.title, year: t.year, context: ctx, item: t });
  }
  hits.sort((a, b) => a.title.localeCompare(b.title));
  return hits;
}

export function searchBooks(library: LibraryData, query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const b of collectBooks(library)) {
    if (!haystackBook(b).includes(q)) continue;
    hits.push({ id: b.id, kind: "book", title: b.title, context: b.author, item: b });
  }
  hits.sort((a, b) => a.title.localeCompare(b.title));
  return hits;
}

export function sidebarMatchCounts(
  library: LibraryData,
  query: string,
  mode: "directors" | "genres" | "books"
): Record<string, number> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return {};
  const counts: Record<string, number> = {};
  if (mode === "books") {
    for (const key of Object.keys(library.books.authors)) {
      const n = (library.books.authors[key].books || []).filter((b) => haystackBook(b).includes(q)).length;
      if (n > 0) counts[key] = n;
    }
  } else {
    const index = mode === "directors" ? library.directors : library.genres;
    for (const key of Object.keys(index)) {
      const n = (index[key].titles || []).filter((t) => haystackMedia(t).includes(q)).length;
      if (n > 0) counts[key] = n;
    }
  }
  return counts;
}
