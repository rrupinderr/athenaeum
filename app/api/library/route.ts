import { NextResponse } from "next/server";
import { loadLibrary } from "@/lib/library";

export async function GET() {
  try {
    const library = loadLibrary();
    return NextResponse.json(library);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load library" },
      { status: 500 }
    );
  }
}
