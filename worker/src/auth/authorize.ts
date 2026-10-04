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

/** Host DTO must never include another member's seeds. */
export function toEventDto(input: {
  event: {
    id: string;
    title: string;
    group_size: number;
    state: string;
    version: number;
    area: string | null;
  };
  viewer: SessionContext;
  preferences: PreferenceRow[];
}): Record<string, unknown> {
  const own = preferencesFor(input.preferences, input.viewer.participantId);
  return {
    id: input.event.id,
    title: input.event.title,
    groupSize: input.event.group_size,
    state: input.event.state,
    version: input.event.version,
    area: input.event.area,
    role: input.viewer.role,
    me: {
      participantId: input.viewer.participantId,
      seeds: own ? JSON.parse(own.seeds_json) : [],
      consentTaste: own ? !!own.consent_taste : false,
    },
    // Aggregate only — never per-member seed matrices for hosts.
    membersProfiled: input.preferences.filter((p) => {
      try {
        return JSON.parse(p.seeds_json).length > 0;
      } catch {
        return false;
      }
    }).length,
    membersTotal: new Set(input.preferences.map((p) => p.participant_id)).size,
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
