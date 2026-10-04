import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import "./form.css";

export function HostCreatePage() {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const size = Number(data.get("size"));
    if (!Number.isFinite(size) || size < 4 || size > 8) {
      setError("Group size must be between 4 and 8.");
      setSaved(false);
      return;
    }
    if (!String(data.get("timezone") || "").trim()) {
      setError("Choose a timezone — we won't guess daylight-saving.");
      setSaved(false);
      return;
    }
    setError(null);
    setSaved(true);
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
          Saving a brief does not book a table. Live invites arrive in a later build step.
        </p>
        {error ? (
          <p className="form__error" role="alert">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="form__ok" role="status">
            Brief looks valid (local-only). API persistence ships in P07.
          </p>
        ) : null}
        <button className="btn btn--primary" type="submit">
          Save brief
        </button>
      </form>
    </div>
  );
}
