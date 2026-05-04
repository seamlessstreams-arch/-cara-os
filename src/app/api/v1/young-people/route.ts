import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

function calcAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status") ?? "current";

  const allYP = db.youngPeople.findAll();
  let filtered = allYP;
  if (statusParam === "current") {
    filtered = allYP.filter((yp) => yp.status === "current");
  } else if (statusParam === "former") {
    filtered = allYP.filter((yp) => yp.status === "ended");
  }
  // statusParam === "all" keeps everything

  const allStaff = db.staff.findAll();
  const allIncidents = db.incidents.findAll();
  const allTasks = db.tasks.findAll();
  const allMissingEpisodes = db.missingEpisodes.findAll();
  const allDailyLog = db.dailyLog.findAll();
  const today = todayStr();

  const data = filtered.map((yp) => {
    const keyWorker = yp.key_worker_id ? (allStaff.find((s) => s.id === yp.key_worker_id) ?? null) : null;
    const secondaryWorker = yp.secondary_worker_id ? (allStaff.find((s) => s.id === yp.secondary_worker_id) ?? null) : null;

    const openIncidents = allIncidents.filter((i) => i.child_id === yp.id && i.status === "open").length;
    const activeTasks = allTasks.filter(
      (t) => t.linked_child_id === yp.id && t.status !== "completed" && t.status !== "cancelled"
    ).length;
    const missingEpisodesTotal = allMissingEpisodes.filter((m) => m.child_id === yp.id).length;

    const childLogs = allDailyLog.filter((e) => e.child_id === yp.id);
    const lastLogDate = childLogs.length > 0
      ? childLogs.sort((a, b) => {
          const dateA = a.date + "T" + a.time;
          const dateB = b.date + "T" + b.time;
          return dateB.localeCompare(dateA);
        })[0].date
      : null;

    const activeMedications = db.medications.findByChild(yp.id).filter((m) => m.is_active).length;
    const riskFlagsCount = yp.risk_flags.length;

    return {
      ...yp,
      age: calcAge(yp.date_of_birth),
      key_worker: keyWorker,
      secondary_worker: secondaryWorker,
      open_incidents: openIncidents,
      active_tasks: activeTasks,
      missing_episodes_total: missingEpisodesTotal,
      last_log_date: lastLogDate,
      active_medications: activeMedications,
      risk_flags_count: riskFlagsCount,
    };
  });

  const allCurrent = allYP.filter((yp) => yp.status === "current");
  const allFormer = allYP.filter((yp) => yp.status === "ended");
  const highRisk = allYP.filter((yp) => yp.risk_flags.length > 0);

  return NextResponse.json({
    data,
    meta: {
      total: allYP.length,
      current: allCurrent.length,
      former: allFormer.length,
      high_risk: highRisk.length,
    },
  });
}
