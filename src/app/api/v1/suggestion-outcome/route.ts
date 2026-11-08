import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import {
  recordSuggestionOutcome,
  isSuggestionType,
  isSuggestionOutcome,
} from "@/lib/feedback/suggestion-outcome.service";

export const dynamic = "force-dynamic";

// POST /api/v1/suggestion-outcome — record what happened to a suggestion.
// Body: { suggestion_type: smart_link|early_warning|pattern_alert,
//         suggestion_ref, outcome: accepted|dismissed|escalated, note? }
export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as {
    suggestion_type?: string;
    suggestion_ref?: string;
    outcome?: string;
    note?: string;
  };

  if (!isSuggestionType(body.suggestion_type) || !body.suggestion_ref || !isSuggestionOutcome(body.outcome)) {
    return NextResponse.json(
      {
        error:
          "suggestion_type (smart_link | early_warning | pattern_alert), suggestion_ref and outcome (accepted | dismissed | escalated) are required",
      },
      { status: 400 },
    );
  }

  const identity = await getRequestIdentity(req);
  const userId = identity instanceof NextResponse ? null : identity.userId;

  const result = await recordSuggestionOutcome({
    suggestion_type: body.suggestion_type,
    suggestion_ref: body.suggestion_ref,
    outcome: body.outcome,
    note: body.note ?? null,
    user_id: userId,
  });

  return NextResponse.json({ ok: true, ...result });
}
