/** 1337x search: https://1337x.to/search/Stalker+1979/1/ */
export function build1337xSearchUrl(title: string, year?: number | null): string {
  const q = year ? `${title.trim()} ${year}` : title.trim();
  const slug = q.split(/\s+/).filter(Boolean).join("+");
  return `https://1337x.to/search/${slug}/1/`;
}

export function buildWebSearchUrl(title: string, year?: number | null, kind: "movie" | "tv" | "book" = "movie"): string {
  if (kind === "book") {
    const parts = [title];
    if (year) parts.push(String(year));
    parts.push("book");
    return `https://www.google.com/search?q=${encodeURIComponent(parts.join(" "))}`;
  }
  return build1337xSearchUrl(title, year);
}

export function openWebSearch(title: string, year?: number | null, kind?: "movie" | "tv" | "book"): void {
  window.open(buildWebSearchUrl(title, year, kind), "_blank", "noopener,noreferrer");
}
