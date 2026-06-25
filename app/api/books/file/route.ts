import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getMediaRoot, isUnderRoot } from "@/lib/paths";
import { loadLibrary, findBookById } from "@/lib/library";

const MIME: Record<string, string> = {
  ".epub": "application/epub+zip",
  ".pdf": "application/pdf",
  ".mobi": "application/x-mobipocket-ebook",
};

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  let library;
  try {
    library = loadLibrary();
  } catch (e) {
    return NextResponse.json({ error: "library not loaded" }, { status: 500 });
  }

  const book = findBookById(library, id);
  if (!book) return NextResponse.json({ error: "book not found" }, { status: 404 });

  const filePath = book.path;
  if (!isUnderRoot(filePath, getMediaRoot())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "file missing" }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const stat = fs.statSync(filePath);
  const stream = fs.createReadStream(filePath);

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Length": String(stat.size),
      "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
    },
  });
}
