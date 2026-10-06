#!/usr/bin/env node
/**
 * Map desk venues → Qloo place entity IDs via /search (rate-limit aware).
 * Only confirms when the top hit's name clearly matches the venue.
 *
 * Usage: node --env-file=.env scripts/map-venues-qloo.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.QLOO_BASE_URL || "https://hackathon.api.qloo.com";
const KEY = process.env.QLOO_API_KEY;
if (!KEY) {
  console.error("QLOO_API_KEY required");
  process.exit(1);
}

const root = resolve(import.meta.dirname, "..");
const venuesPath = resolve(root, "data/venues-private.json");
const outDir = resolve(root, "docs/verification/p03-private");
const mapPath = resolve(outDir, "venue-mappings.json");

const doc = JSON.parse(readFileSync(venuesPath, "utf8"));
mkdirSync(outDir, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeName(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.*?\)/g, " ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenSet(s) {
  return new Set(normalizeName(s).split(" ").filter((t) => t.length > 1 && !["ny", "new", "york", "the", "co", "and"].includes(t)));
}

function nameScore(venueName, hitName) {
  const a = normalizeName(venueName);
  const b = normalizeName(hitName);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (b.includes(a) || a.includes(b)) return 80;
  const ta = tokenSet(venueName);
  const tb = tokenSet(hitName);
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  const union = new Set([...ta, ...tb]).size;
  const jaccard = inter / union;
  const coverage = inter / ta.size;
  return Math.round(jaccard * 40 + coverage * 40);
}

function nycBonus(hit) {
  const loc =
    hit.properties?.address ??
    hit.properties?.location ??
    hit.properties?.city ??
    hit.location ??
    hit.properties?.geocode ??
    "";
  const blob = `${hit.name ?? ""} ${typeof loc === "string" ? loc : JSON.stringify(loc)}`.toLowerCase();
  let score = 0;
  if (/(new york|brooklyn|manhattan|nyc|ny\b)/.test(blob)) score += 10;
  if (/(hotel|marriott|courtyard|indigo|ihg|standard,)/.test(blob)) score -= 25;
  return score;
}

function pickPlace(json, venueName) {
  const list = json?.results ?? json?.entities ?? [];
  if (!Array.isArray(list) || !list.length) return null;
  const scored = list
    .map((e) => {
      const id = e.entity_id ?? e.id;
      const name = e.name ?? e.properties?.name ?? "";
      if (typeof id !== "string" || !name) return null;
      const score = nameScore(venueName, name) + nycBonus(e);
      return { id, name, score };
    })
    .filter(Boolean);
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  if (!top || top.score < 55) return null;
  return top;
}

async function searchPlace(query) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const qs = new URLSearchParams({
      query,
      types: "urn:entity:place",
      take: "8",
    });
    const res = await fetch(`${BASE}/search?${qs}`, {
      headers: { "X-Api-Key": KEY, Accept: "application/json" },
    });
    if (res.status === 429) {
      const wait = 8000 * (attempt + 1);
      console.warn(`429 on "${query}" — waiting ${wait}ms`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, status: res.status, text: text.slice(0, 200) };
    }
    return { ok: true, status: res.status, json: await res.json() };
  }
  return { ok: false, status: 429, text: "rate limited after retries" };
}

const mappings = [];
for (const v of doc.venues) {
  // Reset prior low-quality confirmations
  v.qlooEntityId = null;
  v.qlooMappingStatus = "unknown";

  const bare = v.name.replace(/\(.*?\)/g, "").trim();
  const queries = [
    `${bare} ${v.neighborhood} New York`,
    `${bare} New York`,
    bare,
  ];

  let confirmed = null;
  for (const query of queries) {
    console.log(`Mapping ${v.id}: ${query}`);
    const result = await searchPlace(query);
    await sleep(3000);
    if (!result.ok) {
      console.warn(`  FAIL ${result.status}`);
      continue;
    }
    const pick = pickPlace(result.json, bare);
    if (!pick) {
      const topName = (result.json?.results?.[0]?.name ?? result.json?.entities?.[0]?.name) || "?";
      console.warn(`  weak/no match (top=${topName})`);
      continue;
    }
    confirmed = { query, pick };
    break;
  }

  if (!confirmed) {
    mappings.push({ venueId: v.id, status: "unconfirmed" });
    console.warn(`  UNCONFIRMED ${v.id}`);
    continue;
  }

  v.qlooEntityId = confirmed.pick.id;
  v.qlooMappingStatus = "confirmed";
  mappings.push({
    venueId: v.id,
    query: confirmed.query,
    status: "confirmed",
    entityId: confirmed.pick.id,
    matchedName: confirmed.pick.name,
    score: confirmed.pick.score,
  });
  console.log(`  OK score=${confirmed.pick.score} → ${confirmed.pick.name}`);
}

doc.warning =
  "Desk-checked evidence + live Qloo place IDs confirmed via /search with name-match threshold. Unknown facts still ≠ pass. Not a booking system.";
doc.qloo_mapped_at = new Date().toISOString();
doc.count_confirmed = mappings.filter((m) => m.status === "confirmed").length;

writeFileSync(venuesPath, JSON.stringify(doc, null, 2) + "\n");
writeFileSync(
  mapPath,
  JSON.stringify(
    {
      mapped_at: doc.qloo_mapped_at,
      base: BASE,
      count_confirmed: doc.count_confirmed,
      mappings: mappings.map((m) =>
        m.entityId
          ? { ...m, entityId: `${m.entityId.slice(0, 8)}…${m.entityId.slice(-4)}` }
          : m,
      ),
    },
    null,
    2,
  ) + "\n",
);

console.log(`Done. confirmed=${doc.count_confirmed}/${doc.venues.length}`);
