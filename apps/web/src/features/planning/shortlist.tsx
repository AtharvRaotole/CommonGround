import type { ReactNode } from "react";

export type ShortlistCard = {
  venueId: string;
  name: string;
  role: "best_compromise" | "mean_rank_alternative" | "familiar_fallback";
  meta: string;
  clauses: { text: string; evidenceIds: string[] }[];
  unknownLabels: string[];
  sourceUrl?: string | null;
  dataMode: "live" | "synthetic";
};

const ROLE_LABEL = {
  best_compromise: "Best compromise",
  mean_rank_alternative: "Mean-rank alternative",
  familiar_fallback: "Familiar fallback",
} as const;

type Props = {
  cards: ShortlistCard[];
  tasteMode: "full" | "mixed";
  profiledMemberCount: number;
  totalMemberCount: number;
  onVeto?: (venueId: string) => void;
  onSelect?: (venueId: string) => void;
  selectedVenueId?: string | null;
  vetoPendingVenueId?: string | null;
  footer?: ReactNode;
};

/** Provenance-backed shortlist — ordinal language only; no % likelihood. */
export function Shortlist({
  cards,
  tasteMode,
  profiledMemberCount,
  totalMemberCount,
  onVeto,
  onSelect,
  selectedVenueId,
  vetoPendingVenueId,
  footer,
}: Props) {
  return (
    <section className="shortlist" aria-labelledby="shortlist-title">
      <h1 id="shortlist-title" className="page__title">
        Shortlist
      </h1>
      <p className="page__lede">
        Options balance relative taste ranking on one slate. That is an ordinal compromise — not a
        percent likelihood, calibrated happiness score, or fairness guarantee.
      </p>
      <p className="badge" role="status">
        {cards[0]?.dataMode === "live" ? "Live planning" : "Synthetic example — not a live recommendation"}
      </p>
      {tasteMode === "mixed" ? (
        <p className="form__note" role="note">
          Some members skipped cultural seeds ({profiledMemberCount}/{totalMemberCount}). We won&apos;t
          claim full-group cultural fit.
        </p>
      ) : null}
      <ol className="cards">
        {cards.map((card, index) => (
          <li key={card.venueId} className="card">
            <p className="card__kicker">
              {index + 1} · {ROLE_LABEL[card.role]}
            </p>
            <h2>{card.name}</h2>
            <p className="card__meta">{card.meta}</p>
            <ul className="card__clauses">
              {card.clauses.map((c) => (
                <li key={c.text}>
                  <span data-kind={c.evidenceIds.length ? "fact" : "relative"}>{c.text}</span>
                  {c.evidenceIds.length ? (
                    <span className="card__evidence"> Evidence: {c.evidenceIds.join(", ")}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            {card.unknownLabels.map((u) => (
              <p key={u} className="card__unknown">
                Unknown: {u}
              </p>
            ))}
            {card.sourceUrl ? (
              <p className="card__source">
                <a href={card.sourceUrl} rel="noreferrer noopener">
                  Source
                </a>
              </p>
            ) : null}
            <div className="form__actions">
              {onSelect ? (
                <button
                  type="button"
                  className="btn"
                  aria-pressed={selectedVenueId === card.venueId}
                  onClick={() => onSelect(card.venueId)}
                >
                  {selectedVenueId === card.venueId ? "Selected" : "Accept this venue"}
                </button>
              ) : null}
              {onVeto ? (
                <button
                  type="button"
                  className="btn btn--ghost"
                  aria-label={`Doesn't work for me: ${card.name}`}
                  aria-pressed={vetoPendingVenueId === card.venueId}
                  onClick={() => onVeto(card.venueId)}
                >
                  {vetoPendingVenueId === card.venueId
                    ? "Choose a private reason below"
                    : "Doesn't work for me"}
                </button>
              ) : null}
            </div>
            <p className="form__note">
              Your name and reason stay private. The host only sees that someone objected.
            </p>
          </li>
        ))}
      </ol>
      {footer}
      <p className="form__note">
        Approving confirms the plan inside Common Ground. It does not reserve a table.
      </p>
    </section>
  );
}
