/** Genres that should appear in the UI even when no titles are tagged yet. */
export const EMPTY_GENRE_BUCKETS = ["Pleasure"] as const;

export function allGenreLabels(libraryGenres: Record<string, unknown>): string[] {
  const keys = new Set([...Object.keys(libraryGenres), ...EMPTY_GENRE_BUCKETS]);
  return [...keys].sort((a, b) => {
    const ca = (libraryGenres[a] as { count?: number } | undefined)?.count ?? 0;
    const cb = (libraryGenres[b] as { count?: number } | undefined)?.count ?? 0;
    if (cb !== ca) return cb - ca;
    return a.localeCompare(b);
  });
}

export function genreBucketCount(
  libraryGenres: Record<string, { count?: number }>,
  genre: string
): number {
  return libraryGenres[genre]?.count ?? 0;
}
