// ══════════════════════════════════════════════════════════════════════════════
// API: POST /api/cara/approval/submit — Submit AI output for review
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { caraApprovalEngine } from "@/lib/cara/approval";
import { sanitiseErrorForClient } from "@/lib/cara/core/errors";

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;

    if (!body.approvalId || !body.userId) {
      return NextResponse.json({ error: "Missing approvalId or userId" }, { status: 400 });
    }

    const record = caraApprovalEngine.submitForReview(body.approvalId, body.userId);
    return NextResponse.json({ record });
  } catch (error: any) {
    const safe = sanitiseErrorForClient(error);
    return NextResponse.json({ error: safe.message, code: safe.code }, { status: error?.statusCode ?? 500 });
  }
}
