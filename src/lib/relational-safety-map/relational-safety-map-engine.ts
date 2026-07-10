// ══════════════════════════════════════════════════════════════════════════════
// CARA — RELATIONAL SAFETY MAP — pure engine
//
// Maps each child's documented trusted relationships with staff.
// Synthesises: key worker assignment (formal), key work session frequency
// (actual engagement), PACE trusted adult list (child-identified safety),
// and incident patterns (relationship stress indicators).
//
// "Children should have warm, consistent relationships with at least one
//  safe adult." — DDP principle; RI inspection focus.
//
// Signals per child:
//   secure     — assigned KW, regular sessions (≥1 per 14d), ≥1 PACE adult
//   developing — one or two elements in place
//   fragile    — no KW, no sessions recently, no PACE trusted adult
//
// All deterministic. No LLM calls. Pure — the store is passed IN, so this is
// fully unit-testable and never touches NextResponse or getStore() itself.
// ══════════════════════════════════════════════════════════════════════════════

import type { getStore } from "@/lib/db/store";

export type RelationalStatus = "secure" | "developing" | "fragile";
export type KeyWorkFrequency = "regular" | "intermittent" | "absent";

export interface StaffSnapshot {
  id: string;
  fullName: string;
  jobTitle: string;
}

export interface ChildRelationalProfile {
  childId: string;
  childName: string;
  placementStatus: string;
  // ── Formal assignment ────────────────────────────────────────────────────
  keyWorkerAssigned: boolean;
  keyWorker: StaffSnapshot | null;
  secondaryWorker: StaffSnapshot | null;
  // ── Actual engagement (keyWorkingSessions) ───────────────────────────────
  totalKeyWorkSessions: number;
  sessionsLast30d: number;
  sessionsLast90d: number;
  lastKeyWorkDate: string | null;
  keyWorkFrequency: KeyWorkFrequency;
  keyWorkStaffIds: string[];        // distinct staff who ran sessions
  // ── Child-identified safety (PACE profile) ───────────────────────────────
  hasPaceProfile: boolean;
  trustedAdultCount: number;
  trustedAdults: string[];
  // ── Relationship stress (incidents) ─────────────────────────────────────
  incidentsLast30d: number;
  incidentsLast90d: number;
  // ── Synthesis ────────────────────────────────────────────────────────────
  status: RelationalStatus;
  statusReason: string;
  supervisionPrompt: string;
}

export interface RelationalSafetyMapSummary {
  totalChildren: number;
  secureCount: number;
  developingCount: number;
  fragileCount: number;
  noKeyWorkerAssigned: number;
  noKeyWorkLast30d: number;
  noPaceProfile: number;
  fragileWithElevatedIncidents: number; // fragile + ≥2 incidents last 30d
  overallStatus: "positive" | "mixed" | "concern";
}

export interface RelationalSafetyMapData {
  childProfiles: ChildRelationalProfile[];
  summary: RelationalSafetyMapSummary;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(dateStr: string, now: Date): number {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 9999;
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  // A future-dated record must never count as "recent" key work / incident — it
  // was masking real key-work gaps (and could rate a child falsely "secure").
  return days < 0 ? 9999 : days;
}

function deriveFrequency(sessionsLast30d: number, sessionsLast90d: number): KeyWorkFrequency {
  // regular = at least 2 per month on average over 90d (≥6 total)
  if (sessionsLast30d >= 2) return "regular";
  if (sessionsLast90d >= 3) return "intermittent";
  return "absent";
}

function deriveStatus(
  kwAssigned: boolean,
  freq: KeyWorkFrequency,
  trustedAdultCount: number,
): { status: RelationalStatus; reason: string } {
  if (kwAssigned && freq === "regular" && trustedAdultCount >= 1) {
    return { status: "secure", reason: "Key worker assigned, sessions regular, and child has documented trusted adult" };
  }
  if (!kwAssigned && freq === "absent" && trustedAdultCount === 0) {
    return { status: "fragile", reason: "No key worker assigned, no recent key work sessions, and no trusted adults documented in PACE profile" };
  }
  if (freq === "absent" && trustedAdultCount === 0) {
    return { status: "fragile", reason: "Key work sessions have not occurred recently and no trusted adults are documented in the child's PACE profile" };
  }
  return { status: "developing", reason: "Some relational safety elements are in place but not all three: key worker assignment, regular sessions, and documented trusted adults" };
}

function supervisionPromptFor(
  status: RelationalStatus,
  childName: string,
  kwAssigned: boolean,
  freq: KeyWorkFrequency,
  trustedAdultCount: number,
  incidentsLast30d: number,
): string {
  if (status === "secure") {
    return `${childName}'s relational safety picture looks strong. Use supervision to explore: what is working well in this relationship, and how can we learn from it for other children?`;
  }
  if (status === "fragile") {
    if (incidentsLast30d >= 2) {
      return `${childName} has had ${incidentsLast30d} incident${incidentsLast30d > 1 ? "s" : ""} in the last 30 days and does not appear to have a consistent safe adult relationship documented. This is a priority supervision discussion: who in the team does this child have a connection with, and how do we build on it?`;
    }
    return `${childName} does not appear to have a consistent safe adult relationship documented. Explore in supervision: who does this child respond to? Have we updated their PACE profile? Who would they choose to talk to after a difficult time?`;
  }
  // developing
  if (!kwAssigned) {
    return `${childName} does not have a key worker formally assigned. Consider whether a formal assignment would give the child a sense of consistency and belonging.`;
  }
  if (freq === "absent") {
    return `${childName} has had no key work sessions recently. Explore in supervision: what is getting in the way? Could informal conversations count, and are we recording them?`;
  }
  if (trustedAdultCount === 0) {
    return `${childName} has not had trusted adults documented in their PACE profile. Who does the team notice them gravitating towards? This is worth capturing.`;
  }
  return `${childName}'s relational picture is developing. Review in supervision: is the key work frequency meeting this child's needs?`;
}

// ── Public entry point — pure ────────────────────────────────────────────────

export function buildRelationalSafetyMap(store: ReturnType<typeof getStore>): RelationalSafetyMapData {
  const now = new Date();

  // ── Source collections ────────────────────────────────────────────────────
  const youngPeople = (store.youngPeople ?? []) as Array<{
    id: string; first_name: string; last_name: string;
    key_worker_id: string | null; secondary_worker_id: string | null;
    status: string;
  }>;

  const staffMembers = (store.staff ?? []) as Array<{
    id: string; first_name: string; last_name: string;
    full_name?: string; job_title?: string;
  }>;

  const keyWorkSessions = (store.keyWorkingSessions ?? []) as Array<{
    id: string; child_id: string; staff_id: string; date: string;
  }>;

  const paceProfiles = (store.childPaceProfiles ?? []) as Array<{
    childId: string; trustedAdults: string[];
  }>;

  const incidents = (store.incidents ?? []) as Array<{
    child_id: string; occurred_at?: string; created_at?: string;
  }>;

  // ── Index staff ───────────────────────────────────────────────────────────
  const staffById = new Map<string, StaffSnapshot>();
  for (const s of staffMembers) {
    staffById.set(s.id, {
      id: s.id,
      fullName: s.full_name ?? `${s.first_name} ${s.last_name}`,
      jobTitle: s.job_title ?? "Staff",
    });
  }

  // ── Index key work sessions per child ────────────────────────────────────
  type KWIndex = { total: number; last30d: number; last90d: number; lastDate: string | null; staffIds: Set<string> };
  const kwByChild = new Map<string, KWIndex>();
  for (const s of keyWorkSessions) {
    const age = daysBetween(s.date, now);
    let entry = kwByChild.get(s.child_id);
    if (!entry) {
      entry = { total: 0, last30d: 0, last90d: 0, lastDate: null, staffIds: new Set() };
      kwByChild.set(s.child_id, entry);
    }
    entry.total++;
    if (age <= 30) entry.last30d++;
    if (age <= 90) entry.last90d++;
    if (!entry.lastDate || s.date > entry.lastDate) entry.lastDate = s.date;
    entry.staffIds.add(s.staff_id);
  }

  // ── Index PACE profiles ───────────────────────────────────────────────────
  const paceByChild = new Map<string, string[]>();
  for (const p of paceProfiles) {
    paceByChild.set(p.childId, p.trustedAdults ?? []);
  }

  // ── Index incidents per child ─────────────────────────────────────────────
  const incidentsByChild = new Map<string, { last30d: number; last90d: number }>();
  for (const i of incidents) {
    const dateStr = i.occurred_at ?? i.created_at ?? "";
    const age = dateStr ? daysBetween(dateStr, now) : 999;
    let entry = incidentsByChild.get(i.child_id);
    if (!entry) { entry = { last30d: 0, last90d: 0 }; incidentsByChild.set(i.child_id, entry); }
    if (age <= 30) entry.last30d++;
    if (age <= 90) entry.last90d++;
  }

  // ── Build per-child profiles ──────────────────────────────────────────────
  const currentChildren = youngPeople.filter((yp) => yp.status === "current");

  const childProfiles: ChildRelationalProfile[] = currentChildren.map((yp) => {
    const kw = kwByChild.get(yp.id) ?? { total: 0, last30d: 0, last90d: 0, lastDate: null, staffIds: new Set<string>() };
    const trusted = paceByChild.get(yp.id) ?? [];
    const inc = incidentsByChild.get(yp.id) ?? { last30d: 0, last90d: 0 };

    const kwAssigned = !!yp.key_worker_id;
    const freq = deriveFrequency(kw.last30d, kw.last90d);
    const { status, reason } = deriveStatus(kwAssigned, freq, trusted.length);

    const childName = `${yp.first_name} ${yp.last_name}`;

    return {
      childId: yp.id,
      childName,
      placementStatus: yp.status,
      keyWorkerAssigned: kwAssigned,
      keyWorker: yp.key_worker_id ? (staffById.get(yp.key_worker_id) ?? null) : null,
      secondaryWorker: yp.secondary_worker_id ? (staffById.get(yp.secondary_worker_id) ?? null) : null,
      totalKeyWorkSessions: kw.total,
      sessionsLast30d: kw.last30d,
      sessionsLast90d: kw.last90d,
      lastKeyWorkDate: kw.lastDate,
      keyWorkFrequency: freq,
      keyWorkStaffIds: [...kw.staffIds],
      hasPaceProfile: paceByChild.has(yp.id),
      trustedAdultCount: trusted.length,
      trustedAdults: trusted,
      incidentsLast30d: inc.last30d,
      incidentsLast90d: inc.last90d,
      status,
      statusReason: reason,
      supervisionPrompt: supervisionPromptFor(status, childName, kwAssigned, freq, trusted.length, inc.last30d),
    };
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  const secure   = childProfiles.filter((c) => c.status === "secure").length;
  const developing = childProfiles.filter((c) => c.status === "developing").length;
  const fragile  = childProfiles.filter((c) => c.status === "fragile").length;
  const fragileElevated = childProfiles.filter((c) => c.status === "fragile" && c.incidentsLast30d >= 2).length;

  const overallStatus: "positive" | "mixed" | "concern" =
    fragile > 0 ? "concern"
    : developing > secure ? "mixed"
    : "positive";

  const summary: RelationalSafetyMapSummary = {
    totalChildren: currentChildren.length,
    secureCount: secure,
    developingCount: developing,
    fragileCount: fragile,
    noKeyWorkerAssigned: childProfiles.filter((c) => !c.keyWorkerAssigned).length,
    noKeyWorkLast30d: childProfiles.filter((c) => c.sessionsLast30d === 0).length,
    noPaceProfile: childProfiles.filter((c) => !c.hasPaceProfile).length,
    fragileWithElevatedIncidents: fragileElevated,
    overallStatus,
  };

  // Sort: fragile first, then developing, then secure
  const ORDER: Record<RelationalStatus, number> = { fragile: 0, developing: 1, secure: 2 };
  childProfiles.sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return { childProfiles, summary };
}
