import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import { recordAlertFeedback, isAlertVerdict } from "@/lib/feedback/alert-feedback.service";

export const dynamic = "force-dynamic";

// POST /api/v1/alert-feedback — one-tap feedback on a surfaced attention item.
// Body: { rule_id, verdict: useful|not_useful|wrong, entity_type?, entity_id?, note? }
export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as {
    rule_id?: string;
    verdict?: string;
    entity_type?: string;
    entity_id?: string;
    note?: string;
  };

  if (!body.rule_id || !isAlertVerdict(body.verdict)) {
    return NextResponse.json(
      { error: "rule_id and a valid verdict (useful | not_useful | wrong) are required" },
      { status: 400 },
    );
  }

  // Attribute to the acting user when resolvable; feedback is low-stakes, so an
  // unresolved session records anonymously rather than being rejected.
  const identity = await getRequestIdentity(req);
  const userId = identity instanceof NextResponse ? null : identity.userId;

  const result = await recordAlertFeedback({
    rule_id: body.rule_id,
    verdict: body.verdict,
    entity_type: body.entity_type ?? null,
    entity_id: body.entity_id ?? null,
    note: body.note ?? null,
    user_id: userId,
  });

  return NextResponse.json({ ok: true, ...result });
}
