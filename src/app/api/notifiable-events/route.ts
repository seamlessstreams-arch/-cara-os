// ══════════════════════════════════════════════════════════════════════════════
// API: /api/notifiable-events — Statutory Notification Management
//
// GET  — returns metrics, recent events, compliance status
// POST — evaluate compliance for specific event, get required notifications
//
// CHR 2015 Schedule 5 — Events to be notified to HMCI.
// CHR 2015 Reg 40(4)(a) — Records of notifications.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateNotificationCompliance,
  calculateNotifiableEventsMetrics,
  buildNotificationTimeline,
  getRequiredNotifications,
} from "@/lib/notifiable-events";
import type { NotifiableEvent } from "@/lib/notifiable-events";

// ── GET Handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const homeId = url.searchParams.get("homeId") ?? "home-oak";
  const view = url.searchParams.get("view") ?? "overview";

  const events = getDemoEvents(homeId);

  switch (view) {
    case "overview":
      return NextResponse.json(calculateNotifiableEventsMetrics(events, homeId));
    case "timeline": {
      const eventId = url.searchParams.get("eventId");
      if (!eventId) {
        return NextResponse.json(
          { timelines: events.slice(0, 10).map(e => buildNotificationTimeline(e)) }
        );
      }
      const event = events.find(e => e.id === eventId);
      if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
      return NextResponse.json(buildNotificationTimeline(event));
    }
    case "compliance":
      return NextResponse.json({
        results: events.map(e => evaluateNotificationCompliance(e)),
      });
    default:
      return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 400 });
  }
}

// ── POST Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "required_notifications") {
    const { category, discoveredAt } = body;
    if (!category || !discoveredAt) {
      return NextResponse.json({ error: "category and discoveredAt required" }, { status: 400 });
    }
    return NextResponse.json({
      notifications: getRequiredNotifications(category, discoveredAt),
    });
  }

  if (action === "evaluate") {
    const { event } = body;
    if (!event) {
      return NextResponse.json({ error: "event required" }, { status: 400 });
    }
    return NextResponse.json({
      compliance: evaluateNotificationCompliance(event as NotifiableEvent),
      timeline: buildNotificationTimeline(event as NotifiableEvent),
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// ── Demo Data ─────────────────────────────────────────────────────────────

function getDemoEvents(homeId: string): NotifiableEvent[] {
  return [
    // ── Serious Injury — fully compliant ──
    {
      id: "ne-001",
      homeId,
      category: "serious_injury",
      title: "Broken arm sustained during outdoor activities",
      description: "Child fell from climbing frame during supervised play. Ambulance called, taken to A&E. X-ray confirmed fracture.",
      occurredAt: "2026-05-10T14:30:00Z",
      discoveredAt: "2026-05-10T14:30:00Z",
      childId: "child-jordan",
      childName: "Jordan Williams",
      severity: 3,
      loggedBy: "staff-001",
      loggedAt: "2026-05-10T15:00:00Z",
      notifications: [
        { recipient: "ofsted", method: "online_form", sentAt: "2026-05-10T16:00:00Z", status: "acknowledged", acknowledgedAt: "2026-05-10T18:00:00Z", deadline: "2026-05-11T14:30:00Z", reference: "OFS-2026-4421" },
        { recipient: "local_authority", method: "email", sentAt: "2026-05-10T16:30:00Z", status: "submitted", deadline: "2026-05-11T14:30:00Z" },
        { recipient: "parent_carer", method: "phone", sentAt: "2026-05-10T15:00:00Z", status: "acknowledged", acknowledgedAt: "2026-05-10T15:05:00Z", deadline: "2026-05-11T14:30:00Z" },
        { recipient: "placing_authority", method: "email", sentAt: "2026-05-10T17:00:00Z", status: "submitted", deadline: "2026-05-11T14:30:00Z" },
      ],
      outcome: "Full recovery expected. Risk assessment for climbing frame updated.",
      closedAt: "2026-05-14T09:00:00Z",
      closedBy: "staff-rm-01",
    },

    // ── Child Missing — returned, compliant ──
    {
      id: "ne-002",
      homeId,
      category: "child_missing",
      title: "Child absconded from home after argument",
      description: "Left without permission at 22:15. Police notified at 22:30. Returned voluntarily at 01:15.",
      occurredAt: "2026-05-08T22:15:00Z",
      discoveredAt: "2026-05-08T22:20:00Z",
      childId: "child-alex",
      childName: "Alex Thompson",
      linkedMissingEpisodeId: "mfc-005",
      severity: 3,
      loggedBy: "staff-003",
      loggedAt: "2026-05-08T22:25:00Z",
      notifications: [
        { recipient: "ofsted", method: "online_form", sentAt: "2026-05-09T08:00:00Z", status: "submitted", deadline: "2026-05-09T22:20:00Z" },
        { recipient: "police", method: "phone", sentAt: "2026-05-08T22:30:00Z", status: "acknowledged", acknowledgedAt: "2026-05-08T22:32:00Z", reference: "POL-2026-8812", deadline: "2026-05-09T22:20:00Z" },
        { recipient: "social_worker", method: "phone", sentAt: "2026-05-08T22:40:00Z", status: "submitted", deadline: "2026-05-09T22:20:00Z" },
        { recipient: "parent_carer", method: "phone", sentAt: "2026-05-08T22:35:00Z", status: "acknowledged", acknowledgedAt: "2026-05-08T22:35:00Z", deadline: "2026-05-09T22:20:00Z" },
      ],
      closedAt: "2026-05-10T09:00:00Z",
      closedBy: "staff-rm-01",
    },

    // ── Allegation Against Staff — pending notifications ──
    {
      id: "ne-003",
      homeId,
      category: "allegation_against_staff",
      title: "Allegation of inappropriate language by member of staff",
      description: "Young person disclosed that a staff member used inappropriate language. LADO referral initiated.",
      occurredAt: "2026-05-15T09:00:00Z",
      discoveredAt: "2026-05-15T10:30:00Z",
      staffInvolved: ["staff-004"],
      severity: 4,
      loggedBy: "staff-rm-01",
      loggedAt: "2026-05-15T10:45:00Z",
      notifications: [
        { recipient: "ofsted", method: "online_form", sentAt: "2026-05-15T11:00:00Z", status: "submitted", deadline: "2026-05-16T10:30:00Z", reference: "OFS-2026-4435" },
        { recipient: "local_authority", method: "email", sentAt: "2026-05-15T11:15:00Z", status: "submitted", deadline: "2026-05-16T10:30:00Z" },
        { recipient: "designated_officer", method: "phone", sentAt: "2026-05-15T11:30:00Z", status: "acknowledged", acknowledgedAt: "2026-05-15T11:45:00Z", deadline: "2026-05-16T10:30:00Z" },
      ],
    },

    // ── Restraint Injury — late notification ──
    {
      id: "ne-004",
      homeId,
      category: "restraint_injury",
      title: "Minor injury sustained during physical intervention",
      description: "Carpet burn on knee during standing hold. First aid applied immediately.",
      occurredAt: "2026-05-03T17:30:00Z",
      discoveredAt: "2026-05-03T17:35:00Z",
      childId: "child-jordan",
      childName: "Jordan Williams",
      linkedIncidentId: "inc-007",
      severity: 2,
      loggedBy: "staff-002",
      loggedAt: "2026-05-03T18:00:00Z",
      notifications: [
        { recipient: "ofsted", method: "online_form", sentAt: "2026-05-04T20:00:00Z", status: "submitted", deadline: "2026-05-04T17:35:00Z" }, // 2.4h late
        { recipient: "local_authority", method: "email", sentAt: "2026-05-04T20:00:00Z", status: "submitted", deadline: "2026-05-04T17:35:00Z" },
        { recipient: "parent_carer", method: "phone", sentAt: "2026-05-03T18:30:00Z", status: "acknowledged", acknowledgedAt: "2026-05-03T18:35:00Z", deadline: "2026-05-04T17:35:00Z" },
      ],
      outcome: "No further treatment needed. Staff debrief completed.",
      closedAt: "2026-05-06T09:00:00Z",
      closedBy: "staff-rm-01",
    },

    // ── Fire — recent, fully compliant ──
    {
      id: "ne-005",
      homeId,
      category: "fire",
      title: "Kitchen toaster fire - contained immediately",
      description: "Toaster malfunction caused small fire. Staff extinguished with fire blanket. No injuries. Fire service attended.",
      occurredAt: "2026-05-14T07:45:00Z",
      discoveredAt: "2026-05-14T07:45:00Z",
      severity: 3,
      loggedBy: "staff-005",
      loggedAt: "2026-05-14T08:30:00Z",
      notifications: [
        { recipient: "ofsted", method: "online_form", sentAt: "2026-05-14T09:00:00Z", status: "acknowledged", acknowledgedAt: "2026-05-14T10:30:00Z", deadline: "2026-05-15T07:45:00Z", reference: "OFS-2026-4430" },
        { recipient: "local_authority", method: "email", sentAt: "2026-05-14T09:15:00Z", status: "submitted", deadline: "2026-05-15T07:45:00Z" },
      ],
      outcome: "Toaster replaced. PAT testing brought forward for all kitchen appliances.",
      closedAt: "2026-05-15T09:00:00Z",
      closedBy: "staff-rm-01",
    },
  ];
}
