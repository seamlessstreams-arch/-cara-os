import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";
import type { HealthCheckScore, HealthCheckAction } from "@/types/extended";

function score(good: number, total: number, weight = 1): number {
  if (total === 0) return 100;
  return Math.round((good / total) * 100 * weight);
}

export async function GET(_req: NextRequest) {
  const today = todayStr();
  const actions: HealthCheckAction[] = [];

  // ── Operational score ─────────────────────────────────────────────────────
  const activeTasks = db.tasks.findActive();
  const overdueTasks = db.tasks.findOverdue();
  const completedToday = db.tasks.findAll().filter((t) => t.status === "completed" && t.completed_at?.startsWith(today)).length;
  const overdueRatio = activeTasks.length > 0 ? overdueTasks.length / activeTasks.length : 0;
  const operationalScore = Math.max(0, Math.round(100 - overdueRatio * 100));

  overdueTasks.forEach((t) => {
    if (t.priority === "urgent" || t.priority === "high") {
      actions.push({
        area: "Operations",
        issue: `Overdue task: ${t.title}`,
        owner: t.assigned_to,
        priority: t.priority as "urgent" | "high",
        due: t.due_date,
        escalation_level: t.priority === "urgent" ? "manager" : null,
      });
    }
  });

  // ── Safeguarding score ────────────────────────────────────────────────────
  const openIncidents = db.incidents.findOpen();
  const awaitingOversight = db.incidents.findNeedingOversight();
  const activeMissing = db.missingEpisodes.findActive();
  const criticalIncidents = openIncidents.filter((i) => i.severity === "critical");

  let safeguardingScore = 100;
  if (criticalIncidents.length > 0) safeguardingScore -= criticalIncidents.length * 20;
  if (awaitingOversight.length > 0) safeguardingScore -= awaitingOversight.length * 15;
  if (activeMissing.length > 0) safeguardingScore -= activeMissing.length * 25;
  safeguardingScore = Math.max(0, safeguardingScore);

  awaitingOversight.forEach((i) => {
    actions.push({
      area: "Safeguarding",
      issue: `Incident awaiting oversight: ${i.reference}`,
      owner: "staff_darren",
      priority: "urgent",
      due: today,
      escalation_level: "manager",
    });
  });

  criticalIncidents.forEach((i) => {
    actions.push({
      area: "Safeguarding",
      issue: `Critical incident open: ${i.reference} — ${i.type}`,
      owner: "staff_darren",
      priority: "urgent",
      due: today,
      escalation_level: i.type === "safeguarding_concern" ? "ri" : "manager",
    });
  });

  // ── Medication score ──────────────────────────────────────────────────────
  const allAdmins = db.medicationAdministrations.findAll();
  const exceptions = db.medicationAdministrations.findExceptions();
  const stockAlerts = db.medications.findActive().filter((m) => m.stock_count !== null && m.stock_count < 10);
  const totalAdmins = allAdmins.filter((a) => a.status !== "scheduled").length;
  const medicationScore = Math.max(0, score(totalAdmins - exceptions.length, Math.max(totalAdmins, 1)) - stockAlerts.length * 5);

  if (exceptions.length > 0) {
    actions.push({
      area: "Medication",
      issue: `${exceptions.length} medication exception${exceptions.length > 1 ? "s" : ""} requiring oversight`,
      owner: "staff_ryan",
      priority: "high",
      due: today,
      escalation_level: "manager",
    });
  }
  stockAlerts.forEach((m) => {
    actions.push({
      area: "Medication",
      issue: `Low stock: ${m.name} — ${m.stock_count} remaining`,
      owner: "staff_ryan",
      priority: "medium",
      due: today,
      escalation_level: null,
    });
  });

  // ── Staffing score ────────────────────────────────────────────────────────
  const activeStaff = db.staff.findActive().filter((s) => s.role !== "responsible_individual");
  const supervisionsOverdue = activeStaff.filter((s) => s.next_supervision_due && s.next_supervision_due < today);
  const openShifts = db.shifts.findOpen();
  const staffingScore = Math.max(0, 100 - supervisionsOverdue.length * 10 - openShifts.length * 15);

  supervisionsOverdue.forEach((s) => {
    actions.push({
      area: "Staffing",
      issue: `Supervision overdue: ${s.full_name}`,
      owner: "staff_ryan",
      priority: "high",
      due: today,
      escalation_level: null,
    });
  });

  // ── Compliance score ──────────────────────────────────────────────────────
  const expiredTraining = db.training.findExpired();
  const expiringSoon = db.training.findExpiringSoon();
  const allTraining = db.training.findAll();
  const complianceScore = Math.max(0, score(
    allTraining.length - expiredTraining.length,
    Math.max(allTraining.length, 1)
  ) - expiringSoon.length * 3);

  expiredTraining.forEach((t) => {
    const staff = db.staff.findById(t.staff_id);
    actions.push({
      area: "Compliance",
      issue: `Training expired: ${t.course_name} — ${staff?.full_name || t.staff_id}`,
      owner: "staff_ryan",
      priority: "high",
      due: today,
      escalation_level: null,
    });
  });

  // ── Environment score ─────────────────────────────────────────────────────
  const overdueChecks = db.buildingChecks.findOverdue();
  const failedChecks = db.buildingChecks.findAll().filter((c) => c.result === "fail");
  const vehicleDefects = db.vehicleChecks.findDefects();
  const vehicles = db.vehicles.findAll();
  const restrictedVehicles = vehicles.filter((v) => v.status === "restricted");

  let environmentScore = 100;
  environmentScore -= overdueChecks.length * 10;
  environmentScore -= failedChecks.length * 15;
  environmentScore -= vehicleDefects.filter((c) => c.overall_result === "fail").length * 20;
  environmentScore -= restrictedVehicles.length * 10;
  environmentScore = Math.max(0, environmentScore);

  overdueChecks.forEach((c) => {
    actions.push({
      area: "Environment",
      issue: `Building check overdue: ${c.check_type} — ${c.area}`,
      owner: c.responsible_person,
      priority: c.risk_level === "high" || c.risk_level === "critical" ? "urgent" : "medium",
      due: c.due_date,
      escalation_level: c.risk_level === "critical" ? "manager" : null,
    });
  });

  vehicleDefects.filter((c) => c.overall_result === "fail").forEach((c) => {
    const vehicle = db.vehicles.findById(c.vehicle_id);
    actions.push({
      area: "Vehicles",
      issue: `Vehicle unsafe: ${vehicle?.registration || c.vehicle_id} — ${c.defects}`,
      owner: "staff_ryan",
      priority: "urgent",
      due: today,
      escalation_level: "manager",
    });
  });

  // ── Overall score ─────────────────────────────────────────────────────────
  const overall = Math.round(
    operationalScore * 0.2 +
    safeguardingScore * 0.3 +
    medicationScore * 0.2 +
    staffingScore * 0.1 +
    complianceScore * 0.1 +
    environmentScore * 0.1
  );

  const riskLevel = overall < 50 ? "critical" : overall < 65 ? "high" : overall < 80 ? "medium" : "low";

  const result: HealthCheckScore = {
    overall,
    operational: operationalScore,
    safeguarding: safeguardingScore,
    medication: medicationScore,
    staffing: staffingScore,
    compliance: complianceScore,
    environment: environmentScore,
    risk_level: riskLevel,
    action_plan: actions.sort((a, b) => {
      const w = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (w[a.priority] ?? 2) - (w[b.priority] ?? 2);
    }).slice(0, 15),
    generated_at: new Date().toISOString(),
  };

  return NextResponse.json({ data: result });
}
