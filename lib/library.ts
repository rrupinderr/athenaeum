import fs from "fs";
import { getLibraryPath, readJsonFile } from "./paths";
import type { LibraryData } from "@/types/library";

let cache: { data: LibraryData; mtime: number } | null = null;

export function loadLibrary(): LibraryData {
  const p = getLibraryPath();
  if (!fs.existsSync(p)) {
    throw new Error(`library.json not found at ${p}. Run F:\\movies\\athenaeum.ps1 first.`);
  }
  const stat = fs.statSync(p);
  if (cache && cache.mtime === stat.mtimeMs) return cache.data;
  const data = readJsonFile<LibraryData>(p);
  if (!data) {
    throw new Error(`library.json is empty or invalid at ${p}.`);
  }
  cache = { data, mtime: stat.mtimeMs };
  return data;
}

export function findTitleById(library: LibraryData, id: string) {
  for (const index of [library.directors, library.genres]) {
    for (const key of Object.keys(index)) {
      const t = index[key].titles?.find((x) => x.id === id || x.folder_name === id);
      if (t) return t;
    }
  }
  return null;
}

export function findBookById(library: LibraryData, id: string) {
  for (const key of Object.keys(library.books?.authors || {})) {
    const b = library.books.authors[key].books?.find((x) => x.id === id);
    if (b) return b;
  }
  return null;
}

export function sortKeys<T extends { count: number }>(
  index: Record<string, T>,
  pinUnknownLast = false
): string[] {
  return Object.keys(index).sort((a, b) => {
    if (pinUnknownLast) {
      if (a === "Unknown") return 1;
      if (b === "Unknown") return -1;
    }
    return index[b].count - index[a].count;
  });
}
