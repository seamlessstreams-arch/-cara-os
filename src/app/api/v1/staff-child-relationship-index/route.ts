// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF-CHILD RELATIONSHIP INDEX API ROUTE
// GET /api/v1/staff-child-relationship-index
//
// Maps recording interaction patterns between staff and children to surface
// key-worker presence, relationship distribution, and where a child's key
// worker may have limited direct engagement in recorded interactions.
//
// CHR 2015 Reg 6 (quality of care), Reg 16 (key worker).
// SCCIF: "Children have a trusted adult they can turn to."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";

type RelationshipSignal = "good" | "attention" | "concern";

type StaffInteraction = {
  staffId: string;
  staffName: string;
  role: string;
  recordingCount: number;
  positiveCount: number;
  concerningCount: number;
  isKeyWorker: boolean;
  isSecondaryWorker: boolean;
};

type ChildRelationshipProfile = {
  childId: string;
  childName: string;
  designatedKeyWorkerName: string | null;
  designatedSecondaryWorkerName: string | null;
  totalRecordings: number;
  keyWorkerRecordingPct: number | null;
  keyWorkerRank: number | null;
  staffInteractions: StaffInteraction[];
  signal: RelationshipSignal;
  insight: string;
};

type RelationshipIndexSummary = {
  totalChildren: number;
  childrenAtGood: number;
  childrenAtAttention: number;
  childrenAtConcern: number;
  overallSignal: RelationshipSignal;
};

type StaffChildRelationshipResponse = {
  profiles: ChildRelationshipProfile[];
  summary: RelationshipIndexSummary;
};

function relationshipSignal(
  keyWorkerRank: number | null,
  keyWorkerPct: number | null
): RelationshipSignal {
  if (keyWorkerRank === null || keyWorkerPct === null) return "attention";
  if (keyWorkerPct >= 30 && keyWorkerRank <= 2) return "good";
  if (keyWorkerPct >= 15) return "attention";
  return "concern";
}

function signalInsight(
  keyWorkerName: string | null,
  keyWorkerRank: number | null,
  keyWorkerPct: number | null,
  totalRecordings: number,
  signal: RelationshipSignal
): string {
  if (totalRecordings === 0) return "No behaviour recordings found for this child.";
  const kw = keyWorkerName ?? "Key worker";
  const pct = keyWorkerPct !== null ? `${Math.round(keyWorkerPct)}%` : "0%";
  if (signal === "good") {
    return `${kw} accounts for ${pct} of all recorded interactions — strong key-worker presence in records.`;
  }
  if (signal === "attention") {
    if (keyWorkerRank !== null && keyWorkerRank > 1) {
      return `${kw} is ranked #${keyWorkerRank} for recorded interactions (${pct}). Consider whether key-working time is being captured fully.`;
    }
    return `${kw} accounts for ${pct} of recorded interactions. Increasing their visible involvement in records would strengthen the key-worker relationship evidence.`;
  }
  return `${kw} has limited recorded interactions (${pct}). This may warrant a supervision conversation to understand the key-working relationship quality.`;
}

export async function GET() {
  const [behaviourLogList, staffList, youngPeopleList] = await Promise.all([
      dal.behaviourLog.findAll(),
      dal.staff.findAll(),
      dal.youngPeople.findAll(),
    ]);

  // ── Child & staff maps ─────────────────────────────────────────────────────
  const staffMap = new Map(
    (((staffList)) ?? []).map((s) => [
      s.id,
      {
        name: s.full_name ?? (`${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.id),
        role: s.role ?? s.job_title ?? "staff",
      },
    ])
  );

  const currentChildren = (((youngPeopleList)) ?? []).filter(
    (yp) => yp.status === "current"
  );

  // ── Index behaviourLog by child ────────────────────────────────────────────
  const logByChild = new Map<string, any[]>();
  for (const b of ((behaviourLogList)) ?? []) {
    if (!b.child_id) continue;
    const list = logByChild.get(b.child_id) ?? [];
    list.push(b);
    logByChild.set(b.child_id, list);
  }

  // ── Build per-child profiles ───────────────────────────────────────────────
  const profiles: ChildRelationshipProfile[] = [];

  for (const yp of currentChildren) {
    const childName =
      yp.preferred_name ??
      (`${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || yp.id);

    const keyWorkerId: string | null = yp.key_worker_id ?? null;
    const secondaryWorkerId: string | null = yp.secondary_worker_id ?? null;

    const kwInfo = keyWorkerId ? staffMap.get(keyWorkerId) : null;
    const swInfo = secondaryWorkerId ? staffMap.get(secondaryWorkerId) : null;

    const entries = logByChild.get(yp.id) ?? [];

    // Tally interactions per staff member
    const tallyMap = new Map<string, { positive: number; concerning: number }>();
    for (const b of entries) {
      const sid = b.recorded_by ?? b.staff_id ?? "";
      if (!sid) continue;
      const cur = tallyMap.get(sid) ?? { positive: 0, concerning: 0 };
      if (b.direction === "positive") cur.positive++;
      else cur.concerning++;
      tallyMap.set(sid, cur);
    }

    // Build interaction list, sorted by total desc
    const interactions: StaffInteraction[] = [];
    for (const [sid, counts] of tallyMap.entries()) {
      const info = staffMap.get(sid);
      interactions.push({
        staffId: sid,
        staffName: info?.name ?? sid,
        role: info?.role ?? "unknown",
        recordingCount: counts.positive + counts.concerning,
        positiveCount: counts.positive,
        concerningCount: counts.concerning,
        isKeyWorker: sid === keyWorkerId,
        isSecondaryWorker: sid === secondaryWorkerId,
      });
    }
    interactions.sort((a, b) => b.recordingCount - a.recordingCount);

    const totalRecordings = entries.length;
    const kwRankIndex = interactions.findIndex((i) => i.isKeyWorker);
    const kwRank = kwRankIndex >= 0 ? kwRankIndex + 1 : null;
    const kwEntry = interactions.find((i) => i.isKeyWorker);
    const kwRecordings = kwEntry?.recordingCount ?? 0;
    const keyWorkerPct =
      totalRecordings > 0
        ? (kwRecordings / totalRecordings) * 100
        : null;

    const signal = relationshipSignal(kwRank, keyWorkerPct);

    profiles.push({
      childId: yp.id,
      childName,
      designatedKeyWorkerName: kwInfo?.name ?? null,
      designatedSecondaryWorkerName: swInfo?.name ?? null,
      totalRecordings,
      keyWorkerRecordingPct: keyWorkerPct,
      keyWorkerRank: kwRank,
      staffInteractions: interactions,
      signal,
      insight: signalInsight(
        kwInfo?.name ?? null,
        kwRank,
        keyWorkerPct,
        totalRecordings,
        signal
      ),
    });
  }

  // Sort: concern → attention → good
  const ORDER: Record<RelationshipSignal, number> = {
    concern: 0,
    attention: 1,
    good: 2,
  };
  profiles.sort((a, b) => ORDER[a.signal] - ORDER[b.signal]);

  // ── Summary ─────────────────────────────────────────────────────────────────
  const childrenAtGood = profiles.filter((p) => p.signal === "good").length;
  const childrenAtAttention = profiles.filter(
    (p) => p.signal === "attention"
  ).length;
  const childrenAtConcern = profiles.filter(
    (p) => p.signal === "concern"
  ).length;
  const overallSignal: RelationshipSignal =
    childrenAtConcern > 0
      ? "concern"
      : childrenAtAttention > 0
      ? "attention"
      : "good";

  const response: StaffChildRelationshipResponse = {
    profiles,
    summary: {
      totalChildren: profiles.length,
      childrenAtGood,
      childrenAtAttention,
      childrenAtConcern,
      overallSignal,
    },
  };

  return NextResponse.json({ data: response });
}
