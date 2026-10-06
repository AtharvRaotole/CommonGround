import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TastePicker, type TasteSeed } from "../features/taste/TastePicker";
import "./form.css";

const CONSENT_VERSION = "2026-10-04-v1";

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian evidence needed" },
  { id: "vegan", label: "Vegan evidence needed" },
  { id: "halal", label: "Halal evidence needed" },
] as const;

export function JoinPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"claiming" | "form" | "error">("claiming");
  const [error, setError] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [seeds, setSeeds] = useState<TasteSeed[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [budgetDollars, setBudgetDollars] = useState("");
  const [stepFree, setStepFree] = useState(false);
  const [dietary, setDietary] = useState<string[]>([]);

  useEffect(() => {
    const secret = window.location.hash.replace(/^#/, "").trim();
    if (!secret) {
      setError("Missing invite. Ask the host for a fresh link.");
      setPhase("error");
      return;
    }
    void (async () => {
      const res = await fetch("/api/claims", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = (await res.json().catch(() => null)) as {
        eventId?: string;
        participantId?: string;
        code?: string;
      } | null;
      // Erase capability from the address bar immediately after exchange.
      history.replaceState(null, "", "/join");
      if (!res.ok || !data?.eventId || !data.participantId) {
        setError(
          data?.code === "conflict"
            ? "This invite was already used."
            : "Invite not found or expired.",
        );
        setPhase("error");
        return;
      }
      setEventId(data.eventId);
      setParticipantId(data.participantId);
      setPhase("form");
    })();
  }, []);

  async function saveHardNeeds() {
    if (!eventId || !participantId) return true;
    const puts: Promise<Response>[] = [];
    const budget = budgetDollars.trim();
    if (budget) {
      const dollars = Number(budget);
      if (!Number.isFinite(dollars) || dollars < 0) {
        setError("Budget must be a non-negative dollar amount.");
        return false;
      }
      puts.push(
        fetch(`/api/events/${eventId}/constraints`, {
          method: "PUT",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            ownerId: participantId,
            kind: "budget",
            required: true,
            value: {
              maxCents: Math.round(dollars * 100),
              currency: "USD",
              includesTaxTipDrinks: "unknown",
            },
          }),
        }),
      );
    }
    if (stepFree) {
      puts.push(
        fetch(`/api/events/${eventId}/constraints`, {
          method: "PUT",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            ownerId: participantId,
            kind: "access",
            required: true,
            value: { field: "step_free", expected: true },
          }),
        }),
      );
    }
    if (dietary.length) {
      puts.push(
        fetch(`/api/events/${eventId}/constraints`, {
          method: "PUT",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            ownerId: participantId,
            kind: "dietary",
            required: true,
            value: { tags: dietary, allergySafeClaim: false },
          }),
        }),
      );
    }
    if (!puts.length) return true;
    const results = await Promise.all(puts);
    if (results.some((r) => !r.ok)) {
      setError("Could not save hard needs. Taste picks were not saved either.");
      return false;
    }
    return true;
  }

  async function savePreferences(opts: { skip: boolean }) {
    if (!eventId) return;
    setBusy(true);
    setError(null);
    const needsOk = await saveHardNeeds();
    if (!needsOk) {
      setBusy(false);
      return;
    }
    const res = await fetch(`/api/events/${eventId}/me/preferences`, {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        opts.skip
          ? {
              seeds: [],
              consentTaste: false,
              skipProfiling: true,
              consentVersion: CONSENT_VERSION,
            }
          : {
              seeds,
              consentTaste: consent,
              skipProfiling: false,
              consentVersion: CONSENT_VERSION,
            },
      ),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not save. Check your selections or try skip profiling.");
      return;
    }
    navigate(`/waiting?event=${encodeURIComponent(eventId)}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!consent) {
      setError("Confirm the consent notice before saving taste picks.");
      return;
    }
    void savePreferences({ skip: false });
  }

  function toggleDietary(tag: string) {
    setDietary((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  return (
    <div className="page">
      <p className="page__back">
        <Link to="/">← Common Ground</Link>
      </p>
      <h1 className="page__title">Join the outing</h1>
      <p className="page__lede">
        Your picks and hard needs stay private to you. The host only sees completion counts — never
        your list.
      </p>

      {phase === "claiming" ? <p className="form__note">Opening your private session…</p> : null}
      {phase === "error" ? (
        <p className="form__error" role="alert">
          {error}
        </p>
      ) : null}

      {phase === "form" && eventId ? (
        <form className="form" onSubmit={onSubmit}>
          <fieldset className="form__fieldset">
            <legend>Hard needs (checked before taste ranking)</legend>
            <label>
              Per-person budget ceiling (USD, optional)
              <input
                type="number"
                min={0}
                step={1}
                value={budgetDollars}
                onChange={(e) => setBudgetDollars(e.target.value)}
                placeholder="40"
                disabled={busy}
              />
            </label>
            <label className="form__check">
              <input
                type="checkbox"
                checked={stepFree}
                onChange={(e) => setStepFree(e.target.checked)}
                disabled={busy}
              />
              <span>I need step-free access evidence (unknown ≠ satisfied)</span>
            </label>
            <p className="form__note">Dietary tags request evidence — never an allergy-safety claim.</p>
            {DIETARY_OPTIONS.map((opt) => (
              <label key={opt.id} className="form__check">
                <input
                  type="checkbox"
                  checked={dietary.includes(opt.id)}
                  onChange={() => toggleDietary(opt.id)}
                  disabled={busy}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </fieldset>

          <TastePicker eventId={eventId} seeds={seeds} onChange={setSeeds} disabled={busy} />

          <label className="form__check">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I understand taste signals are voluntary cultural preferences (not a diagnosis),
              consent version {CONSENT_VERSION}.
            </span>
          </label>

          {error ? (
            <p className="form__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="form__actions">
            <button className="btn btn--primary" type="submit" disabled={busy || seeds.length === 0}>
              Save favorites
            </button>
            <button
              className="btn"
              type="button"
              disabled={busy}
              onClick={() => void savePreferences({ skip: true })}
            >
              Skip profiling
            </button>
          </div>
          <p className="form__note" role="note">
            Skipping keeps you in the group. Hard needs still apply. We will not invent ranks for you.
          </p>
        </form>
      ) : null}
    </div>
  );
}
