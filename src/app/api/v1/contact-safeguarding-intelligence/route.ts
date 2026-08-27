// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTACT SAFEGUARDING INTELLIGENCE API ROUTE
// GET /api/v1/contact-safeguarding-intelligence
//
// Cross-references family contact events with post-contact behaviour incidents
// and session-level concerns to surface contact-linked safeguarding patterns.
//
// CHR 2015 Reg 9 (placements/contact), Reg 6 (quality of care),
// Working Together 2023 (assessment of harm).
// SCCIF: children's relationships are safe and contact is appropriately managed.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { todayStr } from "@/lib/utils";

type IncidentIntensity = "low" | "medium" | "high" | "severe";
type LinkType = "direct_trigger" | "post_contact_window";
type ContactSafeguardingSignal = "concern" | "attention" | "stable";

type ContactLinkedBehaviour = {
  id: string;
  date: string;
  title: string;
  direction: string;
  intensity: IncidentIntensity;
  trigger: string;
  antecedent: string;
  outcome: string;
  linkType: LinkType;
};

type ConcernedContactSession = {
  id: string;
  date: string;
  familyMember: string;
  concerns: string[];
  wasSafe: boolean;
};

type ChildContactSafeguardingProfile = {
  childId: string;
  childName: string;
  signal: ContactSafeguardingSignal;
  contactLinkedBehaviours: ContactLinkedBehaviour[];
  concernedContactSessions: ConcernedContactSession[];
  daysSinceLastContact: number | null;
  dominantPattern: string | null;
  highestSeverity: IncidentIntensity | null;
};

type ContactSafeguardingSummary = {
  totalChildrenInScope: number;
  totalContactLinkedIncidents: number;
  childrenWithConcern: number;
  childrenWithAttention: number;
  overallSignal: ContactSafeguardingSignal;
};

type ContactSafeguardingResponse = {
  profiles: ChildContactSafeguardingProfile[];
  summary: ContactSafeguardingSummary;
};

const INTENSITY_RANK: Record<IncidentIntensity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  severe: 4,
};

function higherIntensity(
  a: IncidentIntensity | null,
  b: IncidentIntensity
): IncidentIntensity {
  if (a === null) return b;
  return INTENSITY_RANK[b] > INTENSITY_RANK[a] ? b : a;
}

function daysBetween(earlier: string, later: string): number {
  return Math.floor(
    (new Date(later).getTime() - new Date(earlier).getTime()) / 86_400_000
  );
}

function toDate(v: unknown): string {
  return String(v ?? "").slice(0, 10);
}

function isContactLinkedTrigger(trigger: string, antecedent: string): boolean {
  const t = trigger.toLowerCase();
  const a = antecedent.toLowerCase();
  return (
    t.includes("family contact") ||
    (t.includes("contact") && t.includes("family")) ||
    a.includes("phone call with family") ||
    a.includes("unplanned phone call from") ||
    a.includes("family phone") ||
    a.includes("family contact")
  );
}

function contactSignal(
  behaviours: ContactLinkedBehaviour[],
  concernedSessions: ConcernedContactSession[]
): ContactSafeguardingSignal {
  const concerning = behaviours.filter((b) => b.direction === "concerning");
  if (concerning.some((b) => b.intensity === "high" || b.intensity === "severe")) {
    return "concern";
  }
  if (
    concerning.some((b) => b.intensity === "medium") ||
    concernedSessions.length > 0
  ) {
    return "attention";
  }
  return "stable";
}

export async function GET() {
  const [behaviourLogList, familyTimeSessionsList, youngPeopleList] = await Promise.all([
      dal.behaviourLog.findAll(),
      dal.familyTimeSessions.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const today = todayStr();

  // ── Child name map ──────────────────────────────────────────────────────────
  const ypMap = new Map(
    (((youngPeopleList)) ?? []).map((yp) => [
      yp.id,
      `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || "Unknown",
    ])
  );

  // ── Index family time sessions by child ────────────────────────────────────
  const sessionsByChild = new Map<string, any[]>();
  for (const s of ((familyTimeSessionsList)) ?? []) {
    const list = sessionsByChild.get(s.child_id) ?? [];
    list.push(s);
    sessionsByChild.set(s.child_id, list);
  }

  // ── Index behaviour log by child ───────────────────────────────────────────
  const behaviourByChild = new Map<string, any[]>();
  for (const b of ((behaviourLogList)) ?? []) {
    if (!b.child_id) continue;
    const list = behaviourByChild.get(b.child_id) ?? [];
    list.push(b);
    behaviourByChild.set(b.child_id, list);
  }

  // ── Build per-child profiles ───────────────────────────────────────────────
  const profiles: ChildContactSafeguardingProfile[] = [];
  const childIds = new Set([
    ...sessionsByChild.keys(),
    ...behaviourByChild.keys(),
  ]);

  for (const childId of childIds) {
    if (!ypMap.has(childId)) continue;

    const sessions = sessionsByChild.get(childId) ?? [];
    const behaviours = behaviourByChild.get(childId) ?? [];

    // Sessions with safety concerns
    const concernedContactSessions: ConcernedContactSession[] = sessions
      .filter(
        (s) =>
          s.was_it_safe === false || (s.concerns_raised ?? []).length > 0
      )
      .map((s) => ({
        id: s.id,
        date: toDate(s.date),
        familyMember:
          s.family_member_name ?? s.family_member ?? "Family member",
        concerns: s.concerns_raised ?? [],
        wasSafe: s.was_it_safe !== false,
      }));

    // Session dates for post-contact window
    const sessionDates = sessions.map((s) => toDate(s.date));

    // Directly triggered behaviours first
    const contactLinkedBehaviours: ContactLinkedBehaviour[] = [];
    const directIds = new Set<string>();

    for (const b of behaviours) {
      if (isContactLinkedTrigger(b.trigger ?? "", b.antecedent ?? "")) {
        directIds.add(b.id);
        contactLinkedBehaviours.push({
          id: b.id,
          date: toDate(b.date),
          title: b.title ?? b.behaviour ?? "Behaviour entry",
          direction: b.direction ?? "concerning",
          intensity: (b.intensity as IncidentIntensity) ?? "low",
          trigger: b.trigger ?? "",
          antecedent: b.antecedent ?? "",
          outcome: b.outcome ?? "",
          linkType: "direct_trigger",
        });
      }
    }

    // Post-contact window (≤48 h after a session, not already captured)
    for (const b of behaviours) {
      if (directIds.has(b.id) || b.direction === "positive") continue;
      const bDate = toDate(b.date);
      let linked = false;
      for (const sDate of sessionDates) {
        const diff = daysBetween(sDate, bDate);
        if (diff >= 0 && diff <= 2) {
          linked = true;
          break;
        }
      }
      if (linked) {
        contactLinkedBehaviours.push({
          id: b.id,
          date: bDate,
          title: b.title ?? b.behaviour ?? "Behaviour entry",
          direction: b.direction ?? "concerning",
          intensity: (b.intensity as IncidentIntensity) ?? "low",
          trigger: b.trigger ?? "",
          antecedent: b.antecedent ?? "",
          outcome: b.outcome ?? "",
          linkType: "post_contact_window",
        });
      }
    }

    // Sort by date desc
    contactLinkedBehaviours.sort((a, b) => b.date.localeCompare(a.date));

    // Highest severity
    let highestSeverity: IncidentIntensity | null = null;
    for (const b of contactLinkedBehaviours) {
      if (b.direction === "concerning") {
        highestSeverity = higherIntensity(highestSeverity, b.intensity);
      }
    }

    // Dominant pattern — most recent direct trigger
    const directTriggers = contactLinkedBehaviours
      .filter((b) => b.linkType === "direct_trigger" && b.trigger)
      .map((b) => b.trigger);
    const dominantPattern = directTriggers.length > 0 ? directTriggers[0] : null;

    // Days since last contact
    const sortedSessionDates = sessions
      .map((s) => toDate(s.date))
      .sort()
      .reverse();
    const daysSinceLastContact =
      sortedSessionDates.length > 0
        ? daysBetween(sortedSessionDates[0], today)
        : null;

    profiles.push({
      childId,
      childName: ypMap.get(childId) ?? "Unknown",
      signal: contactSignal(contactLinkedBehaviours, concernedContactSessions),
      contactLinkedBehaviours,
      concernedContactSessions,
      daysSinceLastContact,
      dominantPattern,
      highestSeverity,
    });
  }

  // Sort: concern → attention → stable
  const ORDER: Record<ContactSafeguardingSignal, number> = {
    concern: 0,
    attention: 1,
    stable: 2,
  };
  profiles.sort((a, b) => ORDER[a.signal] - ORDER[b.signal]);

  // ── Summary ────────────────────────────────────────────────────────────────
  const childrenWithConcern = profiles.filter(
    (p) => p.signal === "concern"
  ).length;
  const childrenWithAttention = profiles.filter(
    (p) => p.signal === "attention"
  ).length;
  const totalContactLinkedIncidents = profiles.reduce(
    (acc, p) =>
      acc +
      p.contactLinkedBehaviours.filter((b) => b.direction === "concerning")
        .length,
    0
  );
  const overallSignal: ContactSafeguardingSignal =
    childrenWithConcern > 0
      ? "concern"
      : childrenWithAttention > 0
      ? "attention"
      : "stable";

  const response: ContactSafeguardingResponse = {
    profiles,
    summary: {
      totalChildrenInScope: profiles.length,
      totalContactLinkedIncidents,
      childrenWithConcern,
      childrenWithAttention,
      overallSignal,
    },
  };

  return NextResponse.json({ data: response });
}
