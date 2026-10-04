import { useState } from "react";
import { Link } from "react-router-dom";
import "./form.css";
import "./demo.css";

const STEPS = ["Collect", "Shortlist", "Veto", "Replan", "Export"] as const;

const MEMBERS = [
  { name: "Alex", seeds: "ramen · indie film", need: "budget ≤ $$" },
  { name: "Sam", seeds: "jazz · natural wine", need: "late seating" },
  { name: "Jordan", seeds: "plant-forward · museums", need: "vegetarian evidence" },
  { name: "Riley", seeds: "skip profiling", need: "step-free unknown OK" },
] as const;

const FIRST_SHORTLIST = [
  {
    title: "Synthetic Noodle Room",
    meta: "East Village · $$ · noodles",
    fit: "Best compromise on one common slate — lowers the worst member rank.",
    unknown: "Step-free access unverified",
  },
  {
    title: "Synthetic Brasserie",
    meta: "Tribeca · $$$ · brasserie",
    fit: "Familiar fallback when a prior visit id is present — not popularity alone.",
    unknown: "Party of 7 may exceed reservation cap",
  },
  {
    title: "Synthetic Vegetarian Diner",
    meta: "East Village · $$ · vegetarian",
    fit: "Mean-rank alternative when it differs from worst-rank compromise.",
    unknown: "Walk-in likelihood unknown",
  },
] as const;

const REPLANNED = [
  {
    title: "Synthetic Vegetarian Diner",
    meta: "East Village · $$ · vegetarian",
    fit: "After a private veto, hard-vetoed venues never return. New ordinal pass on the remaining slate.",
    unknown: "Walk-in likelihood unknown",
  },
  {
    title: "Synthetic Herb Counter",
    meta: "West Village · $$ · small plates",
    fit: "Replacement candidate that still clears budget and late-seating tags.",
    unknown: "Noise level unverified",
  },
] as const;

export function DemoPage() {
  const [step, setStep] = useState(0);
  const [vetoed, setVetoed] = useState(false);

  const shortlist = vetoed && step >= 3 ? REPLANNED : FIRST_SHORTLIST;

  return (
    <div className="page demo">
      <p className="page__back">
        <Link to="/">← Common Ground</Link>
      </p>
      <p className="badge">Guided demo · Synthetic example — not a live recommendation</p>
      <h1 className="page__title">Four people, one outing</h1>
      <p className="page__lede">
        Cold walkthrough of the bounded agent loop: private intake → hard gates → ordinal shortlist →
        private veto → honest replan → export that still is not a reservation.
      </p>

      <ol className="demo__steps" aria-label="Demo stages">
        {STEPS.map((label, index) => (
          <li key={label} className={index === step ? "is-active" : index < step ? "is-done" : ""}>
            <button type="button" onClick={() => setStep(index)}>
              {label}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <section className="demo__panel" aria-labelledby="collect-title">
          <h2 id="collect-title">Collect (private)</h2>
          <p>
            Hosts see completion counts only. Seeds and veto reasons stay with the member session.
          </p>
          <ul className="demo__members">
            {MEMBERS.map((m) => (
              <li key={m.name}>
                <strong>{m.name}</strong>
                <span>{m.seeds}</span>
                <span className="demo__need">{m.need}</span>
              </li>
            ))}
          </ul>
          <p className="form__note">Live path uses genuine provider calls when a key exists; otherwise this labeled synthetic path.</p>
        </section>
      ) : null}

      {step === 1 || step === 2 || step === 3 ? (
        <section className="demo__panel" aria-labelledby="shortlist-title">
          <h2 id="shortlist-title">{step === 3 ? "Replan after veto" : "Shortlist"}</h2>
          <p>
            Hard requirements are evaluated before taste ranking. Unknown requirements are not treated
            as passed.
          </p>
          <ol className="cards">
            {shortlist.map((option, index) => (
              <li key={option.title} className="card">
                <p className="card__kicker">
                  {index + 1} ·{" "}
                  {index === 0
                    ? "Best compromise"
                    : index === 1
                      ? shortlist.length > 2
                        ? "Familiar fallback"
                        : "Replacement"
                      : "Mean-rank alternative"}
                </p>
                <h3>{option.title}</h3>
                <p className="card__meta">{option.meta}</p>
                <p>{option.fit}</p>
                <p className="card__unknown">Unknown: {option.unknown}</p>
                {step === 2 && index === 0 ? (
                  <p className="form__actions">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setVetoed(true);
                        setStep(3);
                      }}
                    >
                      Private veto (host sees count only)
                    </button>
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
          {step === 2 && !vetoed ? (
            <p className="form__note">Try a private veto on the top card — the reason is not shown to the host.</p>
          ) : null}
          {step === 3 && vetoed ? (
            <p className="form__note" role="status">
              Veto recorded. Prior approval invalidated. Replan used tools on a reduced slate — not a
              silent swap.
            </p>
          ) : null}
        </section>
      ) : null}

      {step === 4 ? (
        <section className="demo__panel" aria-labelledby="export-title">
          <h2 id="export-title">Export / handoff</h2>
          <p className="badge" role="status">
            Tentative handoff — reservation unconfirmed
          </p>
          <h3>{vetoed ? REPLANNED[0].title : FIRST_SHORTLIST[0].title}</h3>
          <p>
            Approving confirms the plan inside Common Ground. It does <strong>not</strong> reserve a
            table, charge a card, or message the venue.
          </p>
          <p className="card__unknown">Unknown: required access facts may still block a “ready” label.</p>
          <p className="form__note">
            Timestamps and claims on the live deploy are truthful. This page is always synthetic unless
            you start a real outing with live keys.
          </p>
          <div className="form__actions">
            <Link className="btn" to="/host/new">
              Start a live outing
            </Link>
            <Link className="btn btn--ghost" to="/example">
              Static shortlist only
            </Link>
          </div>
        </section>
      ) : null}

      <div className="form__actions demo__nav">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </button>
        <button
          type="button"
          className="btn"
          disabled={step === STEPS.length - 1}
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
