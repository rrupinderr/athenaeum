import { NextRequest, NextResponse } from "next/server";
import { getScriptPath, runPowerShellJson } from "@/lib/ps-bridge";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const moviePath = body.path as string;
  const fileId = body.fileId as number;
  if (!moviePath || !fileId) {
    return NextResponse.json({ error: "missing path or fileId" }, { status: 400 });
  }
  try {
    const result = await runPowerShellJson<{ ok: boolean; destPath?: string; error?: string }>(
      getScriptPath("Invoke-SubtitleApi.ps1"),
      [
        "-Action",
        "Download",
        "-MoviePath",
        moviePath,
        "-FileId",
        String(fileId),
        "-Language",
        (body.language as string) || "en",
      ]
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "download failed" },
      { status: 500 }
    );
  }
}
