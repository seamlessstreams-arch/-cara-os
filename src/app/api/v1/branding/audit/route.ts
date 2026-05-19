// ── GET /api/v1/branding/audit ────────────────────────────────────────────────
// Returns branding audit log entries.
//
// Query params:
//   target_type — optional: "system" | "organisation" | "home"
//   target_id   — optional: specific record ID

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("target_type") ?? undefined;
  const targetId   = searchParams.get("target_id") ?? undefined;

  const log = db.branding.getAuditLog(targetType, targetId);
  return NextResponse.json({ data: log });
}
