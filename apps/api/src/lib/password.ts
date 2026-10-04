// PBKDF2-HMAC-SHA256 password hashing.
//
// Hashes are stored as `pbkdf2$<iterations>$<saltB64>$<hashB64>` so the cost
// factor is self-describing: verification ALWAYS uses the iteration count baked
// into the stored hash, which lets us raise this constant without locking out
// existing users. Successful logins transparently re-hash old-cost hashes up to
// the current value (see `needsRehash`).
//
// NOTE: raise this only if the Worker plan allows enough CPU per request
// (Workers Free caps CPU at 10ms; Paid allows far more). 600k is OWASP's
// current PBKDF2-SHA256 guidance.
export const PBKDF2_ITERATIONS = 600_000;
const SALT_LEN = 16;
const BITS = 256;

function toB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(key)}`;
}

/** Iteration count encoded in a stored hash (0 if the format is unrecognised). */
export function iterationsOf(stored: string): number {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return 0;
  const n = Number(parts[1]);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** True when a stored hash was made with fewer iterations than we now use. */
export function needsRehash(stored: string): boolean {
  return iterationsOf(stored) < PBKDF2_ITERATIONS;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = iterationsOf(stored);
  if (iterations === 0) return false;
  const [, , saltB64, hashB64] = parts as [string, string, string, string];
  const expected = fromB64(hashB64);
  const actual = await deriveKey(password, fromB64(saltB64), iterations);
  if (actual.length !== expected.length) return false;
  let diff = 0; // constant-time-ish compare
  for (let i = 0; i < actual.length; i++) diff |= actual[i]! ^ expected[i]!;
  return diff === 0;
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    BITS,
  );
  return new Uint8Array(bits);
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
