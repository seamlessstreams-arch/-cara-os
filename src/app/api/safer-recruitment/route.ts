// ══════════════════════════════════════════════════════════════════════════════
// API: /api/safer-recruitment — Safer Recruitment Pipeline & Compliance
//
// Returns recruitment compliance status, pipeline metrics, DBS renewals,
// and candidate checklists. Powers the HR dashboard widgets and the
// Safer Recruitment management screen.
//
// CHR 2015 Regulation 34 / Schedule 2 compliance tracking.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  evaluateCompliance,
  checkStartReadiness,
  calculatePipelineMetrics,
  checkDBSRenewals,
} from "@/lib/safer-recruitment";
import type {
  CandidateChecklist,
  RecruitmentCheck,
  CheckType,
  CheckStatus,
} from "@/lib/safer-recruitment";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const homeId = url.searchParams.get("homeId");
    const candidateId = url.searchParams.get("candidateId");
    const view = url.searchParams.get("view") ?? "overview"; // overview | candidate | dbs | pipeline

    const sb = createServerClient();

    if (sb && isSupabaseEnabled()) {
      return await handleLiveData(sb, homeId, candidateId, view);
    }

    return NextResponse.json(getDemoData(homeId, candidateId, view));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Live Data ──────────────────────────────────────────────────────────────

async function handleLiveData(
  sb: any,
  homeId: string | null,
  candidateId: string | null,
  view: string,
) {
  // Single candidate compliance view
  if (view === "candidate" && candidateId) {
    const { data: candidate, error } = await (sb.from("recruitment_candidates") as SB)
      .select("*, recruitment_checks(*)")
      .eq("id", candidateId)
      .single();

    if (error) throw error;

    const checklist = mapToChecklist(candidate);
    const compliance = evaluateCompliance(checklist, candidate.conditions ?? []);
    const readiness = checkStartReadiness(checklist, candidate.conditions ?? []);

    return NextResponse.json({ candidate: checklist, compliance, readiness });
  }

  // DBS renewal tracker
  if (view === "dbs") {
    let query = (sb.from("staff_dbs_records") as SB).select("*");
    if (homeId) query = query.eq("home_id", homeId);
    const { data: staff, error } = await query;
    if (error) throw error;

    const renewals = checkDBSRenewals(
      (staff ?? []).map((s: any) => ({
        id: s.staff_id,
        name: s.staff_name,
        homeId: s.home_id,
        dbs: {
          type: "enhanced_dbs" as CheckType,
          status: s.status as CheckStatus,
          receivedAt: s.issued_at,
          expiresAt: s.expires_at,
          documentRef: s.dbs_number,
          notes: s.on_update_service ? "update_service" : undefined,
        },
      })),
    );

    return NextResponse.json({ renewals });
  }

  // Pipeline metrics
  if (view === "pipeline") {
    let query = (sb.from("recruitment_candidates") as SB)
      .select("*, recruitment_checks(*)");
    if (homeId) query = query.eq("home_id", homeId);
    const { data: candidates, error } = await query;
    if (error) throw error;

    const checklists = (candidates ?? []).map(mapToChecklist);
    const metrics = calculatePipelineMetrics(checklists);

    return NextResponse.json({ metrics, candidates: checklists });
  }

  // Default: overview with key stats
  let query = (sb.from("recruitment_candidates") as SB)
    .select("*, recruitment_checks(*)");
  if (homeId) query = query.eq("home_id", homeId);
  const { data: candidates, error } = await query;
  if (error) throw error;

  const checklists = (candidates ?? []).map(mapToChecklist);
  const metrics = calculatePipelineMetrics(checklists);

  // Find candidates with blockers
  const withIssues = checklists.map((c: any) => ({
    ...c,
    compliance: evaluateCompliance(c),
  })).filter((c: any) => !c.compliance.canProgress);

  // DBS renewals for current staff
  let dbsQuery = (sb.from("staff_dbs_records") as SB).select("*");
  if (homeId) dbsQuery = dbsQuery.eq("home_id", homeId);
  const { data: dbsStaff } = await dbsQuery;
  const renewals = checkDBSRenewals(
    (dbsStaff ?? []).map((s: any) => ({
      id: s.staff_id,
      name: s.staff_name,
      homeId: s.home_id,
      dbs: {
        type: "enhanced_dbs" as CheckType,
        status: s.status as CheckStatus,
        receivedAt: s.issued_at,
        expiresAt: s.expires_at,
        documentRef: s.dbs_number,
        notes: s.on_update_service ? "update_service" : undefined,
      },
    })),
  );

  const expiringSoon = renewals.filter(r => r.status === "expiring_soon");
  const expired = renewals.filter(r => r.status === "expired");

  return NextResponse.json({
    metrics,
    blockedCandidates: withIssues.slice(0, 10),
    dbsSummary: {
      total: renewals.length,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
    },
    recentCandidates: checklists.slice(0, 10),
  });
}

// ── Mapper ────────────────────────────────────────────────────────────────

function mapToChecklist(row: any): CandidateChecklist {
  return {
    candidateId: row.id,
    candidateName: row.candidate_name ?? row.name ?? "Unknown",
    role: row.role ?? "rsw",
    stage: row.stage ?? "application_received",
    checks: (row.recruitment_checks ?? []).map((c: any) => ({
      type: c.check_type,
      status: c.status,
      requestedAt: c.requested_at,
      receivedAt: c.received_at,
      expiresAt: c.expires_at,
      verifiedBy: c.verified_by,
      notes: c.notes,
      documentRef: c.document_ref,
      waiverReason: c.waiver_reason,
      waiverApprovedBy: c.waiver_approved_by,
    })),
    gapsExplained: row.gaps_explained ?? false,
    interviewDate: row.interview_date,
    offerDate: row.offer_date,
    startDate: row.start_date,
    homeId: row.home_id ?? "home-oak",
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

function getDemoData(homeId: string | null, candidateId: string | null, view: string) {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const demoCandidates: CandidateChecklist[] = [
    // Fully compliant — ready to start
    {
      candidateId: "cand-001",
      candidateName: "Emily Richardson",
      role: "rsw",
      stage: "final_clearance",
      homeId: homeId ?? "home-oak",
      gapsExplained: true,
      interviewDate: "2026-04-20",
      offerDate: "2026-04-25",
      startDate: "2026-05-26",
      checks: buildFullChecks("satisfactory"),
    },
    // Awaiting DBS — blocker
    {
      candidateId: "cand-002",
      candidateName: "Marcus Thompson",
      role: "rsw",
      stage: "pre_start_checks",
      homeId: homeId ?? "home-oak",
      gapsExplained: true,
      interviewDate: "2026-04-22",
      offerDate: "2026-04-28",
      startDate: "2026-06-02",
      checks: [
        makeCheck("enhanced_dbs", "requested", "2026-04-30"),
        makeCheck("barred_list", "requested", "2026-04-30"),
        makeCheck("reference_1", "satisfactory"),
        makeCheck("reference_2", "received"),
        makeCheck("employment_history", "satisfactory"),
        makeCheck("identity_proof", "satisfactory"),
        makeCheck("right_to_work", "satisfactory"),
        makeCheck("health_declaration", "satisfactory"),
        makeCheck("interview_assessment", "satisfactory"),
      ],
    },
    // Early stage — many missing
    {
      candidateId: "cand-003",
      candidateName: "Aisha Patel",
      role: "senior_rsw",
      stage: "conditional_offer",
      homeId: homeId ?? "home-oak",
      gapsExplained: false,
      interviewDate: "2026-05-05",
      offerDate: "2026-05-10",
      startDate: "2026-06-09",
      checks: [
        makeCheck("enhanced_dbs", "not_started"),
        makeCheck("barred_list", "not_started"),
        makeCheck("reference_1", "requested", "2026-05-11"),
        makeCheck("reference_2", "not_started"),
        makeCheck("employment_history", "not_started"),
        makeCheck("identity_proof", "satisfactory"),
        makeCheck("right_to_work", "satisfactory"),
        makeCheck("health_declaration", "requested", "2026-05-12"),
        makeCheck("interview_assessment", "satisfactory"),
      ],
    },
    // Concerns noted on reference
    {
      candidateId: "cand-004",
      candidateName: "Daniel O'Brien",
      role: "waking_night",
      stage: "pre_start_checks",
      homeId: homeId ?? "home-oak",
      gapsExplained: true,
      interviewDate: "2026-04-15",
      offerDate: "2026-04-20",
      startDate: "2026-05-19",
      checks: [
        makeCheck("enhanced_dbs", "satisfactory"),
        makeCheck("barred_list", "satisfactory"),
        makeCheck("reference_1", "satisfactory"),
        makeCheck("reference_2", "concerns_noted"),
        makeCheck("employment_history", "satisfactory"),
        makeCheck("identity_proof", "satisfactory"),
        makeCheck("right_to_work", "satisfactory"),
        makeCheck("health_declaration", "satisfactory"),
        makeCheck("interview_assessment", "satisfactory"),
        makeCheck("risk_assessment", "not_started"),
      ],
    },
    // Appointed — fully cleared
    {
      candidateId: "cand-005",
      candidateName: "Grace Okafor",
      role: "rsw",
      stage: "appointed",
      homeId: homeId ?? "home-oak",
      gapsExplained: true,
      interviewDate: "2026-03-10",
      offerDate: "2026-03-15",
      startDate: "2026-04-14",
      checks: buildFullChecks("satisfactory"),
    },
    // Withdrawn
    {
      candidateId: "cand-006",
      candidateName: "James Whitfield",
      role: "rsw",
      stage: "withdrawn",
      homeId: homeId ?? "home-oak",
      gapsExplained: false,
      interviewDate: "2026-04-01",
      checks: [
        makeCheck("enhanced_dbs", "requested", "2026-04-05"),
        makeCheck("interview_assessment", "satisfactory"),
      ],
    },
  ];

  // DBS renewal demo data for existing staff
  const demoDBSStaff = [
    {
      id: "staff-001",
      name: "Sarah Mitchell (RSW)",
      homeId: homeId ?? "home-oak",
      dbs: makeCheck("enhanced_dbs", "satisfactory", undefined, "2026-06-10", "DBS-001234"),
    },
    {
      id: "staff-002",
      name: "James Cooper (Senior RSW)",
      homeId: homeId ?? "home-oak",
      dbs: makeCheck("enhanced_dbs", "satisfactory", undefined, "2026-05-25", "DBS-005678"),
    },
    {
      id: "staff-003",
      name: "Priya Sharma (RSW)",
      homeId: homeId ?? "home-oak",
      dbs: makeCheck("enhanced_dbs", "satisfactory", undefined, "2026-08-15", "DBS-009012"),
    },
    {
      id: "staff-004",
      name: "Michael Barnes (Waking Night)",
      homeId: homeId ?? "home-oak",
      dbs: makeCheck("enhanced_dbs", "satisfactory", undefined, "2026-05-10", "DBS-003456"),
    },
    {
      id: "staff-005",
      name: "Lisa Chen (Team Leader)",
      homeId: homeId ?? "home-oak",
      dbs: makeCheck("enhanced_dbs", "satisfactory", undefined, "2027-02-20", "DBS-007890", "update_service"),
    },
  ];

  // Route based on view
  if (view === "candidate" && candidateId) {
    const candidate = demoCandidates.find(c => c.candidateId === candidateId);
    if (!candidate) {
      return { error: "Candidate not found" };
    }
    const compliance = evaluateCompliance(candidate);
    const readiness = checkStartReadiness(candidate);
    return { candidate, compliance, readiness };
  }

  if (view === "dbs") {
    const renewals = checkDBSRenewals(demoDBSStaff, now);
    return { renewals };
  }

  if (view === "pipeline") {
    const metrics = calculatePipelineMetrics(demoCandidates, now);
    return { metrics, candidates: demoCandidates };
  }

  // Default overview
  const metrics = calculatePipelineMetrics(demoCandidates, now);
  const renewals = checkDBSRenewals(demoDBSStaff, now);

  const candidatesWithCompliance = demoCandidates.map(c => ({
    ...c,
    compliance: evaluateCompliance(c),
  }));

  const blockedCandidates = candidatesWithCompliance.filter(c => !c.compliance.canProgress);
  const expiringSoon = renewals.filter(r => r.status === "expiring_soon");
  const expired = renewals.filter(r => r.status === "expired");

  return {
    metrics,
    blockedCandidates,
    dbsSummary: {
      total: renewals.length,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
      items: renewals,
    },
    recentCandidates: candidatesWithCompliance,
    schedule2Summary: {
      totalActive: demoCandidates.filter(c =>
        !["withdrawn", "rejected", "appointed"].includes(c.stage),
      ).length,
      fullyCompliant: candidatesWithCompliance.filter(c => c.compliance.isCompliant).length,
      withBlockers: blockedCandidates.length,
    },
  };
}

// ── Demo Helpers ──────────────────────────────────────────────────────────

function buildFullChecks(status: CheckStatus): RecruitmentCheck[] {
  const checks: CheckType[] = [
    "enhanced_dbs",
    "barred_list",
    "reference_1",
    "reference_2",
    "employment_history",
    "identity_proof",
    "right_to_work",
    "health_declaration",
    "interview_assessment",
  ];
  return checks.map(type => makeCheck(type, status));
}

function makeCheck(
  type: CheckType,
  status: CheckStatus,
  requestedAt?: string,
  expiresAt?: string,
  documentRef?: string,
  notes?: string,
): RecruitmentCheck {
  return {
    type,
    status,
    ...(requestedAt && { requestedAt }),
    ...(expiresAt && { expiresAt }),
    ...(documentRef && { documentRef }),
    ...(notes && { notes }),
    ...(status === "satisfactory" && { receivedAt: "2026-04-15T10:00:00Z", verifiedBy: "user-rm-1" }),
  };
}
