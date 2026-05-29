// ==============================================================================
// CORNERSTONE -- HOME PERSONAL CALENDAR & APPOINTMENTS INTELLIGENCE API ROUTE
// GET /api/v1/home-personal-calendar-appointments-intelligence
// Cross-domain composite: appointmentRecords + calendarManagementRecords +
// medicalComplianceRecords + transportArrangementRecords +
// childPreparationRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computePersonalCalendarAppointments,
  type AppointmentRecordInput,
  type CalendarManagementRecordInput,
  type MedicalComplianceRecordInput,
  type TransportArrangementRecordInput,
  type ChildPreparationRecordInput,
} from "@/lib/engines/home-personal-calendar-appointments-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawAppointmentRecords = (store.appointmentRecords ?? []) as any[];
    const appointment_records: AppointmentRecordInput[] = rawAppointmentRecords.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      appointment_type: r.appointment_type ?? "other",
      date: (r.date ?? today).toString(),
      time_slot: r.time_slot ?? "",
      attended: !!r.attended,
      cancelled: !!r.cancelled,
      cancelled_reason: r.cancelled_reason ?? "",
      cancelled_by: r.cancelled_by ?? "",
      rescheduled: !!r.rescheduled,
      rescheduled_within_14_days: !!r.rescheduled_within_14_days,
      outcome_recorded: !!r.outcome_recorded,
      follow_up_actions_identified: !!r.follow_up_actions_identified,
      follow_up_actions_completed: !!r.follow_up_actions_completed,
      child_consented: !!r.child_consented,
      staff_accompanied: !!r.staff_accompanied,
      waiting_time_weeks: r.waiting_time_weeks ?? 0,
      is_overdue: !!r.is_overdue,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawCalendarManagementRecords = (store.calendarManagementRecords ?? []) as any[];
    const calendar_management_records: CalendarManagementRecordInput[] = rawCalendarManagementRecords.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      month: r.month ?? "",
      total_appointments_scheduled: r.total_appointments_scheduled ?? 0,
      appointments_in_calendar: r.appointments_in_calendar ?? 0,
      reminders_set: !!r.reminders_set,
      conflicts_identified: r.conflicts_identified ?? 0,
      conflicts_resolved: r.conflicts_resolved ?? 0,
      advance_notice_days: r.advance_notice_days ?? 0,
      calendar_shared_with_child: !!r.calendar_shared_with_child,
      calendar_shared_with_social_worker: !!r.calendar_shared_with_social_worker,
      calendar_accurate: !!r.calendar_accurate,
      missed_from_calendar: r.missed_from_calendar ?? 0,
      double_bookings: r.double_bookings ?? 0,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawMedicalComplianceRecords = (store.medicalComplianceRecords ?? []) as any[];
    const medical_compliance_records: MedicalComplianceRecordInput[] = rawMedicalComplianceRecords.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      compliance_type: r.compliance_type ?? "other",
      due_date: (r.due_date ?? today).toString(),
      completed: !!r.completed,
      completed_date: r.completed_date ?? null,
      overdue: !!r.overdue,
      days_overdue: r.days_overdue ?? 0,
      reason_incomplete: r.reason_incomplete ?? "",
      health_plan_updated: !!r.health_plan_updated,
      consent_obtained: !!r.consent_obtained,
      outcome_documented: !!r.outcome_documented,
      professional_attending: r.professional_attending ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawTransportArrangementRecords = (store.transportArrangementRecords ?? []) as any[];
    const transport_arrangement_records: TransportArrangementRecordInput[] = rawTransportArrangementRecords.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      appointment_id: r.appointment_id ?? "",
      transport_type: r.transport_type ?? "other",
      arranged_in_advance: !!r.arranged_in_advance,
      advance_notice_hours: r.advance_notice_hours ?? 0,
      on_time: !!r.on_time,
      delay_minutes: r.delay_minutes ?? 0,
      child_comfortable: !!r.child_comfortable,
      appropriate_vehicle: !!r.appropriate_vehicle,
      staff_driver_checked: !!r.staff_driver_checked,
      backup_plan_in_place: !!r.backup_plan_in_place,
      cost_approved: !!r.cost_approved,
      distance_miles: r.distance_miles ?? 0,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawChildPreparationRecords = (store.childPreparationRecords ?? []) as any[];
    const child_preparation_records: ChildPreparationRecordInput[] = rawChildPreparationRecords.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      appointment_id: r.appointment_id ?? "",
      preparation_type: r.preparation_type ?? "other",
      child_informed_in_advance: !!r.child_informed_in_advance,
      advance_notice_hours: r.advance_notice_hours ?? 0,
      child_anxieties_addressed: !!r.child_anxieties_addressed,
      preferences_captured: !!r.preferences_captured,
      child_chose_accompaniment: !!r.child_chose_accompaniment,
      debrief_after: !!r.debrief_after,
      child_feedback_captured: !!r.child_feedback_captured,
      child_satisfaction: r.child_satisfaction ?? 3,
      autonomy_supported: !!r.autonomy_supported,
      age_appropriate_information: !!r.age_appropriate_information,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computePersonalCalendarAppointments({
      today,
      total_children,
      appointment_records,
      calendar_management_records,
      medical_compliance_records,
      transport_arrangement_records,
      child_preparation_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
