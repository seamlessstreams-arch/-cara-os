import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listContacts,
  createContact,
  listFeedback,
  createFeedback,
  STAKEHOLDER_TYPES,
  ENGAGEMENT_METHODS,
  RELATIONSHIP_QUALITIES,
  FEEDBACK_RATINGS,
} from "@/lib/services/stakeholder-engagement-service";
import type {
  StakeholderType,
} from "@/lib/services/stakeholder-engagement-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "stakeholder_types") {
    return NextResponse.json({ ok: true, data: STAKEHOLDER_TYPES });
  }
  if (type === "engagement_methods") {
    return NextResponse.json({ ok: true, data: ENGAGEMENT_METHODS });
  }
  if (type === "relationship_qualities") {
    return NextResponse.json({ ok: true, data: RELATIONSHIP_QUALITIES });
  }
  if (type === "feedback_ratings") {
    return NextResponse.json({ ok: true, data: FEEDBACK_RATINGS });
  }

  // Feedback
  if (type === "feedback") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listFeedback(homeId, {
      stakeholderType: (searchParams.get("stakeholderType") ?? undefined) as StakeholderType | undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Contacts (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listContacts(homeId, {
    stakeholderType: (searchParams.get("stakeholderType") ?? undefined) as StakeholderType | undefined,
    childId: searchParams.get("childId") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const { action, ...payload } = body;

  if (action === "create_contact") {
    const result = await createContact(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "create_feedback") {
    const result = await createFeedback(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
