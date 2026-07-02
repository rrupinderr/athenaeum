import type { Episode, LibraryData, MediaTitle } from "@/types/library";

export function isMultiPartMovie(title: MediaTitle): boolean {
  return title.type === "movie" && (title.parts?.length ?? 0) > 1;
}

export function playPathForTitle(title: MediaTitle): string | null {
  if (title.video_path) return title.video_path;
  if (title.parts?.length) return title.parts[0].path;
  if (title.episodes?.length) return title.episodes[0].path;
  return null;
}

export function findMovieById(library: LibraryData, id: string): MediaTitle | null {
  for (const bucket of [library.directors, library.genres]) {
    for (const key of Object.keys(bucket)) {
      const found = bucket[key].titles?.find((t) => t.id === id && t.type === "movie");
      if (found) return found;
    }
  }
  return null;
}

export function getMovieParts(title: MediaTitle): Episode[] {
  if (title.parts?.length) return title.parts;
  if (title.video_path) {
    return [{ label: title.title, path: title.video_path }];
  }
  return [];
}
