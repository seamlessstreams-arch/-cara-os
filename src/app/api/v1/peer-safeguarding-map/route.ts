// ══════════════════════════════════════════════════════════════════════════════
// CARA — PEER SAFEGUARDING MAP API ROUTE
// GET /api/v1/peer-safeguarding-map
//
// Per-pair safeguarding triage: risk level, review compliance, recent incidents,
// and strategy coverage for every pairwise child relationship.
//
// CHR 2015 Reg 19 (behaviour management), Reg 6 (quality of care).
// SCCIF: "Children feel safe with each other"; Reg 19 requires active management
// of peer dynamics where risk exists.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";

type RiskLevel = "none" | "low" | "medium" | "high";
type PairSignal = "concern" | "attention" | "stable";
type EntryType =
  | "incident"
  | "observation"
  | "positive_interaction"
  | "mediation"
  | "review";

export type PairEntry = {
  id: string;
  date: string;
  type: EntryType;
  description: string;
  staffWitness: string;
  interventionUsed: string;
  outcome: string;
};

export type PeerPairProfile = {
  id: string;
  child1Name: string;
  child2Name: string;
  quality: string;
  riskLevel: RiskLevel;
  signal: PairSignal;
  strengths: string[];
  concerns: string[];
  strategies: string[];
  recentEntries: PairEntry[];
  incidentCount14d: number;
  reviewOverdue: boolean;
  daysSinceReview: number | null;
  nextReviewDue: string | null;
  daysUntilNextReview: number | null;
  notes: string;
};

export type GroupAssessment = {
  id: string;
  assessmentDate: string;
  assessedBy: string;
  overallAtmosphere: string;
  groupStrengths: string[];
  groupConcerns: string[];
  recommendations: string[];
};

type PeerSafeguardingMapSummary = {
  totalPairs: number;
  pairsAtConcern: number;
  pairsAtAttention: number;
  reviewsOverdue: number;
  incidentsLast14d: number;
  overallSignal: PairSignal;
};

export type PeerSafeguardingMapResponse = {
  pairs: PeerPairProfile[];
  latestGroupAssessment: GroupAssessment | null;
  summary: PeerSafeguardingMapSummary;
};

const RISK_RANK: Record<RiskLevel, number> = { none: 0, low: 1, medium: 2, high: 3 };

function daysBetween(earlier: string, later: string): number {
  return Math.floor(
    (new Date(later).getTime() - new Date(earlier).getTime()) / 86_400_000
  );
}

function toDate(v: unknown): string {
  return String(v ?? "").slice(0, 10);
}

function pairSignal(
  riskLevel: RiskLevel,
  incidentCount14d: number,
  reviewOverdue: boolean
): PairSignal {
  if (riskLevel === "high") return "concern";
  if (riskLevel === "medium" && incidentCount14d > 0) return "concern";
  if (riskLevel === "medium" || (incidentCount14d > 0 && riskLevel !== "none") || reviewOverdue) {
    return "attention";
  }
  return "stable";
}

export async function GET() {
  const [peerDynamicsList, peerGroupDynamicsList, staffList, youngPeopleList] = await Promise.all([dal.peerDynamics.findAll(), dal.peerGroupDynamics.findAll(), dal.staff.findAll(), dal.youngPeople.findAll()]);
  const today = new Date().toISOString().slice(0, 10);

  // ── Child name map ──────────────────────────────────────────────────────────
  const ypMap = new Map(
    ((youngPeopleList as any[]) ?? []).map((yp: any) => [
      yp.id,
      yp.preferred_name ??
        (`${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || "Unknown"),
    ])
  );

  // ── Staff name map ──────────────────────────────────────────────────────────
  const staffMap = new Map(
    ((staffList as any[]) ?? []).map((s: any) => [
      s.id,
      s.full_name ?? (`${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.id),
    ])
  );

  // ── Pair profiles ───────────────────────────────────────────────────────────
  const pairs: PeerPairProfile[] = [];

  for (const p of (peerDynamicsList as any[]) ?? []) {
    const riskLevel: RiskLevel =
      (["none", "low", "medium", "high"].includes(p.risk_level)
        ? p.risk_level
        : "none") as RiskLevel;

    // Recent entries (last 60 days), newest first
    const allEntries: PairEntry[] = ((p.entries ?? []) as any[]).map(
      (e: any) => ({
        id: e.id ?? "",
        date: toDate(e.date),
        type: (e.type ?? "observation") as EntryType,
        description: e.description ?? "",
        staffWitness: staffMap.get(e.staff_witness) ?? e.staff_witness ?? "",
        interventionUsed: e.intervention_used ?? "",
        outcome: e.outcome ?? "",
      })
    );
    allEntries.sort((a, b) => b.date.localeCompare(a.date));

    // 14-day incident count
    const incidentCount14d = allEntries.filter(
      (e) => e.type === "incident" && daysBetween(e.date, today) <= 14
    ).length;

    // Review overdue
    const nextReviewDue = p.next_review_due
      ? toDate(p.next_review_due)
      : null;
    const daysUntilNextReview =
      nextReviewDue ? daysBetween(today, nextReviewDue) : null;
    const reviewOverdue = daysUntilNextReview !== null && daysUntilNextReview < 0;

    // Days since last review
    const lastReview = p.last_review_date ? toDate(p.last_review_date) : null;
    const daysSinceReview = lastReview ? daysBetween(lastReview, today) : null;

    pairs.push({
      id: p.id ?? "",
      child1Name:
        ypMap.get(p.child_id_1) ?? p.child_id_1 ?? "Child 1",
      child2Name:
        ypMap.get(p.child_id_2) ?? p.child_id_2 ?? "Child 2",
      quality: p.quality ?? "neutral",
      riskLevel,
      signal: pairSignal(riskLevel, incidentCount14d, reviewOverdue),
      strengths: Array.isArray(p.strengths) ? p.strengths : [],
      concerns: Array.isArray(p.concerns) ? p.concerns : [],
      strategies: Array.isArray(p.strategies) ? p.strategies : [],
      recentEntries: allEntries.slice(0, 5),
      incidentCount14d,
      reviewOverdue,
      daysSinceReview,
      nextReviewDue,
      daysUntilNextReview,
      notes: p.notes ?? "",
    });
  }

  // Sort: concern → attention → stable, then by risk rank desc
  const ORDER: Record<PairSignal, number> = {
    concern: 0,
    attention: 1,
    stable: 2,
  };
  pairs.sort(
    (a, b) =>
      ORDER[a.signal] - ORDER[b.signal] ||
      RISK_RANK[b.riskLevel] - RISK_RANK[a.riskLevel]
  );

  // ── Latest group assessment ─────────────────────────────────────────────────
  const groupAssessments = ((peerGroupDynamicsList as any[]) ?? [])
    .map((g: any) => ({
      id: g.id ?? "",
      assessmentDate: toDate(g.assessment_date),
      assessedBy:
        staffMap.get(g.assessed_by) ?? g.assessed_by ?? "",
      overallAtmosphere: g.overall_atmosphere ?? "mixed",
      groupStrengths: Array.isArray(g.group_strengths) ? g.group_strengths : [],
      groupConcerns: Array.isArray(g.group_concerns) ? g.group_concerns : [],
      recommendations: Array.isArray(g.recommendations)
        ? g.recommendations
        : [],
    }))
    .sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));

  const latestGroupAssessment = groupAssessments[0] ?? null;

  // ── Summary ────────────────────────────────────────────────────────────────
  const pairsAtConcern = pairs.filter((p) => p.signal === "concern").length;
  const pairsAtAttention = pairs.filter((p) => p.signal === "attention").length;
  const reviewsOverdue = pairs.filter((p) => p.reviewOverdue).length;
  const incidentsLast14d = pairs.reduce((a, p) => a + p.incidentCount14d, 0);
  const overallSignal: PairSignal =
    pairsAtConcern > 0
      ? "concern"
      : pairsAtAttention > 0
      ? "attention"
      : "stable";

  const response: PeerSafeguardingMapResponse = {
    pairs,
    latestGroupAssessment,
    summary: {
      totalPairs: pairs.length,
      pairsAtConcern,
      pairsAtAttention,
      reviewsOverdue,
      incidentsLast14d,
      overallSignal,
    },
  };

  return NextResponse.json({ data: response });
}
