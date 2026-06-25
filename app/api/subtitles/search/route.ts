import { NextRequest, NextResponse } from "next/server";
import { getScriptPath, runPowerShellJson } from "@/lib/ps-bridge";
import type { SubtitleRow } from "@/types/library";

function normalizeRows(raw: unknown): SubtitleRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r: Record<string, unknown>, i) => ({
    index: Number(r.Index ?? r.index ?? i + 1),
    fileId: Number(r.FileId ?? r.fileId),
    language: String(r.Language ?? r.language ?? "en"),
    downloads: Number(r.Downloads ?? r.downloads ?? 0),
    release: String(r.Release ?? r.release ?? ""),
    flags: String(r.Flags ?? r.flags ?? ""),
    uploader: String(r.Uploader ?? r.uploader ?? ""),
  }));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const moviePath = body.path as string;
  if (!moviePath) {
    return NextResponse.json({ error: "missing path" }, { status: 400 });
  }
  try {
    const rows = await runPowerShellJson<unknown>(getScriptPath("Invoke-SubtitleApi.ps1"), [
      "-Action",
      "Search",
      "-MoviePath",
      moviePath,
    ]);
    return NextResponse.json({ results: normalizeRows(rows) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "search failed" },
      { status: 500 }
    );
  }
}
