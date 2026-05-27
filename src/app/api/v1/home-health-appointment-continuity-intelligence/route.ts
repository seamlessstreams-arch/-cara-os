import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHealthAppointmentContinuity,
  type AppointmentRecordInput,
} from "@/lib/engines/home-health-appointment-continuity-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = store.children ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Appointments → AppointmentRecordInput[]
  const rawAppointments = (store.appointments as any[] ?? []);
  const appointments: AppointmentRecordInput[] = rawAppointments.map((a: any) => ({
    id: a.id ?? "",
    child_id: a.child_id ?? "",
    appointment_type: a.type ?? "other",
    status: a.status ?? "scheduled",
    has_outcome: !!(a.outcome && a.outcome.trim().length > 0),
    transport_arranged: !!(a.transport_arranged),
    has_escort: !!(a.escort_staff && a.escort_staff.trim().length > 0),
    has_follow_up: !!(a.follow_up_date && a.follow_up_date.trim().length > 0),
  }));

  const result = computeHealthAppointmentContinuity({
    today,
    total_children: (children as any[]).length,
    appointments,
  });

  return NextResponse.json({ data: result });
}
