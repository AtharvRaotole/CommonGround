import { Link } from "react-router-dom";
import "./landing.css";

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing__top">
        <span className="landing__mode" data-mode="example">
          Synthetic example available
        </span>
        <nav className="landing__nav" aria-label="Primary">
          <Link to="/example">Walk through</Link>
        </nav>
      </header>

      <main className="landing__hero">
        <p className="landing__eyebrow">For hosts of small recurring dinners</p>
        <h1 className="landing__brand">Common Ground</h1>
        <p className="landing__support">
          Agree on where the group goes — without another endless thread.
        </p>
        <div className="landing__cta">
          <Link className="btn btn--primary" to="/host/new">
            Plan an outing
          </Link>
          <Link className="btn btn--ghost" to="/example">
            See a synthetic plan
          </Link>
        </div>
        <p className="landing__footnote">
          Approving a plan is not a reservation. Ranking signals are not enjoyment percentages.
        </p>
      </main>

      <aside className="landing__plan" aria-label="Plan stages">
        <ol className="plan-strip">
          <li className="is-active">Collect</li>
          <li>Shortlist</li>
          <li>Agree</li>
          <li>Handoff</li>
        </ol>
      </aside>
    </div>
  );
}
