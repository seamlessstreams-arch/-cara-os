// ─────────────────────────────────────────────────────────────────────────────
// Get a message out of a caught value.
//
// Under `strict`, a caught value is `unknown` — because a throw can be
// anything, not just an Error. These handlers used to annotate the clause
// `catch (err: any)` and read `err.message` straight off it, which is correct
// for an Error and silently `undefined` for everything else: a thrown string,
// a rejected object, a Supabase error shape. `{ error: undefined }` drops the
// key from the JSON entirely, so the caller is told a request failed without
// being told anything about it.
//
// This always yields a non-empty string. When the throw carries nothing
// readable the fallback says so, rather than an empty message pretending to
// be one.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_FALLBACK = "Internal server error";

/**
 * @param err      the caught value, whatever it turned out to be
 * @param fallback used when the value carries no readable message
 */
export function errorMessage(err: unknown, fallback: string = DEFAULT_FALLBACK): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object") {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

/**
 * The HTTP status a caught value asks for, if it carries a usable one.
 *
 * `err?.statusCode ?? 500` passed whatever it found straight to
 * `NextResponse.json`, which throws a RangeError on a status outside 200–599 —
 * turning a handled error into an unhandled one. Only a plausible error status
 * is honoured.
 */
export function errorStatus(err: unknown, fallback = 500): number {
  if (err && typeof err === "object") {
    const code = (err as { statusCode?: unknown }).statusCode;
    if (typeof code === "number" && Number.isInteger(code) && code >= 400 && code <= 599) {
      return code;
    }
  }
  return fallback;
}

/** The `name` of a caught value, for the `AbortError` / `TimeoutError` checks. */
export function errorName(err: unknown): string {
  if (err instanceof Error) return err.name;
  if (err && typeof err === "object") {
    const name = (err as { name?: unknown }).name;
    if (typeof name === "string") return name;
  }
  return "";
}
