// ══════════════════════════════════════════════════════════════════════════════
// API — PRACTICE INTELLIGENCE: OVERSIGHT INTELLIGENCE
// GET  ?type=x&childId=y   → list oversight drafts (filterable)
// POST { oversightType, ...}→ generate a new oversight draft
// PUT  { draftId, action }  → approve or commit
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import {
  generateOversightDraft,
  listOversightDrafts,
  approveOversightDraft,
  commitOversightDraft,
} from "@/lib/practice-intelligence";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const drafts = await listOversightDrafts({
      oversightType: (searchParams.get("type") as any) ?? undefined,
      childId: searchParams.get("childId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      limit: parseInt(searchParams.get("limit") ?? "20", 10),
    });

    return NextResponse.json({ ok: true, data: drafts });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { oversightType, recordId, recordType, childId, additionalContext, createdBy } = body;

    if (!oversightType) {
      return NextResponse.json({ ok: false, error: "oversightType is required" }, { status: 400 });
    }

    const draft = await generateOversightDraft({
      oversightType,
      recordId,
      recordType,
      childId,
      additionalContext,
      createdBy: createdBy ?? "system",
    });

    return NextResponse.json({ ok: true, data: draft });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const __jb1 = await readJsonBody(req); if (!__jb1.ok) return __jb1.response; const body = __jb1.data;
    const { draftId, action, approvedBy } = body;

    if (!draftId) {
      return NextResponse.json({ ok: false, error: "draftId is required" }, { status: 400 });
    }

    if (action === "approve") {
      const draft = await approveOversightDraft(draftId, approvedBy ?? "system");
      return NextResponse.json({ ok: true, data: draft });
    }

    if (action === "commit") {
      const draft = await commitOversightDraft(draftId);
      return NextResponse.json({ ok: true, data: draft });
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
