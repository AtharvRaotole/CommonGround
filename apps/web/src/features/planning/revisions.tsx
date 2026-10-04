type Diff = {
  added?: string[];
  removed?: string[];
  changed?: string[];
};

type Props = {
  revisionId: string;
  eventVersion: number;
  parentRevisionId?: string | null;
  diff?: Diff | null;
  groupSummary?: string | null;
  onReplan?: () => void;
};

/** Shows what changed after a veto/replan — requires host review on the new version. */
export function RevisionBanner({
  revisionId,
  eventVersion,
  parentRevisionId,
  diff,
  groupSummary,
  onReplan,
}: Props) {
  const hasDiff = !!(diff?.added?.length || diff?.removed?.length || diff?.changed?.length);
  return (
    <aside className="revision" aria-labelledby="revision-title">
      <h2 id="revision-title" className="revision__title">
        Revision {revisionId.slice(0, 8)}
      </h2>
      <p className="form__note">
        Event version {eventVersion}
        {parentRevisionId ? ` · replaces ${parentRevisionId.slice(0, 8)}` : ""}
      </p>
      {groupSummary ? (
        <p className="revision__summary" role="status">
          {groupSummary}
        </p>
      ) : null}
      {hasDiff ? (
        <ul className="revision__diff">
          {(diff?.removed ?? []).map((id) => (
            <li key={`r-${id}`}>Removed: {id}</li>
          ))}
          {(diff?.added ?? []).map((id) => (
            <li key={`a-${id}`}>Added: {id}</li>
          ))}
          {(diff?.changed ?? []).map((id) => (
            <li key={`c-${id}`}>Changed: {id}</li>
          ))}
        </ul>
      ) : null}
      <p className="form__note">
        A veto invalidates the previous approval. Review this version before exporting.
      </p>
      {onReplan ? (
        <button type="button" className="btn" onClick={onReplan}>
          Run replan
        </button>
      ) : null}
    </aside>
  );
}
