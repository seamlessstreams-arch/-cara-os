import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId         = searchParams.get("home_id");
  const childId        = searchParams.get("child_id");
  const arrangementId  = searchParams.get("arrangement_id");

  let records;
  if (arrangementId) {
    records = intelligenceDb.contactLogs.findByArrangement(arrangementId);
  } else if (childId) {
    records = intelligenceDb.contactLogs.findByChild(childId);
  } else if (homeId) {
    records = intelligenceDb.contactLogs.findAll(homeId);
  } else {
    return NextResponse.json({ error: "home_id, child_id, or arrangement_id required" }, { status: 400 });
  }

  // Enrich with contact person
  const enriched = records.map((log) => ({
    ...log,
    contact_person: intelligenceDb.contactPersons.findById(log.contact_person_id),
  }));

  // Summary meta
  const total     = enriched.length;
  const concerns  = enriched.filter((l) => l.concerns_identified).length;
  const cancelled = enriched.filter((l) => l.status === "cancelled").length;
  const distress  = enriched.filter((l) => l.yp_mood_after === "distressed").length;

  return NextResponse.json({
    data: enriched,
    meta: { total, concerns, cancelled, distress },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.EDIT_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;

  const body   = await req.json();
  const record = intelligenceDb.contactLogs.create({
    ...body,
    status:     body.status     ?? "completed",
    outcome:    body.outcome    ?? "positive",
    concerns_identified: body.concerns_identified ?? false,
    safeguarding_concern: body.safeguarding_concern ?? false,
    follow_up_required:  body.follow_up_required ?? false,
    social_worker_notified: body.social_worker_notified ?? false,
    photos_shared:  body.photos_shared ?? false,
    gifts_received: body.gifts_received ?? false,
    cara_analysis: null,
    created_by: body.created_by ?? "staff_darren",
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
