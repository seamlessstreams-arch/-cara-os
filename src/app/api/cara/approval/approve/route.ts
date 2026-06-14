// ══════════════════════════════════════════════════════════════════════════════
// API: POST /api/cara/approval/approve — Approve AI output
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { caraApprovalEngine } from "@/lib/cara/approval";
import { sanitiseErrorForClient } from "@/lib/cara/core/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.approvalId || !body.userId || !body.userRole) {
      return NextResponse.json({ error: "Missing approvalId, userId, or userRole" }, { status: 400 });
    }

    const record = caraApprovalEngine.approve(
      body.approvalId,
      body.userId,
      body.userRole,
      body.notes,
    );

    return NextResponse.json({ record });
  } catch (error: any) {
    const safe = sanitiseErrorForClient(error);
    return NextResponse.json({ error: safe.message, code: safe.code }, { status: error?.statusCode ?? 500 });
  }
}
