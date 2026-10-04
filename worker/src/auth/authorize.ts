export type Role = "host" | "member";

export type SessionContext = {
  sessionId: string;
  eventId: string;
  participantId: string;
  role: Role;
};

export type PreferenceRow = {
  participant_id: string;
  event_id: string;
  seeds_json: string;
  consent_taste: number;
};

export type ConsentRow = {
  participant_id: string;
  skip_profiling: number;
  taste_opt_in: number;
};

export type ParticipantRow = {
  id: string;
  role: Role;
};

/** Host DTO must never include another member's seeds or objection reasons. */
export function toEventDto(input: {
  event: {
    id: string;
    title: string;
    group_size: number;
    state: string;
    version: number;
    area: string | null;
    results_invalid_at?: string | null;
  };
  viewer: SessionContext;
  preferences: PreferenceRow[];
  participants: ParticipantRow[];
  consents?: ConsentRow[];
}): Record<string, unknown> {
  const own = preferencesFor(input.preferences, input.viewer.participantId);
  const consentById = new Map(
    (input.consents ?? []).map((c) => [c.participant_id, c] as const),
  );
  const membersTotal = input.participants.length;
  let membersProfiled = 0;
  let membersSkipped = 0;
  let membersCompleted = 0;

  for (const p of input.participants) {
    const pref = preferencesFor(input.preferences, p.id);
    const consent = consentById.get(p.id);
    const skipped = !!consent?.skip_profiling;
    let seedCount = 0;
    try {
      seedCount = pref ? JSON.parse(pref.seeds_json).length : 0;
    } catch {
      seedCount = 0;
    }
    if (skipped) {
      membersSkipped += 1;
      membersCompleted += 1;
    } else if (seedCount > 0) {
      membersProfiled += 1;
      membersCompleted += 1;
    }
  }

  const ownConsent = consentById.get(input.viewer.participantId);

  return {
    id: input.event.id,
    title: input.event.title,
    groupSize: input.event.group_size,
    state: input.event.state,
    version: input.event.version,
    area: input.event.area,
    role: input.viewer.role,
    resultsInvalid: !!input.event.results_invalid_at,
    me: {
      participantId: input.viewer.participantId,
      seeds: own ? JSON.parse(own.seeds_json) : [],
      consentTaste: own ? !!own.consent_taste : false,
      skipProfiling: !!ownConsent?.skip_profiling,
    },
    // Aggregate only — never per-member seed matrices or objection reasons.
    membersProfiled,
    membersSkipped,
    membersCompleted,
    membersTotal,
  };
}

function preferencesFor(
  rows: PreferenceRow[],
  participantId: string,
): PreferenceRow | undefined {
  return rows.find((r) => r.participant_id === participantId);
}

export function assertSameOrigin(request: Request, allowedOrigins: string[]): boolean {
  if (request.method === "GET" || request.method === "HEAD") return true;
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  return allowedOrigins.includes(origin);
}

export function genericUnauthorized(): Response {
  return Response.json(
    {
      code: "unauthorized",
      message: "Not found or not authorized",
      retryable: false,
      requestId: crypto.randomUUID(),
    },
    { status: 404 },
  );
}
