export function buildWebSearchUrl(title: string, year?: number | null, kind: "movie" | "tv" | "book" = "movie"): string {
  const parts = [title];
  if (year) parts.push(String(year));
  parts.push(kind === "book" ? "book" : kind === "tv" ? "TV series" : "movie");
  return `https://www.google.com/search?q=${encodeURIComponent(parts.join(" "))}`;
}

export function openWebSearch(title: string, year?: number | null, kind?: "movie" | "tv" | "book"): void {
  window.open(buildWebSearchUrl(title, year, kind), "_blank", "noopener,noreferrer");
}
