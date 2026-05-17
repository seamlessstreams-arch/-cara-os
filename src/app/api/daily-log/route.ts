// ═════════════════════════════════════════════════════════════════════��════════
// API: /api/daily-log — Daily Records & Key Events
//
// Returns shift entries, child wellbeing trends, handover summaries, and
// home activity metrics. Powers the daily log dashboard, handover screens,
// and child wellbeing monitoring.
//
// CHR 2015 Reg 36/Schedule 3 — Records to be maintained.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  evaluateDailyCompliance,
  analyzeChildWellbeing,
  generateHandoverSummary,
  calculateHomeActivityMetrics,
} from "@/lib/daily-log";
import type { DailyLogEntry, ChildShiftEntry, KeyEvent, MoodRating } from "@/lib/daily-log";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const homeId = url.searchParams.get("homeId") ?? "home-oak";
    const childId = url.searchParams.get("childId");
    const view = url.searchParams.get("view") ?? "overview";
    const days = parseInt(url.searchParams.get("days") ?? "30", 10);

    const sb = createServerClient();

    if (sb && isSupabaseEnabled()) {
      return await handleLiveData(sb, homeId, childId, view, days);
    }

    return NextResponse.json(getDemoData(homeId, childId, view, days));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Live Data ──────────────────────────────────────────────────────────────

async function handleLiveData(sb: any, homeId: string, childId: string | null, view: string, days: number) {
  const { data: rows, error } = await (sb.from("daily_log_entries") as SB)
    .select("*, child_shift_entries(*, key_events(*), medication_entries(*), meal_records(*), night_checks(*))")
    .eq("home_id", homeId)
    .order("date", { ascending: false })
    .limit(days * 4); // up to 4 shifts per day

  if (error) throw error;

  const entries: DailyLogEntry[] = (rows ?? []).map(mapToEntry);

  switch (view) {
    case "overview":
      return NextResponse.json(calculateHomeActivityMetrics(entries, homeId, days));
    case "compliance":
      return NextResponse.json({
        results: entries.map(evaluateDailyCompliance),
      });
    case "wellbeing":
      if (!childId) {
        return NextResponse.json({ error: "childId required for wellbeing view" }, { status: 400 });
      }
      const childName = entries
        .flatMap(e => e.childEntries)
        .find(ce => ce.childId === childId)?.childName ?? "Unknown";
      return NextResponse.json(analyzeChildWellbeing(entries, childId, childName, days));
    case "handover":
      const latest = entries[0];
      if (!latest) return NextResponse.json({ error: "No entries found" }, { status: 404 });
      return NextResponse.json(generateHandoverSummary(latest));
    default:
      return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 400 });
  }
}

function mapToEntry(row: any): DailyLogEntry {
  return {
    id: row.id,
    homeId: row.home_id,
    date: row.date,
    shift: row.shift,
    staffOnShift: row.staff_on_shift ?? [],
    shiftLeader: row.shift_leader ?? "",
    childEntries: (row.child_shift_entries ?? []).map(mapToChildEntry),
    homeNotes: row.home_notes ?? "",
    maintenanceIssues: row.maintenance_issues ?? [],
    visitorsToHome: row.visitors ?? [],
    handoverNotes: row.handover_notes ?? "",
    handoverPriorities: row.handover_priorities ?? [],
    handoverCompletedAt: row.handover_completed_at,
    handoverReceivedBy: row.handover_received_by,
    createdBy: row.created_by ?? "",
    createdAt: row.created_at ?? "",
    signedOffBy: row.signed_off_by,
    signedOffAt: row.signed_off_at,
  };
}

function mapToChildEntry(row: any): ChildShiftEntry {
  return {
    childId: row.child_id,
    childName: row.child_name,
    moodRating: row.mood_rating ?? 3,
    moodNotes: row.mood_notes ?? "",
    presentInHome: row.present_in_home ?? true,
    schoolAttended: row.school_attended,
    keyEvents: (row.key_events ?? []).map((ev: any) => ({
      id: ev.id,
      category: ev.category,
      priority: ev.priority,
      time: ev.time,
      description: ev.description,
      staffInvolved: ev.staff_involved ?? [],
      childResponse: ev.child_response,
      actionRequired: ev.action_required,
      followUpDate: ev.follow_up_date,
      linkedIncidentId: ev.linked_incident_id,
      linkedMissingId: ev.linked_missing_id,
    })),
    medicationAdministered: (row.medication_entries ?? []).map((m: any) => ({
      medicationName: m.medication_name,
      dose: m.dose,
      time: m.time,
      administeredBy: m.administered_by,
      witnessed: m.witnessed ?? false,
      witnessedBy: m.witnessed_by,
      refused: m.refused ?? false,
      refusalNotes: m.refusal_notes,
    })),
    mealsEaten: (row.meal_records ?? []).map((m: any) => ({
      meal: m.meal,
      eaten: m.eaten,
      notes: m.notes,
    })),
    nightChecks: (row.night_checks ?? []).map((nc: any) => ({
      time: nc.time,
      checkedBy: nc.checked_by,
      childPresent: nc.child_present ?? true,
      awake: nc.awake ?? false,
      notes: nc.notes,
    })),
  };
}

// ── Demo Data ─────────────────────────────────────────────────────────────

function getDemoData(homeId: string, childId: string | null, view: string, days: number) {
  const entries = getDemoEntries(homeId);

  switch (view) {
    case "overview":
      return calculateHomeActivityMetrics(entries, homeId, days);
    case "compliance":
      return { results: entries.map(evaluateDailyCompliance) };
    case "wellbeing":
      if (!childId) return { error: "childId required for wellbeing view" };
      const childName = entries
        .flatMap(e => e.childEntries)
        .find(ce => ce.childId === childId)?.childName ?? "Unknown";
      return analyzeChildWellbeing(entries, childId, childName, days);
    case "handover":
      return generateHandoverSummary(entries[0]);
    default:
      return { error: `Unknown view: ${view}` };
  }
}

function getDemoEntries(homeId: string): DailyLogEntry[] {
  return [
    // ── Today's afternoon shift ──
    {
      id: "log-001",
      homeId,
      date: "2026-05-16",
      shift: "afternoon",
      staffOnShift: ["staff-001", "staff-002", "staff-003"],
      shiftLeader: "staff-001",
      childEntries: [
        {
          childId: "child-jordan",
          childName: "Jordan Williams",
          moodRating: 4 as MoodRating,
          moodNotes: "Good mood after school. Engaged well with peers this evening.",
          presentInHome: true,
          schoolAttended: true,
          keyEvents: [
            { id: "ev-001", category: "activity", priority: "routine", time: "2026-05-16T16:00:00Z", description: "Football in garden for 1 hour with Alex", staffInvolved: ["staff-002"] },
            { id: "ev-002", category: "achievement", priority: "notable", time: "2026-05-16T17:00:00Z", description: "Completed homework independently without prompting", staffInvolved: ["staff-001"], childResponse: "I want to get a good grade" },
          ],
          medicationAdministered: [
            { medicationName: "Melatonin", dose: "2mg", time: "2026-05-16T21:00:00Z", administeredBy: "staff-001", witnessed: true, witnessedBy: "staff-002", refused: false },
          ],
          mealsEaten: [
            { meal: "dinner", eaten: "full" },
            { meal: "snack", eaten: "full" },
          ],
        },
        {
          childId: "child-alex",
          childName: "Alex Reeves",
          moodRating: 3 as MoodRating,
          moodNotes: "Quiet this evening. Spent time in room but came down for dinner.",
          presentInHome: true,
          schoolAttended: true,
          keyEvents: [
            { id: "ev-003", category: "contact", priority: "routine", time: "2026-05-16T18:00:00Z", description: "Phone call with social worker (10 min)", staffInvolved: ["staff-001"] },
          ],
          medicationAdministered: [],
          mealsEaten: [
            { meal: "dinner", eaten: "partial", notes: "Ate half, said wasn't hungry" },
          ],
        },
        {
          childId: "child-mia",
          childName: "Mia Chen",
          moodRating: 5 as MoodRating,
          moodNotes: "Brilliant day. School trip to science museum. Talked non-stop about dinosaurs.",
          presentInHome: true,
          schoolAttended: true,
          keyEvents: [
            { id: "ev-004", category: "education", priority: "notable", time: "2026-05-16T15:30:00Z", description: "Returned from school trip excited and engaged", staffInvolved: ["staff-003"], childResponse: "Can we go back? I loved the space bit!" },
            { id: "ev-005", category: "activity", priority: "routine", time: "2026-05-16T19:00:00Z", description: "Art and crafts — made dinosaur model from trip", staffInvolved: ["staff-003"] },
          ],
          medicationAdministered: [
            { medicationName: "Sertraline", dose: "50mg", time: "2026-05-16T08:00:00Z", administeredBy: "staff-002", witnessed: true, witnessedBy: "staff-001", refused: false },
          ],
          mealsEaten: [
            { meal: "dinner", eaten: "full" },
            { meal: "snack", eaten: "full" },
          ],
        },
      ],
      homeNotes: "Calm evening. All children engaged in activities. No concerns.",
      maintenanceIssues: [],
      visitorsToHome: [],
      handoverNotes: "All settled. Jordan meds given. Alex quiet but not concerning — give space. Mia on a high from trip.",
      handoverPriorities: ["Alex — check in gently at bedtime", "Mia may take a while to settle (excited)"],
      handoverCompletedAt: "2026-05-16T21:30:00Z",
      handoverReceivedBy: "staff-004",
      createdBy: "staff-001",
      createdAt: "2026-05-16T21:30:00Z",
      signedOffBy: "staff-001",
      signedOffAt: "2026-05-16T21:45:00Z",
    },

    // ── Yesterday morning shift ──
    {
      id: "log-002",
      homeId,
      date: "2026-05-15",
      shift: "morning",
      staffOnShift: ["staff-002", "staff-003"],
      shiftLeader: "staff-002",
      childEntries: [
        {
          childId: "child-jordan",
          childName: "Jordan Williams",
          moodRating: 3 as MoodRating,
          moodNotes: "Slow to get up. Needed prompting for breakfast and school prep.",
          presentInHome: true,
          schoolAttended: true,
          keyEvents: [],
          medicationAdministered: [],
          mealsEaten: [
            { meal: "breakfast", eaten: "partial", notes: "Cereal only, no toast" },
          ],
        },
        {
          childId: "child-alex",
          childName: "Alex Reeves",
          moodRating: 2 as MoodRating,
          moodNotes: "Woke in low mood. Didn't want to go to school. Eventually went after keyworker chat.",
          presentInHome: true,
          schoolAttended: true,
          keyEvents: [
            { id: "ev-006", category: "behaviour", priority: "notable", time: "2026-05-15T07:30:00Z", description: "Refused to get ready for school initially. 20-min discussion with keyworker.", staffInvolved: ["staff-002"], actionRequired: "Monitor school avoidance pattern. Discuss at next keyworker session." },
          ],
          medicationAdministered: [],
          mealsEaten: [
            { meal: "breakfast", eaten: "refused" },
          ],
        },
        {
          childId: "child-mia",
          childName: "Mia Chen",
          moodRating: 4 as MoodRating,
          moodNotes: "Good morning. Up on time, packed bag for school trip independently.",
          presentInHome: true,
          schoolAttended: true,
          keyEvents: [],
          medicationAdministered: [
            { medicationName: "Sertraline", dose: "50mg", time: "2026-05-15T08:00:00Z", administeredBy: "staff-003", witnessed: true, witnessedBy: "staff-002", refused: false },
          ],
          mealsEaten: [
            { meal: "breakfast", eaten: "full" },
          ],
        },
      ],
      homeNotes: "Morning routine completed. All to school by 8:40am.",
      maintenanceIssues: ["Bathroom light flickering — maintenance called"],
      visitorsToHome: [],
      handoverNotes: "Alex needed support this morning. Jordan slow but compliant. Mia independent.",
      handoverPriorities: ["Alex mood — check in at lunch if calls from school", "Maintenance for bathroom light"],
      handoverCompletedAt: "2026-05-15T14:00:00Z",
      handoverReceivedBy: "staff-001",
      createdBy: "staff-002",
      createdAt: "2026-05-15T14:00:00Z",
      signedOffBy: "staff-002",
      signedOffAt: "2026-05-15T14:05:00Z",
    },

    // ── Yesterday night shift ──
    {
      id: "log-003",
      homeId,
      date: "2026-05-15",
      shift: "waking_night",
      staffOnShift: ["staff-004"],
      shiftLeader: "staff-004",
      childEntries: [
        {
          childId: "child-jordan",
          childName: "Jordan Williams",
          moodRating: 4 as MoodRating,
          moodNotes: "Settled well. Asleep by 22:15.",
          presentInHome: true,
          keyEvents: [],
          medicationAdministered: [],
          mealsEaten: [],
          nightChecks: Array.from({ length: 18 }, (_, i) => ({
            time: `2026-05-15T${String(22 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}:00Z`,
            checkedBy: "staff-004",
            childPresent: true,
            awake: false,
          })),
        },
        {
          childId: "child-alex",
          childName: "Alex Reeves",
          moodRating: 3 as MoodRating,
          moodNotes: "Light on until 23:00 (reading). Settled after.",
          presentInHome: true,
          keyEvents: [],
          medicationAdministered: [],
          mealsEaten: [],
          nightChecks: Array.from({ length: 18 }, (_, i) => ({
            time: `2026-05-15T${String(22 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}:00Z`,
            checkedBy: "staff-004",
            childPresent: true,
            awake: i < 2, // awake for first hour
          })),
        },
        {
          childId: "child-mia",
          childName: "Mia Chen",
          moodRating: 4 as MoodRating,
          moodNotes: "Asleep quickly. No disturbances.",
          presentInHome: true,
          keyEvents: [],
          medicationAdministered: [],
          mealsEaten: [],
          nightChecks: Array.from({ length: 18 }, (_, i) => ({
            time: `2026-05-15T${String(22 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}:00Z`,
            checkedBy: "staff-004",
            childPresent: true,
            awake: false,
          })),
        },
      ],
      homeNotes: "Quiet night. All children settled. No concerns.",
      maintenanceIssues: [],
      visitorsToHome: [],
      handoverNotes: "All asleep by 23:00. No disturbances. Alex read until 23:00 (permitted).",
      handoverPriorities: ["All well — routine morning"],
      handoverCompletedAt: "2026-05-16T07:00:00Z",
      handoverReceivedBy: "staff-002",
      createdBy: "staff-004",
      createdAt: "2026-05-16T07:00:00Z",
      signedOffBy: "staff-004",
      signedOffAt: "2026-05-16T07:05:00Z",
    },
  ];
}
