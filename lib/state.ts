import { getStatePath, readJsonFile, writeJsonFile } from "./paths";
import type { LibraryState } from "@/types/library";

const empty: LibraryState = { watched: {}, favorites: {}, book_progress: {}, bookmarks: {} };
export function loadState(): LibraryState {
  const s = readJsonFile<LibraryState>(getStatePath());
  if (!s) return { ...empty };
  return {
    watched: s.watched || {},
    favorites: s.favorites || {},
    book_progress: s.book_progress || {},
    bookmarks: s.bookmarks || {},
  };
}

export function saveState(state: LibraryState): void {
  writeJsonFile(getStatePath(), state);
}

export function patchState(patch: Partial<LibraryState>): LibraryState {
  const current = loadState();
  const next = { ...current, ...patch };
  saveState(next);
  return next;
}
