import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCoversDir, getMediaRoot, isUnderRoot } from "@/lib/paths";
import { loadLibrary, findBookById } from "@/lib/library";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  let library;
  try {
    library = loadLibrary();
  } catch {
    return NextResponse.json({ error: "library not loaded" }, { status: 500 });
  }

  const book = findBookById(library, id);
  if (!book) return NextResponse.json({ error: "book not found" }, { status: 404 });

  const coverPath = book.cover_file
    ? book.cover_file
    : path.join(getCoversDir(), `${id}.jpg`);

  if (!fs.existsSync(coverPath)) {
    return NextResponse.json({ error: "no cover" }, { status: 404 });
  }

  const buf = fs.readFileSync(coverPath);
  return new NextResponse(buf, {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" },
  });
}
