import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Reject a create whose identifying fields are missing.
//
// readJsonBody proves the body is valid JSON. It does not prove the body says
// anything. Several collection routes went straight from a parsed `{}` into
// `create({ child_id: body.child_id ?? "", outcome: body.outcome ?? "positive" })`
// and returned 201 — writing a record that asserts things nobody recorded. A
// contact log defaulting to outcome "positive" with safeguarding_concern false
// is the fabricate-on-empty rule applied to a record instead of a score, and it
// then feeds every count and compliance denominator downstream.
//
// Optional fields may still default. What must not default is the field that
// says WHO or WHAT the record is about — a care plan with child_id "" belongs
// to no child, and no amount of downstream logic can recover the answer.
// ─────────────────────────────────────────────────────────────────────────────

export function requireFields(
  body: Record<string, unknown>,
  fields: readonly string[],
): NextResponse | null {
  const missing = fields.filter((f) => {
    const v = body[f];
    return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
  });

  if (missing.length === 0) return null;

  return NextResponse.json(
    {
      error: `Missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`,
      missing,
    },
    { status: 400 },
  );
}

// Some creates pass the parsed body straight into `create(body)` against a type
// this helper cannot see. Requiring a named field there would be a guess, and a
// wrong guess 400s a legitimate create forever. Requiring the body to say
// SOMETHING is the honest floor: it still stops `POST {}` writing a skeleton
// record, without inventing a schema.
export function requireNonEmptyBody(body: Record<string, unknown>): NextResponse | null {
  const hasValue = Object.values(body).some(
    (v) => v !== undefined && v !== null && !(typeof v === "string" && v.trim() === ""),
  );
  if (hasValue) return null;
  return NextResponse.json(
    { error: "Request body is empty — nothing to record.", missing: ["<any field>"] },
    { status: 400 },
  );
}
