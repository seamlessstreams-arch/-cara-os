import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listDrafts, getDraft, createDraft, updateDraft,
  approveDraft, markSent, getCommunicationStats,
  generateHandoverDraft, generateSocialWorkerDraft,
  generateShiftBriefingDraft, generateManagementSummaryDraft,
  COMMUNICATION_TEMPLATES,
} from "@/lib/services/communication-intelligence";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  // Templates (no DB needed)
  if (type === "templates") {
    return NextResponse.json({ ok: true, data: COMMUNICATION_TEMPLATES });
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
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
    type: searchParams.get("commType") as any ?? undefined,
    status: searchParams.get("status") as any ?? undefined,
    childId: searchParams.get("childId") ?? undefined,
    limit: parseInt(searchParams.get("limit") ?? "50"),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

      if (!isSupabaseEnabled()) {
        return NextResponse.json({ ok: true, persisted: false });
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

      if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, persisted: false });

      const result = await updateDraft(id, { content, title, editedBy });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    // Approve draft
    if (action === "approve") {
      const { id, userId } = body;
      if (!id || !userId) return NextResponse.json({ error: "id and userId required" }, { status: 400 });

      if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, persisted: false });

      const result = await approveDraft(id, userId);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    // Mark sent
    if (action === "mark_sent") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

      if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, persisted: false });

      const result = await markSent(id);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json({ error: "action must be generate, create, update, approve, or mark_sent" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
