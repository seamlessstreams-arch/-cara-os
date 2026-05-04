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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const yp = db.youngPeople.findById(id);
  if (!yp) return NextResponse.json({ error: "Young person not found" }, { status: 404 });

  const allStaff   = db.staff.findAll();
  const today      = todayStr();

  const keyWorker       = yp.key_worker_id ? (allStaff.find((s) => s.id === yp.key_worker_id) ?? null) : null;
  const secondaryWorker = yp.secondary_worker_id ? (allStaff.find((s) => s.id === yp.secondary_worker_id) ?? null) : null;

  const incidents        = db.incidents.findAll().filter((i) => i.child_id === id);
  const tasks            = db.tasks.findAll().filter((t) => t.linked_child_id === id);
  const medications      = db.medications.findByChild(id);
  const missingEpisodes  = db.missingEpisodes.findByChild(id);
  const chronology       = db.chronology.findByChild(id);
  const careForms        = db.careForms.findByChild(id);
  const dailyLog         = db.dailyLog.findByChild(id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  return NextResponse.json({
    data: {
      ...yp,
      age:                   calcAge(yp.date_of_birth),
      key_worker:            keyWorker,
      secondary_worker:      secondaryWorker,
      open_incidents:        incidents.filter((i) => i.status === "open").length,
      active_tasks:          tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length,
      active_medications:    medications.filter((m) => m.is_active).length,
      missing_episodes_total: missingEpisodes.length,
      risk_flags_count:      yp.risk_flags.length,
      last_log_date:         dailyLog[0]?.date ?? null,
    },
    related: {
      incidents:       incidents.sort((a, b) => b.date.localeCompare(a.date)),
      tasks:           tasks.filter((t) => t.status !== "completed").sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")),
      medications:     medications.filter((m) => m.is_active),
      missing_episodes: missingEpisodes.sort((a, b) => b.date_missing.localeCompare(a.date_missing)),
      chronology:      chronology,
      care_forms:      careForms.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
      recent_log:      dailyLog,
    },
    meta: {
      today,
      total_incidents: incidents.length,
      open_incidents:  incidents.filter((i) => i.status === "open").length,
      total_tasks:     tasks.length,
      active_tasks:    tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length,
    },
  });
}
