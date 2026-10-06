import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Shortlist, type ShortlistCard } from "../features/planning/shortlist";
import { RevisionBanner } from "../features/planning/revisions";
import "./form.css";
import "./plan.css";

type RevisionDto = {
  revisionId: string;
  eventVersion: number;
  dataMode: "live" | "synthetic";
  tasteMode: "full" | "mixed";
  profiledMemberCount: number;
  totalMemberCount: number;
  readiness: string;
  venueIds: string[];
  unknownFactIds: string[];
  alternatives: {
    venueId: string;
    role: ShortlistCard["role"];
    explanation: string;
  }[];
  explanations: {
    venueId: string;
    role: ShortlistCard["role"];
    clauses: { text: string; evidenceIds: string[] }[];
    source: string;
  }[];
  venueNames?: Record<string, string>;
  vetoSummary: { activeVetoCount: number };
  parentRevisionId: string | null;
  diff: { added?: string[]; removed?: string[]; changed?: string[] } | null;
  notice: string;
};

type EventDto = {
  title: string;
  role: string;
  version?: number;
};

export function PlanPage() {
  const [params] = useSearchParams();
  const eventId = params.get("event");
  const [event, setEvent] = useState<EventDto | null>(null);
  const [revision, setRevision] = useState<RevisionDto | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!eventId) return;
    const ev = await fetch(`/api/events/${eventId}`, { credentials: "include" });
    if (ev.ok) setEvent((await ev.json()) as EventDto);
    const rev = await fetch(`/api/events/${eventId}/revision`, { credentials: "include" });
    if (rev.ok) setRevision((await rev.json()) as RevisionDto);
    else if (rev.status === 404) setRevision(null);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runPlan() {
    if (!eventId) return;
    setBusy(true);
    setError(null);
    setStatus("Starting guided planning…");
    try {
      // Omit candidate slate — Worker uses confirmed Qloo-mapped catalog when available.
      const create = await fetch(`/api/events/${eventId}/runs`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: `plan-${eventId}-${Date.now()}`.slice(0, 128),
        }),
      });
      if (!create.ok) {
        setError("Could not start a planning run.");
        return;
      }
      const { runId } = (await create.json()) as { runId: string };
      for (let i = 0; i < 8; i += 1) {
        const step = await fetch(`/api/runs/${runId}/step`, {
          method: "POST",
          credentials: "include",
        });
        if (!step.ok) {
          setError("Planning step failed.");
          return;
        }
        const body = (await step.json()) as {
          state: string;
          stage: string;
          progress: { count: number; of: number };
          revisionId: string | null;
        };
        setStatus(`Stage ${body.stage} (${body.progress.count}/${body.progress.of})`);
        if (body.state === "complete" || body.state === "needs_input" || body.state === "failed") {
          break;
        }
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function onVeto(venueId: string) {
    if (!eventId) return;
    const res = await fetch(`/api/events/${eventId}/vetoes`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ venueId, reasonCategory: "other" }),
    });
    if (!res.ok) {
      setError("Could not record objection.");
      return;
    }
    const body = (await res.json()) as { groupSummary: string };
    setStatus(body.groupSummary);
    setRevision(null);
  }

  async function onAccept(venueId: string) {
    if (!eventId || !revision) return;
    setSelected(venueId);
    const res = await fetch(`/api/events/${eventId}/acceptances`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ revisionId: revision.revisionId, venueId }),
    });
    if (!res.ok) {
      setError("Acceptance failed — revision may have changed.");
      return;
    }
    setStatus("Acceptance recorded for this revision.");
  }

  async function onApprove() {
    if (!eventId || !revision) return;
    const res = await fetch(`/api/events/${eventId}/approve`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        revisionId: revision.revisionId,
        expectedVersion: revision.eventVersion,
      }),
    });
    const body = (await res.json()) as { notice?: string; message?: string };
    if (!res.ok) {
      setError(body.message || "Approval failed.");
      return;
    }
    setStatus(body.notice || "Approved.");
  }

  const cards: ShortlistCard[] =
    revision?.alternatives.map((alt) => {
      const explanation = revision.explanations.find((e) => e.venueId === alt.venueId);
      return {
        venueId: alt.venueId,
        name: revision.venueNames?.[alt.venueId] ?? alt.venueId,
        role: alt.role,
        meta: alt.explanation,
        clauses: explanation?.clauses ?? [{ text: alt.explanation, evidenceIds: [] }],
        unknownLabels: revision.unknownFactIds.slice(0, 2),
        dataMode: revision.dataMode,
      };
    }) ?? [];

  return (
    <div className="page">
      <p className="page__back">
        <Link to={eventId ? `/waiting?event=${eventId}` : "/"}>← Waiting room</Link>
      </p>
      <p className="page__lede">{event?.title ?? "Plan"}</p>
      {error ? (
        <p className="form__error" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="form__note" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}

      {event?.role === "host" && !revision ? (
        <div className="form__actions">
          <button type="button" className="btn" disabled={busy} onClick={() => void runPlan()}>
            {busy ? "Planning…" : "Start guided planning"}
          </button>
        </div>
      ) : null}

      {revision ? (
        <>
          <RevisionBanner
            revisionId={revision.revisionId}
            eventVersion={revision.eventVersion}
            parentRevisionId={revision.parentRevisionId}
            diff={revision.diff}
            groupSummary={
              revision.vetoSummary.activeVetoCount
                ? `${revision.vetoSummary.activeVetoCount} active objection(s) reflected in constraints.`
                : null
            }
            onReplan={event?.role === "host" ? () => void runPlan() : undefined}
          />
          <Shortlist
            cards={cards}
            tasteMode={revision.tasteMode}
            profiledMemberCount={revision.profiledMemberCount}
            totalMemberCount={revision.totalMemberCount}
            selectedVenueId={selected}
            onSelect={(id) => void onAccept(id)}
            onVeto={(id) => void onVeto(id)}
            footer={
              event?.role === "host" ? (
                <div className="form__actions">
                  <button type="button" className="btn" onClick={() => void onApprove()}>
                    Approve current plan revision
                  </button>
                  <Link className="btn btn--ghost" to={`/export?event=${eventId}`}>
                    Open export
                  </Link>
                </div>
              ) : null
            }
          />
        </>
      ) : (
        <p className="form__note">
          {event?.role === "host"
            ? "No shortlist yet. Start guided planning when the group is ready."
            : "Waiting for the host to publish a shortlist."}
        </p>
      )}
    </div>
  );
}
