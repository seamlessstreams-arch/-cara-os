import { readJsonBody } from "@/lib/http/read-json";
import { enumParam } from "@/lib/http/enum-param";
import { COMMUNICATION_STATUS_VALUES, COMMUNICATION_TYPE_VALUES } from "@/lib/services/communication-intelligence";
import { NextRequest, NextResponse } from "next/server";
import {
  listDrafts, getDraft, createDraft, updateDraft,
  approveDraft, markSent, submitDraftForReview, getCommunicationStats,
  generateHandoverDraft, generateSocialWorkerDraft,
  generateShiftBriefingDraft, generateManagementSummaryDraft,
  COMMUNICATION_TEMPLATES,
} from "@/lib/services/communication-intelligence";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const commTypeParam = enumParam("commType", searchParams.get("commType"), COMMUNICATION_TYPE_VALUES);
  if (!commTypeParam.ok) return commTypeParam.response;
  const statusParam = enumParam("status", searchParams.get("status"), COMMUNICATION_STATUS_VALUES);
  if (!statusParam.ok) return statusParam.response;
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  // Templates (no DB needed)
  if (type === "templates") {
    return NextResponse.json({ ok: true, data: COMMUNICATION_TEMPLATES });
  }

  // Stats
  if (type === "stats") {
    const result = await getCommunicationStats(homeId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Single draft by ID
  const draftId = searchParams.get("id");
  if (draftId) {
    const result = await getDraft(draftId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // List
  const result = await listDrafts(homeId, {
    type: commTypeParam.value,
    status: statusParam.value,
    childId: searchParams.get("childId") ?? undefined,
    limit: parseInt(searchParams.get("limit") ?? "50"),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { action } = body;

    // Generate draft (pure — no DB)
    if (action === "generate") {
      const { generationType, context } = body;
      let content: string;

      switch (generationType) {
        case "handover_summary":
          content = generateHandoverDraft(context);
          break;
        case "social_worker_update":
          content = generateSocialWorkerDraft(context);
          break;
        case "shift_briefing":
          content = generateShiftBriefingDraft(context);
          break;
        case "management_summary":
          content = generateManagementSummaryDraft(context);
          break;
        default:
          return NextResponse.json({ error: `Unknown generation type: ${generationType}` }, { status: 400 });
      }

      return NextResponse.json({ ok: true, data: { content } });
    }

    // Create draft in DB
    if (action === "create") {
      const { homeId, type: commType, title, content, createdBy, childId, staffId, linkedEntityType, linkedEntityId, recipientContext, caraGenerated, caraPromptUsed } = body;
      if (!homeId || !commType || !title || !content || !createdBy) {
        return NextResponse.json({ error: "homeId, type, title, content, createdBy required" }, { status: 400 });
      }

      const result = await createDraft({
        homeId, type: commType, title, content, createdBy,
        childId, staffId, linkedEntityType, linkedEntityId,
        recipientContext, caraGenerated, caraPromptUsed,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    // Update draft
    if (action === "update") {
      const { id, content, title, editedBy } = body;
      if (!id || !editedBy) return NextResponse.json({ error: "id and editedBy required" }, { status: 400 });

      const result = await updateDraft(id, { content, title, editedBy });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    // Hand to a reviewer
    if (action === "submit_for_review") {
      const { id, userId } = body;
      if (!id || !userId) return NextResponse.json({ error: "id and userId required" }, { status: 400 });
      const result = await submitDraftForReview(id, userId);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    // Approve draft
    if (action === "approve") {
      const { id, userId } = body;
      if (!id || !userId) return NextResponse.json({ error: "id and userId required" }, { status: 400 });

      const result = await approveDraft(id, userId);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    // Mark sent
    if (action === "mark_sent") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

      const result = await markSent(id);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json({ error: "action must be generate, create, update, submit_for_review, approve, or mark_sent" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
