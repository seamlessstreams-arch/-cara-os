import { getStore } from './store';

/**
 * Evidence & Compliance domain re-export wrapper
 *
 * This lazy-coupled wrapper extracts all Evidence & Compliance collections
 * from the monolithic store during the extraction phase. It maintains
 * access patterns while the underlying store is gradually refactored.
 *
 * Phase 1 (this file): Re-export wrapper only — no imports changed yet.
 * Phase 2 (future): Migrate callers to this wrapper.
 * Phase 3 (future): Move collections to Supabase DAL.
 */

export const getEvidenceComplianceStore = () => {
  const store = getStore();
  return {
    // ── Care Events (live update routing system) ───────────────────────────────
    careEvents: store.careEvents,
    careEventRoutes: store.careEventRoutes,
    careEventJobs: store.careEventJobs,
    careEventAuditLog: store.careEventAuditLog,

    // ── Reg 45 & Annex A Evidence Queues ────────────────────────────────────────
    reg45EvidenceQueue: store.reg45EvidenceQueue,
    annexAEvidenceQueue: store.annexAEvidenceQueue,

    // ── Welfare Checks ──────────────────────────────────────────────────────────
    welfareChecks: store.welfareChecks,
    welfareCheckRounds: store.welfareCheckRounds,

    // ── Outcome Tracking ────────────────────────────────────────────────────────
    outcomeTargets: store.outcomeTargets,
    outcomeReviews: store.outcomeReviews,

    // ── Reg 44 Visitor Reports ──────────────────────────────────────────────────
    reg44VisitReports: store.reg44VisitReports,

    // ── Key Working Sessions ────────────────────────────────────────────────────
    keyWorkingSessions: store.keyWorkingSessions,

    // ── Education Records ───────────────────────────────────────────────────────
    educationRecords: store.educationRecords,

    // ── Risk Assessments ────────────────────────────────────────────────────────
    riskAssessments: store.riskAssessments,

    // ── LAC Reviews ─────────────────────────────────────────────────────────────
    lacReviews: store.lacReviews,

    // ── Behaviour Support Plans ──────────────────────────────────────────────────
    behaviourSupportPlans: store.behaviourSupportPlans,

    // ── Delegated Authority ──────────────────────────────────────────────────────
    delegatedAuthority: store.delegatedAuthority,

    // ── House Meetings ───────────────────────────────────────────────────────────
    houseMeetings: store.houseMeetings,

    // ── Sanctions & Rewards ──────────────────────────────────────────────────────
    sanctionRewards: store.sanctionRewards,

    // ── Young Person Feedback ───────────────────────────────────────────────────
    ypFeedback: store.ypFeedback,

    // ── Sleep Log ────────────────────────────────────────────────────────────────
    sleepLog: store.sleepLog,

    // ── Body Map ─────────────────────────────────────────────────────────────────
    bodyMap: store.bodyMap,

    // ── Activities ───────────────────────────────────────────────────────────────
    activities: store.activities,

    // ── Chronology ───────────────────────────────────────────────────────────────
    chronology: store.chronology,

    // ── Handovers ────────────────────────────────────────────────────────────────
    handovers: store.handovers,

    // ── Documents ────────────────────────────────────────────────────────────────
    documents: store.documents,
    documentReadReceipts: store.documentReadReceipts,

    // ── Expenses ─────────────────────────────────────────────────────────────────
    expenses: store.expenses,

    // ── Audits ───────────────────────────────────────────────────────────────────
    audits: store.audits,

    // ── Maintenance ──────────────────────────────────────────────────────────────
    maintenance: store.maintenance,

    // ── Uploaded Documents & Audit ──────────────────────────────────────────────
    uploadedDocuments: store.uploadedDocuments,
    documentAuditLog: store.documentAuditLog,

    // ── Compliments ──────────────────────────────────────────────────────────────
    compliments: store.compliments,

    // ── Visitors ─────────────────────────────────────────────────────────────────
    visitors: store.visitors,

    // ── Fire Drills ──────────────────────────────────────────────────────────────
    fireDrills: store.fireDrills,

    // ── Significant Events ───────────────────────────────────────────────────────
    significantEvents: store.significantEvents,
  };
};

// Export the entire Evidence & Compliance store as a single type for convenience
export type EvidenceComplianceStore = ReturnType<typeof getEvidenceComplianceStore>;
