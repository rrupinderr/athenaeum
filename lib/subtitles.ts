import fs from "fs";
import path from "path";
import type { SubtitleInfo } from "@/types/library";

const SUB_EXTS = new Set([".srt", ".ass", ".vtt", ".sub"]);

export function scanLocalSubtitles(videoPath: string): SubtitleInfo {
  const empty: SubtitleInfo = {
    has_local: false,
    has_embedded: false,
    files: [],
    languages: [],
    embedded_languages: [],
    source: "none",
  };
  if (!videoPath || !fs.existsSync(videoPath)) return empty;
  const dir = path.dirname(videoPath);
  if (!fs.existsSync(dir)) return empty;
  const files = fs.readdirSync(dir).filter((f) => SUB_EXTS.has(path.extname(f).toLowerCase()));
  if (files.length === 0) return empty;
  const langs: string[] = [];
  for (const f of files) {
    const m = f.match(/\.(en|eng|english)\./i);
    if (m) {
      if (!langs.includes("en")) langs.push("en");
    } else {
      const m2 = f.match(/\.([a-z]{2,3})\./i);
      if (m2 && !langs.includes(m2[1].toLowerCase())) langs.push(m2[1].toLowerCase());
      else if (f.endsWith(".srt") && !langs.includes("en")) langs.push("en");
    }
  }
  return {
    has_local: true,
    has_embedded: false,
    files: files.map((f) => path.join(dir, f)),
    languages: langs,
    embedded_languages: [],
    source: "external",
  };
}

export function mergeSubtitleInfo(base: SubtitleInfo | undefined, patch: SubtitleInfo): SubtitleInfo {
  if (!base) return patch;
  const hasLocal = base.has_local || patch.has_local;
  const hasEmbedded = base.has_embedded || patch.has_embedded;
  let source: SubtitleInfo["source"] = "none";
  if (hasLocal && hasEmbedded) source = "both";
  else if (hasLocal) source = patch.source === "external" ? "external" : base.source === "external" ? "external" : "external";
  else if (hasEmbedded) source = "embedded";
  return {
    has_local: hasLocal,
    has_embedded: hasEmbedded || base.has_embedded,
    files: patch.files.length ? patch.files : base.files,
    languages: patch.languages.length ? patch.languages : base.languages,
    embedded_languages: base.embedded_languages?.length ? base.embedded_languages : patch.embedded_languages,
    source: patch.has_local ? (base.has_embedded ? "both" : "external") : base.source,
  };
}
