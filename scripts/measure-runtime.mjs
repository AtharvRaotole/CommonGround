#!/usr/bin/env node
/** P23 — delegates to integration runtime sample (writes docs/verification/runtime-report.md). */
import { spawnSync } from "node:child_process";

const result = spawnSync(
  "pnpm",
  ["exec", "vitest", "run", "--config", "vitest.integration.config.ts", "tests/integration/runtime-measure.test.ts"],
  { stdio: "inherit", shell: true },
);
process.exit(result.status ?? 1);
