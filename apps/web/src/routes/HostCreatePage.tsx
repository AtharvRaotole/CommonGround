import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import "./form.css";

type Created = {
  eventId: string;
  hostRecoverySecret: string;
  hostClaimSecret: string;
};

export function HostCreatePage() {
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [invitePath, setInvitePath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const size = Number(data.get("size"));
    if (!Number.isFinite(size) || size < 4 || size > 8) {
      setError("Group size must be between 4 and 8.");
      return;
    }
    if (!String(data.get("timezone") || "").trim()) {
      setError("Choose a timezone — we won't guess daylight-saving.");
      return;
    }
    setError(null);
    setBusy(true);
    const res = await fetch("/api/events", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: String(data.get("title") || "").trim(),
        groupSize: size,
        area: String(data.get("area") || "").trim() || undefined,
        timezone: String(data.get("timezone") || "").trim(),
      }),
    });
    const body = (await res.json().catch(() => null)) as Created | { message?: string } | null;
    if (!res.ok || !body || !("eventId" in body)) {
      setBusy(false);
      setError((body && "message" in body && body.message) || "Could not create event.");
      return;
    }

    const claim = await fetch("/api/claims", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: body.hostClaimSecret }),
    });
    setBusy(false);
    if (!claim.ok) {
      setError("Event created but host session claim failed. Use the recovery secret.");
      setCreated(body);
      return;
    }
    setCreated(body);
  }

  async function mintInvite() {
    if (!created) return;
    setBusy(true);
    const res = await fetch(`/api/events/${created.eventId}/invites`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const data = (await res.json().catch(() => null)) as { claimPath?: string } | null;
    setBusy(false);
    if (!res.ok || !data?.claimPath) {
      setError("Could not mint invite.");
      return;
    }
    setInvitePath(data.claimPath);
  }

  return (
    <div className="page">
      <p className="page__back">
        <Link to="/">← Common Ground</Link>
      </p>
      <h1 className="page__title">Plan an outing</h1>
      <p className="page__lede">
        You choose the people and the occasion. We help the group agree on a venue.
      </p>

      {!created ? (
        <form className="form" onSubmit={onSubmit} noValidate>
          <label>
            Title
            <input name="title" required maxLength={80} placeholder="Thursday dinner" />
          </label>
          <label>
            Group size (4–8)
            <input name="size" type="number" min={4} max={8} defaultValue={6} required />
          </label>
          <label>
            Local date & time
            <input name="when" type="datetime-local" required />
          </label>
          <label>
            Timezone
            <input name="timezone" list="tz" placeholder="America/New_York" required />
            <datalist id="tz">
              <option value="America/New_York" />
              <option value="America/Chicago" />
              <option value="America/Los_Angeles" />
            </datalist>
          </label>
          <label>
            Neighborhood / catchment
            <input name="area" placeholder="East Village + Williamsburg" />
          </label>
          <p className="form__note" role="note">
            Saving a brief does not book a table. Free-tier Workers + D1 only.
          </p>
          {error ? (
            <p className="form__error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="btn btn--primary" type="submit" disabled={busy}>
            Create event
          </button>
        </form>
      ) : (
        <div className="form">
          <p className="form__ok" role="status">
            Event ready. Save the host recovery secret — it is shown once.
          </p>
          <label>
            Event id
            <input readOnly value={created.eventId} />
          </label>
          <label>
            Host recovery secret
            <textarea readOnly rows={3} value={created.hostRecoverySecret} />
          </label>
          <div className="form__actions">
            <button className="btn btn--primary" type="button" disabled={busy} onClick={() => void mintInvite()}>
              Mint member invite
            </button>
            <Link className="btn" to={`/waiting?event=${encodeURIComponent(created.eventId)}`}>
              Open waiting room
            </Link>
          </div>
          {invitePath ? (
            <label>
              Member invite path (share privately; secret is in the fragment)
              <input readOnly value={invitePath} />
            </label>
          ) : null}
          {error ? (
            <p className="form__error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
