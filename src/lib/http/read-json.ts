// ──────────────────────────────────────────────────────────────────────────
// Safe JSON body reader for route handlers.
//
// `await req.json()` throws on a malformed (or, in some runtimes, empty) body,
// which surfaces to the client as an unhandled 500. readJsonBody parses the
// body defensively and returns a discriminated result:
//   • malformed JSON        → { ok: false, response: 400 }  (handler returns it)
//   • empty body            → { ok: true,  data: {} }       (trigger-style POSTs)
//   • valid JSON            → { ok: true,  data: <parsed> }
//
// The handler's own required-field validation then produces the appropriate
// domain-level response. Consistent with the platform's degrade-gracefully,
// never-crash posture.
// ──────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

export type JsonBodyResult =
  | { ok: true; data: any } // eslint-disable-line @typescript-eslint/no-explicit-any
  | { ok: false; response: NextResponse };

/**
 * Read + parse a JSON request body without ever throwing.
 * Returns a 400 result for malformed JSON; an empty body is treated as `{}`.
 */
export async function readJsonBody(req: Request): Promise<JsonBodyResult> {
  let text: string;
  try {
    text = await req.text();
  } catch {
    return { ok: true, data: {} };
  }
  if (!text || !text.trim()) {
    return { ok: true, data: {} };
  }
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      ),
    };
  }
}
