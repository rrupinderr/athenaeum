export type StateFilter = "all" | "watched" | "favorites";
export type TypeFilter = "all" | "movie" | "tv";

export function matchesStateFilter(
  id: string,
  filter: StateFilter,
  watched: Set<string>,
  favorites: Set<string>
): boolean {
  if (filter === "watched") return watched.has(id);
  if (filter === "favorites") return favorites.has(id);
  return true;
}

export function matchesTypeFilter(type: "movie" | "tv", filter: TypeFilter): boolean {
  if (filter === "all") return true;
  return type === filter;
}
