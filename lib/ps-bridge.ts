import { spawn } from "child_process";
import path from "path";

function tryParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function runPowerShellJson<T>(scriptPath: string, args: string[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const psArgs = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath, ...args];
    const proc = spawn("powershell.exe", psArgs, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      const trimmed = stdout.trim();
      const parsed = tryParseJson<T & { error?: string }>(trimmed);
      if (code !== 0) {
        if (parsed && typeof parsed === "object" && "error" in parsed && parsed.error) {
          reject(new Error(parsed.error));
          return;
        }
        reject(new Error(stderr.trim() || trimmed || `PowerShell exited ${code}`));
        return;
      }
      if (parsed) resolve(parsed);
      else reject(new Error(`Invalid JSON from script: ${stdout.slice(0, 200)}`));
    });
  });
}

export function getScriptPath(name: string): string {
  const root = process.env.SCRIPTS_ROOT || "F:\\movies\\_scripts";
  return path.join(root, name);
}
