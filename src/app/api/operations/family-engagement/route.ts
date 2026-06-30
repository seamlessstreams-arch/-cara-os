import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listContacts,
  createContact,
  listRelationships,
  createRelationship,
  updateRelationship,
  CONTACT_TYPES,
  CONTACT_OUTCOMES,
  FAMILY_MEMBER_TYPES,
  RELATIONSHIP_QUALITIES,
  ENGAGEMENT_TRENDS,
} from "@/lib/services/family-engagement-service";
import type {
  FamilyMemberType,
  ContactOutcome,
  RelationshipQuality,
  EngagementTrend,
} from "@/lib/services/family-engagement-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "contact_types") {
    return NextResponse.json({ ok: true, data: CONTACT_TYPES });
  }
  if (type === "contact_outcomes") {
    return NextResponse.json({ ok: true, data: CONTACT_OUTCOMES });
  }
  if (type === "family_member_types") {
    return NextResponse.json({ ok: true, data: FAMILY_MEMBER_TYPES });
  }
  if (type === "relationship_qualities") {
    return NextResponse.json({ ok: true, data: RELATIONSHIP_QUALITIES });
  }
  if (type === "engagement_trends") {
    return NextResponse.json({ ok: true, data: ENGAGEMENT_TRENDS });
  }

  // Relationships
  if (type === "relationships") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listRelationships(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      quality: (searchParams.get("quality") ?? undefined) as RelationshipQuality | undefined,
      trend: (searchParams.get("trend") ?? undefined) as EngagementTrend | undefined,
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
    childId: searchParams.get("childId") ?? undefined,
    familyMemberType: (searchParams.get("familyMemberType") ?? undefined) as FamilyMemberType | undefined,
    outcome: (searchParams.get("outcome") ?? undefined) as ContactOutcome | undefined,
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
  if (action === "create_relationship") {
    const result = await createRelationship(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_relationship") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateRelationship(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
