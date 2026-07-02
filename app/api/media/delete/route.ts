import { NextRequest, NextResponse } from "next/server";
import { getMediaRoot, getScriptsRoot, isUnderRoot } from "@/lib/paths";
import { loadState, saveState } from "@/lib/state";
import { runPowerShellJson } from "@/lib/ps-bridge";
import path from "path";

interface RemoveResult {
  ok: boolean;
  error?: string;
  folder_name?: string;
  paths_removed?: string[];
}

function cleanMediaState(id: string, episodePaths: string[]) {
  const state = loadState();
  delete state.watched[id];
  delete state.favorites[id];
  for (const epPath of episodePaths) {
    const eid = `${id}::${epPath}`;
    delete state.watched[eid];
    delete state.favorites[eid];
  }
  saveState(state);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = body.id as string;
  const episodePaths = (body.episode_paths as string[] | undefined) || [];

  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const mediaRoot = getMediaRoot();
  const scriptPath = path.join(getScriptsRoot(), "Remove-MediaFromLibrary.ps1");

  try {
    const result = await runPowerShellJson<RemoveResult>(scriptPath, [
      "-FolderName",
      id,
    ]);

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Delete failed" }, { status: 400 });
    }

    for (const p of result.paths_removed || []) {
      if (!isUnderRoot(p, mediaRoot)) {
        return NextResponse.json({ error: "forbidden path in delete result" }, { status: 403 });
      }
    }

    cleanMediaState(id, episodePaths);
    return NextResponse.json({ ok: true, paths_removed: result.paths_removed || [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 }
    );
  }
}
