// ══════════════════════════════════════════════════════════════════════════════
// CARA — INCIDENT OVERSIGHT QUALITY INTELLIGENCE
// GET /api/v1/incident-oversight-quality-intelligence
// Surfaces oversight gaps, notification acknowledgement deficits, body-map
// omissions, and lessons-learned completion across all incidents.
// CHR 2015 Reg 36 (oversight), Reg 40 (notifications), Reg 28 (PI records).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import type { Incident, YoungPerson } from "@/types";

type IncidentOversightSignal = "urgent" | "overdue" | "pending" | "compliant";
type HomeOversightSignal = "urgent" | "attention" | "monitoring" | "good";

interface IncidentOversightProfile {
  incidentId: string;
  reference: string;
  type: string;
  severity: string;
  childId: string;
  childName: string;
  date: string;
  daysOpen: number;
  status: string;
  oversightGap: boolean;
  oversightAt: string | null;
  oversightHours: number | null;
  bodyMapGap: boolean;
  unacknowledgedNotifications: string[];
  lessonsLearnedMissed: boolean;
  signal: IncidentOversightSignal;
}

interface IncidentOversightSummary {
  totalIncidents: number;
  openIncidents: number;
  oversightGapsCount: number;
  criticalWithoutOversight: number;
  physicalInterventionsWithoutOversight: number;
  avgHoursToOversight: number | null;
  lessonsLearnedRate: number;
  notificationAcknowledgementRate: number;
  signal: HomeOversightSignal;
}

function daysBetween(dateStr: string, nowStr: string): number {
  return Math.floor(
    (new Date(nowStr).getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function hoursBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / (1000 * 60 * 60);
}

function incidentSignal(
  severity: string,
  type: string,
  oversightGap: boolean,
  daysOpen: number
): IncidentOversightSignal {
  if (!oversightGap) return "compliant";
  if (severity === "critical" || type === "physical_intervention") return "urgent";
  if (daysOpen >= 2) return "overdue";
  return "pending";
}

// Read a dal collection defensively: a transient query failure degrades to an
// empty list rather than 500-ing the whole route.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const now = new Date().toISOString();

  const [youngPeople, incidents] = (await Promise.all([
    safeList(dal.youngPeople.findAll()),
    safeList(dal.incidents.findAll()),
  ])) as [YoungPerson[], Incident[]];

  const ypMap = new Map(
    youngPeople.map((yp) => [yp.id, `${yp.first_name} ${yp.last_name}`.trim() || "Unknown"])
  );

  const profiles: IncidentOversightProfile[] = incidents.map((inc) => {
    const daysOpen = daysBetween(inc.date, now);
    const oversightGap = inc.requires_oversight && !inc.oversight_note;

    const incidentDatetime = `${inc.date}T${inc.time ?? "00:00"}:00Z`;
    const oversightHours =
      inc.oversight_at !== null
        ? Math.max(0, Math.round(hoursBetween(incidentDatetime, inc.oversight_at)))
        : null;

    const bodyMapGap = inc.body_map_required && !inc.body_map_completed;

    const unacknowledgedNotifications = (inc.notifications ?? [])
      .filter((n) => !n.acknowledged)
      .map((n) => n.role);

    const lessonsLearnedMissed =
      inc.status === "closed" &&
      (!inc.lessons_learned || inc.lessons_learned.trim() === "");

    const signal = incidentSignal(inc.severity, inc.type, oversightGap, daysOpen);

    return {
      incidentId: inc.id,
      reference: inc.reference,
      type: inc.type,
      severity: inc.severity,
      childId: inc.child_id,
      childName: ypMap.get(inc.child_id) ?? "Unknown",
      date: inc.date,
      daysOpen,
      status: inc.status,
      oversightGap,
      oversightAt: inc.oversight_at,
      oversightHours,
      bodyMapGap,
      unacknowledgedNotifications,
      lessonsLearnedMissed,
      signal,
    };
  });

  const signalOrder: Record<IncidentOversightSignal, number> = {
    urgent: 0,
    overdue: 1,
    pending: 2,
    compliant: 3,
  };
  profiles.sort((a, b) => {
    const diff = signalOrder[a.signal] - signalOrder[b.signal];
    if (diff !== 0) return diff;
    return b.daysOpen - a.daysOpen;
  });

  // ── Summary ───────────────────────────────────────────────────────────────

  const totalIncidents = incidents.length;
  const openIncidents = incidents.filter((i) => i.status === "open").length;
  const oversightGapsCount = profiles.filter((p) => p.oversightGap).length;
  const criticalWithoutOversight = profiles.filter(
    (p) => p.oversightGap && p.severity === "critical"
  ).length;
  const physicalInterventionsWithoutOversight = profiles.filter(
    (p) => p.oversightGap && p.type === "physical_intervention"
  ).length;

  const completedOversights = profiles.filter((p) => p.oversightHours !== null);
  const avgHoursToOversight =
    completedOversights.length > 0
      ? Math.round(
          completedOversights.reduce((sum, p) => sum + (p.oversightHours ?? 0), 0) /
            completedOversights.length
        )
      : null;

  const closedIncidents = incidents.filter((i) => i.status === "closed");
  const lessonsLearnedRate =
    closedIncidents.length > 0
      ? Math.round(
          (closedIncidents.filter(
            (i) => i.lessons_learned && i.lessons_learned.trim() !== ""
          ).length /
            closedIncidents.length) *
            100
        )
      : 100;

  const allNotifications = incidents.flatMap((i) => i.notifications ?? []);
  const notificationAcknowledgementRate =
    allNotifications.length > 0
      ? Math.round(
          (allNotifications.filter((n) => n.acknowledged).length /
            allNotifications.length) *
            100
        )
      : 100;

  let homeSignal: HomeOversightSignal = "good";
  if (criticalWithoutOversight > 0 || physicalInterventionsWithoutOversight > 0) {
    homeSignal = "urgent";
  } else if (oversightGapsCount > 1) {
    homeSignal = "attention";
  } else if (oversightGapsCount === 1) {
    homeSignal = "monitoring";
  }

  const summary: IncidentOversightSummary = {
    totalIncidents,
    openIncidents,
    oversightGapsCount,
    criticalWithoutOversight,
    physicalInterventionsWithoutOversight,
    avgHoursToOversight,
    lessonsLearnedRate,
    notificationAcknowledgementRate,
    signal: homeSignal,
  };

  return NextResponse.json({ data: { incidents: profiles, summary } });
}
