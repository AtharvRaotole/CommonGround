import { useState, type FormEvent } from "react";

type Props = {
  eventId: string;
  isHost: boolean;
};

export function FeedbackForm({ eventId, isHost }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    const attended = String(fd.get("attended") || "");
    const actualFit = String(fd.get("actualFit") || "");
    const planningExperience = String(fd.get("planningExperience") || "");
    if (attended) body.attended = attended;
    if (actualFit) body.actualFit = actualFit;
    if (planningExperience) body.planningExperience = planningExperience;
    if (isHost) {
      const mins = Number(fd.get("hostActiveMinutes"));
      if (Number.isFinite(mins)) body.hostActiveMinutes = mins;
      const support = Number(fd.get("supportMinutes"));
      if (Number.isFinite(support)) body.supportMinutes = support;
      if (fd.get("venueChanged") === "on") body.venueChanged = true;
    }
    const res = await fetch(`/api/events/${eventId}/feedback`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError("Could not save feedback.");
      return;
    }
    setStatus("Saved. Missing answers stay missing — a no-show is not a dislike.");
  }

  return (
    <form className="form" onSubmit={(e) => void onSubmit(e)} aria-labelledby="feedback-title">
      <h1 id="feedback-title" className="page__title">
        How did it go?
      </h1>
      <p className="page__lede">
        Attendance, fit, and planning experience are separate optional answers.
      </p>
      <label>
        Did you attend?
        <select name="attended" defaultValue="">
          <option value="">Skip</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
          <option value="skipped">Skipped / no-show</option>
        </select>
      </label>
      <label>
        Actual venue fit
        <select name="actualFit" defaultValue="">
          <option value="">Skip</option>
          <option value="good">Good</option>
          <option value="ok">OK</option>
          <option value="poor">Poor</option>
        </select>
      </label>
      <label>
        Planning experience
        <select name="planningExperience" defaultValue="">
          <option value="">Skip</option>
          <option value="smooth">Smooth</option>
          <option value="ok">OK</option>
          <option value="frustrating">Frustrating</option>
        </select>
      </label>
      {isHost ? (
        <>
          <label>
            Active planning minutes
            <input name="hostActiveMinutes" type="number" min={0} max={1440} />
          </label>
          <label>
            Support / verification minutes
            <input name="supportMinutes" type="number" min={0} max={1440} />
          </label>
          <label className="form__check">
            <input name="venueChanged" type="checkbox" />
            <span>Group changed venue after the plan</span>
          </label>
        </>
      ) : null}
      {error ? (
        <p className="form__error" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="form__note" role="status">
          {status}
        </p>
      ) : null}
      <button type="submit" className="btn">
        Save feedback
      </button>
    </form>
  );
}
