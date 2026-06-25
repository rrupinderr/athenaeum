import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export function getVlcPath(): string | null {
  const candidates = [
    path.join(process.env.ProgramFiles || "C:\\Program Files", "VideoLAN", "VLC", "vlc.exe"),
    path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "VideoLAN", "VLC", "vlc.exe"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function playInVlc(filePath: string): { ok: boolean; error?: string } {
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: "File not found" };
  }
  const vlc = getVlcPath();
  try {
    if (vlc) {
      const child = spawn(vlc, [filePath], { detached: true, stdio: "ignore", windowsHide: true });
      child.unref();
    } else {
      const child = spawn("cmd", ["/c", "start", "", filePath], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });
      child.unref();
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to launch player" };
  }
}
