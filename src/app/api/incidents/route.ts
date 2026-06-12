import { NextRequest, NextResponse } from "next/server";
import { generateIncidentIntelligence } from "@/lib/incidents";
import type { IncidentRecord, IncidentPolicy, StaffIncidentTraining } from "@/lib/incidents";
import { createIncident, type CreateIncidentInput } from "@/lib/incidents/incident-orchestrator";
import { persistRecord, persistAuditEntry } from "@/lib/orchestrator/record-persistence";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

// ── Demo Data ─────────────────────────────────────────────────────────────

const DEMO_RECORDS: IncidentRecord[] = [
  { id: "inc-001", homeId: "home-oak", date: "2026-05-14", childId: "child-alex", childName: "Alex", category: "physical_incident", outcome: "de_escalated", deEscalationAttempted: true, childViewRecorded: true, debriefConducted: true, lessonsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "inc-002", homeId: "home-oak", date: "2026-05-07", childId: "child-jordan", childName: "Jordan", category: "verbal_incident", outcome: "resolved_safely", deEscalationAttempted: true, childViewRecorded: true, debriefConducted: true, lessonsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "inc-003", homeId: "home-oak", date: "2026-04-30", childId: "child-morgan", childName: "Morgan", category: "self_harm", outcome: "external_referral", deEscalationAttempted: true, childViewRecorded: true, debriefConducted: true, lessonsIdentified: false, documentationComplete: true, timelyRecording: true },
  { id: "inc-004", homeId: "home-oak", date: "2026-04-23", childId: "child-alex", childName: "Alex", category: "absconding", outcome: "resolved_safely", deEscalationAttempted: true, childViewRecorded: true, debriefConducted: true, lessonsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "inc-005", homeId: "home-oak", date: "2026-04-16", childId: "child-jordan", childName: "Jordan", category: "substance_misuse", outcome: "external_referral", deEscalationAttempted: true, childViewRecorded: true, debriefConducted: false, lessonsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "inc-006", homeId: "home-oak", date: "2026-04-09", childId: "child-morgan", childName: "Morgan", category: "criminal_behaviour", outcome: "not_applicable", deEscalationAttempted: true, childViewRecorded: true, debriefConducted: true, lessonsIdentified: true, documentationComplete: true, timelyRecording: false },
  { id: "inc-007", homeId: "home-oak", date: "2026-04-02", childId: "child-alex", childName: "Alex", category: "bullying", outcome: "de_escalated", deEscalationAttempted: true, childViewRecorded: false, debriefConducted: true, lessonsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "inc-008", homeId: "home-oak", date: "2026-03-26", childId: "child-jordan", childName: "Jordan", category: "property_damage", outcome: "resolved_safely", deEscalationAttempted: true, childViewRecorded: true, debriefConducted: true, lessonsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "inc-009", homeId: "home-oak", date: "2026-03-19", childId: "child-morgan", childName: "Morgan", category: "physical_incident", outcome: "restraint_used", deEscalationAttempted: false, childViewRecorded: true, debriefConducted: true, lessonsIdentified: true, documentationComplete: false, timelyRecording: true },
  { id: "inc-010", homeId: "home-oak", date: "2026-03-12", childId: "child-alex", childName: "Alex", category: "verbal_incident", outcome: "de_escalated", deEscalationAttempted: true, childViewRecorded: true, debriefConducted: true, lessonsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "inc-011", homeId: "home-oak", date: "2026-03-05", childId: "child-jordan", childName: "Jordan", category: "self_harm", outcome: "external_referral", deEscalationAttempted: true, childViewRecorded: true, debriefConducted: true, lessonsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "inc-012", homeId: "home-oak", date: "2026-02-26", childId: "child-morgan", childName: "Morgan", category: "absconding", outcome: "resolved_safely", deEscalationAttempted: true, childViewRecorded: true, debriefConducted: true, lessonsIdentified: true, documentationComplete: true, timelyRecording: true },
];

const DEMO_POLICY: IncidentPolicy = {
  incidentManagementPolicy: true,
  deEscalationGuidance: true,
  restraintPolicy: true,
  postIncidentDebriefPolicy: true,
  childViewInIncidentPolicy: true,
  notificationProcedure: true,
  lessonsLearnedFramework: true,
};

const DEMO_STAFF: StaffIncidentTraining[] = [
  { staffId: "staff-sarah", deEscalationSkills: true, incidentRecording: true, restraintCertification: true, postIncidentSupport: true, childProtectionAwareness: true, conflictResolution: true },
  { staffId: "staff-tom", deEscalationSkills: true, incidentRecording: true, restraintCertification: true, postIncidentSupport: true, childProtectionAwareness: true, conflictResolution: false },
  { staffId: "staff-lisa", deEscalationSkills: true, incidentRecording: true, restraintCertification: true, postIncidentSupport: true, childProtectionAwareness: true, conflictResolution: true },
  { staffId: "staff-darren", deEscalationSkills: true, incidentRecording: true, restraintCertification: true, postIncidentSupport: true, childProtectionAwareness: true, conflictResolution: true },
];

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const childId = searchParams.get("child_id");
  const needsOversight = searchParams.get("needs_oversight") === "true";

  // If query params are present, return filtered incident list from store
  if (status || childId || needsOversight) {
    let incidents = db.incidents.findAll();
    if (status) incidents = incidents.filter((i) => i.status === status);
    if (childId) incidents = incidents.filter((i) => i.child_id === childId);
    if (needsOversight) incidents = db.incidents.findNeedingOversight();

    const open = db.incidents.findOpen().length;
    const oversight = db.incidents.findNeedingOversight().length;

    return NextResponse.json({
      data: incidents,
      meta: { total: incidents.length, open, needs_oversight: oversight },
    });
  }

  // Default: return incident intelligence analytics
  const result = generateIncidentIntelligence({
    homeId: "home-oak",
    periodStart: "2026-01-01",
    periodEnd: "2026-05-20",
    records: DEMO_RECORDS,
    policy: DEMO_POLICY,
    staff: DEMO_STAFF,
  });

  return NextResponse.json({
    data: {
      ...result,
      meta: { generatedAt: new Date().toISOString(), engine: "incidents", version: "2.0.0" },
    },
  });
}

// ── POST: Create a new incident ─────────────────────────────────────────────
// This is the complete vertical slice entry point.
// Form → API → Store → Audit → Timeline → Tasks → Automation → Cara Context

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Validate required fields ────────────────────────────────────────────
  const required = ["child_id", "type", "severity", "date", "time", "description", "immediate_action"];
  const missing = required.filter((f) => !body[f] || (typeof body[f] === "string" && !(body[f] as string).trim()));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}`, fields: missing },
      { status: 400 },
    );
  }

  // Validate severity
  const validSeverities = ["low", "medium", "high", "critical"];
  if (!validSeverities.includes(body.severity as string)) {
    return NextResponse.json(
      { error: `Invalid severity. Must be one of: ${validSeverities.join(", ")}` },
      { status: 400 },
    );
  }

  // Validate description length
  if ((body.description as string).trim().length < 10) {
    return NextResponse.json(
      { error: "Description must be at least 10 characters" },
      { status: 400 },
    );
  }

  // ── Build input ─────────────────────────────────────────────────────────
  const input: CreateIncidentInput = {
    child_id: body.child_id as string,
    type: body.type as string,
    severity: body.severity as string,
    date: body.date as string,
    time: body.time as string,
    location: (body.location as string) || undefined,
    description: (body.description as string).trim(),
    immediate_action: (body.immediate_action as string).trim(),
    reported_by: (body.reported_by as string) || "staff_darren",
    witnesses: Array.isArray(body.witnesses) ? body.witnesses as string[] : [],
    body_map_required: body.body_map_required === true,
    notifications: Array.isArray(body.notifications) ? body.notifications as CreateIncidentInput["notifications"] : [],
    home_id: (body.home_id as string) || "home_oak",
  };

  // ── Orchestrate ─────────────────────────────────────────────────────────
  try {
    const result = createIncident(input);

    // ── Durable write-through (gated — no-op unless Supabase is configured) ──
    const inc = result.incident as unknown as Record<string, unknown>;
    let persisted = false;
    try {
      const [rec] = await Promise.all([
        persistRecord({
          ...inc,
          record_type: "incident",
          staff_id: inc.reported_by ?? input.reported_by,
          title: `${input.type.replace(/_/g, " ")} ${inc.reference ?? ""}`.trim(),
          data: {
            type: inc.type, immediate_action: inc.immediate_action, location: inc.location,
            witnesses: inc.witnesses, body_map_required: inc.body_map_required, notifications: inc.notifications,
          },
        }),
        persistAuditEntry(result.audit_entry as unknown as Record<string, unknown>, "incident"),
      ]);
      persisted = rec.persisted;
    } catch { /* best-effort */ }

    // HQ usage metering — kind + actor label only, never incident content.
    void import("@/lib/hq/hq-service")
      .then((m) => m.logUsageEvent("incident", { userLabel: (input.reported_by as string | undefined) ?? null }))
      .catch(() => {});

    return NextResponse.json({
      data: result.incident,
      linked_updates: result.linked_updates,
      meta: {
        tasks_created: result.tasks_created.length,
        automation_runs: result.automation_runs.length,
        audit_entry_id: result.audit_entry.id,
        timeline_event_id: result.timeline_event.id,
        persisted,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/incidents] Orchestration failed:", err);
    return NextResponse.json(
      { error: "Failed to create incident", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
