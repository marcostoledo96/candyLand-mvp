import { execFileSync, spawnSync } from "node:child_process";

export function loadGitBaseline(cwd, ref, paths) {
  const probe = spawnSync("git", ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], { cwd, encoding: "utf8" });
  if (probe.error) throw probe.error;
  if (probe.status !== 0) {
    if (probe.status === 1 && !probe.stderr.trim()) return null;
    throw new Error(probe.stderr.trim() || `git rev-parse exited with status ${probe.status}`);
  }
  return Object.fromEntries(paths.map((path) => [path, execFileSync("git", ["show", `${ref}:${path}`], { cwd, encoding: "utf8" })]));
}
