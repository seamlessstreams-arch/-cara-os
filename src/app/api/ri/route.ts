// ══════════════════════════════════════════════════════════════════════════════
// Cara — RI Governance Scoring API Route
//
// GET  → returns Chamberlain House demo governance scorecard
// POST → accepts custom RiScoreInputs for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { computeRiScores } from "@/lib/ri/compute-scores";
import type { RiScoreInputs } from "@/lib/ri/compute-scores";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

function getDemoInputs(): RiScoreInputs {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  return {
    // Training needs — 1 urgent unaddressed, 1 high completed, 2 medium
    trainingNeeds: [
      {
        id: "tn-demo-1", home_id: "oak-house", identified_by: "cara",
        need_type: "specialist", title: "Attachment & Trauma Advanced",
        description: "Advanced attachment training needed following recent placement challenges",
        priority: "urgent", status: "identified",
        affected_staff: ["staff-tom"], deadline: today,
        created_by: "system", created_at: threeDaysAgo, updated_at: threeDaysAgo,
      },
      {
        id: "tn-demo-2", home_id: "oak-house", identified_by: "supervision",
        need_type: "mandatory", title: "Safeguarding Refresher",
        description: "Annual safeguarding refresher for all staff",
        priority: "high", status: "completed", completed_at: yesterday,
        created_by: "staff-sarah", created_at: fiveDaysAgo, updated_at: yesterday,
      },
      {
        id: "tn-demo-3", home_id: "oak-house", identified_by: "manual",
        need_type: "specialist", title: "Mental Health First Aid",
        description: "MHFA certification for senior staff",
        priority: "medium", status: "in_progress",
        created_by: "staff-sarah", created_at: fiveDaysAgo, updated_at: twoDaysAgo,
      },
      {
        id: "tn-demo-4", home_id: "oak-house", identified_by: "incident",
        need_type: "mandatory", title: "Physical Intervention Refresher",
        description: "Refresher required following recent PI incident review",
        priority: "medium", status: "assigned",
        created_by: "system", created_at: twoDaysAgo, updated_at: twoDaysAgo,
      },
    ],

    // Training records — mix of compliant and expiring
    trainingRecords: [
      {
        id: "tr-demo-1", staff_id: "staff-sarah", course_name: "Advanced Safeguarding L3",
        category: "safeguarding", provider: "Local Authority", completed_date: "2026-02-10",
        expiry_date: "2027-02-10", certificate_url: null, status: "compliant",
        is_mandatory: true, notes: null, home_id: "oak-house",
        created_at: now, updated_at: now, created_by: "sys", updated_by: "sys",
      },
      {
        id: "tr-demo-2", staff_id: "staff-tom", course_name: "Safeguarding L2",
        category: "safeguarding", provider: "External", completed_date: "2026-01-15",
        expiry_date: "2027-01-15", certificate_url: null, status: "compliant",
        is_mandatory: true, notes: null, home_id: "oak-house",
        created_at: now, updated_at: now, created_by: "sys", updated_by: "sys",
      },
      {
        id: "tr-demo-3", staff_id: "staff-lisa", course_name: "First Aid at Work",
        category: "first_aid", provider: "Red Cross", completed_date: "2025-08-20",
        expiry_date: "2026-06-20", certificate_url: null, status: "expiring_soon",
        is_mandatory: true, notes: null, home_id: "oak-house",
        created_at: now, updated_at: now, created_by: "sys", updated_by: "sys",
      },
      {
        id: "tr-demo-4", staff_id: "staff-darren", course_name: "Fire Safety",
        category: "fire_safety", provider: "In-house", completed_date: "2026-01-10",
        expiry_date: null, certificate_url: null, status: "compliant",
        is_mandatory: true, notes: null, home_id: "oak-house",
        created_at: now, updated_at: now, created_by: "sys", updated_by: "sys",
      },
      {
        id: "tr-demo-5", staff_id: "staff-sarah", course_name: "PRICE Physical Intervention",
        category: "restraint", provider: "PRICE", completed_date: "2026-03-20",
        expiry_date: "2027-03-20", certificate_url: null, status: "compliant",
        is_mandatory: true, notes: null, home_id: "oak-house",
        created_at: now, updated_at: now, created_by: "sys", updated_by: "sys",
      },
      {
        id: "tr-demo-6", staff_id: "staff-tom", course_name: "Medication Administration",
        category: "medication", provider: "In-house", completed_date: "2026-04-01",
        expiry_date: null, certificate_url: null, status: "compliant",
        is_mandatory: true, notes: null, home_id: "oak-house",
        created_at: now, updated_at: now, created_by: "sys", updated_by: "sys",
      },
    ],

    // Alerts — 1 critical unresolved, 1 high resolved, 1 medium unresolved
    alerts: [
      {
        id: "alert-demo-1", home_id: "oak-house", alert_type: "safeguarding_risk",
        severity: "critical", title: "Unresolved safeguarding concern — Child A",
        description: "Multi-agency meeting not yet convened following disclosure",
        is_resolved: false, auto_generated: true,
        created_by: "system", created_at: twoDaysAgo,
      },
      {
        id: "alert-demo-2", home_id: "oak-house", alert_type: "supervision_gap",
        severity: "high", title: "Supervision gap resolved",
        description: "Tom Richards supervision was overdue but has now been completed",
        is_resolved: true, resolved_at: yesterday, resolved_by: "staff-sarah",
        resolution_note: "Supervision completed and actions agreed",
        auto_generated: true, created_by: "system", created_at: fiveDaysAgo,
      },
      {
        id: "alert-demo-3", home_id: "oak-house", alert_type: "overdue_action",
        severity: "medium", title: "Overdue maintenance action",
        description: "Fire door check overdue by 3 days",
        is_resolved: false, auto_generated: true,
        created_by: "system", created_at: threeDaysAgo,
      },
    ],

    // Incidents — 1 open high with oversight needed, 1 closed, 1 complaint open, 1 medium closed
    incidents: [
      {
        id: "inc-demo-1", reference: "INC-2026-041", type: "safeguarding_concern",
        severity: "high", child_id: "child-alex", date: twoDaysAgo.slice(0, 10),
        time: "15:30", location: "Garden", description: "Disclosure during key-work session",
        immediate_action: "Safeguarding referral initiated", reported_by: "staff-lisa",
        witnesses: [], body_map_required: false, body_map_completed: false, body_map_url: null,
        notifications: [], requires_oversight: true, oversight_note: null,
        oversight_by: null, oversight_at: null, status: "open", outcome: null,
        lessons_learned: null, linked_task_ids: [], linked_document_ids: [],
        home_id: "oak-house", created_at: twoDaysAgo, updated_at: twoDaysAgo,
        created_by: "staff-lisa", updated_by: "staff-lisa",
      },
      {
        id: "inc-demo-2", reference: "INC-2026-039", type: "behaviour_incident",
        severity: "medium", child_id: "child-jordan", date: fiveDaysAgo.slice(0, 10),
        time: "18:00", location: "Dining room", description: "Verbal aggression at mealtimes",
        immediate_action: "De-escalation techniques used", reported_by: "staff-tom",
        witnesses: ["staff-lisa"], body_map_required: false, body_map_completed: false,
        body_map_url: null, notifications: [], requires_oversight: true,
        oversight_note: "Reviewed — pattern identified, added to behaviour support plan",
        oversight_by: "staff-sarah", oversight_at: threeDaysAgo,
        status: "closed", outcome: "BSP updated", lessons_learned: "Mealtime routine adjusted",
        linked_task_ids: [], linked_document_ids: [],
        home_id: "oak-house", created_at: fiveDaysAgo, updated_at: threeDaysAgo,
        created_by: "staff-tom", updated_by: "staff-sarah",
      },
      {
        id: "inc-demo-3", reference: "INC-2026-040", type: "complaint",
        severity: "medium", child_id: "child-morgan", date: threeDaysAgo.slice(0, 10),
        time: "10:00", location: null, description: "Parent raised concern about contact arrangements",
        immediate_action: "Acknowledged and logged", reported_by: "staff-sarah",
        witnesses: [], body_map_required: false, body_map_completed: false, body_map_url: null,
        notifications: [], requires_oversight: false, oversight_note: null,
        oversight_by: null, oversight_at: null, status: "under_review", outcome: null,
        lessons_learned: null, linked_task_ids: [], linked_document_ids: [],
        home_id: "oak-house", created_at: threeDaysAgo, updated_at: threeDaysAgo,
        created_by: "staff-sarah", updated_by: "staff-sarah",
      },
      {
        id: "inc-demo-4", reference: "INC-2026-038", type: "missing_from_care",
        severity: "critical", child_id: "child-alex", date: fiveDaysAgo.slice(0, 10),
        time: "22:30", location: null, description: "Alex absent from home past curfew",
        immediate_action: "Police notified, SW contacted", reported_by: "staff-tom",
        witnesses: [], body_map_required: false, body_map_completed: false, body_map_url: null,
        notifications: [], requires_oversight: true,
        oversight_note: "Full debrief completed, safety plan updated",
        oversight_by: "staff-darren", oversight_at: threeDaysAgo,
        status: "closed", outcome: "Safety plan updated", lessons_learned: null,
        linked_task_ids: [], linked_document_ids: [],
        home_id: "oak-house", created_at: fiveDaysAgo, updated_at: threeDaysAgo,
        created_by: "staff-tom", updated_by: "staff-darren",
      },
    ],

    supervisionsMeta: { overdue: 1 },
    auditsMeta: { overdue: 0 },

    // Audits — including safety-category audits
    audits: [
      {
        id: "aud-demo-1", title: "Fire Safety Quarterly Check", category: "fire_safety",
        date: yesterday.slice(0, 10), completed_by: "staff-darren",
        score: 92, max_score: 100, status: "completed", findings: 1, actions: 1,
        home_id: "oak-house", created_at: yesterday, created_by: "staff-darren",
        updated_at: yesterday, updated_by: "staff-darren",
      },
      {
        id: "aud-demo-2", title: "Health & Safety Walk-around", category: "health_and_safety",
        date: twoDaysAgo.slice(0, 10), completed_by: "staff-sarah",
        score: 88, max_score: 100, status: "completed", findings: 2, actions: 2,
        home_id: "oak-house", created_at: twoDaysAgo, created_by: "staff-sarah",
        updated_at: twoDaysAgo, updated_by: "staff-sarah",
      },
      {
        id: "aud-demo-3", title: "Records & Documentation Audit", category: "documentation",
        date: threeDaysAgo.slice(0, 10), completed_by: "staff-sarah",
        score: 82, max_score: 100, status: "completed", findings: 3, actions: 2,
        home_id: "oak-house", created_at: threeDaysAgo, created_by: "staff-sarah",
        updated_at: threeDaysAgo, updated_by: "staff-sarah",
      },
    ],

    // Medication audits
    medicationAudits: [
      {
        id: "maud-demo-1", title: "Monthly Medication Audit", category: "medication",
        date: yesterday.slice(0, 10), completed_by: "staff-lisa",
        score: 88, max_score: 100, status: "completed", findings: 1, actions: 1,
        home_id: "oak-house", created_at: yesterday, created_by: "staff-lisa",
        updated_at: yesterday, updated_by: "staff-lisa",
      },
      {
        id: "maud-demo-2", title: "Controlled Drugs Stock Check", category: "medication",
        date: fiveDaysAgo.slice(0, 10), completed_by: "staff-sarah",
        score: 95, max_score: 100, status: "completed", findings: 0, actions: 0,
        home_id: "oak-house", created_at: fiveDaysAgo, created_by: "staff-sarah",
        updated_at: fiveDaysAgo, updated_by: "staff-sarah",
      },
    ],

    // Reg 45 — reviewed status
    reg45Items: [
      {
        id: "reg45-demo-1", home_id: "oak-house", report_period: "Q1 2026",
        period_start: "2026-01-01", period_end: "2026-03-31",
        evidence_items: [{ area: "safeguarding", summary: "Two referrals made" }],
        status: "reviewed", submitted_to_ofsted: false,
        created_by: "staff-darren", created_at: fiveDaysAgo, updated_at: twoDaysAgo,
      },
    ],

    // Challenges — 1 open, 1 action_pending, 1 resolved
    challenges: [
      {
        id: "chal-demo-1", home_id: "oak-house", title: "Staffing levels at weekends",
        challenge_area: "staffing", evidence_summary: "Weekend cover frequently requires agency staff",
        challenge_text: "What steps are being taken to reduce reliance on agency cover at weekends?",
        escalation_level: "standard", status: "open", cara_generated: true,
        created_by: "system", created_at: threeDaysAgo, updated_at: threeDaysAgo,
      },
      {
        id: "chal-demo-2", home_id: "oak-house", title: "Keywork session frequency",
        challenge_area: "practice", evidence_summary: "Keywork sessions below target for 2 YP",
        challenge_text: "How will keywork frequency be restored for all young people?",
        escalation_level: "standard",
        manager_response: "Rota adjusted to ensure weekly sessions",
        manager_responded_at: yesterday, manager_responded_by: "staff-sarah",
        status: "action_pending", action_required: "Monitor over next 2 weeks",
        action_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        cara_generated: true, created_by: "system", created_at: fiveDaysAgo, updated_at: yesterday,
      },
      {
        id: "chal-demo-3", home_id: "oak-house", title: "Daily log quality improvement",
        challenge_area: "oversight", evidence_summary: "Daily logs lacked detail and reflective content",
        challenge_text: "What measures have been implemented to improve daily log quality?",
        escalation_level: "standard",
        manager_response: "Template updated and training delivered to all staff",
        manager_responded_at: fiveDaysAgo, manager_responded_by: "staff-sarah",
        action_completed_at: threeDaysAgo,
        status: "resolved", cara_generated: true,
        created_by: "system", created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: threeDaysAgo,
      },
    ],

    // Care forms — mix of statuses
    careForms: [
      {
        id: "cf-demo-1", title: "Alex — Risk Assessment Review", form_type: "risk_assessment",
        status: "approved", linked_child_id: "child-alex", linked_staff_id: null,
        linked_incident_id: null, linked_shift_id: null, linked_task_id: null,
        description: "Quarterly risk assessment update", body: {},
        submitted_at: fiveDaysAgo, submitted_by: "staff-lisa",
        reviewed_by: "staff-sarah", reviewed_at: threeDaysAgo, review_notes: null,
        approved_at: twoDaysAgo, approved_by: "staff-darren",
        due_date: today, priority: "high", tags: ["safeguarding"],
        home_id: "oak-house", created_at: fiveDaysAgo, updated_at: twoDaysAgo,
        created_by: "staff-lisa", updated_by: "staff-darren",
      },
      {
        id: "cf-demo-2", title: "Jordan — Behaviour Support Plan", form_type: "behaviour_record",
        status: "submitted", linked_child_id: "child-jordan", linked_staff_id: null,
        linked_incident_id: null, linked_shift_id: null, linked_task_id: null,
        description: "Updated BSP following mealtime incident", body: {},
        submitted_at: yesterday, submitted_by: "staff-tom",
        reviewed_by: null, reviewed_at: null, review_notes: null,
        approved_at: null, approved_by: null,
        due_date: today, priority: "medium", tags: [],
        home_id: "oak-house", created_at: twoDaysAgo, updated_at: yesterday,
        created_by: "staff-tom", updated_by: "staff-tom",
      },
      {
        id: "cf-demo-3", title: "Morgan — Placement Plan", form_type: "key_work_session",
        status: "approved", linked_child_id: "child-morgan", linked_staff_id: null,
        linked_incident_id: null, linked_shift_id: null, linked_task_id: null,
        description: "Six-month placement plan review", body: {},
        submitted_at: fiveDaysAgo, submitted_by: "staff-sarah",
        reviewed_by: "staff-darren", reviewed_at: threeDaysAgo, review_notes: null,
        approved_at: twoDaysAgo, approved_by: "staff-darren",
        due_date: null, priority: "medium", tags: [],
        home_id: "oak-house", created_at: fiveDaysAgo, updated_at: twoDaysAgo,
        created_by: "staff-sarah", updated_by: "staff-darren",
      },
      {
        id: "cf-demo-4", title: "Alex — Education Update", form_type: "education_update",
        status: "draft", linked_child_id: "child-alex", linked_staff_id: null,
        linked_incident_id: null, linked_shift_id: null, linked_task_id: null,
        description: "Termly education progress note", body: {},
        submitted_at: null, submitted_by: null,
        reviewed_by: null, reviewed_at: null, review_notes: null,
        approved_at: null, approved_by: null,
        due_date: "2026-05-10", priority: "low", tags: ["education"],
        home_id: "oak-house", created_at: fiveDaysAgo, updated_at: fiveDaysAgo,
        created_by: "staff-tom", updated_by: "staff-tom",
      },
    ],

    // Daily logs — recent entries across all 3 YP
    dailyLogs: [
      {
        id: "dl-demo-1", child_id: "child-alex", date: today, time: "08:00",
        entry_type: "general", content: "Alex had a settled morning, engaged well in breakfast routine.",
        mood_score: 7, staff_id: "staff-tom", linked_incident_id: null, is_significant: false,
        home_id: "oak-house", created_at: now, updated_at: now, created_by: "staff-tom", updated_by: "staff-tom",
      },
      {
        id: "dl-demo-2", child_id: "child-alex", date: today, time: "14:00",
        entry_type: "mood", content: "Alex appeared withdrawn after school. Offered 1:1 time.",
        mood_score: 4, staff_id: "staff-lisa", linked_incident_id: null, is_significant: true,
        home_id: "oak-house", created_at: now, updated_at: now, created_by: "staff-lisa", updated_by: "staff-lisa",
      },
      {
        id: "dl-demo-3", child_id: "child-jordan", date: today, time: "09:00",
        entry_type: "general", content: "Jordan had a good start to the day.",
        mood_score: 8, staff_id: "staff-tom", linked_incident_id: null, is_significant: false,
        home_id: "oak-house", created_at: now, updated_at: now, created_by: "staff-tom", updated_by: "staff-tom",
      },
      {
        id: "dl-demo-4", child_id: "child-jordan", date: yesterday.slice(0, 10), time: "20:00",
        entry_type: "behaviour", content: "Jordan requested to call social worker.",
        mood_score: 6, staff_id: "staff-lisa", linked_incident_id: null, is_significant: true,
        home_id: "oak-house", created_at: yesterday, updated_at: yesterday, created_by: "staff-lisa", updated_by: "staff-lisa",
      },
      {
        id: "dl-demo-5", child_id: "child-morgan", date: today, time: "10:00",
        entry_type: "activity", content: "Morgan attended art group at community centre.",
        mood_score: 8, staff_id: "staff-sarah", linked_incident_id: null, is_significant: false,
        home_id: "oak-house", created_at: now, updated_at: now, created_by: "staff-sarah", updated_by: "staff-sarah",
      },
      {
        id: "dl-demo-6", child_id: "child-morgan", date: yesterday.slice(0, 10), time: "15:00",
        entry_type: "general", content: "Morgan helped prepare evening meal.",
        mood_score: 7, staff_id: "staff-tom", linked_incident_id: null, is_significant: false,
        home_id: "oak-house", created_at: yesterday, updated_at: yesterday, created_by: "staff-tom", updated_by: "staff-tom",
      },
      {
        id: "dl-demo-7", child_id: "child-alex", date: twoDaysAgo.slice(0, 10), time: "12:00",
        entry_type: "health", content: "Alex attended GP appointment. No concerns.",
        mood_score: 6, staff_id: "staff-lisa", linked_incident_id: null, is_significant: true,
        home_id: "oak-house", created_at: twoDaysAgo, updated_at: twoDaysAgo, created_by: "staff-lisa", updated_by: "staff-lisa",
      },
      {
        id: "dl-demo-8", child_id: "child-jordan", date: twoDaysAgo.slice(0, 10), time: "18:00",
        entry_type: "contact", content: "Jordan spoke to mum on video call — positive interaction.",
        mood_score: 8, staff_id: "staff-tom", linked_incident_id: null, is_significant: false,
        home_id: "oak-house", created_at: twoDaysAgo, updated_at: twoDaysAgo, created_by: "staff-tom", updated_by: "staff-tom",
      },
      {
        id: "dl-demo-9", child_id: "child-morgan", date: threeDaysAgo.slice(0, 10), time: "08:30",
        entry_type: "education", content: "Morgan had a good day at school. Positive feedback from teacher.",
        mood_score: 9, staff_id: "staff-sarah", linked_incident_id: null, is_significant: false,
        home_id: "oak-house", created_at: threeDaysAgo, updated_at: threeDaysAgo, created_by: "staff-sarah", updated_by: "staff-sarah",
      },
      {
        id: "dl-demo-10", child_id: "child-alex", date: threeDaysAgo.slice(0, 10), time: "21:00",
        entry_type: "sleep", content: "Alex settled to bed at 21:00. Required reassurance.",
        mood_score: 5, staff_id: "staff-tom", linked_incident_id: null, is_significant: false,
        home_id: "oak-house", created_at: threeDaysAgo, updated_at: threeDaysAgo, created_by: "staff-tom", updated_by: "staff-tom",
      },
    ],

    // Recruitment — 2 active candidates
    activeCandidates: [
      { compliance_score: 92 },
      { compliance_score: 88 },
    ],

    ypCount: 3,
  };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const inputs = getDemoInputs();
    const scores = computeRiScores(inputs);

    return NextResponse.json({
      scores,
      inputs_summary: {
        training_needs: inputs.trainingNeeds.length,
        training_records: inputs.trainingRecords.length,
        alerts: inputs.alerts.length,
        incidents: inputs.incidents.length,
        supervisions_overdue: inputs.supervisionsMeta?.overdue ?? 0,
        audits_overdue: inputs.auditsMeta?.overdue ?? 0,
        audits: inputs.audits.length,
        medication_audits: inputs.medicationAudits.length,
        reg45_items: inputs.reg45Items.length,
        challenges: inputs.challenges.length,
        care_forms: inputs.careForms?.length ?? 0,
        daily_logs: inputs.dailyLogs?.length ?? 0,
        active_candidates: inputs.activeCandidates?.length ?? 0,
        yp_count: inputs.ypCount ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to compute RI governance scores", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredArrays = [
      "trainingNeeds", "trainingRecords", "alerts", "incidents",
      "audits", "medicationAudits", "reg45Items", "challenges",
    ] as const;

    for (const field of requiredArrays) {
      if (!Array.isArray(body[field])) {
        return NextResponse.json(
          { error: `Missing or invalid required field: ${field} (must be an array)` },
          { status: 400 },
        );
      }
    }

    const inputs: RiScoreInputs = {
      trainingNeeds: body.trainingNeeds,
      trainingRecords: body.trainingRecords,
      alerts: body.alerts,
      incidents: body.incidents,
      supervisionsMeta: body.supervisionsMeta,
      auditsMeta: body.auditsMeta,
      audits: body.audits,
      medicationAudits: body.medicationAudits,
      reg45Items: body.reg45Items,
      challenges: body.challenges,
      careForms: body.careForms,
      dailyLogs: body.dailyLogs,
      activeCandidates: body.activeCandidates,
      ypCount: body.ypCount,
    };

    const scores = computeRiScores(inputs);

    return NextResponse.json({
      scores,
      inputs_summary: {
        training_needs: inputs.trainingNeeds.length,
        training_records: inputs.trainingRecords.length,
        alerts: inputs.alerts.length,
        incidents: inputs.incidents.length,
        supervisions_overdue: inputs.supervisionsMeta?.overdue ?? 0,
        audits_overdue: inputs.auditsMeta?.overdue ?? 0,
        audits: inputs.audits.length,
        medication_audits: inputs.medicationAudits.length,
        reg45_items: inputs.reg45Items.length,
        challenges: inputs.challenges.length,
        care_forms: inputs.careForms?.length ?? 0,
        daily_logs: inputs.dailyLogs?.length ?? 0,
        active_candidates: inputs.activeCandidates?.length ?? 0,
        yp_count: inputs.ypCount ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process RI governance data", details: String(error) },
      { status: 500 },
    );
  }
}
