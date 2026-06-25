import { spawn } from "child_process";
import path from "path";

export function runPowerShellJson<T>(scriptPath: string, args: string[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const psArgs = [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      ...args,
    ];
    const proc = spawn("powershell.exe", psArgs, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || `PowerShell exited ${code}`));
        return;
      }
      try {
        const trimmed = stdout.trim();
        resolve(JSON.parse(trimmed || "{}") as T);
      } catch {
        reject(new Error(`Invalid JSON from script: ${stdout.slice(0, 200)}`));
      }
    });
  });
}

export function getScriptPath(name: string): string {
  const root = process.env.SCRIPTS_ROOT || "F:\\movies\\_scripts";
  return path.join(root, name);
}
