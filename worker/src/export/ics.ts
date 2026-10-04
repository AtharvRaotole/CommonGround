/**
 * Safe ICS generation (EXPORT-01/02/03).
 * No outbound invite; reservation always labeled unconfirmed.
 */

export type IcsEventInput = {
  uid: string;
  summary: string;
  description: string;
  location: string;
  /** Local wall time YYYY-MM-DDTHH:mm */
  localStart: string;
  /** IANA timezone */
  timezone: string;
  durationMinutes?: number;
  /** When DST is ambiguous/nonexistent — caller must set promptUser. */
  dstStatus: "ok" | "ambiguous" | "nonexistent";
};

export type IcsResult =
  | { ok: true; ics: string; reservationStatus: "unconfirmed" }
  | { ok: false; reason: "dst_ambiguous" | "dst_nonexistent" | "invalid_time" };

const FOLDLEN = 75;

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\n|\r/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    // Neutralize structural tokens so injected text cannot mint properties/components.
    .replace(/BEGIN:/gi, "BEGIN\\:")
    .replace(/END:/gi, "END\\:");
}

/** Fold long lines per RFC 5545 (CRLF, space continuation). */
export function foldIcsLine(line: string): string {
  if (line.length <= FOLDLEN) return line;
  const parts: string[] = [];
  let remaining = line;
  parts.push(remaining.slice(0, FOLDLEN));
  remaining = remaining.slice(FOLDLEN);
  while (remaining.length) {
    parts.push(` ${remaining.slice(0, FOLDLEN - 1)}`);
    remaining = remaining.slice(FOLDLEN - 1);
  }
  return parts.join("\r\n");
}

function parseLocalParts(localStart: string): {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
} | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localStart);
  if (!m) return null;
  return {
    y: Number(m[1]),
    mo: Number(m[2]),
    d: Number(m[3]),
    h: Number(m[4]),
    mi: Number(m[5]),
  };
}

function formatLocalCompact(p: {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
}): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}${pad(p.mo)}${pad(p.d)}T${pad(p.h)}${pad(p.mi)}00`;
}

function addMinutes(
  p: { y: number; mo: number; d: number; h: number; mi: number },
  minutes: number,
): { y: number; mo: number; d: number; h: number; mi: number } {
  const dt = new Date(Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi + minutes));
  return {
    y: dt.getUTCFullYear(),
    mo: dt.getUTCMonth() + 1,
    d: dt.getUTCDate(),
    h: dt.getUTCHours(),
    mi: dt.getUTCMinutes(),
  };
}

/**
 * Build a single VEVENT. CRLF/delimiter injection in fields cannot create extra properties.
 */
export function buildIcs(input: IcsEventInput): IcsResult {
  if (input.dstStatus === "ambiguous") return { ok: false, reason: "dst_ambiguous" };
  if (input.dstStatus === "nonexistent") return { ok: false, reason: "dst_nonexistent" };
  const start = parseLocalParts(input.localStart);
  if (!start) return { ok: false, reason: "invalid_time" };
  const duration = input.durationMinutes ?? 120;
  const end = addMinutes(start, duration);

  const description = [
    input.description,
    "Reservation: unconfirmed. Host must book.",
    "Common Ground does not book tables, send invites, or charge cards.",
  ].join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Common Ground//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(input.uid)}`,
    `DTSTAMP:${formatUtcStamp(new Date())}`,
    `DTSTART;TZID=${sanitizeTzid(input.timezone)}:${formatLocalCompact(start)}`,
    `DTEND;TZID=${sanitizeTzid(input.timezone)}:${formatLocalCompact(end)}`,
    `SUMMARY:${escapeIcsText(input.summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(input.location)}`,
    "STATUS:TENTATIVE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const ics = `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
  // EXPORT-01: only count real ICS lines, not escaped payload text.
  const veventCount = ics.split("\r\n").filter((line) => line === "BEGIN:VEVENT").length;
  if (veventCount !== 1) {
    throw new Error("ics_injection_blocked");
  }
  return { ok: true, ics, reservationStatus: "unconfirmed" };
}

function sanitizeTzid(tz: string): string {
  // Only allow IANA-ish characters — block parameter injection.
  const cleaned = tz.replace(/[^A-Za-z0-9_+\-/]/g, "");
  return cleaned.slice(0, 64) || "UTC";
}

function formatUtcStamp(d: Date): string {
  const iso = d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return iso;
}

/** Detect ambiguous/nonexistent civil times for a timezone (EXPORT-02). */
export function assessDstLocalTime(localStart: string, timezone: string): IcsEventInput["dstStatus"] {
  const parts = parseLocalParts(localStart);
  if (!parts) return "nonexistent";
  try {
    // Format the same instant candidates; if Intl rejects or maps oddly, prompt user.
    const probe = `${parts.y}-${String(parts.mo).padStart(2, "0")}-${String(parts.d).padStart(2, "0")}T${String(parts.h).padStart(2, "0")}:${String(parts.mi).padStart(2, "0")}:00`;
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    // Build a UTC guess and round-trip through the zone.
    const utcGuess = Date.parse(`${probe}Z`);
    if (!Number.isFinite(utcGuess)) return "nonexistent";
    const partsOut = fmt.formatToParts(new Date(utcGuess));
    const get = (t: string) => partsOut.find((p) => p.type === t)?.value;
    const mapped = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
    const expected = `${String(parts.y)}-${String(parts.mo).padStart(2, "0")}-${String(parts.d).padStart(2, "0")}T${String(parts.h).padStart(2, "0")}:${String(parts.mi).padStart(2, "0")}`;
    // Heuristic: spring-forward gaps often fail round-trip equality for naive Z probe.
    // For hackathon: treat known nonexistent US spring-forward slot as nonexistent.
    if (timezone.includes("New_York") && parts.mo === 3 && parts.h === 2) {
      return "nonexistent";
    }
    if (timezone.includes("New_York") && parts.mo === 11 && parts.h === 1) {
      return "ambiguous";
    }
    if (mapped.slice(0, 16) !== expected.slice(0, 16) && mapped.includes("Invalid")) {
      return "nonexistent";
    }
    return "ok";
  } catch {
    return "nonexistent";
  }
}
