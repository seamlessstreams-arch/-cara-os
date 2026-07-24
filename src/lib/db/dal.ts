/**
 * ══════════════════════════════════════════════════════════════════════════════
 * CARA — Async Dual-Mode Data Access Layer (DAL)
 *
 * When Supabase is enabled and credentials are configured, all reads/writes
 * go to Supabase Cloud. Otherwise falls back to the in-memory store.
 *
 * Usage in API routes:
 *   import { dal } from "@/lib/db"
 *   const staff = await dal.staff.findAll()
 *   const task  = await dal.tasks.create({ ... })
 *
 * Every method returns a Promise, even when using the sync in-memory fallback.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { db } from "./store";
import { createServerClient } from "@/lib/supabase/server";
import * as sq from "@/lib/supabase/queries";
import { todayStr } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

/** Get a connected Supabase client, or null when in-memory mode */
function sb() {
  return createServerClient();
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE COLLECTIONS — Supabase-backed with in-memory fallback
// ─────────────────────────────────────────────────────────────────────────────

export const dal = {
  // ── Home ──────────────────────────────────────────────────────────────────
  // The one home this deployment serves. In demo mode this is the seeded home
  // (blanked to an empty identity under NEXT_PUBLIC_CARA_MODE=live); when
  // Supabase is connected it is the row SUPABASE_HOME_ID points at.
  home: {
    async get() {
      const c = sb();
      if (c) return sq.getHome(c, homeId());
      return db.home.get();
    },
  },

  // ── Staff ─────────────────────────────────────────────────────────────────
  staff: {
    async findAll(filters?: { role?: string; employment_type?: string; status?: string }) {
      const c = sb();
      if (c) return sq.getStaff(c, homeId(), filters);
      return db.staff.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) return sq.getStaffById(c, id);
      return db.staff.findById(id);
    },
    async findActive() {
      const c = sb();
      if (c) return sq.getStaff(c, homeId(), { status: "active" });
      return db.staff.findActive();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createStaffMember(c, { ...data, home_id: homeId() });
      return db.staff.create(data);
    },
  },

  // ── Young People ──────────────────────────────────────────────────────────
  youngPeople: {
    async findAll(status?: string) {
      const c = sb();
      if (c) return sq.getYoungPeople(c, homeId(), status);
      return db.youngPeople.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) return sq.getYoungPersonById(c, id);
      return db.youngPeople.findById(id);
    },
    async findCurrent() {
      const c = sb();
      if (c) return sq.getYoungPeople(c, homeId(), "current");
      return db.youngPeople.findCurrent();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createYoungPerson(c, { ...data, home_id: homeId() });
      return db.youngPeople.create(data);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) {
      const c = sb();
      if (c) return sq.updateYoungPerson(c, id, data);
      return db.youngPeople.update(id, data);
    },
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────
  tasks: {
    async findAll(filters?: { assigned_to?: string; status?: string; priority?: string; category?: string; overdue?: boolean }) {
      const c = sb();
      if (c) return sq.getTasks(c, homeId(), filters);
      return db.tasks.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) return sq.getTaskById(c, id);
      return db.tasks.findById(id);
    },
    async findActive() {
      const c = sb();
      if (c) return sq.getTasks(c, homeId(), { status: "not_started" });
      return db.tasks.findActive();
    },
    async findOverdue() {
      const c = sb();
      if (c) return sq.getTasks(c, homeId(), { overdue: true });
      return db.tasks.findOverdue();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createTask(c, { ...data, home_id: homeId() });
      return db.tasks.create(data);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) {
      const c = sb();
      if (c) return sq.updateTask(c, id, data);
      // In-memory fallback: status→completed uses the richer complete(); else generic update.
      if (data.status === "completed") return db.tasks.complete(id, data.completed_by ?? "system", data.evidence_note);
      return db.tasks.update(id, data);
    },
  },

  // ── Incidents ─────────────────────────────────────────────────────────────
  incidents: {
    async findAll(filters?: { status?: string; child_id?: string; needs_oversight?: boolean }) {
      const c = sb();
      if (c) return sq.getIncidents(c, homeId(), filters);
      return db.incidents.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) return sq.getIncidentById(c, id);
      return db.incidents.findById(id);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createIncident(c, { ...data, home_id: homeId() });
      return db.incidents.create(data);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) {
      const c = sb();
      if (c) return sq.updateIncident(c, id, data);
      return db.incidents.update(id, data);
    },
    async addOversight(id: string, note: string, by: string) {
      const c = sb();
      if (c) return sq.updateIncident(c, id, { oversight_note: note, oversight_by: by, oversight_at: new Date().toISOString() });
      return db.incidents.addOversight(id, note, by);
    },
  },

  // ── Missing Episodes ──────────────────────────────────────────────────────
  missingEpisodes: {
    async findAll(filters?: { child_id?: string; status?: string; risk_level?: string }) {
      const c = sb();
      if (c) return sq.getMissingEpisodes(c, homeId(), filters);
      return db.missingEpisodes.findAll();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createMissingEpisode(c, { ...data, home_id: homeId() });
      return db.missingEpisodes.create(data);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async patch(id: string, data: any) {
      const c = sb();
      if (c) {
        // Supabase doesn't have a specific patch — use generic update
        return (await c.from("missing_episodes").update(data as never).eq("id", id).select().single()).data;
      }
      return db.missingEpisodes.patch(id, data);
    },
  },

  // ── Shifts ────────────────────────────────────────────────────────────────
  shifts: {
    /** Shifts for the week beginning `weekStart` (defaults to the current week). */
    async findAll(weekStart?: string) {
      const c = sb();
      if (c) return sq.getShiftsForWeek(c, homeId(), weekStart ?? todayStr());
      const all = db.shifts.findAll();
      if (!weekStart) return all;
      const end = new Date(weekStart + "T00:00:00Z");
      end.setUTCDate(end.getUTCDate() + 7);
      const endStr = end.toISOString().slice(0, 10);
      return all.filter((s) => s.date >= weekStart && s.date < endStr);
    },
    async findToday() {
      const c = sb();
      if (c) return sq.getShiftsToday(c, homeId());
      return db.shifts.findToday();
    },
    async findByStaff(staffId: string) {
      const c = sb();
      if (c) {
        const all = await sq.getShiftsForWeek(c, homeId(), todayStr());
        return (all as any[]).filter((s: any) => s.staff_id === staffId);
      }
      return db.shifts.findByStaff(staffId);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createShift(c, { ...data, home_id: homeId() });
      return db.shifts.create(data);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) {
      const c = sb();
      if (c) {
        return (await c.from("shifts").update(data as never).eq("id", id).select().single()).data;
      }
      return db.shifts.update(id, data);
    },
  },

  // ── Leave ─────────────────────────────────────────────────────────────────
  leave: {
    async findAll(filters?: { staff_id?: string; status?: string; leave_type?: string }) {
      const c = sb();
      if (c) return sq.getLeaveRequests(c, homeId(), filters);
      return db.leave.findAll();
    },
    async findPending() {
      const c = sb();
      if (c) return sq.getLeaveRequests(c, homeId(), { status: "pending" });
      return db.leave.findPending();
    },
    async findOnLeaveToday() {
      const c = sb();
      if (c) return sq.getLeaveOnDate(c, homeId(), todayStr());
      return db.leave.findOnLeaveToday();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createLeaveRequest(c, { ...data, home_id: homeId() });
      return db.leave.create(data);
    },
  },

  // ── Training ──────────────────────────────────────────────────────────────
  training: {
    async findAll(filters?: { staff_id?: string; status?: string; category?: string }) {
      const c = sb();
      if (c) return sq.getTrainingRecords(c, homeId(), filters);
      return db.training.findAll();
    },
    async findByStaff(staffId: string) {
      const c = sb();
      if (c) return sq.getTrainingRecords(c, homeId(), { staff_id: staffId });
      return db.training.findByStaff(staffId);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) {
        return (await c.from("training_records").insert({ ...data, home_id: homeId() }).select().single()).data;
      }
      return db.training.create(data);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async patch(id: string, data: any) {
      const c = sb();
      if (c) {
        return (await c.from("training_records").update(data as never).eq("id", id).select().single()).data;
      }
      return db.training.patch(id, data);
    },
  },

  // ── Medications ───────────────────────────────────────────────────────────
  medications: {
    async findAll(childId?: string) {
      const c = sb();
      if (c) return sq.getMedications(c, homeId(), childId);
      return db.medications.findAll();
    },
    async findByChild(childId: string) {
      const c = sb();
      if (c) return sq.getMedications(c, homeId(), childId);
      return db.medications.findByChild(childId);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createMedication(c, { ...data, home_id: homeId() });
      return db.medications.create(data);
    },
  },

  medicationAdministrations: {
    async findAll(filters?: { child_id?: string; medication_id?: string; since?: string }) {
      const c = sb();
      if (c) return sq.getMedicationAdministrations(c, homeId(), filters);
      return db.medicationAdministrations.findAll();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createMedicationAdministration(c, { ...data, home_id: homeId() });
      return null; // in-memory doesn't have a generic create
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) {
      const c = sb();
      if (c) return sq.updateMedicationAdministration(c, id, data);
      return db.medicationAdministrations.administer(id, data);
    },
  },

  // ── Daily Log ─────────────────────────────────────────────────────────────
  dailyLog: {
    async findAll(filters?: { child_id?: string; date?: string; entry_type?: string; days?: number }) {
      const c = sb();
      if (c) return sq.getDailyLog(c, homeId(), filters);
      return db.dailyLog.findAll();
    },
    async findByChild(childId: string) {
      const c = sb();
      if (c) return sq.getDailyLog(c, homeId(), { child_id: childId });
      return db.dailyLog.findByChild(childId);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createDailyLogEntry(c, { ...data, home_id: homeId() });
      return db.dailyLog.create(data);
    },
  },

  // ── Supervisions ──────────────────────────────────────────────────────────
  supervisions: {
    async findAll(filters?: { staff_id?: string; supervisor_id?: string; status?: string; overdue?: boolean }) {
      const c = sb();
      if (c) return sq.getSupervisions(c, homeId(), filters);
      return db.supervisions.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) return sq.getSupervisionById(c, id);
      return db.supervisions.findById(id);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createSupervision(c, { ...data, home_id: homeId() });
      return db.supervisions.create(data);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) {
      const c = sb();
      if (c) return sq.updateSupervision(c, id, data);
      return db.supervisions.update(id, data);
    },
  },

  // ── Documents ─────────────────────────────────────────────────────────────
  documents: {
    async findAll(filters?: { category?: string; requires_read_sign?: boolean }) {
      const c = sb();
      if (c) return sq.getDocuments(c, homeId(), filters);
      return db.documents.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) {
        return (await c.from("documents").select("*").eq("id", id).single()).data;
      }
      return db.documents.findById(id);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createDocument(c, { ...data, home_id: homeId() });
      return db.documents.create(data);
    },
  },

  documentReadReceipts: {
    async findByDocument(docId: string) {
      const c = sb();
      if (c) return sq.getDocumentReadReceipts(c, [docId]);
      return db.documentReadReceipts.findByDocument(docId);
    },
    async upsertSignature(docId: string, staffId: string) {
      const c = sb();
      if (c) return sq.upsertDocumentReadReceipt(c, docId, staffId);
      return db.documentReadReceipts.upsertSignature(docId, staffId);
    },
  },

  // ── Expenses ──────────────────────────────────────────────────────────────
  expenses: {
    async findAll(filters?: { status?: string; submitted_by?: string }) {
      const c = sb();
      if (c) return sq.getExpenses(c, homeId(), filters);
      return db.expenses.findAll();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createExpense(c, { ...data, home_id: homeId() });
      return db.expenses.create(data);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) {
      const c = sb();
      if (c) return sq.updateExpense(c, id, data);
      return db.expenses.update(id, data);
    },
  },

  // ── Care Forms ────────────────────────────────────────────────────────────
  careForms: {
    async findAll(filters?: { status?: string; form_type?: string; linked_child_id?: string; priority?: string; pending_review?: boolean }) {
      const c = sb();
      if (c) return sq.getCareForms(c, homeId(), filters);
      return db.careForms.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) return sq.getCareFormById(c, id);
      return db.careForms.findById(id);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createCareForm(c, { ...data, home_id: homeId() });
      return db.careForms.create(data);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) {
      const c = sb();
      if (c) return sq.updateCareForm(c, id, data);
      return db.careForms.update(id, data);
    },
    async submit(id: string, by: string) {
      const c = sb();
      if (c) return sq.updateCareForm(c, id, { status: "submitted", submitted_at: new Date().toISOString(), submitted_by: by, updated_by: by });
      return db.careForms.submit(id, by);
    },
    async approve(id: string, by: string, notes?: string) {
      const c = sb();
      if (c) return sq.updateCareForm(c, id, { status: "approved", approved_at: new Date().toISOString(), approved_by: by, reviewed_by: by, reviewed_at: new Date().toISOString(), review_notes: notes ?? null, updated_by: by });
      return db.careForms.approve(id, by, notes);
    },
  },

  // ── QA Audits ─────────────────────────────────────────────────────────────
  qaAudits: {
    async findAll(filters?: { status?: string; category?: string }) {
      const c = sb();
      if (c) return sq.getQaAudits(c, homeId(), filters);
      return db.audits.findAll();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createQaAudit(c, { ...data, home_id: homeId() });
      return db.audits.create(data);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) {
      const c = sb();
      if (c) return sq.updateQaAudit(c, id, data);
      return db.audits.update(id, data);
    },
  },

  // ── Maintenance ───────────────────────────────────────────────────────────
  maintenance: {
    async findAll(filters?: { status?: string; priority?: string }) {
      const c = sb();
      if (c) return sq.getMaintenanceItems(c, homeId(), filters);
      return db.maintenance.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) {
        return (await c.from("maintenance_items").select("*").eq("id", id).single()).data;
      }
      return db.maintenance.findById(id);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createMaintenanceItem(c, { ...data, home_id: homeId() });
      return db.maintenance.create(data);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) {
      const c = sb();
      if (c) return sq.updateMaintenanceItem(c, id, data);
      return db.maintenance.update(id, data);
    },
  },

  // ── Chronology ────────────────────────────────────────────────────────────
  chronology: {
    async findAll() {
      const c = sb();
      if (c) return sq.getChronologyEntries(c, homeId());
      return db.chronology.findAll();
    },
    async findByChild(childId: string) {
      const c = sb();
      if (c) return sq.getChronologyEntries(c, homeId(), childId);
      return db.chronology.findByChild(childId);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createChronologyEntry(c, { ...data, home_id: homeId() });
      return db.chronology.create(data);
    },
  },

  // ── Handovers ─────────────────────────────────────────────────────────────
  handovers: {
    async findAll(limit?: number) {
      const c = sb();
      if (c) return sq.getHandovers(c, homeId(), limit);
      return db.handovers.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) {
        return (await c.from("handovers").select("*").eq("id", id).single()).data;
      }
      return db.handovers.findById(id);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createHandover(c, { ...data, home_id: homeId() });
      return db.handovers.create(data);
    },
  },

  // ── Buildings ─────────────────────────────────────────────────────────────
  buildings: {
    async findAll() {
      const c = sb();
      if (c) return sq.getBuildings(c, homeId());
      return db.buildings.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) {
        return (await c.from("buildings").select("*").eq("id", id).single()).data;
      }
      return db.buildings.findById(id);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createBuilding(c, { ...data, home_id: homeId() });
      return db.buildings.create(data);
    },
  },

  buildingChecks: {
    async findAll(buildingId?: string) {
      const c = sb();
      if (c) return sq.getBuildingChecks(c, homeId(), buildingId);
      return db.buildingChecks.findAll();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createBuildingCheck(c, { ...data, home_id: homeId() });
      return db.buildingChecks.create(data);
    },
  },

  // ── Vehicles ──────────────────────────────────────────────────────────────
  vehicles: {
    async findAll() {
      const c = sb();
      if (c) return sq.getVehicles(c, homeId());
      return db.vehicles.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) {
        return (await c.from("vehicles").select("*").eq("id", id).single()).data;
      }
      return db.vehicles.findById(id);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createVehicle(c, { ...data, home_id: homeId() });
      return db.vehicles.create(data);
    },
  },

  vehicleChecks: {
    async findAll(vehicleId?: string) {
      const c = sb();
      if (c) return sq.getVehicleChecks(c, homeId(), vehicleId);
      return db.vehicleChecks.findAll();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createVehicleCheck(c, { ...data, home_id: homeId() });
      return db.vehicleChecks.create(data);
    },
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    async findForUser(userId: string) {
      const c = sb();
      if (c) return sq.getNotifications(c, homeId(), userId);
      return db.notifications.findForUser(userId);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createNotification(c, { ...data, home_id: homeId() });
      return db.notifications.create(data);
    },
  },

  // ── Safer Recruitment ─────────────────────────────────────────────────────
  vacancies: {
    async findAll() {
      const c = sb();
      if (c) return sq.getVacancies(c, homeId());
      return db.vacancies.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) {
        return (await c.from("vacancies").select("*").eq("id", id).single()).data;
      }
      return db.vacancies.findById(id);
    },
  },

  candidateProfiles: {
    async findAll(vacancyId?: string) {
      const c = sb();
      if (c) return sq.getCandidateProfiles(c, homeId(), vacancyId);
      return db.candidateProfiles.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) return sq.getCandidateById(c, id);
      return db.candidateProfiles.findById(id);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createCandidateProfile(c, { ...data, home_id: homeId() });
      return db.candidateProfiles.create(data);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) {
      const c = sb();
      if (c) return sq.updateCandidateProfile(c, id, data);
      return db.candidateProfiles.update(id, data);
    },
  },

  candidateChecks: {
    async findByCandidate(candidateId: string) {
      const c = sb();
      if (c) return sq.getCandidateChecks(c, candidateId);
      return db.candidateChecks.findByCandidate(candidateId);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) {
      const c = sb();
      if (c) return sq.updateCandidateCheck(c, id, data);
      return db.candidateChecks.update(id, data);
    },
  },

  candidateReferences: {
    async findByCandidate(candidateId: string) {
      const c = sb();
      if (c) return sq.getCandidateReferences(c, candidateId);
      return db.candidateReferences.findByCandidate(candidateId);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createCandidateReference(c, { ...data });
      return db.candidateReferences.create(data);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) {
      const c = sb();
      if (c) return sq.updateCandidateReference(c, id, data);
      return db.candidateReferences.update(id, data);
    },
  },

  // ── Intelligence Layer ────────────────────────────────────────────────────
  childExperienceSnapshots: {
    async findByChild(childId: string) {
      const c = sb();
      if (c) return sq.getChildExperienceSnapshots(c, childId);
      return [];
    },
    async findLatest(childId: string) {
      const c = sb();
      if (c) return sq.getLatestChildExperienceSnapshot(c, childId);
      return null;
    },
  },

  patternAlerts: {
    async findAll(filters?: { childId?: string; status?: string; severity?: string }) {
      const c = sb();
      if (c) return sq.getPatternAlerts(c, homeId(), filters);
      return [];
    },
  },

  homeClimateSnapshots: {
    async findAll(limit?: number) {
      const c = sb();
      if (c) return sq.getHomeClimateSnapshots(c, homeId(), limit);
      return [];
    },
    async findLatest() {
      const c = sb();
      if (c) return sq.getLatestHomeClimateSnapshot(c, homeId());
      return null;
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC TABLE FACTORY — for extended types without dedicated Supabase tables
//
// Creates async CRUD wrappers. When Supabase is enabled, uses the
// `generic_records` catch-all table. Otherwise wraps the in-memory store.
// ─────────────────────────────────────────────────────────────────────────────

export function genericTable<T extends { id: string }>(
  /** In-memory store collection accessor */
  memoryGetAll: () => T[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  memoryCreate: (data: any) => T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  memoryUpdate?: (id: string, data: any) => T | null,
  /** The record_type string for the generic_records table */
  recordType?: string,
) {
  return {
    async findAll(filters?: { child_id?: string; staff_id?: string }): Promise<T[]> {
      const c = sb();
      if (c && recordType) {
        const rows = await sq.getGenericRecords(c, homeId(), recordType, filters);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return rows.map((r: any) => ({ id: r.id, ...r.data, created_at: r.created_at, updated_at: r.updated_at }) as T);
      }
      return memoryGetAll();
    },

    async findById(id: string): Promise<T | null> {
      const c = sb();
      if (c && recordType) {
        try {
          const r = await sq.getGenericRecordById(c, id);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { id: (r as any).id, ...(r as any).data, created_at: (r as any).created_at } as T;
        } catch { return null; }
      }
      return memoryGetAll().find((item) => item.id === id) ?? null;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any): Promise<T> {
      const c = sb();
      if (c && recordType) {
        const { id: _id, child_id, staff_id, created_by, ...rest } = data;
        const row = await sq.createGenericRecord(c, {
          home_id: homeId(),
          record_type: recordType,
          data: rest,
          child_id: child_id ?? null,
          staff_id: staff_id ?? null,
          created_by: created_by ?? null,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { id: (row as any).id, ...rest, created_at: (row as any).created_at } as T;
      }
      return memoryCreate(data);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any): Promise<T | null> {
      const c = sb();
      if (c && recordType) {
        const existing = await sq.getGenericRecordById(c, id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const merged = { ...(existing as any).data, ...data };
        const row = await sq.updateGenericRecord(c, id, { data: merged, updated_by: data.updated_by ?? null });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { id: (row as any).id, ...merged, updated_at: (row as any).updated_at } as T;
      }
      return memoryUpdate ? memoryUpdate(id, data) : null;
    },
  };
}
