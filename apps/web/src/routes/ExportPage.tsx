import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FeedbackForm } from "../features/feedback/FeedbackForm";
import "./form.css";

type ExportSummary = {
  revisionId: string;
  title: string;
  venueId: string;
  timezone: string;
  localStart: string;
  reservationStatus: "unconfirmed";
  exportKind: "tentative" | "ready";
  banner: string;
  unknownFactIds: string[];
};

export function ExportPage() {
  const [params] = useSearchParams();
  const eventId = params.get("event");
  const [summary, setSummary] = useState<ExportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState("member");

  useEffect(() => {
    if (!eventId) return;
    void (async () => {
      const ev = await fetch(`/api/events/${eventId}`, { credentials: "include" });
      if (ev.ok) {
        const body = (await ev.json()) as { role: string };
        setRole(body.role);
      }
      const ready = await fetch(`/api/events/${eventId}/export`, { credentials: "include" });
      if (ready.ok) {
        setSummary((await ready.json()) as ExportSummary);
        return;
      }
      const tentative = await fetch(`/api/events/${eventId}/export?tentative=1`, {
        credentials: "include",
      });
      if (tentative.ok) {
        setSummary((await tentative.json()) as ExportSummary);
        return;
      }
      setError("Nothing to export yet.");
    })();
  }, [eventId]);

  async function copyBrief() {
    if (!summary) return;
    const text = [
      summary.banner,
      summary.title,
      `Venue: ${summary.venueId}`,
      `When: ${summary.localStart} (${summary.timezone})`,
      `Reservation: ${summary.reservationStatus}`,
      "Common Ground does not book tables. You still make the reservation and send invites.",
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  async function repeatEvent() {
    if (!eventId) return;
    const res = await fetch(`/api/events/${eventId}/repeat`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      setError("Could not create repeat outing.");
      return;
    }
    const body = (await res.json()) as { eventId: string; notice: string };
    setError(null);
    window.alert(body.notice);
    window.location.href = `/waiting?event=${body.eventId}`;
  }

  return (
    <div className="page">
      <p className="page__back">
        <Link to={eventId ? `/plan?event=${eventId}` : "/"}>← Plan</Link>
      </p>
      <h1 className="page__title">Handoff</h1>
      {error ? (
        <p className="form__error" role="alert">
          {error}
        </p>
      ) : null}
      {summary ? (
        <section className="export" aria-labelledby="export-banner">
          <p id="export-banner" className="badge" role="status">
            {summary.banner}
          </p>
          <h2>{summary.title}</h2>
          <dl className="wait__counts">
            <div>
              <dt>Venue</dt>
              <dd>{summary.venueId}</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>
                {summary.localStart} · {summary.timezone}
              </dd>
            </div>
            <div>
              <dt>Reservation</dt>
              <dd>{summary.reservationStatus}</dd>
            </div>
          </dl>
          {summary.unknownFactIds.length ? (
            <p className="card__unknown">
              Unknown required facts remain — this cannot be marked fully ready.
            </p>
          ) : null}
          <p className="form__note">
            Approving confirms the group&apos;s plan inside Common Ground. It does{" "}
            <strong>not</strong> reserve a table, charge a card, or message the venue.
          </p>
          <div className="form__actions">
            <button type="button" className="btn" onClick={() => void copyBrief()}>
              {copied ? "Copied" : "Copy planning brief"}
            </button>
            <a
              className="btn btn--ghost"
              href={`/api/events/${eventId}/export?format=ics${summary.exportKind === "tentative" ? "&tentative=1" : ""}`}
              download
            >
              Download calendar file (reservation still unconfirmed)
            </a>
          </div>
          {role === "host" ? (
            <div className="form__actions">
              <button type="button" className="btn btn--ghost" onClick={() => void repeatEvent()}>
                Duplicate settings for a new outing
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <p className="form__note">Loading export…</p>
      )}
      {eventId ? <FeedbackForm eventId={eventId} isHost={role === "host"} /> : null}
    </div>
  );
}
