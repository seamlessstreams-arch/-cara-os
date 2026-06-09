// ══════════════════════════════════════════════════════════════════════════════
// API: /api/notification-timeliness
//
// Notification Timeliness Intelligence
//
// GET  — Returns notification timeliness assessment with realistic Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateNotificationTimelinessIntelligence,
  getNotificationTypeLabel,
  getRecipientLabel,
  getRatingLabel,
} from "@/lib/notification-timeliness";
import type {
  NotifiableEvent,
  NotificationRecord,
  NotificationPolicy,
  NotificationAudit,
} from "@/lib/notification-timeliness";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function n(overrides: Partial<NotificationRecord> = {}): NotificationRecord {
  return {
    recipient: "ofsted",
    method: "online_form",
    sentAt: "2026-05-15T16:00:00Z",
    status: "submitted_on_time",
    contentSummary: "Standard notification submitted.",
    ...overrides,
  };
}

const DEMO_EVENTS: NotifiableEvent[] = [
  // Event 1: Alex — serious injury, all on time
  {
    id: "evt-alex-001",
    homeId: "oak-house",
    category: "schedule_5",
    type: "serious_injury",
    title: "Alex sustained broken arm during outdoor activity",
    description: "Alex fell from the climbing frame during supervised outdoor activities. Staff administered first aid and called an ambulance. Parent notified immediately.",
    childId: "child-alex",
    childName: "Alex",
    occurredAt: "2026-05-10T10:00:00Z",
    discoveredAt: "2026-05-10T10:00:00Z",
    severity: 3,
    loggedBy: "Darren Laville",
    loggedAt: "2026-05-10T10:30:00Z",
    notifications: [
      n({ recipient: "ofsted", sentAt: "2026-05-10T12:00:00Z", acknowledgedAt: "2026-05-10T14:00:00Z", reference: "OF-2026-1234" }),
      n({ recipient: "local_authority", sentAt: "2026-05-10T12:30:00Z", method: "email", contentSummary: "Email to LA safeguarding team re: serious injury." }),
      n({ recipient: "parent_carer", sentAt: "2026-05-10T10:30:00Z", method: "phone", acknowledgedAt: "2026-05-10T10:35:00Z", contentSummary: "Phone call to parent — informed of injury and hospital attendance." }),
      n({ recipient: "placing_authority", sentAt: "2026-05-10T13:00:00Z", method: "email", contentSummary: "Email to placing authority social worker." }),
    ],
    followUpRequired: true,
    followUpCompletedAt: "2026-05-11T09:00:00Z",
    outcome: "Alex discharged same day with cast. Returned to home. Risk assessment for climbing frame updated.",
  },
  // Event 2: Jordan — absconding, Ofsted late, police not notified
  {
    id: "evt-jordan-001",
    homeId: "oak-house",
    category: "schedule_5",
    type: "absconding",
    title: "Jordan left the home without permission at night",
    description: "Jordan climbed out of bedroom window at approximately 22:00. Night staff discovered absence during check at 22:30. Police contacted by phone. Jordan returned voluntarily at 01:00.",
    childId: "child-jordan",
    childName: "Jordan",
    occurredAt: "2026-05-12T22:00:00Z",
    discoveredAt: "2026-05-12T22:30:00Z",
    severity: 4,
    loggedBy: "Sarah Johnson",
    loggedAt: "2026-05-12T23:00:00Z",
    notifications: [
      n({ recipient: "ofsted", sentAt: "2026-05-14T10:00:00Z", status: "submitted_late", contentSummary: "Late notification to Ofsted re: absconding episode." }),
      n({ recipient: "local_authority", sentAt: "2026-05-13T08:00:00Z", method: "email", contentSummary: "Email to LA regarding missing episode." }),
      n({ recipient: "parent_carer", sentAt: "2026-05-12T23:00:00Z", method: "phone", acknowledgedAt: "2026-05-12T23:05:00Z", contentSummary: "Phone call to parent — informed of absence and return." }),
      // Police NOT notified via formal notification — gap
    ],
    followUpRequired: true,
    followUpCompletedAt: "2026-05-13T14:00:00Z",
    outcome: "Return home interview completed. Window locks reviewed. Safety plan updated.",
  },
  // Event 3: Morgan — allegation against staff, all on time
  {
    id: "evt-morgan-001",
    homeId: "oak-house",
    category: "schedule_5",
    type: "allegation_against_staff",
    title: "Morgan disclosed allegation against night staff member",
    description: "During key work session Morgan disclosed that a night staff member had used inappropriate language. LADO referral made immediately.",
    childId: "child-morgan",
    childName: "Morgan",
    occurredAt: "2026-05-14T08:00:00Z",
    discoveredAt: "2026-05-14T08:00:00Z",
    severity: 4,
    loggedBy: "Darren Laville",
    loggedAt: "2026-05-14T08:15:00Z",
    notifications: [
      n({ recipient: "ofsted", sentAt: "2026-05-14T09:00:00Z", acknowledgedAt: "2026-05-14T11:00:00Z", contentSummary: "Ofsted notification of allegation against staff." }),
      n({ recipient: "local_authority", sentAt: "2026-05-14T09:30:00Z", method: "email", contentSummary: "Email to LA LADO team." }),
      n({ recipient: "lado", sentAt: "2026-05-14T08:30:00Z", method: "phone", acknowledgedAt: "2026-05-14T09:00:00Z", contentSummary: "Phone referral to LADO." }),
    ],
    followUpRequired: true,
    followUpCompletedAt: "2026-05-15T14:00:00Z",
    outcome: "LADO investigation initiated. Staff member suspended pending outcome. Support plan for Morgan implemented.",
  },
  // Event 4: Jordan — child protection (Schedule 6), all on time
  {
    id: "evt-jordan-002",
    homeId: "oak-house",
    category: "schedule_6",
    type: "child_protection",
    title: "Jordan disclosed historical abuse during therapy session",
    description: "Jordan disclosed historical physical abuse during a scheduled therapeutic session. Therapist alerted registered manager immediately.",
    childId: "child-jordan",
    childName: "Jordan",
    occurredAt: "2026-05-16T11:00:00Z",
    discoveredAt: "2026-05-16T11:00:00Z",
    severity: 5,
    loggedBy: "Darren Laville",
    loggedAt: "2026-05-16T11:15:00Z",
    notifications: [
      n({ recipient: "ofsted", sentAt: "2026-05-16T12:00:00Z", contentSummary: "Notification to Ofsted re: child protection disclosure." }),
      n({ recipient: "local_authority", sentAt: "2026-05-16T12:00:00Z", method: "phone", acknowledgedAt: "2026-05-16T12:15:00Z", contentSummary: "Phone call to LA MASH team." }),
      n({ recipient: "parent_carer", sentAt: "2026-05-16T13:00:00Z", method: "phone", contentSummary: "Parent informed — discussion with social worker present." }),
      n({ recipient: "placing_authority", sentAt: "2026-05-16T13:30:00Z", method: "email", contentSummary: "Email to placing authority." }),
    ],
    followUpRequired: true,
    followUpCompletedAt: "2026-05-17T10:00:00Z",
    outcome: "Strategy meeting convened. Increased therapeutic support arranged for Jordan.",
  },
  // Event 5: Alex — police involvement, Ofsted pending
  {
    id: "evt-alex-002",
    homeId: "oak-house",
    category: "schedule_5",
    type: "police_involvement",
    title: "Police called after Alex found with suspected stolen goods",
    description: "Staff found suspected stolen electronics in Alex's room. Police contacted. Alex cooperative during search.",
    childId: "child-alex",
    childName: "Alex",
    occurredAt: "2026-05-17T16:00:00Z",
    discoveredAt: "2026-05-17T16:00:00Z",
    severity: 3,
    loggedBy: "Darren Laville",
    loggedAt: "2026-05-17T16:30:00Z",
    notifications: [
      // Ofsted NOT yet notified — still within 24h deadline
      n({ recipient: "local_authority", sentAt: "2026-05-17T17:00:00Z", method: "email", contentSummary: "Email to LA re: police involvement." }),
      n({ recipient: "placing_authority", sentAt: "2026-05-17T17:30:00Z", method: "email", contentSummary: "Email to placing authority re: police involvement." }),
    ],
    followUpRequired: false,
  },
];

const DEMO_POLICY: NotificationPolicy = {
  homeId: "oak-house",
  policyDocumentTitle: "Chamberlain House Notification & Reporting Policy v3.1",
  lastReviewedAt: "2026-03-01",
  nextReviewDue: "2026-09-01",
  approvedBy: "Darren Laville",
  coversSchedule5: true,
  coversSchedule6: true,
  coversStakeholderNotification: true,
  staffTrainedCount: 8,
  totalStaffCount: 10,
  escalationProcedureDocumented: true,
  outOfHoursContactsDocumented: true,
};

const DEMO_AUDITS: NotificationAudit[] = [
  {
    id: "audit-001",
    homeId: "oak-house",
    auditDate: "2026-03-15",
    auditor: "Sarah Johnson (Deputy Manager)",
    findings: [
      "All Schedule 5 notifications submitted within statutory timeframes for the quarter",
      "Acknowledgement tracking needs improvement — only 40% of notifications had confirmed receipt",
      "One absconding event lacked formal police notification record",
    ],
    recommendations: [
      "Implement notification acknowledgement tracker",
      "Create checklist for absconding events covering all required recipients",
      "Schedule refresher training for night staff on out-of-hours notification procedures",
    ],
    overallCompliance: "partially_compliant",
    actionPlanInPlace: true,
    nextAuditDue: "2026-09-15",
  },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateNotificationTimelinessIntelligence(
    DEMO_EVENTS,
    DEMO_POLICY,
    DEMO_AUDITS,
    "oak-house",
    "2026-05-01",
    "2026-05-18",
    "2026-05-18T12:00:00Z",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        ratingLabel: getRatingLabel(result.rating),
        notificationTypeLabels: Object.fromEntries(
          (["death", "serious_injury", "serious_illness", "allegation_against_staff", "child_protection", "police_involvement", "absconding", "serious_complaint", "deprivation_of_liberty", "accommodation_change", "manager_change", "closure", "other"] as const).map(
            (t) => [t, getNotificationTypeLabel(t)],
          ),
        ),
        recipientLabels: Object.fromEntries(
          (["ofsted", "local_authority", "parent_carer", "placing_authority", "lado", "police", "other"] as const).map(
            (r) => [r, getRecipientLabel(r)],
          ),
        ),
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    events,
    policy,
    audits,
    homeId,
    periodStart,
    periodEnd,
    currentDate,
  } = body as {
    events?: NotifiableEvent[];
    policy?: NotificationPolicy | null;
    audits?: NotificationAudit[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    currentDate?: string;
  };

  if (!events || !Array.isArray(events)) {
    return NextResponse.json({ error: "events array is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateNotificationTimelinessIntelligence(
    events,
    policy ?? null,
    audits ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    currentDate ?? new Date().toISOString(),
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        ratingLabel: getRatingLabel(result.rating),
      },
    },
  });
}
