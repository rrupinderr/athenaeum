import { NextRequest, NextResponse } from "next/server";
import { getMediaRoot, isUnderRoot } from "@/lib/paths";
import { playInVlc } from "@/lib/vlc";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const filePath = body.path as string;
  if (!filePath) {
    return NextResponse.json({ error: "missing path" }, { status: 400 });
  }
  if (!isUnderRoot(filePath, getMediaRoot())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const result = playInVlc(filePath);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
