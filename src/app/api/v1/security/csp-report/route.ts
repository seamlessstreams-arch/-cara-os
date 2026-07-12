import { NextRequest, NextResponse } from "next/server";

// ── CSP violation report sink (report-ONLY mode) ────────────────────────────
// The `Content-Security-Policy-Report-Only` header (next.config.ts) makes the
// browser POST a report here whenever the policy WOULD have blocked a resource.
// Nothing is ever enforced or blocked — this endpoint only records what an
// enforced CSP would break, so we can allow-list correctly before turning it on.
//
// Notes:
//  - Intentionally UNAUTHENTICATED: browsers send violation reports with no
//    session/credentials, so an auth gate would drop every report.
//  - Reports carry no child/PII data — only a violated directive + blocked URL.
//  - Parsed TOLERANTLY (never 400 a browser report): so this deliberately does
//    NOT use readJsonBody, which would reject malformed bodies with a 400.
//  - The in-memory ring is per-serverless-instance (best-effort inspection via
//    GET); the console.warn is the durable signal (shows in Vercel logs).

interface CspViolation {
  at: string;
  directive: string;
  blockedUri: string;
  documentUri: string;
}

const recent: CspViolation[] = [];
const MAX = 100;

export async function POST(req: NextRequest) {
  let payload: unknown = null;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    payload = __parsed.data;
  } catch {
    // Malformed / empty body — acknowledge without recording.
    return new NextResponse(null, { status: 204 });
  }

  for (const r of normaliseReports(payload)) {
    const violation: CspViolation = {
      at: new Date().toISOString(),
      // report-uri uses kebab-case keys; report-to uses camelCase — accept both.
      directive: String(
        r["violated-directive"] ?? r["effective-directive"] ?? r["violatedDirective"] ?? r["effectiveDirective"] ?? "unknown",
      ),
      blockedUri: String(r["blocked-uri"] ?? r["blockedURL"] ?? "unknown"),
      documentUri: String(r["document-uri"] ?? r["documentURL"] ?? ""),
    };
    console.warn(
      "[csp-report]",
      violation.directive,
      "→ blocked",
      violation.blockedUri,
      violation.documentUri ? `(on ${violation.documentUri})` : "",
    );
    recent.push(violation);
  }
  if (recent.length > MAX) recent.splice(0, recent.length - MAX);

  return new NextResponse(null, { status: 204 });
}

// GET — quick inspection of recently reported violations (non-PII infra telemetry).
export function GET() {
  return NextResponse.json({
    count: recent.length,
    note: "report-only — nothing is enforced; these are what an enforced CSP would block",
    recent,
  });
}

/** Extract the violation object(s) from either CSP report wire format. */
function normaliseReports(payload: unknown): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== "object") return [];

  // report-uri format: { "csp-report": { ... } }
  const single = (payload as Record<string, unknown>)["csp-report"];
  if (single && typeof single === "object") {
    return [single as Record<string, unknown>];
  }

  // report-to format: [ { type: "csp-violation", body: { ... } }, ... ]
  if (Array.isArray(payload)) {
    return payload
      .map((r) => (r && typeof r === "object" && "body" in r ? (r as Record<string, unknown>).body : r))
      .filter((b): b is Record<string, unknown> => Boolean(b) && typeof b === "object");
  }

  return [];
}
