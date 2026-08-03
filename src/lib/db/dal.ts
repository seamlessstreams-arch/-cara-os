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

import { db, getStore } from "./store";
import { facilityStore } from "./facility-store";
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
      if (c) return sq.getActiveTasks(c, homeId());
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
      if (c) return sq.getShiftsByStaff(c, homeId(), staffId);
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
      // In-memory fallback: apply the same filters client-side so demo mode
      // matches live behavior. The primitives (findByStaff, findScheduled,
      // etc.) exist on store.supervisions if a single-filter fast path is ever
      // needed; findAll+filter keeps parity for the multi-filter case.
      let list = db.supervisions.findAll();
      if (filters?.staff_id) list = list.filter((s) => s.staff_id === filters.staff_id);
      if (filters?.supervisor_id) list = list.filter((s) => s.supervisor_id === filters.supervisor_id);
      if (filters?.status) list = list.filter((s) => s.status === filters.status);
      if (filters?.overdue) {
        const today = todayStr();
        list = list.filter((s) => s.status === "scheduled" && s.scheduled_date < today);
      }
      return list;
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
    async findAll() {
      // No Supabase list query yet — always in-memory. When a query lands,
      // swap in `if (sb()) return sq.getAllDocumentReadReceipts(c, homeId());`
      return db.documentReadReceipts.findAll();
    },
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
      return facilityStore.buildings.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) {
        return (await c.from("buildings").select("*").eq("id", id).single()).data;
      }
      return facilityStore.buildings.findById(id);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createBuilding(c, { ...data, home_id: homeId() });
      return facilityStore.buildings.create(data);
    },
  },

  buildingChecks: {
    async findAll(buildingId?: string) {
      const c = sb();
      if (c) return sq.getBuildingChecks(c, homeId(), buildingId);
      return facilityStore.buildingChecks.findAll();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createBuildingCheck(c, { ...data, home_id: homeId() });
      return facilityStore.buildingChecks.create(data);
    },
  },

  // ── Vehicles ──────────────────────────────────────────────────────────────
  vehicles: {
    async findAll() {
      const c = sb();
      if (c) return sq.getVehicles(c, homeId());
      return facilityStore.vehicles.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) {
        return (await c.from("vehicles").select("*").eq("id", id).single()).data;
      }
      return facilityStore.vehicles.findById(id);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createVehicle(c, { ...data, home_id: homeId() });
      return facilityStore.vehicles.create(data);
    },
  },

  vehicleChecks: {
    async findAll(vehicleId?: string) {
      const c = sb();
      if (c) return sq.getVehicleChecks(c, homeId(), vehicleId);
      return facilityStore.vehicleChecks.findAll();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) {
      const c = sb();
      if (c) return sq.createVehicleCheck(c, { ...data, home_id: homeId() });
      return facilityStore.vehicleChecks.create(data);
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

  // ─────────────────────────────────────────────────────────────────────────
  // DEMO-ONLY extensions — collections routed through DAL for uniform access
  // but currently ALWAYS in-memory (no Supabase table yet). When a table
  // lands for one of these, wire the query in queries.ts and swap the
  // `if (sb())` branch here — routes stay unchanged.
  // ─────────────────────────────────────────────────────────────────────────

  keyWorkingSessions: {
    async findAll(filters?: { child_id?: string; staff_id?: string }) {
      let list = db.keyWorkingSessions.findAll();
      if (filters?.child_id) list = list.filter((s) => s.child_id === filters.child_id);
      if (filters?.staff_id) list = list.filter((s) => s.staff_id === filters.staff_id);
      return list;
    },
    async findById(id: string) { return db.keyWorkingSessions.findById(id) ?? null; },
    async findByChild(childId: string) { return db.keyWorkingSessions.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.keyWorkingSessions.create(data); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) { return db.keyWorkingSessions.update(id, data); },
  },

  behaviourLog: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.behaviourLog.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.behaviourLog.findById(id) ?? null; },
    async findByChild(childId: string) { return db.behaviourLog.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.behaviourLog.create(data); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) { return db.behaviourLog.update(id, data); },
  },

  riskAssessments: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.riskAssessments.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.riskAssessments.findById(id) ?? null; },
    async findByChild(childId: string) { return db.riskAssessments.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.riskAssessments.create(data); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) { return db.riskAssessments.update(id, data); },
  },

  lacReviews: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.lacReviews.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.lacReviews.findById(id) ?? null; },
    async findByChild(childId: string) { return db.lacReviews.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.lacReviews.create(data); },
  },

  educationRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.educationRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.educationRecords.findById(id) ?? null; },
    async findByChild(childId: string) { return db.educationRecords.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.educationRecords.create(data); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) { return db.educationRecords.update(id, data); },
  },

  trainingRecords: {
    async findAll(filters?: { staff_id?: string }) {
      let list = getStore().trainingRecords;
      if (filters?.staff_id) list = list.filter((r) => r.staff_id === filters.staff_id);
      return list;
    },
    async findById(id: string) { return getStore().trainingRecords.find((r) => r.id === id) ?? null; },
    async findByStaff(staffId: string) { return getStore().trainingRecords.filter((r) => r.staff_id === staffId); },
  },

  restraints: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.restraints.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.restraints.findById(id) ?? null; },
    async findByChild(childId: string) { return db.restraints.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.restraints.create(data); },
  },

  reflectiveSupervisions: {
    async findAll(filters?: { staff_id?: string }) {
      let list = getStore().reflectiveSupervisions;
      if (filters?.staff_id) list = list.filter((r) => r.staff_id === filters.staff_id);
      return list;
    },
    async findById(id: string) { return getStore().reflectiveSupervisions.find((r) => r.id === id) ?? null; },
    async findByStaff(staffId: string) { return getStore().reflectiveSupervisions.filter((r) => r.staff_id === staffId); },
    // DEMO-ONLY append (mirrors the in-memory copy). Real persistence is the
    // persistReflectiveSupervision side-channel the route still calls.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(record: any) {
      const s = getStore() as any;
      s.reflectiveSupervisions = s.reflectiveSupervisions ?? [];
      s.reflectiveSupervisions.push(record);
      return record;
    },
  },

  outcomeTargets: {
    async findAll(filters?: { child_id?: string; status?: string; domain?: string }) {
      let list = db.outcomeTargets.findAll();
      if (filters?.child_id) list = list.filter((t) => t.child_id === filters.child_id);
      if (filters?.status) list = list.filter((t) => t.status === filters.status);
      if (filters?.domain) list = list.filter((t) => t.domain === filters.domain);
      return list;
    },
    async findById(id: string) { return db.outcomeTargets.findById(id) ?? null; },
    async findByChild(childId: string) { return db.outcomeTargets.findByChild(childId); },
    async findActive() { return db.outcomeTargets.findActive(); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.outcomeTargets.create(data); },
  },

  debriefRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.debriefRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.debriefRecords.findById(id) ?? null; },
    async findByChild(childId: string) { return db.debriefRecords.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.debriefRecords.create(data); },
  },

  familyTimeSessions: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.familyTimeSessions.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.familyTimeSessions.findById(id) ?? null; },
    async findByChild(childId: string) { return db.familyTimeSessions.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.familyTimeSessions.create(data); },
  },

  sanctionRewards: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.sanctionRewards.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.sanctionRewards.findById(id) ?? null; },
    async findByChild(childId: string) { return db.sanctionRewards.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.sanctionRewards.create(data); },
  },

  returnInterviews: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.returnInterviews.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.returnInterviews.findById(id) ?? null; },
    async findByChild(childId: string) { return db.returnInterviews.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.returnInterviews.create(data); },
  },

  positiveAchievements: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.positiveAchievements.getAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.positiveAchievements.getAll().find((r) => r.id === id) ?? null; },
    async findByChild(childId: string) { return db.positiveAchievements.getAll().filter((r) => r.child_id === childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.positiveAchievements.create(data); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) { return db.positiveAchievements.update(id, data); },
  },

  caraRecordingReviews: {
    async findAll(filters?: { user_id?: string; child_id?: string }) {
      let list = getStore().caraRecordingReviews;
      if (filters?.user_id) list = list.filter((r) => r.user_id === filters.user_id);
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return getStore().caraRecordingReviews.find((r) => r.id === id) ?? null; },
    // DEMO-ONLY append (mirrors the in-memory copy the routes kept). The real
    // Supabase persistence is a side-channel (persistRecordingReview) the routes
    // still call directly. When a table lands, add `if (sb()) return sq...` here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(review: any) {
      const s = getStore() as any;
      s.caraRecordingReviews = s.caraRecordingReviews ?? [];
      s.caraRecordingReviews.push(review);
      return review;
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEMO-ONLY extensions — batch 2 (2026-08-02). Unlocks ~77 more raw-store
  // routes for DAL migration. Same demo-only pattern — reads always in-memory
  // until a Supabase table lands.
  // ─────────────────────────────────────────────────────────────────────────

  leaveRequests: {
    async findAll(filters?: { staff_id?: string; status?: string }) {
      let list = getStore().leaveRequests;
      if (filters?.staff_id) list = list.filter((r) => r.staff_id === filters.staff_id);
      if (filters?.status) list = list.filter((r) => r.status === filters.status);
      return list;
    },
    async findById(id: string) { return getStore().leaveRequests.find((r) => r.id === id) ?? null; },
  },

  ypFeedback: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.ypFeedback.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.ypFeedback.findById(id) ?? null; },
    async findByChild(childId: string) { return db.ypFeedback.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.ypFeedback.create(data); },
  },

  healthAssessments: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.healthAssessments.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.healthAssessments.findById(id) ?? null; },
    async findByChild(childId: string) { return db.healthAssessments.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.healthAssessments.create(data); },
  },

  notifiableEvents: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.notifiableEvents.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.notifiableEvents.findById(id) ?? null; },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.notifiableEvents.create(data); },
  },

  employerValuesProfiles: {
    async findAll() { return getStore().employerValuesProfiles; },
    async findById(id: string) { return getStore().employerValuesProfiles.find((r) => r.id === id) ?? null; },
    // DEMO-ONLY single-profile upsert (there is one profile per home). Mirrors
    // the route's list[0]-replace mutation exactly.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async upsert(updated: any) {
      const s = getStore() as any;
      const list = s.employerValuesProfiles ?? [];
      if (list[0]) list[0] = updated; else list.push(updated);
      s.employerValuesProfiles = list;
      return updated;
    },
  },

  reg44VisitReports: {
    async findAll(filters?: { home_id?: string }) {
      let list = db.reg44VisitReports.findAll();
      if (filters?.home_id) list = list.filter((r) => r.home_id === filters.home_id);
      return list;
    },
    async findById(id: string) { return db.reg44VisitReports.findById(id) ?? null; },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.reg44VisitReports.create(data); },
  },

  mentalHealthCheckIns: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.mentalHealthCheckIns.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.mentalHealthCheckIns.findById(id) ?? null; },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.mentalHealthCheckIns.create(data); },
  },

  childPaceProfiles: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.childPaceProfiles.findAll();
      if (filters?.child_id) list = list.filter((r) => r.childId === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.childPaceProfiles.findByChild(childId) ?? null; },
  },

  complaints: {
    async findAll(filters?: { status?: string }) {
      let list = getStore().complaints;
      if (filters?.status) list = list.filter((r) => r.status === filters.status);
      return list;
    },
    async findById(id: string) { return getStore().complaints.find((r) => r.id === id) ?? null; },
  },

  welfareChecks: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.welfareChecks.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.welfareChecks.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.welfareChecks.create(data); },
  },

  medicationErrors: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.medicationErrors.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.medicationErrors.findById(id) ?? null; },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.medicationErrors.create(data); },
  },

  outcomeReviews: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.outcomeReviews.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.outcomeReviews.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.outcomeReviews.create(data); },
  },

  advocacyRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.advocacyRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.advocacyRecords.findById(id) ?? null; },
  },

  qaAuditRecords: {
    async findAll() { return db.qaAuditRecords.getAll(); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.qaAuditRecords.create(data); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) { return db.qaAuditRecords.update(id, data); },
  },

  candidateValuesProfiles: {
    async findAll(filters?: { candidate_id?: string }) {
      let list = getStore().candidateValuesProfiles;
      if (filters?.candidate_id) list = list.filter((r) => r.candidate_id === filters.candidate_id);
      return list;
    },
    async findById(id: string) { return getStore().candidateValuesProfiles.find((r) => r.id === id) ?? null; },
  },

  appointments: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.appointments.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.appointments.findById(id) ?? null; },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.appointments.create(data); },
  },

  staffSicknessRecords: {
    async findAll(filters?: { staff_id?: string }) {
      let list = db.staffSicknessRecords.getAll();
      if (filters?.staff_id) list = list.filter((r) => r.staff_id === filters.staff_id);
      return list;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.staffSicknessRecords.create(data); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) { return db.staffSicknessRecords.update(id, data); },
  },

  complaintOutcomeRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.complaintOutcomeRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.complaintOutcomeRecords.findById(id) ?? null; },
    async findByChild(childId: string) { return db.complaintOutcomeRecords.findByChild(childId); },
  },

  exploitationScreenings: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.exploitationScreenings.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.exploitationScreenings.findById(id) ?? null; },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.exploitationScreenings.create(data); },
  },

  independenceSkillsRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.independenceSkillsRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.independenceSkillsRecords.findById(id) ?? null; },
    async findByChild(childId: string) { return db.independenceSkillsRecords.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.independenceSkillsRecords.create(data); },
  },

  postIncidentReflections: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.postIncidentReflections.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.postIncidentReflections.findById(id) ?? null; },
    async findByChild(childId: string) { return db.postIncidentReflections.findByChild(childId); },
    async findByIncident(incidentId: string) { return db.postIncidentReflections.findByIncident(incidentId) ?? null; },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async append(r: any) { return db.postIncidentReflections.append(r); },
  },

  dentalRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.dentalRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.dentalRecords.findById(id) ?? null; },
    async findByChild(childId: string) { return db.dentalRecords.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.dentalRecords.create(data); },
  },

  behaviourSupportPlans: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.behaviourSupportPlans.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.behaviourSupportPlans.findById(id) ?? null; },
    async findByChild(childId: string) { return db.behaviourSupportPlans.findByChild(childId); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.behaviourSupportPlans.create(data); },
  },

  carePlans: {
    async findAll(filters?: { child_id?: string }) {
      let list = getStore().carePlans;
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return getStore().carePlans.find((r) => r.id === id) ?? null; },
  },

  camhsReferrals: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.camhsReferrals.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.camhsReferrals.findById(id) ?? null; },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.camhsReferrals.create(data); },
  },

  inductionRecords: {
    async findAll(filters?: { overall_status?: string }) {
      let list = db.inductionRecords.findAll();
      if (filters?.overall_status) list = list.filter((r) => r.overall_status === filters.overall_status);
      return list;
    },
    async findByStaff(staffId: string) { return db.inductionRecords.findByStaff(staffId) ?? null; },
    async findByStatus(status: string) { return db.inductionRecords.findByStatus(status); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(data: any) { return db.inductionRecords.create(data); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: any) { return db.inductionRecords.update(id, data); },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEMO-ONLY extensions — batch 3 (2026-08-02). Unblocks the single-gap
  // pure-read routes. Reads always in-memory until a Supabase table lands;
  // then swap the `if (sb())` branch in the block, routes stay unchanged.
  // ─────────────────────────────────────────────────────────────────────────

  admissionReferrals: {
    async findAll() { return db.admissionReferrals.getAll(); },
  },

  independencePathways: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.independencePathways.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.independencePathways.findByChild(childId); },
  },

  cornerstoneEvents: {
    async findAll() { return db.cornerstoneEvents.findAll(); },
  },

  welfareCheckRounds: {
    async findAll() { return db.welfareCheckRounds.findAll(); },
  },

  uploadedDocuments: {
    async findAll() { return db.uploadedDocuments.findAll(); },
  },

  pathwayPlans: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.pathwayPlans.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.pathwayPlans.findByChild(childId); },
  },

  aspirationRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.aspirationRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.aspirationRecords.findByChild(childId); },
  },

  escalationDecisions: {
    async findAll() { return db.escalationDecisions.findAll(); },
  },

  contactPlans: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.contactPlans.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.contactPlans.findByChild(childId); },
  },

  healthRecordEntries: {
    async findAll() { return db.healthRecordEntries.getAll(); },
  },

  homePolicies: {
    async findAll() { return db.homePolicies.getAll(); },
  },

  ladoReferrals: {
    async findAll() { return db.ladoReferrals.findAll(); },
  },

  dolRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.dolRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.dolRecords.findByChild(childId); },
  },

  pepRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.pepRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.pepRecords.findByChild(childId); },
  },

  selfEvaluationAreas: {
    async findAll() { return db.selfEvaluationAreas.findAll(); },
  },

  visitors: {
    async findAll() { return db.visitors.findAll(); },
  },

  conditionalOffers: {
    async findAll() { return db.conditionalOffers.findAll(); },
  },

  developmentPlans: {
    async findAll() { return db.developmentPlans.findAll(); },
  },

  activities: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.activities.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.activities.findByChild(childId); },
  },

  audits: {
    async findAll() { return db.audits.findAll(); },
  },

  appraisals: {
    async findAll() { return db.appraisals.findAll(); },
  },

  whistleblowingRecords: {
    async findAll() { return db.whistleblowingRecords.getAll(); },
  },

  contextualSafeguardingRisks: {
    async findAll() { return db.contextualSafeguardingRisks.findAll(); },
  },

  absenceTracking: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.absenceTracking.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.absenceTracking.findByChild(childId); },
  },

  localityRisks: {
    async findAll() { return db.localityRisks.findAll(); },
  },

  fireDrills: {
    async findAll() { return db.fireDrills.findAll(); },
  },

  houseMeetings: {
    async findAll() { return db.houseMeetings.findAll(); },
  },

  traumaTherapyLogs: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.traumaTherapyLogs.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.traumaTherapyLogs.findByChild(childId); },
  },

  sleepLog: {
    async findAll() { return db.sleepLog.findAll(); },
  },

  belongingsRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.belongingsRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.belongingsRecords.findByChild(childId); },
  },

  lessonsLearned: {
    async findAll() { return db.lessonsLearned.findAll(); },
  },

  therapeuticInputRecords: {
    async findAll() { return db.therapeuticInputRecords.getAll(); },
  },

  significantEvents: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.significantEvents.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.significantEvents.findByChild(childId); },
  },

  staffDisciplinaryRecords: {
    async findAll() { return db.staffDisciplinaryRecords.getAll(); },
  },

  qualityOfCareReviews: {
    async findAll() { return db.qualityOfCareReviews.getAll(); },
  },

  disclosures: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.disclosures.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.disclosures.findByChild(childId); },
  },

  caraPracticeAssessments: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.caraPracticeAssessments.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.caraPracticeAssessments.findByChild(childId); },
  },

  timeSaved: {
    async findAll() { return getStore().timeSaved; },
  },

  integrityHealEvents: {
    async findAll() { return getStore().integrityHealEvents; },
  },

  caraIncidentSessions: {
    async findAll() { return getStore().caraIncidentSessions; },
  },

  askCaraAuditEvents: {
    async findAll() { return getStore().askCaraAuditEvents; },
  },

  shiftPatterns: {
    async findAll() { return getStore().shiftPatterns; },
    // DEMO-ONLY CRUD via whole-array replace (mirrors rota/patterns exactly).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async create(pattern: any) {
      const s = getStore() as any;
      s.shiftPatterns = [...(s.shiftPatterns ?? []), pattern];
      return pattern;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, pattern: any) {
      const s = getStore() as any;
      const list = (s.shiftPatterns ?? []) as any[];
      s.shiftPatterns = list.map((p) => (p.id === id ? pattern : p));
      return pattern;
    },
    async remove(id: string) {
      const s = getStore() as any;
      const list = (s.shiftPatterns ?? []) as any[];
      s.shiftPatterns = list.filter((p) => p.id !== id);
    },
  },

  waterHygieneRecords: {
    async findAll() { return db.waterHygieneRecords.getAll(); },
  },

  fireEquipmentChecks: {
    async findAll() { return db.fireEquipmentChecks.findAll(); },
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
