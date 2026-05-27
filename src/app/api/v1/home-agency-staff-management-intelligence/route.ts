import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeAgencyStaffManagement,
  type AgencyShiftInput,
  type AgencyInductionInput,
  type AgencyFeedbackInput,
} from "@/lib/engines/home-agency-staff-management-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const staff = store.staff ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Agency shift records → AgencyShiftInput[]
  const rawShifts = (store.agencyStaffLog as any[] ?? []);
  const shifts: AgencyShiftInput[] = rawShifts.map((s: any) => ({
    id: s.id ?? "",
    worker_name: s.worker_name ?? "",
    worker_ref: s.worker_ref ?? "",
    booking_reason: s.booking_reason ?? "sickness_cover",
    vetting_status: s.vetting_status ?? "pending",
    dbs_enhanced: !!(s.dbs_enhanced),
    induction_completed: !!(s.induction_completed),
    safeguarding_briefing: !!(s.safeguarding_briefing),
    young_people_briefing: !!(s.young_people_briefing),
    feedback_score: s.feedback_score ?? null,
    has_concerns: !!(s.concerns && s.concerns.trim().length > 0),
  }));

  // Agency inductions → AgencyInductionInput[]
  const rawInductions = (store.agencyInductions as any[] ?? []);
  const inductions: AgencyInductionInput[] = rawInductions.map((ind: any) => {
    const topics = (ind.induction_topics ?? []) as any[];
    const covered = topics.filter((t: any) => t.covered).length;
    return {
      id: ind.id ?? "",
      agency_staff_name: ind.agency_staff_name ?? "",
      dbs_verified: !!(ind.agency_dbs_verified),
      training_verified: !!(ind.agency_training_verified),
      references_verified: !!(ind.agency_references_verified),
      children_informed: !!(ind.children_informed_about_agency_arrival),
      behaviour_plans_briefed: !!(ind.behaviour_support_plans_briefed),
      induction_pack_signed: !!(ind.agency_staff_signed_induction_pack),
      topics_covered_count: covered,
      topics_total_count: topics.length,
      repeat_booking_approved: !!(ind.repeat_booking_approved),
    };
  });

  // Agency feedback → AgencyFeedbackInput[]
  const rawFeedback = (store.agencyFeedback as any[] ?? []);
  const feedback: AgencyFeedbackInput[] = rawFeedback.map((f: any) => ({
    id: f.id ?? "",
    agency_staff_name: f.agency_staff_name ?? "",
    follows_routines: !!(f.follows_routines),
    follows_behaviour_plans: !!(f.follows_behaviour_support_plans),
    follows_sensory_protocols: !!(f.follows_sensory_protocols),
    recording_quality: f.recording_quality ?? "adequate",
    professionalism_rating: f.professionalism_rating ?? 0,
    relational_skills_rating: f.relational_skills_rating ?? 0,
    overall_verdict: f.overall_verdict ?? "not_approved_for_repeat",
  }));

  const result = computeAgencyStaffManagement({
    today,
    total_staff: (staff as any[]).length,
    shifts,
    inductions,
    feedback,
  });

  return NextResponse.json({ data: result });
}
