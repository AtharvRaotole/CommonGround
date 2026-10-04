/** @deprecated Prefer `pnpm verify:release` → scripts/verify-release.ts */
import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "scripts/verify-release.ts"],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
