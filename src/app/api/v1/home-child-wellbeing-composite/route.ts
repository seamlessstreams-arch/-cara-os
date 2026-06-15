import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeChildWellbeingComposite,
  type ChildWellbeingSnapshot,
} from "@/lib/engines/home-child-wellbeing-composite-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);
  const children = store.youngPeople ?? [];

  const child_snapshots: ChildWellbeingSnapshot[] = children.map((child: any) => {
    const childId = child.id;

    // Health
    const healthAppts = ((store.appointments as any[]) ?? []).filter((a: any) => a.child_id === childId);
    const attended = healthAppts.filter((a: any) => a.status === "attended" || a.attended).length;
    const immunisations = ((store.immunisationRecords as any[]) ?? []).filter((r: any) => r.child_id === childId);
    const immunCurrent = immunisations.length > 0 && immunisations.every((r: any) => r.up_to_date || r.status === "up_to_date");
    const dentalAppts = healthAppts.filter((a: any) => a.type === "dental" || a.appointment_type === "dental");
    const dentalCurrent = dentalAppts.some((a: any) => a.status === "attended" || a.attended);
    const opticianAppts = healthAppts.filter((a: any) => a.type === "optician" || a.appointment_type === "optician");
    const opticianCurrent = opticianAppts.some((a: any) => a.status === "attended" || a.attended);

    // Mental health
    const mhReferrals = ((store as any).mentalHealthReferrals as any[] ?? []).filter((r: any) => r.child_id === childId);
    const mhActive = mhReferrals.some((r: any) => r.status === "active" || r.status === "open");
    const therapySessions = ((store as any).therapeuticSessions as any[] ?? []).filter((s: any) => s.child_id === childId);
    const therapyAttended = therapySessions.filter((s: any) => s.attended || s.status === "attended").length;
    const sdqAssessments = ((store as any).sdqAssessments as any[] ?? []).filter((s: any) => s.child_id === childId);
    const latestSdq = sdqAssessments.length > 0 ? sdqAssessments.sort((a: any, b: any) => (b.date ?? "").localeCompare(a.date ?? ""))[0] : null;

    // Behaviour
    const behaviourLogs = (store.behaviourLog as any[] ?? []).filter((b: any) => b.child_id === childId);
    const positive = behaviourLogs.filter((b: any) => b.type === "positive" || b.direction === "positive" || b.positive).length;
    const concerning = behaviourLogs.filter((b: any) => b.type === "concerning" || b.type === "negative" || b.direction === "concern" || b.concerning).length;
    const restraints = (store.restraints as any[] ?? []).filter((r: any) => r.child_id === childId).length;
    const sanctions = (store.sanctionRewards as any[] ?? []).filter((s: any) => s.child_id === childId).length;

    // Sleep
    const sleepLogs = (store.sleepLog as any[] ?? []).filter((s: any) => s.child_id === childId);
    const avgSleep = sleepLogs.length > 0 ? sleepLogs.reduce((sum: number, s: any) => sum + (s.hours_slept ?? s.duration ?? 8), 0) / sleepLogs.length : 8;
    const disruptions = sleepLogs.filter((s: any) => s.disrupted || s.disruptions > 0).length;

    // Nutrition
    const mealLogs = ((store as any).mealRecords as any[] ?? []).filter((m: any) => m.child_id === childId);
    const mealsEaten = mealLogs.filter((m: any) => m.eaten || m.status === "eaten" || m.portion_eaten !== "none").length;
    const mealRate = mealLogs.length > 0 ? Math.round((mealsEaten / mealLogs.length) * 100) : 80;
    const dietaryPlans = (store.dietaryPlans as any[] ?? []).filter((d: any) => d.child_id === childId);
    const dietaryMet = dietaryPlans.length === 0 || dietaryPlans.every((d: any) => d.met || d.status === "met");

    // Education
    const eduRecords = (store.eduAttendanceRecords as any[] ?? []).filter((e: any) => e.child_id === childId);
    const attendanceRate = eduRecords.length > 0
      ? Math.round((eduRecords.filter((e: any) => e.present || e.status === "present").length / eduRecords.length) * 100)
      : (child.school_attendance_rate ?? 90);
    const exclusions = ((store as any).exclusionRecords as any[] ?? []).filter((e: any) => e.child_id === childId);
    const exclusionDays = exclusions.reduce((s: number, e: any) => s + (e.days ?? 1), 0);

    // Social
    const friendshipMaps = ((store.friendshipMaps as any[]) ?? []).filter((f: any) => f.child_id === childId);
    const latestFM = friendshipMaps.length > 0 ? friendshipMaps.sort((a: any, b: any) => (b.map_date ?? "").localeCompare(a.map_date ?? ""))[0] : null;
    const friendsCount = latestFM?.friends?.length ?? 3;
    const isoRisk = latestFM?.isolation_risk ?? "none";
    const contacts = ((store as any).contactRecords as any[] ?? []).filter((c: any) => c.child_id === childId && c.contact_type === "family");
    const contactFreq = contacts.length >= 4 ? "weekly" : contacts.length >= 2 ? "fortnightly" : contacts.length >= 1 ? "monthly" : "infrequent";

    return {
      child_id: childId,
      health_appointments_attended: attended,
      health_appointments_total: healthAppts.length,
      immunisations_current: immunCurrent,
      dental_current: dentalCurrent,
      optician_current: opticianCurrent,
      mental_health_referral_active: mhActive,
      therapeutic_sessions_attended: therapyAttended,
      therapeutic_sessions_offered: therapySessions.length,
      sdq_score: latestSdq?.total_score ?? latestSdq?.score ?? null,
      positive_behaviour_count: positive,
      concerning_behaviour_count: concerning,
      restraint_count: restraints,
      sanctions_count: sanctions,
      avg_sleep_hours: Math.round(avgSleep * 10) / 10,
      sleep_disruptions_7d: Math.min(disruptions, 7),
      meals_eaten_rate: mealRate,
      dietary_needs_met: dietaryMet,
      attendance_rate: attendanceRate,
      exclusion_days: exclusionDays,
      friends_count: friendsCount,
      isolation_risk: isoRisk,
      family_contact_frequency: contactFreq,
    };
  });

  const result = computeHomeChildWellbeingComposite({
    today, child_snapshots, total_children: children.length,
  });

  return NextResponse.json({ data: result });
}
