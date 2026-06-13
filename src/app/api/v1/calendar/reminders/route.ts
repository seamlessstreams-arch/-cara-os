// CARA — POST /api/v1/calendar/reminders
//
// Idempotent: fires in-app reminders for any planned event currently inside its
// reminder window (reminder_sent flips so it never double-fires). Safe to call
// from a cron/loop or a "check reminders now" button. No external send.
import { NextResponse } from "next/server";
import { runDueReminders } from "@/lib/calendar/calendar-service";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = runDueReminders(new Date().toISOString());
  return NextResponse.json({ data: result });
}
