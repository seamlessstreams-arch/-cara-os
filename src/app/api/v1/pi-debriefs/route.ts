import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId     = req.nextUrl.searchParams.get("home_id") ?? "home_oak";
  const incidentId = req.nextUrl.searchParams.get("incident_id");

  const records = intelligenceDb.piDebriefs.findAll(homeId);
  const filtered = incidentId ? records.filter((r) => r.incident_id === incidentId) : records;

  const pending    = filtered.filter((r) => r.status === "pending").length;
  const incomplete = filtered.filter((r) => !r.yp_debrief_completed || !r.staff_debrief_completed).length;
  const overdue    = filtered.filter((r) => {
    const created = new Date(r.created_at).getTime();
    const now     = Date.now();
    const daysSince = (now - created) / (1000 * 60 * 60 * 24);
    return daysSince > 2 && r.status !== "rm_signed_off";
  }).length;

  return NextResponse.json({
    data: filtered,
    meta: { total: filtered.length, pending, incomplete, overdue },
  });
}

export async function POST(req: NextRequest) {
  const body   = await req.json();
  const record = intelligenceDb.piDebriefs.create({
    home_id:     body.home_id ?? "home_oak",
    incident_id: body.incident_id ?? "",
    technique_used:              body.technique_used ?? "team_teach_holding",
    technique_other:             body.technique_other ?? null,
    duration_minutes:            body.duration_minutes ?? 0,
    body_position:               body.body_position ?? "standing",
    staff_involved:              body.staff_involved ?? [],
    de_escalation_attempted:     body.de_escalation_attempted ?? true,
    de_escalation_description:   body.de_escalation_description ?? null,
    injuries:                    body.injuries ?? [],
    medical_assessment_completed:body.medical_assessment_completed ?? false,
    medical_assessment_notes:    body.medical_assessment_notes ?? null,
    ofsted_notification_required:body.ofsted_notification_required ?? false,
    ofsted_notified_at:          null,
    ofsted_reference:            null,
    la_notification_required:    body.la_notification_required ?? false,
    la_notified_at:              null,
    riddor_reportable:           body.riddor_reportable ?? false,
    riddor_reported_at:          null,
    riddor_reference:            null,
    yp_debrief_completed:        false,
    yp_debrief_date:             null,
    yp_debrief_by:               null,
    yp_debrief_notes:            null,
    yp_debrief_feelings:         null,
    staff_debrief_completed:     false,
    staff_debrief_date:          null,
    staff_debrief_by:            null,
    staff_debrief_notes:         null,
    trigger_identified:          body.trigger_identified ?? null,
    preventative_measures:       null,
    learning_shared_with_team:   false,
    status:                      "pending",
    rm_sign_off_date:            null,
    rm_sign_off_by:              null,
    rm_comments:                 null,
    aria_analysis:               null,
    created_by:                  body.created_by ?? "staff_darren",
    ...body,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
