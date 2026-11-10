import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { generateHumanisedOversight } from "@/lib/intelligence/humanised-oversight";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";
import { intelligenceScope } from "@/lib/intelligence/request-scope";
import type { HumanisedOversightInput } from "@/types/intelligence.layer";

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    // Live: who and where come from the session, never the body (see request-scope.ts).
    const scope = await intelligenceScope(request, body);
    if (scope instanceof NextResponse) return scope;
    const { homeId, actorUserId, actorRole } = scope;
    const { recordType, recordId, recordSummary, childName, context } = body as HumanisedOversightInput;

    if (!recordType || !recordId || !recordSummary) {
      return NextResponse.json(
        { error: "recordType, recordId, and recordSummary are required" },
        { status: 400 },
      );
    }

    const result = await generateHumanisedOversight({
      recordType,
      recordId,
      recordSummary,
      childName,
      context,
    });

    await writeIntelligenceAudit({
      homeId: homeId ?? undefined,
      entityType: recordType,
      entityId: recordId,
      action: "cara_draft_generated",
      actorUserId: actorUserId ?? undefined,
      actorRole: actorRole ?? undefined,
      detail: { confidence: result.confidence, riskFlags: result.riskFlags },
    });

    return NextResponse.json({
      ok: true,
      result,
      caraLabel: "Cara suggested draft — requires manager review and approval",
    });
  } catch (err) {
    console.error("[api/intelligence/humanised-oversight] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate oversight draft" },
      { status: 500 },
    );
  }
}
