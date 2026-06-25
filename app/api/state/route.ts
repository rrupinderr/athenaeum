import { NextRequest, NextResponse } from "next/server";
import { loadState, patchState } from "@/lib/state";

export async function GET() {
  const state = loadState();
  return NextResponse.json({
    watched: Object.keys(state.watched),
    favorites: Object.keys(state.favorites),
    book_progress: state.book_progress || {},
    bookmarks: state.bookmarks || {},
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = body.id as string;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const current = loadState();
  if (body.watched !== undefined) {
    if (body.watched) current.watched[id] = true;
    else delete current.watched[id];
  }
  if (body.favorite !== undefined) {
    if (body.favorite) current.favorites[id] = true;
    else delete current.favorites[id];
  }
  if (body.book_progress !== undefined) {
    current.book_progress = current.book_progress || {};
    current.book_progress[id] = body.book_progress;
  }
  if (body.bookmark_action === "add" && body.bookmark) {
    current.bookmarks = current.bookmarks || {};
    const list = current.bookmarks[id] || [];
    list.push(body.bookmark);
    current.bookmarks[id] = list;
  }
  if (body.bookmark_action === "remove" && body.bookmark_id) {
    current.bookmarks = current.bookmarks || {};
    current.bookmarks[id] = (current.bookmarks[id] || []).filter((b) => b.id !== body.bookmark_id);
  }
  patchState(current);
  return NextResponse.json({ ok: true });
}
