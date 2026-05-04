import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { processMedicationException } from "@/lib/db/linked-updates";
import { todayStr } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");
  const view = searchParams.get("view"); // "mar" | "schedule" | "prn" | "stock"

  const meds = childId ? db.medications.findByChild(childId) : db.medications.findActive();
  const admins = childId ? db.medicationAdministrations.findByChild(childId) : db.medicationAdministrations.findAll();

  const todayAdmins = admins.filter((a) => a.scheduled_time.startsWith(todayStr()));
  const exceptions = db.medicationAdministrations.findExceptions();
  const scheduled = db.medicationAdministrations.findScheduled();

  // Build MAR summary per medication
  const mar = meds.map((med) => {
    const medAdmins = admins.filter((a) => a.medication_id === med.id)
      .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
    return { medication: med, administrations: medAdmins };
  });

  return NextResponse.json({
    data: {
      medications: meds,
      mar,
      today_schedule: todayAdmins,
      exceptions,
      scheduled,
      stock_alerts: meds.filter((m) => m.stock_count !== null && m.stock_count < 10),
    },
    meta: {
      total_active: meds.length,
      exceptions_this_week: exceptions.length,
      scheduled_today: scheduled.filter((a) => a.scheduled_time.startsWith(todayStr())).length,
    },
  });
}
