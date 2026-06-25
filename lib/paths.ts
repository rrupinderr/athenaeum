import path from "path";
import fs from "fs";

export function getMediaRoot(): string {
  return process.env.MEDIA_ROOT || "F:\\movies";
}

export function getMetadataRoot(): string {
  return process.env.METADATA_ROOT || "E:\\github\\athenaeum\\data";
}

export function getScriptsRoot(): string {
  return process.env.SCRIPTS_ROOT || "F:\\movies\\_scripts";
}

export function getLibraryPath(): string {
  return path.join(getMetadataRoot(), "library.json");
}

export function getStatePath(): string {
  return path.join(getMetadataRoot(), ".library-state.json");
}

export function getCoversDir(): string {
  return path.join(getMetadataRoot(), "covers", "books");
}

export function isUnderRoot(filePath: string, root: string): boolean {
  try {
    const full = path.resolve(filePath);
    const rootFull = path.resolve(root);
    return full.toLowerCase().startsWith(rootFull.toLowerCase() + path.sep.toLowerCase()) ||
      full.toLowerCase() === rootFull.toLowerCase();
  } catch {
    return false;
  }
}

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function writeJsonFile(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}
