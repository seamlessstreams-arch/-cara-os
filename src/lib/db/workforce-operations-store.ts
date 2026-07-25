// ══════════════════════════════════════════════════════════════════════════════
// WORKFORCE & OPERATIONS DOMAIN STORE
//
// Phase 2 extraction: re-export wrapper for all workforce/operations collections
// from the main store. This maintains lazy coupling during the extraction phase.
// API routes continue to import from this module rather than directly from store.ts.
//
// No modifications to business logic — this is the re-export layer only.
// ══════════════════════════════════════════════════════════════════════════════

import { getStore } from './store';

/**
 * Getter that returns all workforce and operations domain collections.
 * Use this instead of importing directly from the main store.
 */
export const getWorkforceOperationsStore = () => {
  const store = getStore();
  return {
    // ── Supervision & HR ──────────────────────────────────────────────────────
    supervisions: store.supervisions,
    reflectiveSupervisions: store.reflectiveSupervisions,

    // ── Recruitment ──────────────────────────────────────────────────────────
    vacancies: store.vacancies,
    candidateProfiles: store.candidateProfiles,
    candidateChecks: store.candidateChecks,
    candidateReferences: store.candidateReferences,
    candidateInterviews: store.candidateInterviews,
    conditionalOffers: store.conditionalOffers,
    recruitmentAudit: store.recruitmentAudit,
    employmentHistory: store.employmentHistory,
    gapExplanations: store.gapExplanations,

    // ── Values Matching ───────────────────────────────────────────────────────
    employerValuesProfiles: store.employerValuesProfiles,
    candidateValuesProfiles: store.candidateValuesProfiles,

    // ── Staff Development & Competency ────────────────────────────────────────
    competencyProfiles: store.competencyProfiles,
    competencyScores: store.competencyScores,
    developmentPlans: store.developmentPlans,
    practiceObservations: store.practiceObservations,
    readinessReports: store.readinessReports,
    successionPlans: store.successionPlans,
    appraisals: store.appraisals,
    inductionRecords: store.inductionRecords,
    qualifications: store.qualifications,

    // ── Scheduling & Rota Management ──────────────────────────────────────────
    shiftPatterns: store.shiftPatterns,
    staffingPolicy: store.staffingPolicy,
    shiftCoverNotes: store.shiftCoverNotes,
    shiftLifecycleRecords: store.shiftLifecycleRecords,
    calendarEvents: store.calendarEvents,

    // ── Assets & Infrastructure ───────────────────────────────────────────────
    buildings: store.buildings,
    buildingChecks: store.buildingChecks,
    vehicles: store.vehicles,
    vehicleChecks: store.vehicleChecks,

    // ── Agency & External Workforce ───────────────────────────────────────────
    agencyInductions: store.agencyInductions,
    agencyStaffLog: store.agencyStaffLog,

    // ── Children/Young People PACE & Development ─────────────────────────────
    childPaceProfiles: store.childPaceProfiles,
  };
};

// ── Convenience type export ────────────────────────────────────────────────────
export type WorkforceOperationsStore = ReturnType<typeof getWorkforceOperationsStore>;
