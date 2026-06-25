import { NextRequest, NextResponse } from "next/server";
import { getScriptPath, runPowerShellJson } from "@/lib/ps-bridge";

export async function GET(req: NextRequest) {
  const director = req.nextUrl.searchParams.get("director");
  if (!director) {
    return NextResponse.json({ error: "missing director" }, { status: 400 });
  }
  try {
    const result = await runPowerShellJson<unknown>(getScriptPath("Invoke-FilmographyApi.ps1"), [
      "-Action",
      "Get",
      "-Director",
      director,
    ]);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "filmography failed" },
      { status: 500 }
    );
  }
}
