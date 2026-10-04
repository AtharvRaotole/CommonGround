/**
 * P29 release readiness scanner (Node ≥22 type-stripped).
 * Complements CI; does not replace human cold-start review.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
let failed = false;

function fail(msg: string) {
  console.error(`verify-release FAIL: ${msg}`);
  failed = true;
}

function ok(msg: string) {
  console.log(`verify-release OK: ${msg}`);
}

const requiredFiles = [
  "LICENSE",
  "README.md",
  ".env.example",
  "pnpm-lock.yaml",
  "docs/setup.md",
  "docs/privacy.md",
  "docs/submission.md",
  "docs/operations/rollback.md",
  "docs/ops/free-tier.md",
  "docs/security/threat-model.md",
  "docs/demo/evidence-map.md",
];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) fail(`missing ${file}`);
  else ok(file);
}

const envExample = readFileSync(join(root, ".env.example"), "utf8");
for (const line of envExample.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const value = trimmed.slice(eq + 1).trim();
  if (value !== "") fail(".env.example must keep values empty");
}
ok(".env.example values empty");

const license = readFileSync(join(root, "LICENSE"), "utf8");
if (!/MIT/i.test(license)) fail("LICENSE must remain MIT-visible for app code");
else ok("LICENSE MIT");

const dangerous =
  /(sk-[a-zA-Z0-9]{20,}|api[_-]?key\s*[:=]\s*['"][^'"]{8,}['"]|BEGIN (RSA |OPENSSH )?PRIVATE KEY)/i;

const skipDirs = new Set([
  "node_modules",
  ".git",
  "dist",
  "output",
  ".wrangler",
  "playwright-report",
  "test-results",
]);

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (skipDirs.has(entry)) continue;
    const path = join(dir, entry);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, acc);
    else if (/\.(ts|tsx|js|mjs|json|yml|yaml|env|md)$/.test(entry)) acc.push(path);
  }
  return acc;
}

for (const file of walk(root)) {
  if (file.endsWith("pnpm-lock.yaml")) continue;
  const text = readFileSync(file, "utf8");
  if (dangerous.test(text)) fail(`possible secret material in ${file}`);
}
ok("no obvious secrets in scanned tree");

const readme = readFileSync(join(root, "README.md"), "utf8");
if (!/common-ground\.issue-atharva\.workers\.dev/i.test(readme) && !/workers\.dev/i.test(readme)) {
  fail("README should link a public workers.dev URL or explicit hosting status");
} else ok("README hosting pointer");

if (/fabricated uplift|guaranteed revenue|will enjoy \(calibrated\)/i.test(readme)) {
  fail("README contains forbidden hype claims");
} else ok("README claim tone");

if (failed) {
  process.exit(1);
}
console.log("verify-release PASS");
