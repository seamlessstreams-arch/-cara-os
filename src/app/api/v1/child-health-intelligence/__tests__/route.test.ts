import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { getStore } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

// Every health collection this route maps was read through `(x: any)` lambdas
// against field names the structs do not have, so with the dal now typed the
// compiler exposed 40 dead reads here — the largest single file in the census:
//
//   HealthAssessment.outcome/.summary        → key_findings / notes
//   DentalRecord.date/.type/.outcome/…       → the record is a per-child
//     SUMMARY: visits live in check_ups_history, next_check_up_due is real
//   OpticiansRecord.…                        → exam_history / next_exam_due
//   ImmunisationRecord.vaccine/.date/.status → records: VaccineEntry[]
//   CamhsReferral (behind an `as any` the census could not even see):
//     .status/.sessions_attended/.sessions_offered → referral_status /
//     sessions_held / sessions_scheduled
//   MentalHealthCheckIn.overall_mood/.mood   → mood_rating; .anxiety has NO
//     source field (now honest-null, not a fabricated neutral 3);
//     .sleep_quality is a five-word scale, not a number; .concerns →
//     whats_heavy (the child's own words)
//   Appointment.attended/.rescheduled        → status
//
// None of these collections is seeded, so the demo never showed it — but every
// record a home enters through the app flows here and was silently discarded.

const today = todayStr();
const daysAgo = (n: number) => {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};
const CHILD = "yp_health_test";

const call = () =>
  GET(new NextRequest(`http://localhost/api/v1/child-health-intelligence?childId=${CHILD}`));

beforeAll(() => {
  const s = getStore();
  s.youngPeople.push({
    ...s.youngPeople[0],
    id: CHILD,
    first_name: "Health",
    last_name: "Tester",
  });
  s.mentalHealthCheckIns.push(
    {
      id: "mh-t1", child_id: CHILD, date: daysAgo(3), mood_rating: 2,
      mood_emoji: "🙁", whats_heavy: "school worries", whats_good: "",
      what_would_help: "", sleep_quality: "poor", appetite: "picked",
      energy: "low", conversation_length: "brief", staff_present: "st1",
      flags_concerns: [], created_at: `${daysAgo(3)}T10:00:00Z`,
    } as (typeof s.mentalHealthCheckIns)[number],
    {
      id: "mh-t2", child_id: CHILD, date: daysAgo(5), mood_rating: 4,
      mood_emoji: "🙂", whats_heavy: "", whats_good: "football", what_would_help: "",
      sleep_quality: "great", appetite: "ate_normally", energy: "good",
      conversation_length: "extended", staff_present: "st1",
      flags_concerns: [], created_at: `${daysAgo(5)}T10:00:00Z`,
    } as (typeof s.mentalHealthCheckIns)[number],
  );
  s.camhsReferrals.push({
    ...({} as (typeof s.camhsReferrals)[number]),
    id: "cam-t1", child_id: CHILD, referral_date: daysAgo(60),
    referral_reason: "anxiety", referrer: "GP",
    referral_status: "active_engagement", waiting_time_weeks: 4,
    first_appointment_date: daysAgo(30), current_clinician: "Dr T",
    current_therapeutic_approach: "CBT", sessions_held: 6, sessions_scheduled: 8,
    current_engagement_level: "strong",
  });
  s.dentalRecords.push({
    ...({} as (typeof s.dentalRecords)[number]),
    id: "den-t1", child_id: CHILD, dental_practice: "Smiles", dentist_name: "Dr D",
    registration_status: "active_nhs",
    last_check_up_date: daysAgo(90), next_check_up_due: daysAgo(-90),
    check_ups_history: [
      { date: daysAgo(270), dentist: "Dr D", findings: "healthy", treatment_recommended: "", treatment_received: "" },
      { date: daysAgo(90), dentist: "Dr D", findings: "one filling", treatment_recommended: "filling", treatment_received: "filling" },
    ],
  });
  s.appointments.push(
    { ...({} as (typeof s.appointments)[number]), id: "ap-t1", child_id: CHILD, date: daysAgo(10), type: "gp", status: "attended" },
    { ...({} as (typeof s.appointments)[number]), id: "ap-t2", child_id: CHILD, date: daysAgo(4), type: "dental", status: "missed" },
  );
});

describe("GET /api/v1/child-health-intelligence — mapped from the fields the structs actually have", () => {
  it("computes mood from mood_rating and reports anxiety as unmeasured, not neutral", async () => {
    const body = (await (await call()).json()).data;
    const wt = body.wellbeing_trajectory;
    // mood_rating 2 and 4 → avg 3; the old mapper read .overall_mood/.mood
    // (neither exists) and defaulted EVERY check-in to 3 regardless of the child
    expect(wt.avg_mood).toBe(3);
    // sleep: "poor"(1) and "great"(5) translated by the word scale → avg 3;
    // the old mapper fed the word itself into `?? 3`
    expect(wt.avg_sleep).toBe(3);
    // the check-in form has no anxiety question — unmeasured is null, and the
    // old fabricated neutral 3 no longer appears
    expect(wt.avg_anxiety).toBeNull();
  });

  it("carries the child's own 'what's heavy' answer as the concern", async () => {
    const body = (await (await call()).json()).data;
    expect(body.wellbeing_trajectory.recent_concerns).toContain("school worries");
  });

  it("reads CAMHS engagement through referral_status and the real session counts", async () => {
    const body = (await (await call()).json()).data;
    const camhs = body.camhs_status;
    // active_engagement → engaged; sessions_held/sessions_scheduled → 75%.
    // The old block sat behind an `as any` and read five phantom fields —
    // status defaulted "active" but sessions always 0/0.
    expect(camhs.engaged).toBe(true);
    expect(camhs.attendance_rate).toBe(75);
    expect(camhs.engagement_level).toBe("strong");
  });

  it("explodes the dental summary's check-up history and carries the real next-due", async () => {
    const body = (await (await call()).json()).data;
    const hc = body.health_compliance;
    // the latest exploded visit is 90 days ago with next_check_up_due ahead of
    // us; the old mapper's single phantom-field record had an empty date and a
    // null next_due, so dental always read as nothing on file
    expect(hc.dental_last_date).toBe(daysAgo(90));
    expect(hc.dental_next_due).toBe(daysAgo(-90));
    expect(hc.dental_current).toBe(true);
  });

  it("derives appointment attendance from status", async () => {
    const body = (await (await call()).json()).data;
    const appts = body.appointment_analysis;
    // one attended, one missed in the 90-day window; the old
    // `.attended ?? (…: true)` read a phantom field and defaulted unknown
    // statuses to attended, so the DNA count could never rise
    expect(appts.total_90d).toBe(2);
    expect(appts.attended_rate).toBe(50);
    expect(appts.dna_count).toBe(1);
  });
});
