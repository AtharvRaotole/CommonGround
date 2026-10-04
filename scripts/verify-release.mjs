import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const required = ["LICENSE", "README.md", ".env.example", "pnpm-lock.yaml"];

for (const file of required) {
  try {
    statSync(join(root, file));
  } catch {
    console.error(`verify:release missing ${file}`);
    process.exit(1);
  }
}

const envExample = readFileSync(join(root, ".env.example"), "utf8");
for (const line of envExample.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const value = trimmed.slice(eq + 1).trim();
  if (value !== "") {
    console.error("verify:release .env.example must keep values empty");
    process.exit(1);
  }
}

const dangerous = /(sk-[a-zA-Z0-9]{20,}|api[_-]?key\s*[:=]\s*['"][^'"]{8,}['"])/i;

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (
      entry === "node_modules" ||
      entry === ".git" ||
      entry === "dist" ||
      entry === "output" ||
      entry === "pnpm-lock.yaml"
    ) {
      continue;
    }
    const path = join(dir, entry);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, acc);
    else if (/\.(ts|tsx|js|mjs|json|yml|yaml|env)$/.test(entry)) acc.push(path);
  }
  return acc;
}

for (const file of walk(root)) {
  const text = readFileSync(file, "utf8");
  if (dangerous.test(text)) {
    console.error(`verify:release possible secret material in ${file}`);
    process.exit(1);
  }
}

console.log("verify:release PASS");
