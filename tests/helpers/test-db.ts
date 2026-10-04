import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import type { D1Like } from "../../worker/src/db/repository";

/** Test-only D1 adapter over Node's built-in sqlite (free, local). */
export function openTestDb(migrationPath = join(process.cwd(), "migrations/0001_core.sql")): {
  db: D1Like;
  raw: DatabaseSync;
} {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON;");
  raw.exec(readFileSync(migrationPath, "utf8"));

  const db: D1Like = {
    prepare(query: string) {
      return {
        bind(...values: unknown[]) {
          const stmt = raw.prepare(query);
          return {
            async first<T = unknown>() {
              const row = stmt.get(...values);
              return (row as T) ?? null;
            },
            async all<T = unknown>() {
              const results = stmt.all(...values) as T[];
              return { results };
            },
            async run() {
              const info = stmt.run(...values);
              return { meta: { changes: Number(info.changes ?? 0) } };
            },
          };
        },
      };
    },
    async batch() {
      throw new Error("batch not used in P07 tests");
    },
  };

  return { db, raw };
}
