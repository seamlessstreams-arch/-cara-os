// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/complaints — Complaints & Representations Intelligence
//
// Analyses complaint handling, resolution times, themes, and accessibility.
// Pure deterministic — no AI. Returns structured assessment.
// CHR 2015 Reg 39 alignment (Complaints and Representations).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseComplaints } from "@/lib/cara/complaints-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ComplaintsInput, Complaint } from "@/lib/cara/complaints-intelligence";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const childId = url.searchParams.get("childId");

    if (!childId) {
      return NextResponse.json(
        { error: "childId query parameter is required" },
        { status: 400 },
      );
    }

    const sb = createServerClient();
    let input: ComplaintsInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    const assessment = analyseComplaints(input);

    return NextResponse.json({ success: true, data: assessment });
  } catch (err) {
    console.error("[cara/complaints] Error:", err);
    return NextResponse.json(
      { error: "Complaints intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchData(sb: any, childId: string): Promise<ComplaintsInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 15;

  const cutoff = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
  const { data: rawComplaints } = await (sb.from("complaints") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff)
    .order("date", { ascending: true });

  const { data: complaintsConfig } = await (sb.from("complaints_config") as SB)
    .select("*")
    .eq("child_id", childId)
    .single();

  const complaints: Complaint[] = (rawComplaints ?? []).map((c: any) => ({
    id: c.id,
    date: c.date,
    category: c.category ?? "other",
    description: c.description ?? "",
    status: c.status ?? "open",
    resolvedDate: c.resolved_date ?? undefined,
    resolutionDays: c.resolution_days ?? undefined,
    outcome: c.outcome ?? undefined,
    childSatisfied: c.child_satisfied ?? undefined,
    acknowledgedWithin24Hours: c.acknowledged_24h ?? true,
    investigatedProperly: c.investigated ?? true,
    childKeptInformed: c.child_informed ?? true,
    escalationLevel: c.escalation_level ?? "internal",
    escalatedToOfsted: c.escalated_ofsted ?? false,
    advocateInvolved: c.advocate_involved ?? false,
    madeBy: c.made_by ?? "child",
    againstWhom: c.against_whom ?? undefined,
    actionTaken: c.action_taken ?? undefined,
    lessonLearned: c.lesson_learned ?? undefined,
  }));

  return {
    childId,
    childName,
    age,
    complaints,
    complaintsProcessExplained: complaintsConfig?.process_explained ?? true,
    childKnowsHowToComplain: complaintsConfig?.child_knows ?? true,
    advocateAvailable: complaintsConfig?.advocate_available ?? true,
    complaintsDisplayedAccessibly: complaintsConfig?.displayed_accessibly ?? true,
    independentVisitorAssigned: complaintsConfig?.iv_assigned ?? false,
    regulatoryBodyInfoProvided: complaintsConfig?.ofsted_info_provided ?? true,
    complaintsReviewedByRM: complaintsConfig?.rm_reviews ?? true,
    lastComplaintsAuditDate: complaintsConfig?.last_audit ?? undefined,
  };
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function buildDemoData(childId: string): ComplaintsInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  if (!isJordan) {
    return {
      childId,
      childName: "Sam",
      age: 14,
      complaints: [
        {
          id: "comp_1",
          date: "2026-04-10",
          category: "food",
          description: "Same meals every week",
          status: "resolved",
          resolvedDate: "2026-04-12",
          resolutionDays: 2,
          outcome: "Menu variety increased",
          childSatisfied: true,
          acknowledgedWithin24Hours: true,
          investigatedProperly: true,
          childKeptInformed: true,
          escalationLevel: "internal",
          advocateInvolved: false,
          madeBy: "child",
        },
      ],
      complaintsProcessExplained: true,
      childKnowsHowToComplain: true,
      advocateAvailable: true,
      complaintsDisplayedAccessibly: true,
      independentVisitorAssigned: true,
      regulatoryBodyInfoProvided: true,
      complaintsReviewedByRM: true,
      lastComplaintsAuditDate: "2026-04-01",
    };
  }

  return {
    childId,
    childName: "Jordan",
    age: 15,
    complaints: [
      {
        id: "comp_1",
        date: "2026-03-20",
        category: "sanctions",
        description: "Felt sanction was unfair for being 5 minutes late",
        status: "resolved",
        resolvedDate: "2026-03-24",
        resolutionDays: 4,
        outcome: "Sanction reviewed and modified",
        childSatisfied: true,
        acknowledgedWithin24Hours: true,
        investigatedProperly: true,
        childKeptInformed: true,
        escalationLevel: "registered_manager",
        advocateInvolved: false,
        madeBy: "child",
      },
      {
        id: "comp_2",
        date: "2026-04-05",
        category: "privacy",
        description: "Staff entered room without knocking",
        status: "resolved",
        resolvedDate: "2026-04-07",
        resolutionDays: 2,
        outcome: "Reminder issued to all staff about knocking policy",
        childSatisfied: true,
        acknowledgedWithin24Hours: true,
        investigatedProperly: true,
        childKeptInformed: true,
        escalationLevel: "internal",
        advocateInvolved: false,
        madeBy: "child",
      },
      {
        id: "comp_3",
        date: "2026-05-01",
        category: "activities",
        description: "Wants more outdoor activities at weekends",
        status: "resolved",
        resolvedDate: "2026-05-08",
        resolutionDays: 7,
        outcome: "Activity schedule revised to include more outdoor options",
        childSatisfied: true,
        acknowledgedWithin24Hours: true,
        investigatedProperly: true,
        childKeptInformed: true,
        escalationLevel: "internal",
        advocateInvolved: false,
        madeBy: "child",
      },
    ],
    complaintsProcessExplained: true,
    childKnowsHowToComplain: true,
    advocateAvailable: true,
    complaintsDisplayedAccessibly: true,
    independentVisitorAssigned: true,
    regulatoryBodyInfoProvided: true,
    complaintsReviewedByRM: true,
    lastComplaintsAuditDate: "2026-04-15",
  };
}
