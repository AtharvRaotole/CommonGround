import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./form.css";

type EventDto = {
  title: string;
  role: string;
  membersProfiled: number;
  membersSkipped: number;
  membersCompleted: number;
  membersTotal: number;
  me: { skipProfiling: boolean; seeds: unknown[] };
};

export function WaitingPage() {
  const [params] = useSearchParams();
  const eventId = params.get("event");
  const [dto, setDto] = useState<EventDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setError("Missing event.");
      return;
    }
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/events/${eventId}`, { credentials: "include" });
      if (!res.ok) {
        if (!cancelled) setError("Could not load event status.");
        return;
      }
      const data = (await res.json()) as EventDto;
      if (!cancelled) setDto(data);
    }
    void load();
    const id = window.setInterval(() => void load(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [eventId]);

  return (
    <div className="page">
      <p className="page__back">
        <Link to="/">← Common Ground</Link>
      </p>
      <h1 className="page__title">Waiting on the group</h1>
      <p className="page__lede">
        {dto?.role === "host"
          ? "You see completion counts only — never individual taste lists."
          : "You’re in. You can close this tab; the host sees that you finished."}
      </p>

      {error ? (
        <p className="form__error" role="alert">
          {error}
        </p>
      ) : null}

      {dto ? (
        <div className="wait">
          <h2 className="wait__title">{dto.title}</h2>
          <dl className="wait__counts">
            <div>
              <dt>Completed</dt>
              <dd>
                {dto.membersCompleted} / {dto.membersTotal}
              </dd>
            </div>
            <div>
              <dt>Profiled</dt>
              <dd>{dto.membersProfiled}</dd>
            </div>
            <div>
              <dt>Skipped profiling</dt>
              <dd>{dto.membersSkipped}</dd>
            </div>
          </dl>
          <p className="form__note">
            Your status:{" "}
            {dto.me.skipProfiling
              ? "skipped profiling"
              : dto.me.seeds.length
                ? `${dto.me.seeds.length} favorite(s) saved`
                : "not yet submitted"}
          </p>
        </div>
      ) : !error ? (
        <p className="form__note">Loading…</p>
      ) : null}

      {eventId ? (
        <p className="form__actions">
          <Link className="btn" to={`/plan?event=${eventId}`}>
            Open plan
          </Link>
        </p>
      ) : (
        <p className="form__note">Missing event — return home or use a join link.</p>
      )}
    </div>
  );
}
