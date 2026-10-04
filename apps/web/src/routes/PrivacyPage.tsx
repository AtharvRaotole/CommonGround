import { Link } from "react-router-dom";
import "./form.css";

export function PrivacyPage() {
  return (
    <div className="page">
      <p className="page__back">
        <Link to="/">← Common Ground</Link>
      </p>
      <h1 className="page__title">Privacy</h1>
      <p className="page__lede">
        This notice matches the implemented preview. We do not promise zero vendor retention.
      </p>
      <ul className="card__clauses">
        <li>Hosts see counts and aggregate shortlists — not your seed list or veto reason.</li>
        <li>
          You can delete your inputs for an outing; that revokes your session and clears your
          preferences, constraints, vetoes, and feedback.
        </li>
        <li>A skipped event or no-show is not recorded as a dislike.</li>
        <li>
          When live keys are configured, Qloo/OpenAI may process the minimum data needed under their
          terms. OpenAI calls use <code>store:false</code> when used — not a zero-retention guarantee.
        </li>
        <li>Capability links and cookies grant access until expiry or revocation if copied.</li>
      </ul>
      <p className="form__note">
        Full text: <code>docs/privacy/notice.md</code> in the repository.
      </p>
    </div>
  );
}
