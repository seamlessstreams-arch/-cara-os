// ─────────────────────────────────────────────────────────────────────────────
// Validate a query-string parameter against the union it is about to become.
//
// These filters used to be cast straight from `searchParams.get(...)` into a
// narrow union, so `?status=banana` sailed through as if it were a real value
// and the query quietly matched nothing. The screen then showed an empty list —
// indistinguishable from a home with nothing on file. A filter the caller
// mistyped should say so, not answer with a silent, wrong "none".
//
// Absent or empty means "no filter" and is always fine. An unrecognised value
// is a 400 that names what is allowed, so the caller can see the mistake.
//
// Pair it with the `*_VALUES` const arrays the unions are derived from
// (`type X = (typeof X_VALUES)[number]`), so the validator and the type can
// never drift apart.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

export type EnumParamResult<T extends string> =
  | { ok: true; value: T | undefined }
  | { ok: false; response: NextResponse };

export type EnumParamListResult<T extends string> =
  | { ok: true; value: T[] | undefined }
  | { ok: false; response: NextResponse };

/**
 * Narrow a raw query param to one of `allowed`.
 *
 * @param name    the parameter as the caller spelled it, for the error message
 * @param raw     `searchParams.get(name)` — null/empty means no filter
 * @param allowed the union's own value list
 */
export function enumParam<T extends string>(
  name: string,
  raw: string | null | undefined,
  allowed: readonly T[],
): EnumParamResult<T> {
  if (raw === null || raw === undefined || raw === "") {
    return { ok: true, value: undefined };
  }
  if ((allowed as readonly string[]).includes(raw)) {
    return { ok: true, value: raw as T };
  }
  return {
    ok: false,
    response: NextResponse.json(
      {
        error: `\`${name}\` is not a recognised value.`,
        received: raw,
        allowed,
        parameter: name,
      },
      { status: 400 },
    ),
  };
}

/**
 * The repeating-parameter form (`?status=a&status=b`). Every value must be
 * recognised; one bad entry rejects the request rather than being dropped,
 * because a silently-dropped filter widens the result set without saying so.
 */
export function enumParamList<T extends string>(
  name: string,
  raw: readonly string[],
  allowed: readonly T[],
): EnumParamListResult<T> {
  if (raw.length === 0) return { ok: true, value: undefined };
  const bad = raw.filter((v) => !(allowed as readonly string[]).includes(v));
  if (bad.length > 0) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `\`${name}\` contains ${bad.length === 1 ? "an unrecognised value" : "unrecognised values"}.`,
          received: bad,
          allowed,
          parameter: name,
        },
        { status: 400 },
      ),
    };
  }
  return { ok: true, value: raw as T[] };
}
