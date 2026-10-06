type BrandMarkProps = {
  className?: string;
  /** When set, the mark is announced alone. Omit next to a visible wordmark. */
  title?: string;
};

/** Overlapping lenses: the shared ground between two people. */
export function BrandMark({ className, title }: BrandMarkProps) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="12.5" cy="16" r="9.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="19.5" cy="16" r="9.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M16 8.7c2.1 1.6 3.4 4.2 3.4 7.3s-1.3 5.7-3.4 7.3c-2.1-1.6-3.4-4.2-3.4-7.3s1.3-5.7 3.4-7.3Z"
        fill="currentColor"
        fillOpacity="0.18"
      />
    </svg>
  );
}
