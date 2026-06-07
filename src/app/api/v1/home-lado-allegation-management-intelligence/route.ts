import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeLadoAllegationManagement,
  type LadoReferralInput,
  type AllegationPatternInput,
  type SafeguardingTrainingInput,
} from "@/lib/engines/home-lado-allegation-management-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const staff = store.staff ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const todayMs = new Date(today).getTime();

  // LADO referrals → LadoReferralInput[]
  const rawReferrals = (store.ladoReferrals as any[] ?? []);
  const referrals: LadoReferralInput[] = rawReferrals.map((r: any) => {
    const isClosed = r.status === "closed" || r.status === "nfa";
    let daysToClose = -1;
    if (isClosed && r.closed_date) {
      const referredMs = new Date(r.date_referred).getTime();
      const closedMs = new Date(r.closed_date).getTime();
      daysToClose = Math.max(1, Math.round((closedMs - referredMs) / 86400000));
    }
    return {
      id: r.id ?? "",
      date_referred: (r.date_referred ?? "").toString().slice(0, 10),
      allegation_type: r.allegation_type ?? "other",
      status: r.status ?? "initial_assessment",
      outcome: r.outcome ?? "pending",
      ofsted_notified: !!(r.ofsted_notified),
      dbs_referral: !!(r.dbs_referral),
      police_involved: !!(r.police_involved),
      strategy_meeting_held: !!(r.strategy_meeting_date),
      // These are free-text string fields — only count them as present when there
      // is real content. !! treats whitespace (" ") as truthy, so a blank entry
      // would otherwise inflate the lessons-learned / support compliance rates.
      has_support_for_child: typeof r.support_for_child === "string" && r.support_for_child.trim().length > 0,
      has_support_for_staff: typeof r.support_for_staff === "string" && r.support_for_staff.trim().length > 0,
      has_lesson_learned: typeof r.lesson_learned === "string" && r.lesson_learned.trim().length > 0,
      days_to_close: daysToClose,
    };
  });

  // Build allegation patterns — group by subject staff
  const staffAllegations: Record<string, { count: number; substantiated: number }> = {};
  for (const r of rawReferrals) {
    const sid = (r as any).subject_staff_id ?? "";
    if (!sid) continue;
    if (!staffAllegations[sid]) staffAllegations[sid] = { count: 0, substantiated: 0 };
    staffAllegations[sid].count++;
    if ((r as any).outcome === "substantiated") staffAllegations[sid].substantiated++;
  }
  const patterns: AllegationPatternInput[] = Object.entries(staffAllegations).map(([staffId, data]) => ({
    id: staffId,
    staff_id: staffId,
    allegation_count: data.count,
    substantiated_count: data.substantiated,
  }));

  // Safeguarding training — from training matrix rows where safer recruitment training
  const rawMatrix = (store.trainingMatrixRows as any[] ?? []);
  const training: SafeguardingTrainingInput[] = (staff as any[]).map((s: any) => {
    const matrixRow = rawMatrix.find((m: any) => m.staff_id === s.id);
    const statuses = (matrixRow?.training_statuses ?? []) as any[];
    const hasSaferRecruitment = statuses.some((t: any) =>
      t.course_name?.toLowerCase().includes("safer recruitment") && t.status === "valid"
    );
    const hasAllegation = statuses.some((t: any) =>
      (t.course_name?.toLowerCase().includes("allegation") || t.course_name?.toLowerCase().includes("lado")) && t.status === "valid"
    );
    return {
      id: s.id ?? "",
      staff_id: s.id ?? "",
      safer_recruitment_trained: hasSaferRecruitment || !!(matrixRow && matrixRow.overall_compliance === "fully_compliant"),
      allegation_awareness_trained: hasAllegation || !!(matrixRow && matrixRow.overall_compliance === "fully_compliant"),
      last_training_date: matrixRow?.next_refresher_due ?? today,
    };
  });

  const result = computeLadoAllegationManagement({
    today,
    total_staff: (staff as any[]).length,
    referrals,
    patterns,
    training,
  });

  return NextResponse.json({ data: result });
}
