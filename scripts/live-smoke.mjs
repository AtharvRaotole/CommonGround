#!/usr/bin/env node
/**
 * Live production smoke — host create → claim → preferences → plan → accept → approve → export.
 * Does not print secrets. Uses cookie jar + Origin for capability auth.
 */
const BASE = process.env.SMOKE_BASE || "https://common-ground.issue-atharva.workers.dev";
const ORIGIN = BASE;

const jar = new Map();

function storeCookies(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const fallback = res.headers.get("set-cookie");
  const list = raw.length ? raw : fallback ? [fallback] : [];
  for (const line of list) {
    const [pair] = line.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      origin: ORIGIN,
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
      ...(jar.size ? { cookie: cookieHeader() } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  storeCookies(res);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const health = await api("GET", "/api/health");
  assert(health.status === 200 && health.json.ok, `health failed ${health.status}`);
  console.log("health", health.json.revision, health.json.mode);

  const created = await api("POST", "/api/events", {
    title: `Smoke ${new Date().toISOString().slice(0, 16)}`,
    groupSize: 4,
    area: "East Village",
    timezone: "America/New_York",
    startsAtLocal: "2026-10-18T19:00",
  });
  assert(created.status === 201, `create event ${created.status} ${JSON.stringify(created.json)}`);
  const { eventId, hostClaimSecret } = created.json;
  console.log("event", eventId);

  const claim = await api("POST", "/api/claims", { secret: hostClaimSecret });
  assert(claim.status === 200 || claim.status === 201, `claim ${claim.status}`);
  console.log("claimed host session");

  // Host taste seeds — live Qloo search then save preferences
  const search = await api("POST", `/api/events/${eventId}/me/entity-search`, {
    query: "Radiohead",
  });
  console.log("search", search.status, search.json?.dataMode || search.json?.code, "n=", search.json?.candidates?.length);
  let seeds = [];
  if (search.status === 200 && search.json.candidates?.length) {
    const c = search.json.candidates[0];
    seeds = [
      {
        entityId: c.entityId,
        name: c.name,
        type: c.type,
        confirmedAt: new Date().toISOString(),
      },
    ];
  }

  if (seeds.length) {
    const prefs = await api("PUT", `/api/events/${eventId}/me/preferences`, {
      seeds,
      consentTaste: true,
      skipProfiling: false,
      consentVersion: "2026-10-04-v1",
    });
    assert(prefs.status === 200 || prefs.status === 204, `prefs ${prefs.status} ${JSON.stringify(prefs.json)}`);
    console.log("preferences saved", seeds[0].name);
  } else {
    console.warn("no seeds resolved — continuing with catalog fallback");
  }

  const run = await api("POST", `/api/events/${eventId}/runs`, {
    idempotencyKey: `smoke-${Date.now()}`,
  });
  assert(run.status === 202 || run.status === 200, `run ${run.status} ${JSON.stringify(run.json)}`);
  console.log("run", run.json.runId, "mode", run.json.mode);

  let last = null;
  for (let i = 0; i < 12; i += 1) {
    const step = await api("POST", `/api/runs/${run.json.runId}/step`);
    assert(step.status === 200, `step ${step.status} ${JSON.stringify(step.json)}`);
    last = step.json;
    console.log(`step${i}`, last.state, last.stage, last.progress);
    if (["complete", "needs_input", "failed", "cancelled"].includes(last.state)) break;
  }
  assert(last, "no step result");
  if (last.state === "needs_input" && !last.revisionId) {
    // One more step sometimes needed after ranked_alternatives land
    for (let i = 0; i < 4; i += 1) {
      const step = await api("POST", `/api/runs/${run.json.runId}/step`);
      last = step.json;
      console.log(`retry${i}`, last.state, last.stage);
      if (last.state === "complete" || last.revisionId) break;
    }
  }
  assert(
    last.state === "complete" || last.revisionId,
    `run did not complete: ${JSON.stringify(last)}`,
  );

  const rev = await api("GET", `/api/events/${eventId}/revision`);
  assert(rev.status === 200, `revision ${rev.status}`);
  const alts = rev.json.alternatives || [];
  assert(alts.length >= 1, "expected shortlist alternatives");
  const venueId = alts[0].venueId;
  const name = rev.json.venueNames?.[venueId] || venueId;
  console.log(
    "revision",
    rev.json.dataMode,
    "alts",
    alts.length,
    "top",
    name,
    "modeTaste",
    rev.json.tasteMode,
  );
  assert(!String(name).includes("-Infinity"), "bad ordinal copy");
  assert(!/nan/i.test(JSON.stringify(alts)), "NaN in alternatives");

  const accept = await api("POST", `/api/events/${eventId}/acceptances`, {
    revisionId: rev.json.revisionId,
    venueId,
  });
  assert(accept.status === 200 || accept.status === 201, `accept ${accept.status} ${JSON.stringify(accept.json)}`);

  const approve = await api("POST", `/api/events/${eventId}/approve`, {
    revisionId: rev.json.revisionId,
    expectedVersion: rev.json.eventVersion,
  });
  // Solo host: only one participant — should succeed
  console.log("approve", approve.status, approve.json.notice || approve.json.message || approve.json.code);
  assert(approve.status === 200, `approve failed ${approve.status} ${JSON.stringify(approve.json)}`);

  const exp = await api("GET", `/api/events/${eventId}/export`);
  assert(exp.status === 200, `export ${exp.status} ${JSON.stringify(exp.json)}`);
  console.log(
    "export",
    exp.json.exportKind,
    exp.json.localStart,
    exp.json.timezone,
    exp.json.venueName || exp.json.venueId,
  );
  assert(exp.json.localStart === "2026-10-18T19:00", "host datetime not preserved");
  assert(exp.json.reservationStatus === "unconfirmed", "must stay unconfirmed");

  console.log("SMOKE_PASS");
}

main().catch((err) => {
  console.error("SMOKE_FAIL", err.message);
  process.exit(1);
});
