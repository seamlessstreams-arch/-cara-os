import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { below, formatRate, meanOf, meets, rateOf } from "@/lib/metrics/rate";
import type {
  StaffSkillProfile,
  StaffSkillsAnalysis,
  SignalColour,
} from "@/lib/cara-visual-toolkit/types";

export const dynamic = "force-dynamic";

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.round(Math.abs(d1 - d2) / 86_400_000);
}

export async function GET() {
  const store = getStore();
  const staff = (store.staff as any[]) ?? [];
  const trainingRecords = (store.trainingRecords as any[]) ?? [];
  const supervisions = (store.reflectiveSupervisions as any[]) ?? [];
  const today = new Date().toISOString().slice(0, 10);

  const activeStaff = staff.filter(
    (s: any) => s.employment_status !== "left" && s.is_active !== false
  );

  const staffProfiles: StaffSkillProfile[] = activeStaff.map((s: any) => {
    const staffTraining = trainingRecords.filter((t: any) => t.staff_id === s.id);
    const mandatory = staffTraining.filter((t: any) => t.is_mandatory === true);
    const compliant = mandatory.filter(
      (t: any) =>
        t.status === "completed" &&
        (!t.expiry_date || t.expiry_date >= today)
    );
    const overdue = mandatory.filter(
      (t: any) =>
        t.status !== "completed" ||
        (t.expiry_date && t.expiry_date < today)
    );

    // No mandatory training on file means nothing has been evidenced for this
    // person — not that they are fully compliant.
    const complianceRate = rateOf(compliant, mandatory);

    // Most recent supervision
    const staffSups = supervisions
      .filter((sup: any) => sup.staff_id === s.id)
      .sort((a: any, b: any) => (b.date ?? "").localeCompare(a.date ?? ""));

    const latestSup = staffSups[0] ?? null;
    const wellbeingScore: number | null =
      latestSup?.wellbeing_score != null
        ? Number(latestSup.wellbeing_score)
        : null;
    const confidenceLevel: string | null = latestSup?.confidence_level ?? null;
    const lastSupervision: string | null = latestSup?.date ?? null;

    // Development areas from all supervisions
    const devAreas: string[] = [];
    for (const sup of staffSups.slice(0, 3)) {
      if (Array.isArray(sup.training_needs)) {
        devAreas.push(...sup.training_needs);
      } else if (typeof sup.training_needs === "string" && sup.training_needs) {
        devAreas.push(sup.training_needs);
      }
    }

    const signal: SignalColour =
      below(complianceRate, 60) || (wellbeingScore !== null && wellbeingScore <= 2)
        ? "red"
        : below(complianceRate, 80) ||
          overdue.length > 0 ||
          (wellbeingScore !== null && wellbeingScore <= 3)
        ? "amber"
        : complianceRate === null
        ? "grey"
        : "green";

    return {
      staffId: s.id,
      staffName: s.full_name ?? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
      role: s.job_title ?? s.role ?? "Staff",
      mandatoryTotal: mandatory.length,
      mandatoryCompliant: compliant.length,
      complianceRate,
      overdueTraining: overdue.map(
        (t: any) => t.course_name ?? "Unknown course"
      ),
      supervisionScore: wellbeingScore,
      confidenceLevel,
      lastSupervision,
      developmentAreas: [...new Set(devAreas)].slice(0, 4),
      signal,
    } satisfies StaffSkillProfile;
  });

  const fullCompliance = staffProfiles.filter((p) => meets(p.complianceRate, 100)).length;
  const overdueTotal = staffProfiles.reduce(
    (sum, p) => sum + p.overdueTraining.length,
    0
  );
  const lowConfidence = staffProfiles.filter(
    (p) => p.supervisionScore !== null && p.supervisionScore <= 3
  ).length;
  const avgRate = meanOf(staffProfiles.map((p) => p.complianceRate));

  const insights: string[] = [];
  if (overdueTotal > 0) {
    insights.push(
      `${overdueTotal} mandatory training item${overdueTotal > 1 ? "s are" : " is"} overdue across the workforce. Unqualified staff may not be safe to practice in those areas — prioritise completion.`
    );
  }
  if (lowConfidence > 0) {
    insights.push(
      `${lowConfidence} staff member${lowConfidence > 1 ? "s have" : " has"} a wellbeing or confidence score of 3 or below in their most recent supervision. Consider whether additional support or supervision is needed.`
    );
  }
  const unrecorded = staffProfiles.filter((p) => p.complianceRate === null).length;
  if (unrecorded > 0) {
    insights.push(
      `${unrecorded} staff member${unrecorded > 1 ? "s have" : " has"} no mandatory training on record. Compliance cannot be evidenced for them — an empty training file is a gap, not a pass, and is excluded from the average below.`
    );
  }
  if (fullCompliance < staffProfiles.length) {
    insights.push(
      `${staffProfiles.length - fullCompliance} staff member${staffProfiles.length - fullCompliance > 1 ? "s are" : " is"} not fully compliant with mandatory training. Average compliance rate: ${formatRate(avgRate, "not yet measured")}.`
    );
  }
  if (fullCompliance === staffProfiles.length && staffProfiles.length > 0) {
    insights.push(
      `All active staff are fully compliant with mandatory training. Ensure refresher dates are tracked to prevent lapse.`
    );
  }

  const redProfiles = staffProfiles.filter((p) => p.signal === "red").length;
  const overallSignal: SignalColour =
    redProfiles >= 2 || below(avgRate, 60)
      ? "red"
      : redProfiles > 0 || overdueTotal > 0 || lowConfidence > 0
      ? "amber"
      : staffProfiles.length === 0 || avgRate === null
      ? "grey"
      : "green";

  const result: StaffSkillsAnalysis = {
    totalStaff: staffProfiles.length,
    fullCompliance,
    avgComplianceRate: avgRate,
    overdueTrainingCount: overdueTotal,
    lowConfidenceCount: lowConfidence,
    // Lowest measured compliance first; staff with nothing recorded sort last
    // rather than being presented as the worst performers.
    staffProfiles: staffProfiles.sort(
      (a, b) =>
        (a.complianceRate ?? Number.POSITIVE_INFINITY) -
        (b.complianceRate ?? Number.POSITIVE_INFINITY)
    ),
    insights,
    overallSignal,
    regulatoryNote:
      "CHR 2015 Reg 32 (training), Reg 33 (supervision), Reg 34 (staff support). All staff must complete mandatory training before working unsupervised with children. Managers must ensure records are current and refreshers planned.",
  };

  return NextResponse.json({ data: result });
}
