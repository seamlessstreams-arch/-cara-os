// ══════════════════════════════════���═══════════════════════════════════════════
// API: /api/aria/staffing-adequacy
//
// GET — Analyse staffing adequacy for a home
// ════���═════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  analyseStaffingAdequacy,
  type ShiftSlot,
  type ChildNeed,
  type PlannedActivity,
  type HomeConfig,
} from "@/lib/aria/staffing-adequacy";

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoData(homeId: string) {
  const d = (daysAhead: number) => new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);

  const config: HomeConfig = {
    homeId,
    homeName: "Oak House",
    registeredBeds: 4,
    currentOccupancy: 3,
    minimumDayStaff: 2,
    minimumEveningStaff: 2,
    minimumNightStaff: 1,
    requiresSeniorEveryShift: true,
    requiresFirstAidEveryShift: true,
    requiresMedTrainedEveryShift: true,
  };

  const shifts: ShiftSlot[] = [
    // Tomorrow — well staffed
    { id: "sh_1", date: d(1), shiftType: "day", startTime: "07:00", endTime: "15:00", staffId: "staff_sarah", staffName: "Sarah T", role: "senior", qualifications: ["L5", "first_aid", "med_trained", "safeguarding_lead", "driver"], confirmed: true },
    { id: "sh_2", date: d(1), shiftType: "day", startTime: "07:00", endTime: "15:00", staffId: "staff_mike", staffName: "Mike R", role: "residential", qualifications: ["L3", "first_aid", "med_trained", "driver"], confirmed: true },
    { id: "sh_3", date: d(1), shiftType: "evening", startTime: "14:00", endTime: "22:00", staffId: "staff_emma", staffName: "Emma L", role: "senior", qualifications: ["L5", "first_aid", "med_trained", "fire_marshal"], confirmed: true },
    { id: "sh_4", date: d(1), shiftType: "evening", startTime: "14:00", endTime: "22:00", staffId: "staff_james", staffName: "James K", role: "residential", qualifications: ["L3", "first_aid", "restraint"], confirmed: true },
    { id: "sh_5", date: d(1), shiftType: "night", startTime: "22:00", endTime: "07:00", staffId: "staff_lisa", staffName: "Lisa M", role: "residential", qualifications: ["L3", "first_aid", "med_trained"], confirmed: true },

    // Day 2 — marginal
    { id: "sh_6", date: d(2), shiftType: "day", startTime: "07:00", endTime: "15:00", staffId: "staff_sarah", staffName: "Sarah T", role: "senior", qualifications: ["L5", "first_aid", "med_trained", "safeguarding_lead", "driver"], confirmed: true },
    { id: "sh_7", date: d(2), shiftType: "day", startTime: "07:00", endTime: "15:00", staffId: "staff_mike", staffName: "Mike R", role: "residential", qualifications: ["L3", "first_aid", "med_trained", "driver"], confirmed: true },
    { id: "sh_8", date: d(2), shiftType: "evening", startTime: "14:00", endTime: "22:00", staffId: "staff_emma", staffName: "Emma L", role: "senior", qualifications: ["L5", "first_aid", "med_trained", "fire_marshal"], confirmed: false },
    { id: "sh_9", date: d(2), shiftType: "evening", startTime: "14:00", endTime: "22:00", staffId: "staff_agency1", staffName: "Agency TBC", role: "agency", qualifications: ["L3"], confirmed: false },
    { id: "sh_10", date: d(2), shiftType: "night", startTime: "22:00", endTime: "07:00", staffId: "staff_james", staffName: "James K", role: "residential", qualifications: ["L3", "first_aid", "restraint"], confirmed: true },

    // Day 3 — under-staffed evening
    { id: "sh_11", date: d(3), shiftType: "day", startTime: "07:00", endTime: "15:00", staffId: "staff_mike", staffName: "Mike R", role: "residential", qualifications: ["L3", "first_aid", "med_trained", "driver"], confirmed: true },
    { id: "sh_12", date: d(3), shiftType: "day", startTime: "07:00", endTime: "15:00", staffId: "staff_lisa", staffName: "Lisa M", role: "residential", qualifications: ["L3", "first_aid", "med_trained"], confirmed: true },
    { id: "sh_13", date: d(3), shiftType: "evening", startTime: "14:00", endTime: "22:00", staffId: "staff_james", staffName: "James K", role: "residential", qualifications: ["L3", "first_aid", "restraint"], confirmed: true },
    { id: "sh_14", date: d(3), shiftType: "night", startTime: "22:00", endTime: "07:00", staffId: "staff_emma", staffName: "Emma L", role: "senior", qualifications: ["L5", "first_aid", "med_trained", "fire_marshal"], confirmed: true },

    // Day 4 — gap (no night staff assigned)
    { id: "sh_15", date: d(4), shiftType: "day", startTime: "07:00", endTime: "15:00", staffId: "staff_sarah", staffName: "Sarah T", role: "senior", qualifications: ["L5", "first_aid", "med_trained", "safeguarding_lead", "driver"], confirmed: true },
    { id: "sh_16", date: d(4), shiftType: "day", startTime: "07:00", endTime: "15:00", staffId: "staff_james", staffName: "James K", role: "residential", qualifications: ["L3", "first_aid", "restraint"], confirmed: true },
    { id: "sh_17", date: d(4), shiftType: "evening", startTime: "14:00", endTime: "22:00", staffId: "staff_mike", staffName: "Mike R", role: "residential", qualifications: ["L3", "first_aid", "med_trained", "driver"], confirmed: true },
    { id: "sh_18", date: d(4), shiftType: "evening", startTime: "14:00", endTime: "22:00", staffId: "staff_lisa", staffName: "Lisa M", role: "residential", qualifications: ["L3", "first_aid", "med_trained"], confirmed: true },
    { id: "sh_19", date: d(4), shiftType: "night", startTime: "22:00", endTime: "07:00", staffId: undefined, staffName: undefined, role: "residential", qualifications: [], confirmed: false },
  ];

  const childNeeds: ChildNeed[] = [
    { childId: "child_jordan", childName: "Jordan P", staffingRatio: "standard", requiresWakingNight: true, requiresMedTrained: true, riskLevel: "high", currentlyPlaced: true },
    { childId: "child_sam", childName: "Sam W", staffingRatio: "standard", requiresWakingNight: false, requiresMedTrained: false, riskLevel: "medium", currentlyPlaced: true },
    { childId: "child_alex", childName: "Alex R", staffingRatio: "1:1", requiresWakingNight: false, requiresMedTrained: false, riskLevel: "very_high", currentlyPlaced: true },
  ];

  const activities: PlannedActivity[] = [
    { id: "act_1", date: d(1), time: "10:00", description: "Swimming trip", staffRequired: 2, requiresDriver: true },
    { id: "act_2", date: d(2), time: "14:00", description: "Contact visit (Jordan)", staffRequired: 1, requiresDriver: true },
    { id: "act_3", date: d(3), time: "16:00", description: "DofE volunteering", staffRequired: 1, requiresDriver: true },
  ];

  return { shifts, childNeeds, activities, config };
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const homeId = req.nextUrl.searchParams.get("homeId") ?? "home_oak";
    const days = parseInt(req.nextUrl.searchParams.get("days") ?? "7", 10);

    const { shifts, childNeeds, activities, config } = getDemoData(homeId);
    const analysis = analyseStaffingAdequacy(shifts, childNeeds, activities, config, days);

    return NextResponse.json({ ok: true, data: analysis });
  } catch (err) {
    console.error("[aria/staffing-adequacy] GET error:", err);
    return NextResponse.json({ error: "Failed to analyse staffing adequacy" }, { status: 500 });
  }
}
