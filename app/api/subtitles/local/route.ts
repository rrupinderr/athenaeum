import { NextRequest, NextResponse } from "next/server";
import { getMediaRoot, isUnderRoot } from "@/lib/paths";
import { scanLocalSubtitles } from "@/lib/subtitles";

export async function GET(req: NextRequest) {
  const videoPath = req.nextUrl.searchParams.get("path");
  if (!videoPath) return NextResponse.json({ error: "missing path" }, { status: 400 });
  if (!isUnderRoot(videoPath, getMediaRoot())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json(scanLocalSubtitles(videoPath));
}
