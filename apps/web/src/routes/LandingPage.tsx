import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import "./landing.css";

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing__top">
        <Link className="landing__brandlink" to="/">
          <BrandMark className="landing__mark" />
          <span>Common Ground</span>
        </Link>
        <nav className="landing__nav" aria-label="Primary">
          <Link to="/demo">Watch the story</Link>
          <Link to="/example">Walk through</Link>
          <Link to="/privacy">Privacy</Link>
        </nav>
      </header>

      <main className="landing__hero">
        <h1 className="landing__brand">Agree on the place.</h1>
        <p className="landing__support">
          Private tastes for a small group. One shortlist. No endless thread.
        </p>
        <div className="landing__cta">
          <Link className="btn btn--primary" to="/host/new">
            Plan an outing
          </Link>
          <Link className="btn btn--ghost" to="/demo">
            Guided demo
          </Link>
        </div>
        <p className="landing__footnote">
          Approving a plan is not a reservation. Ranking signals are not enjoyment percentages.
        </p>
      </main>
    </div>
  );
}
