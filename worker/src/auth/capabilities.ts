/** Capability secrets: 32+ random bytes, hashed at rest, never logged plaintext. */

const encoder = new TextEncoder();

export function randomId(): string {
  return crypto.randomUUID();
}

export function randomSecretBytes(byteLength = 32): Uint8Array {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const data = typeof input === "string" ? encoder.encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function mintCapability(): Promise<{ secret: string; hash: string }> {
  const secret = bytesToBase64Url(randomSecretBytes(32));
  const hash = await sha256Hex(secret);
  return { secret, hash };
}

export function cookieHeader(
  name: string,
  value: string,
  opts: { maxAgeSec: number; secure: boolean },
): string {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${opts.maxAgeSec}`,
  ];
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}

export function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

export const SESSION_COOKIE = "cg_session";
export const SESSION_TTL_SEC = 60 * 60 * 24 * 7;
export const CLAIM_TTL_SEC = 60 * 60 * 72;
