import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import "./taste.css";

export type TasteCandidate = {
  entityId: string;
  name: string;
  type: string;
  context?: string;
};

export type TasteSeed = TasteCandidate & { confirmedAt: string };

type SearchStatus = "idle" | "loading" | "ok" | "no_match" | "timeout" | "quota" | "unavailable";

const TYPE_LABEL: Record<string, string> = {
  "urn:entity:artist": "Artist",
  "urn:entity:movie": "Film",
  "urn:entity:book": "Book",
  "urn:entity:place": "Place",
};

type Props = {
  eventId: string;
  seeds: TasteSeed[];
  onChange: (seeds: TasteSeed[]) => void;
  disabled?: boolean;
};

async function searchEntities(
  eventId: string,
  query: string,
): Promise<{ status: SearchStatus; candidates: TasteCandidate[] }> {
  const res = await fetch(`/api/events/${eventId}/me/entity-search`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const data = (await res.json().catch(() => null)) as {
    status?: SearchStatus;
    candidates?: TasteCandidate[];
  } | null;
  if (!data?.status) {
    return { status: "unavailable", candidates: [] };
  }
  return { status: data.status, candidates: data.candidates ?? [] };
}

export function TastePicker({ eventId, seeds, onChange, disabled }: Props) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [candidates, setCandidates] = useState<TasteCandidate[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2 || seeds.length >= 3 || disabled) {
      setCandidates([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    debounceRef.current = window.setTimeout(() => {
      void (async () => {
        const result = await searchEntities(eventId, q);
        setStatus(result.status);
        setCandidates(result.candidates);
        setActiveIndex(0);
      })();
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, eventId, seeds.length, disabled]);

  function confirm(candidate: TasteCandidate) {
    if (seeds.length >= 3) return;
    if (seeds.some((s) => s.entityId === candidate.entityId)) return;
    onChange([
      ...seeds,
      { ...candidate, confirmedAt: new Date().toISOString() },
    ]);
    setQuery("");
    setCandidates([]);
    setStatus("idle");
  }

  function remove(entityId: string) {
    onChange(seeds.filter((s) => s.entityId !== entityId));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!candidates.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, candidates.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = candidates[activeIndex];
      if (pick) confirm(pick);
    }
  }

  return (
    <div className="taste">
      <p className="taste__lede">
        Optionally pick up to three favorites. Ambiguous names need an explicit choice — we never
        invent an ID from typed text.
      </p>

      <ul className="taste__seeds" aria-label="Confirmed favorites">
        {seeds.map((s) => (
          <li key={s.entityId}>
            <span>
              <strong>{s.name}</strong>
              <em>{TYPE_LABEL[s.type] ?? s.type}</em>
              {s.context ? <small>{s.context}</small> : null}
            </span>
            <button type="button" onClick={() => remove(s.entityId)} disabled={disabled}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      {seeds.length < 3 ? (
        <label className="taste__search">
          Search
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Artist, film, book, or place"
            minLength={2}
            maxLength={80}
            disabled={disabled}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={candidates.length > 0}
          />
        </label>
      ) : (
        <p className="taste__note" role="status">
          Three favorites selected. Remove one to search again.
        </p>
      )}

      {status === "loading" ? <p className="taste__note">Searching…</p> : null}
      {status === "no_match" ? (
        <p className="taste__note" role="status">
          No match. Try another query, or skip profiling.
        </p>
      ) : null}
      {status === "timeout" || status === "unavailable" ? (
        <p className="taste__error" role="alert">
          Lookup unavailable. You can edit your query or skip for now.
        </p>
      ) : null}
      {status === "quota" ? (
        <p className="taste__error" role="alert">
          Daily lookup budget reached. You can still keep confirmed picks or skip.
        </p>
      ) : null}

      {candidates.length > 0 ? (
        <ul id={listId} className="taste__candidates" role="listbox">
          {candidates.map((c, i) => (
            <li key={c.entityId} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                className={i === activeIndex ? "is-active" : undefined}
                onClick={() => confirm(c)}
              >
                <strong>{c.name}</strong>
                <em>{TYPE_LABEL[c.type] ?? c.type}</em>
                {c.context ? <small>{c.context}</small> : null}
                <span className="taste__confirm">Confirm</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
