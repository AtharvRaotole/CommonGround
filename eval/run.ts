import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeStudy, type GroupOccasion } from "./analysis";
import { formatStudyReport } from "./report";

const here = dirname(fileURLToPath(import.meta.url));

type RatingsFile = {
  protocolVersion: string;
  dataMode: string;
  occasions: GroupOccasion[];
};

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function runEvaluation(opts?: {
  ratingsPath?: string;
  manifestPath?: string;
  outPath?: string;
}): ReturnType<typeof analyzeStudy> {
  const manifestPath = opts?.manifestPath ?? join(here, "manifest.json");
  const ratingsPath = opts?.ratingsPath ?? join(here, "private/ratings.json");
  const manifest = loadJson<{
    protocolVersion: string;
    targetGroups: number;
    graduation: { minWins: number; minMedianPairedDelta: number };
    deviations: unknown[];
  }>(manifestPath);
  const ratings = loadJson<RatingsFile>(ratingsPath);

  const report = analyzeStudy({
    protocolVersion: manifest.protocolVersion,
    occasions: ratings.occasions ?? [],
    targetGroups: manifest.targetGroups,
    winThreshold: manifest.graduation.minWins,
    medianDeltaThreshold: manifest.graduation.minMedianPairedDelta,
  });

  if (opts?.outPath) {
    mkdirSync(dirname(opts.outPath), { recursive: true });
    writeFileSync(opts.outPath, formatStudyReport(report));
  }
  return report;
}

// CLI entry is optional; CI uses tests/unit/eval-analysis.test.ts.
