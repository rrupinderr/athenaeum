import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { getMediaRoot, isUnderRoot } from "@/lib/paths";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const targetPath = body.path as string;
  if (!targetPath) {
    return NextResponse.json({ error: "missing path" }, { status: 400 });
  }
  if (!isUnderRoot(targetPath, getMediaRoot())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  spawn("explorer.exe", [targetPath], { detached: true, stdio: "ignore" }).unref();
  return NextResponse.json({ ok: true });
}
