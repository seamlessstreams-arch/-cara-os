import { readJsonBody } from "@/lib/http/read-json";
import { rejectFutureDates } from "@/lib/http/retrospective-dates";
import { requireFields } from "@/lib/http/require-fields";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { todayStr, addWorkingDays } from "@/lib/utils";
import { runPostSaveIntelligence } from "@/lib/cara/post-save-intelligence";
import { captureDomainEvent } from "@/lib/event-capture/capture-event-service";


export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? "home_oak";
  const open   = req.nextUrl.searchParams.get("open") === "true";

  const records = open
    ? intelligenceDb.complaints.findOpen(homeId)
    : intelligenceDb.complaints.findAll(homeId);

  const today    = todayStr();
  const overdue  = records.filter((r) => r.status !== "closed" && r.response_due < today).length;
  const dueToday = records.filter((r) => r.status !== "closed" && r.response_due === today).length;
  const openCount = records.filter((r) => r.status !== "closed").length;

  return NextResponse.json({
    data: records,
    meta: { total: records.length, open: openCount, overdue, due_today: dueToday },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_COMPLAINTS);
  if (auth instanceof NextResponse) return auth;

  const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const __fd = rejectFutureDates(body, ["date_received"]); if (__fd) return __fd;

  const missing = requireFields(body, ["summary"]);
  if (missing) return missing;
  const dateReceived = body.date_received ?? todayStr();
  // Sequential, not random. `Math.floor(Math.random() * 900) + 100` drew from
  // 900 values, so by the birthday bound a home logging ~30 complaints a year
  // had a better-than-one-in-three chance of two complaints sharing a
  // reference — and a statutory complaint reference that is not unique cannot
  // be used to trace the complaint it names.
  const homeId = (body.home_id as string) ?? "home_oak";
  const year = new Date().getFullYear();
  const usedThisYear = intelligenceDb.complaints
    .findAll(homeId)
    .filter((c) => typeof c.reference === "string" && c.reference.startsWith(`CMP-${year}-`)).length;
  const nextRef = `CMP-${year}-${String(usedThisYear + 1).padStart(3, "0")}`;

  const record = intelligenceDb.complaints.create({
    home_id:                   homeId,
    reference:                 nextRef,
    child_id:                  body.child_id ?? null,
    complainant_type:          body.complainant_type ?? "young_person",
    complainant_name:          body.complainant_name ?? "",
    complainant_relationship:  body.complainant_relationship ?? null,
    date_received:             dateReceived,
    category:                  body.category ?? "other",
    stage:                     "stage_1",
    status:                    "received",
    summary:                   body.summary ?? "",
    full_detail:               body.full_detail ?? null,
    outcome:                   null,
    outcome_detail:            null,
    acknowledgement_due:       addWorkingDays(dateReceived, 3),
    response_due:              addWorkingDays(dateReceived, 10),
    acknowledged_at:           null,
    response_sent_at:          null,
    assigned_to:               body.assigned_to ?? null,
    investigation_notes:       null,
    lessons_learned:           null,
    learning_shared:           false,
    escalated_to_stage2_at:    null,
    escalated_reason:          null,
    ombudsman_reference:       null,
    timeline:                  [{
      date:        dateReceived,
      action:      "Complaint received",
      recorded_by: body.created_by ?? "staff_darren",
      note:        body.summary ?? null,
    }],
    includes_safeguarding_element: body.includes_safeguarding_element ?? false,
    linked_incident_id:        body.linked_incident_id ?? null,
    cara_summary:              null,
    created_by:                body.created_by ?? "staff_darren",
  });

  // Write through the canonical event spine (forms-as-views). The canonical event
  // lands on the `cornerstoneEvents` spine collection, so the complaint surfaces in
  // the timeline + intelligence under the projection's stable id (evt_cmp_<id>).
  // Best-effort; never blocks complaint creation.
  try {
    const sg = !!record.includes_safeguarding_element;
    const escalated = record.stage === "stage_2" || record.stage === "ombudsman" || record.status === "escalated";
    const resolved = record.status === "response_sent" || record.status === "closed";
    const risk = sg || escalated ? "high" : resolved ? "low" : "medium";
    const tags = ["complaint", record.category, record.stage, record.status].filter(Boolean) as string[];
    if (sg) tags.push("safeguarding_element");
    captureDomainEvent(
      {
        eventType: "complaint",
        childId: record.child_id ?? undefined,
        homeId: record.home_id,
        occurredAt: `${(record.date_received ?? "").slice(0, 10)}T00:00:00.000Z`,
        createdBy: record.created_by ?? "system",
        summary: `Complaint ${record.reference} (${String(record.category).replace(/_/g, " ")}): ${(record.summary ?? "").slice(0, 120)}`,
        riskLevel: risk,
        structuredTags: tags,
      },
      { id: `evt_cmp_${record.id}` },
    );
  } catch { /* best-effort write-through; never block complaint creation */ }

  // Fire-and-forget Cara intelligence hook (golden thread + child voice detection)
  runPostSaveIntelligence({
    homeId: record.home_id ?? "home_oak",
    childId: record.child_id ?? null,
    sourceTable: "cs_complaints",
    sourceId: record.id,
    title: `Complaint: ${record.category} — ${record.reference}`,
    summary: record.summary ?? "",
    eventType: "complaint",
    createdBy: record.created_by ?? "staff_darren",
    eventDate: record.date_received,
  }).catch(() => {});

  return NextResponse.json({ data: record }, { status: 201 });
}
