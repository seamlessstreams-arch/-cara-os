import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { intelligenceDb } from "@/lib/intelligence/store";
import { todayStr } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  const today = todayStr();

  const activeStaff = db.staff.findActive().filter(
    (s) => s.role !== "responsible_individual"
  );

  const allSupervisions = db.supervisions.findAll();
  const allTrainingNeeds = intelligenceDb.trainingNeeds.findAll("home_oak");
  const allTrainingRecords = db.training.findAll();

  const profiles = activeStaff.map((s) => {
    // Training needs
    const staffNeeds = allTrainingNeeds.filter((n) => {
      if ((n as { staff_id?: string }).staff_id === s.id) return true;
      if (n.affected_staff?.includes(s.id)) return true;
      if (n.affected_roles?.includes(s.role)) return true;
      return false;
    });
    const openNeeds = staffNeeds.filter(
      (n) => n.status !== "completed" && n.status !== "no_action"
    );
    const urgentNeeds = openNeeds.filter((n) => n.priority === "urgent");
    const completedNeeds = staffNeeds.filter((n) => n.status === "completed");

    // Supervisions
    const staffSupervisions = allSupervisions
      .filter((sv) => sv.staff_id === s.id)
      .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date));
    const lastSupervision = staffSupervisions.find(
      (sv) => sv.status === "completed"
    );
    const nextSupervision = staffSupervisions.find(
      (sv) => sv.status === "scheduled"
    );
    const overdueSupervision =
      s.next_supervision_due && s.next_supervision_due < today && !nextSupervision;

    // Training records
    const staffRecords = allTrainingRecords.filter(
      (r) => r.staff_id === s.id
    );
    const mandatoryRecords = staffRecords.filter((r) => r.is_mandatory);
    const currentMandatory = mandatoryRecords.filter(
      (r) => r.status === "compliant" && (!r.expiry_date || r.expiry_date >= today)
    );
    const trainingCompliancePct =
      mandatoryRecords.length > 0
        ? Math.round((currentMandatory.length / mandatoryRecords.length) * 100)
        : 100;

    // Appraisal status
    const appraisalDue = s.next_appraisal_due;
    const appraisalOverdue = appraisalDue && appraisalDue < today;

    // Overall development status
    let status: "on_track" | "attention" | "at_risk";
    if (urgentNeeds.length > 0 || overdueSupervision || appraisalOverdue) {
      status = "at_risk";
    } else if (openNeeds.length > 0 || trainingCompliancePct < 80) {
      status = "attention";
    } else {
      status = "on_track";
    }

    return {
      staff_id: s.id,
      full_name: s.full_name,
      job_title: s.job_title,
      role: s.role,
      start_date: s.start_date,
      probation_end_date: s.probation_end_date ?? null,
      open_training_needs: openNeeds.length,
      urgent_training_needs: urgentNeeds.length,
      completed_training_needs: completedNeeds.length,
      training_compliance_pct: trainingCompliancePct,
      last_supervision_date: lastSupervision?.actual_date ?? null,
      next_supervision_date: nextSupervision?.scheduled_date ?? s.next_supervision_due ?? null,
      supervision_overdue: overdueSupervision ?? false,
      next_appraisal_due: appraisalDue ?? null,
      appraisal_overdue: !!appraisalOverdue,
      wellbeing_score: lastSupervision?.wellbeing_score ?? null,
      status,
      top_training_needs: openNeeds.slice(0, 2).map((n) => ({
        id: n.id,
        title: n.title,
        priority: n.priority,
        need_type: n.need_type,
        deadline: n.deadline ?? null,
      })),
    };
  });

  const summary = {
    total_staff: profiles.length,
    on_track: profiles.filter((p) => p.status === "on_track").length,
    needs_attention: profiles.filter((p) => p.status === "attention").length,
    at_risk: profiles.filter((p) => p.status === "at_risk").length,
    supervision_overdue: profiles.filter((p) => p.supervision_overdue).length,
    appraisal_overdue: profiles.filter((p) => p.appraisal_overdue).length,
    avg_training_compliance: Math.round(
      profiles.reduce((sum, p) => sum + p.training_compliance_pct, 0) / profiles.length
    ),
  };

  return NextResponse.json({ data: profiles, summary });
}
