#!/usr/bin/env node
/**
 * Seed desk-checked venues into D1 (local or remote).
 * Usage:
 *   node scripts/seed-venues.mjs --local
 *   node scripts/seed-venues.mjs --remote
 * Free-tier only. No paid APIs.
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const remote = process.argv.includes("--remote");
const flag = remote ? "--remote" : "--local";
const doc = JSON.parse(readFileSync("data/venues-private.json", "utf8"));

const statements = [];
for (const v of doc.venues) {
  statements.push(
    `INSERT OR REPLACE INTO venues (id, name, neighborhood, borough, address, category, price_band, official_url, qloo_entity_id, qloo_mapping_status, created_at) VALUES (${sql(
      v.id,
    )}, ${sql(v.name)}, ${sql(v.neighborhood)}, ${sql(v.borough)}, ${sql(v.address)}, ${sql(
      v.category,
    )}, ${sql(v.priceBand)}, ${sql(v.officialUrl)}, NULL, ${sql(v.qlooMappingStatus)}, ${sql(
      doc.created + "T00:00:00.000Z",
    )});`,
  );
  for (const f of v.facts) {
    statements.push(
      `INSERT OR REPLACE INTO venue_facts (id, venue_id, field, value_json, state, source_url, source_kind, observed_at, expires_at, note) VALUES (${sql(
        f.id,
      )}, ${sql(v.id)}, ${sql(f.field)}, ${sql(JSON.stringify(f.value))}, ${sql(f.state)}, ${sql(
        f.sourceUrl,
      )}, ${sql(f.sourceKind)}, ${sql(f.observedAt)}, ${sql(f.expiresAt)}, ${sql(f.note)});`,
    );
  }
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

const sqlFile = "scripts/.seed-venues.tmp.sql";
import { writeFileSync, unlinkSync } from "node:fs";
writeFileSync(sqlFile, statements.join("\n"));
const result = spawnSync(
  "npx",
  ["wrangler", "d1", "execute", "common-ground", flag, "--file", sqlFile, "--yes"],
  { stdio: "inherit" },
);
try {
  unlinkSync(sqlFile);
} catch {
  /* ignore */
}
process.exit(result.status ?? 1);
