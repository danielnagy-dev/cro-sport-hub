/** vpx tools/guards/check.ts [--pr-body <file>] — see docs/lessons.md. Linux and macOS. No network. */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));

const skip = new Set([
  "node_modules",
  "dist",
  "coverage",
  ".angular",
  ".next",
  "storybook-static",
  "artifacts",
]);

function procNeedle(): string {
  return String.fromCharCode(47, 112, 114, 111, 99, 47);
}

function trailerHasEmail(text: string): boolean {
  return text.split("\n").some((line) => /^[ \t]*co-authored-by:.*@/i.test(line));
}

function uncovered(command: string, projects: readonly string[]): string[] {
  return projects.filter((project) => !command.includes(project));
}

function assertSelfTest(): void {
  const needle = procNeedle();
  if (needle.length !== 6 || needle.charCodeAt(0) !== 47 || needle.charCodeAt(1) !== 112) {
    throw new Error("self-test failed: proc needle");
  }
  if (!`x ${needle} y`.includes(needle) || "process.cwd()".includes(needle)) {
    throw new Error("self-test failed: proc needle");
  }
  const at = ["agent", "example.test"].join("@");
  if (!trailerHasEmail(`Co-authored-by: Agent <${at}>`)) {
    throw new Error("self-test failed: trailer");
  }
  if (!trailerHasEmail(`  co-authored-by: Agent <${at}>`)) {
    throw new Error("self-test failed: trailer");
  }
  if (
    trailerHasEmail("Co-authored-by: Agent") ||
    trailerHasEmail(`Mention Co-authored-by near ${at}`)
  ) {
    throw new Error("self-test failed: trailer");
  }
  const missed = uncovered("tsc -p tools/verify/tsconfig.json", [
    "tools/verify/tsconfig.json",
    "tools/guards/tsconfig.json",
  ]);
  if (missed.length !== 1 || missed[0] !== "tools/guards/tsconfig.json") {
    throw new Error("self-test failed: typecheck coverage");
  }
}

function git(args: readonly string[]): string {
  return execFileSync("git", [...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function tryGit(args: readonly string[]): string | undefined {
  try {
    return git(args);
  } catch {
    return undefined;
  }
}

function isSource(name: string): boolean {
  return /\.(?:ts|tsx|mts|cts|js|mjs|cjs)$/.test(name);
}

function collectSources(dir: string, files: string[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink() || skip.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) collectSources(path, files);
    else if (entry.isFile() && isSource(entry.name)) files.push(path);
  }
}

function posix(path: string): string {
  return relative(root, path).split(sep).join("/");
}

function procFailures(): string[] {
  const needle = procNeedle();
  const files: string[] = [];
  for (const name of ["apps", "libs", "tools"]) collectSources(join(root, name), files);
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && isSource(entry.name)) files.push(join(root, entry.name));
  }
  const hits: string[] = [];
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      if ((lines[index] ?? "").includes(needle)) {
        hits.push(`${posix(file)}:${index + 1}: Linux-only proc path`);
      }
      if (hits.length >= 30) return [...hits, "further proc hits omitted"];
    }
  }
  return hits;
}

function mergeBase(): string | undefined {
  for (const ref of ["origin/main", "main"]) {
    if (tryGit(["rev-parse", "--verify", "--quiet", ref]) === undefined) continue;
    const base = tryGit(["merge-base", "HEAD", ref])?.trim();
    if (base) return base;
  }
  return undefined;
}

function commitScan(): { label: string; failures: string[] } {
  const base = mergeBase();
  if (base === undefined) {
    const text = tryGit(["log", "-1", "--format=%H%n%B"]) ?? "";
    return { label: "HEAD only (main ref not found)", failures: trailerHits(text) };
  }
  const text = tryGit(["log", "--format=%H%n%B%x1e", `${base}..HEAD`]) ?? "";
  return { label: `${base.slice(0, 12)}..HEAD`, failures: trailerHits(text) };
}

function trailerHits(text: string): string[] {
  const failures: string[] = [];
  for (const chunk of text.split("\u001e")) {
    if (!trailerHasEmail(chunk)) continue;
    const sha = chunk.trim().split("\n")[0] ?? "commit";
    failures.push(`${sha}: Co-authored-by line contains an email`);
  }
  return failures;
}

function typecheckCommand(config: string): string {
  const objectForm = /typecheck:\s*\{[\s\S]*?command:\s*"([^"]+)"/.exec(config);
  if (objectForm?.[1] !== undefined) return objectForm[1];
  const stringForm = /typecheck:\s*"([^"]+)"/.exec(config);
  return stringForm?.[1] ?? "";
}

function typecheckFailures(): string[] {
  const toolsDir = join(root, "tools");
  const command = typecheckCommand(readFileSync(join(root, "vite.config.ts"), "utf8"));
  const projects: string[] = [];
  for (const entry of readdirSync(toolsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    const sources: string[] = [];
    collectSources(join(toolsDir, entry.name), sources);
    if (sources.length === 0) continue;
    projects.push(`tools/${entry.name}/tsconfig.json`);
  }
  return uncovered(command, projects).map((project) =>
    existsSync(join(root, project))
      ? `${project}: not in the root typecheck command`
      : `${project}: missing, and the directory has TypeScript files`,
  );
}

function prBodyFailures(path: string | undefined): { note: string; failures: string[] } {
  if (path === undefined) return { note: "pr-body: skipped", failures: [] };
  const abs = resolve(root, path);
  if (!existsSync(abs))
    return { note: "pr-body: missing", failures: [`pr body not found: ${path}`] };
  if (trailerHasEmail(readFileSync(abs, "utf8"))) {
    return {
      note: "pr-body: failed",
      failures: [`${path}: Co-authored-by line contains an email`],
    };
  }
  return { note: "pr-body: ok", failures: [] };
}

function parseArgs(argv: readonly string[]): { prBody?: string } {
  const options: { prBody?: string } = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag !== "--pr-body")
      throw new Error("Usage: vpx tools/guards/check.ts [--pr-body <file>]");
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error("Usage: vpx tools/guards/check.ts [--pr-body <file>]");
    }
    options.prBody = value;
    index += 1;
  }
  return options;
}

function main(): number {
  assertSelfTest();
  const options = parseArgs(process.argv.slice(2));
  const commits = commitScan();
  const prBody = prBodyFailures(options.prBody);
  const failures = [
    ...procFailures(),
    ...commits.failures,
    ...prBody.failures,
    ...typecheckFailures(),
  ];
  console.log(`commits scanned: ${commits.label}`);
  console.log(prBody.note);
  if (failures.length === 0) {
    console.log("guards: ok");
    return 0;
  }
  console.log("guards: failed");
  for (const failure of failures) console.log(`- ${failure}`);
  return 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(error instanceof Error ? error.message : "guards failed");
  process.exitCode = 1;
}
