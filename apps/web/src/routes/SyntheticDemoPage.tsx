import { Link } from "react-router-dom";
import "./form.css";
import "./demo.css";

const OPTIONS = [
  {
    title: "Synthetic Noodle Room",
    role: "Best compromise",
    meta: "East Village · $$ · noodles",
    fit: "Matches two hard needs (budget, late seating). Cultural ranking labeled synthetic.",
    unknown: "Step-free access unverified",
  },
  {
    title: "Synthetic Brasserie",
    role: "Familiar fallback",
    meta: "Tribeca · $$$ · brasserie",
    fit: "Familiar fallback for hosts who listed a prior visit.",
    unknown: "Party of 7 may exceed stated reservation cap",
  },
  {
    title: "Synthetic Vegetarian Diner",
    role: "Mean-rank alternative",
    meta: "East Village · $$ · vegetarian",
    fit: "Discovery option when a member requires vegetarian evidence.",
    unknown: "Walk-in likelihood unknown",
  },
] as const;

export function SyntheticDemoPage() {
  return (
    <div className="page example-table">
      <p className="page__back">
        <Link to="/">← Common Ground</Link>
      </p>
      <p className="badge">Synthetic example. Not a live recommendation.</p>
      <h1 className="page__title">Shortlist</h1>
      <p className="page__lede">
        Options balance relative taste ranking on one slate. That is an ordinal compromise, not a
        percent likelihood, calibrated happiness score, or fairness guarantee.
      </p>
      <ol className="place-cards">
        {OPTIONS.map((option) => (
          <li key={option.title} className="place-card">
            <p className="place-card__ribbon">{option.role}</p>
            <h2>{option.title}</h2>
            <p className="place-card__meta">{option.meta}</p>
            <p>{option.fit}</p>
            <p className="place-card__unknown">Unknown: {option.unknown}</p>
          </li>
        ))}
      </ol>
      <p className="form__note">
        Live path: “Doesn&apos;t work for me” records a private objection reason. Your name and
        reason stay private. The host only sees that someone objected.
      </p>
      <p className="form__note">
        Approving confirms the plan inside Common Ground. It does not reserve a table.
      </p>
    </div>
  );
}
