// ════════════════════════════════════��═════════════════════════════════════════
// API: /api/aria/contact — Contact & Relationships Intelligence
//
// Analyses contact frequency, quality, consistency, and child voice.
// Pure deterministic — no AI. Returns structured assessment.
// CHR 2015 Reg 9 alignment (Promotion of Contact).
// ═════════════════════════════════���════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseContact } from "@/lib/aria/contact-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ContactInput, ContactSession, ContactArrangement } from "@/lib/aria/contact-intelligence";

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
    let input: ContactInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    const assessment = analyseContact(input);

    return NextResponse.json({ success: true, data: assessment });
  } catch (err) {
    console.error("[aria/contact] Error:", err);
    return NextResponse.json(
      { error: "Contact intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchData(sb: any, childId: string): Promise<ContactInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 15;

  // Contact sessions (last 90 days)
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const { data: rawSessions } = await (sb.from("contact_sessions") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff)
    .order("date", { ascending: true });

  const contactSessions: ContactSession[] = (rawSessions ?? []).map((s: any) => ({
    id: s.id,
    date: s.date,
    person: s.person ?? "other",
    personName: s.person_name ?? "Unknown",
    type: s.type ?? "face_to_face",
    plannedDuration: s.planned_duration ?? 60,
    actualDuration: s.actual_duration ?? 0,
    occurred: s.occurred ?? true,
    cancelledBy: s.cancelled_by ?? undefined,
    cancellationReason: s.cancellation_reason ?? undefined,
    outcome: s.outcome ?? "not_recorded",
    childWanted: s.child_wanted ?? true,
    childFeedback: s.child_feedback ?? undefined,
    supervisedRequired: s.supervised_required ?? false,
    supervisorPresent: s.supervisor_present ?? undefined,
  }));

  // Contact arrangements
  const { data: rawArrangements } = await (sb.from("contact_arrangements") as SB)
    .select("*")
    .eq("child_id", childId)
    .eq("active", true);

  const arrangements: ContactArrangement[] = (rawArrangements ?? []).map((a: any) => ({
    person: a.person ?? "other",
    personName: a.person_name ?? "Unknown",
    agreedFrequency: a.agreed_frequency ?? "monthly",
    agreedFrequencyPerMonth: a.frequency_per_month ?? 1,
    contactType: a.contact_type ?? "face_to_face",
    supervisedRequired: a.supervised_required ?? false,
    courtOrdered: a.court_ordered ?? false,
    childViews: a.child_views ?? "not_asked",
  }));

  // Contact config
  const { data: config } = await (sb.from("contact_config") as SB)
    .select("*")
    .eq("child_id", childId)
    .single();

  return {
    childId,
    childName,
    age,
    contactSessions,
    arrangements,
    contactPlanReviewed: config?.plan_reviewed ?? true,
    contactPlanLastReviewDate: config?.last_review_date ?? undefined,
    childConsultedOnPlan: config?.child_consulted ?? true,
    advocateAvailableForContact: config?.advocate_available ?? true,
    lifestoryWorkStarted: config?.lifestory_started ?? false,
    siblingPlacementConsidered: config?.sibling_considered ?? true,
    letterboxContactAvailable: config?.letterbox_available ?? false,
  };
}

// ── Demo Data ────���──────────────────────────────────────────────────────────

function buildDemoData(childId: string): ContactInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  if (!isJordan) {
    // Sam — stable contact
    return {
      childId,
      childName: "Sam",
      age: 14,
      contactSessions: [
        {
          id: "ct_1", date: "2026-03-05", person: "mother", personName: "Mum",
          type: "face_to_face", plannedDuration: 60, actualDuration: 60, occurred: true,
          outcome: "positive", childWanted: true, supervisedRequired: false,
        },
        {
          id: "ct_2", date: "2026-03-19", person: "mother", personName: "Mum",
          type: "face_to_face", plannedDuration: 60, actualDuration: 55, occurred: true,
          outcome: "positive", childWanted: true, supervisedRequired: false,
        },
        {
          id: "ct_3", date: "2026-04-02", person: "mother", personName: "Mum",
          type: "face_to_face", plannedDuration: 60, actualDuration: 60, occurred: true,
          outcome: "positive", childWanted: true, supervisedRequired: false,
        },
        {
          id: "ct_4", date: "2026-04-16", person: "mother", personName: "Mum",
          type: "face_to_face", plannedDuration: 60, actualDuration: 0, occurred: false,
          cancelledBy: "parent", cancellationReason: "Mum unwell",
          outcome: "not_recorded", childWanted: true, supervisedRequired: false,
        },
        {
          id: "ct_5", date: "2026-04-30", person: "mother", personName: "Mum",
          type: "face_to_face", plannedDuration: 60, actualDuration: 60, occurred: true,
          outcome: "positive", childWanted: true, supervisedRequired: false,
        },
        {
          id: "ct_6", date: "2026-05-14", person: "mother", personName: "Mum",
          type: "face_to_face", plannedDuration: 60, actualDuration: 60, occurred: true,
          outcome: "positive", childWanted: true, supervisedRequired: false,
        },
        {
          id: "ct_7", date: "2026-03-10", person: "sibling", personName: "Ella",
          type: "face_to_face", plannedDuration: 120, actualDuration: 120, occurred: true,
          outcome: "positive", childWanted: true, supervisedRequired: false,
        },
        {
          id: "ct_8", date: "2026-04-10", person: "sibling", personName: "Ella",
          type: "face_to_face", plannedDuration: 120, actualDuration: 120, occurred: true,
          outcome: "positive", childWanted: true, supervisedRequired: false,
        },
        {
          id: "ct_9", date: "2026-05-10", person: "sibling", personName: "Ella",
          type: "face_to_face", plannedDuration: 120, actualDuration: 110, occurred: true,
          outcome: "positive", childWanted: true, supervisedRequired: false,
        },
      ],
      arrangements: [
        {
          person: "mother", personName: "Mum", agreedFrequency: "fortnightly",
          agreedFrequencyPerMonth: 2, contactType: "face_to_face",
          supervisedRequired: false, courtOrdered: false, childViews: "wants_contact",
        },
        {
          person: "sibling", personName: "Ella", agreedFrequency: "monthly",
          agreedFrequencyPerMonth: 1, contactType: "face_to_face",
          supervisedRequired: false, courtOrdered: false, childViews: "wants_contact",
        },
      ],
      contactPlanReviewed: true,
      contactPlanLastReviewDate: "2026-04-01",
      childConsultedOnPlan: true,
      advocateAvailableForContact: true,
      lifestoryWorkStarted: true,
      siblingPlacementConsidered: true,
      letterboxContactAvailable: true,
    };
  }

  // Jordan — some complexity
  return {
    childId,
    childName: "Jordan",
    age: 15,
    contactSessions: [
      {
        id: "ct_1", date: "2026-03-08", person: "mother", personName: "Mum",
        type: "supervised", plannedDuration: 60, actualDuration: 60, occurred: true,
        outcome: "neutral", childWanted: true, supervisedRequired: true, supervisorPresent: true,
      },
      {
        id: "ct_2", date: "2026-03-22", person: "mother", personName: "Mum",
        type: "supervised", plannedDuration: 60, actualDuration: 0, occurred: false,
        cancelledBy: "parent", cancellationReason: "Did not attend",
        outcome: "not_recorded", childWanted: true, supervisedRequired: true,
      },
      {
        id: "ct_3", date: "2026-04-05", person: "mother", personName: "Mum",
        type: "supervised", plannedDuration: 60, actualDuration: 45, occurred: true,
        outcome: "positive", childWanted: true, supervisedRequired: true, supervisorPresent: true,
      },
      {
        id: "ct_4", date: "2026-04-19", person: "mother", personName: "Mum",
        type: "supervised", plannedDuration: 60, actualDuration: 60, occurred: true,
        outcome: "positive", childWanted: true, supervisedRequired: true, supervisorPresent: true,
      },
      {
        id: "ct_5", date: "2026-05-03", person: "mother", personName: "Mum",
        type: "supervised", plannedDuration: 60, actualDuration: 0, occurred: false,
        cancelledBy: "parent", cancellationReason: "Mum unwell",
        outcome: "not_recorded", childWanted: true, supervisedRequired: true,
      },
      {
        id: "ct_6", date: "2026-04-12", person: "father", personName: "Dad",
        type: "phone_call", plannedDuration: 30, actualDuration: 20, occurred: true,
        outcome: "neutral", childWanted: true, supervisedRequired: false,
      },
      {
        id: "ct_7", date: "2026-05-10", person: "father", personName: "Dad",
        type: "phone_call", plannedDuration: 30, actualDuration: 25, occurred: true,
        outcome: "positive", childWanted: true, supervisedRequired: false,
      },
      {
        id: "ct_8", date: "2026-03-15", person: "sibling", personName: "Tyler",
        type: "face_to_face", plannedDuration: 120, actualDuration: 120, occurred: true,
        outcome: "positive", childWanted: true, supervisedRequired: false,
      },
      {
        id: "ct_9", date: "2026-04-20", person: "sibling", personName: "Tyler",
        type: "face_to_face", plannedDuration: 120, actualDuration: 120, occurred: true,
        outcome: "positive", childWanted: true, supervisedRequired: false,
      },
      {
        id: "ct_10", date: "2026-05-11", person: "grandparent", personName: "Nan",
        type: "face_to_face", plannedDuration: 90, actualDuration: 90, occurred: true,
        outcome: "positive", childWanted: true, supervisedRequired: false,
      },
    ],
    arrangements: [
      {
        person: "mother", personName: "Mum", agreedFrequency: "fortnightly",
        agreedFrequencyPerMonth: 2, contactType: "supervised",
        supervisedRequired: true, courtOrdered: true, childViews: "wants_contact",
      },
      {
        person: "father", personName: "Dad", agreedFrequency: "monthly",
        agreedFrequencyPerMonth: 1, contactType: "phone_call",
        supervisedRequired: false, courtOrdered: false, childViews: "wants_contact",
      },
      {
        person: "sibling", personName: "Tyler", agreedFrequency: "monthly",
        agreedFrequencyPerMonth: 1, contactType: "face_to_face",
        supervisedRequired: false, courtOrdered: false, childViews: "wants_contact",
      },
      {
        person: "grandparent", personName: "Nan", agreedFrequency: "monthly",
        agreedFrequencyPerMonth: 1, contactType: "face_to_face",
        supervisedRequired: false, courtOrdered: false, childViews: "wants_contact",
      },
    ],
    contactPlanReviewed: true,
    contactPlanLastReviewDate: "2026-04-10",
    childConsultedOnPlan: true,
    advocateAvailableForContact: true,
    lifestoryWorkStarted: true,
    siblingPlacementConsidered: true,
    letterboxContactAvailable: false,
  };
}
