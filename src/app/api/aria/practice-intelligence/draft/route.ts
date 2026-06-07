// ══════════════════════════════════════════════════════════════════════════════
// POST /api/aria/practice-intelligence/draft
//
// ARIA DRAFTS a stronger, child-centred record/summary/reflection. Returns a
// structured, editable scaffold (deterministic) enhanced with an AI narrative
// when a provider is configured. Role-gated via aria.generate_drafts.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateDraft, type AriaDraftType } from "@/lib/aria-practice/aria-draft";
import { getUserRoleFromRequest, getUserIdFromRequest } from "@/lib/auth-guard";
import { appRoleToAriaRole, checkAriaAccess } from "@/lib/aria/aria-permissions";
import type { PracticeSourceType } from "@/lib/aria-practice/types";

export const dynamic = "force-dynamic";

const DRAFT_TYPES: AriaDraftType[] = [
  "professional_record",
  "child_friendly_explanation",
  "manager_threshold_summary",
  "supervision_reflection",
  "care_plan_impact_statement",
  "protective_factor_rewrite",
  "livers_analysis",
];

export async function POST(req: Request) {
  let body: {
    draftType?: AriaDraftType;
    sourceType?: PracticeSourceType;
    content?: string;
    context?: Record<string, unknown>;
    childId?: string | null;
    staffId?: string | null;
    homeId?: string | null;
    today?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.draftType || !DRAFT_TYPES.includes(body.draftType)) {
    return NextResponse.json({ error: `draftType must be one of: ${DRAFT_TYPES.join(", ")}` }, { status: 400 });
  }
  if (typeof body.content !== "string" || body.content.trim().length === 0) {
    return NextResponse.json({ error: "`content` is required" }, { status: 400 });
  }
  const sourceType: PracticeSourceType = body.sourceType ?? "daily_record";

  // Role gate — drafting requires aria.generate_drafts.
  const appRole = getUserRoleFromRequest(req);
  const userId = getUserIdFromRequest(req);
  const ariaRole = appRoleToAriaRole(appRole);
  const decision = checkAriaAccess(
    { userId, role: ariaRole, homeId: body.homeId ?? undefined, staffSelfId: userId },
    {
      permission: "aria.generate_drafts",
      homeId: body.homeId ?? undefined,
      childId: body.childId ?? undefined,
      isSafeguardingSensitive: body.draftType === "manager_threshold_summary",
    },
  );
  if (!decision.allowed) {
    return NextResponse.json({ error: decision.reason ?? "Not permitted" }, { status: 403 });
  }

  const draft = await generateDraft({
    draftType: body.draftType,
    sourceType,
    content: body.content,
    context: body.context,
    childId: body.childId ?? null,
    staffId: body.staffId ?? null,
    homeId: body.homeId ?? null,
    today: body.today,
  });

  return NextResponse.json({
    data: { ...draft, meta: { engine: "aria-practice-draft", version: "1.0.0", ranBy: userId, role: ariaRole } },
  });
}
