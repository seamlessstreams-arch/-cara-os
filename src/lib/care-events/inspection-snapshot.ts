// ══════════════════════════════════════════════════════════════════════════════
// CARA — Inspection Snapshot Bundle  (Milestone 30)
//
// Generates a single immutable point-in-time bundle of every live signal an
// inspector or Responsible Individual would ask for. Stateless: each call
// captures the current state from the live engines and returns a self-
// contained payload that can be downloaded as evidence.
//
// CLAUDE.md: "allow managers to generate a point-in-time Annex A inspection
//            snapshot" + the broader inspection-readiness dashboard.
//
// Read-only. Compose-only — does not call any mutating engine.
// ══════════════════════════════════════════════════════════════════════════════

import { computeInspectionReadiness, type InspectionReadinessReport } from "./inspection-readiness";
import { loadFilingCabinetIndex, type FilingCabinetIndex } from "./filing-cabinet-index";
import { loadRoutingHealth, type RoutingHealthSummary } from "./routing-health";
import { loadJobQueueStatus, type JobQueueStatus } from "./job-queue-status";
import { loadOversightInbox, type OversightSummary } from "./oversight-inbox";
import { loadManagerVerifyQueue, type ManagerVerifyQueue } from "./manager-verify-queue";
import { loadReturnedRecordsQueue, type ReturnedRecordsSummary } from "./returned-records";
import { loadNotifications, type NotificationStream } from "./notifications";
import { loadSavedTimeDashboard, type SavedTimeDashboard } from "./saved-time-dashboard";
import { db } from "@/lib/db/store";
import type { PersistedInspectionSnapshot } from "@/lib/db/store";

export interface InspectionSnapshotHeadline {
  readiness_score: number;
  readiness_severity: InspectionReadinessReport["severity"];
  filing_total: number;
  filing_unverified_pct: number;
  oversight_total: number;
  oversight_critical: number;
  manager_verify_total: number;
  manager_verify_critical: number;
  manager_verify_sensitive: number;
  returned_total: number;
  returned_safeguarding_sensitive: number;
  notifications_total: number;
  notifications_critical: number;
  routing_failed_routes: number;
  routing_failed_jobs: number;
  jobs_health: JobQueueStatus["health"];
  jobs_failures: number;
  saved_time_hours_30d: number;
  saved_time_hours_all_time: number;
  open_reg40_triages: number;
  ai_draft_reg45_evidence: number;
  pending_annex_a_evidence: number;
}

export interface InspectionSnapshot {
  id: string;                      // deterministic per home + generated_at
  home_id: string;
  generated_at: string;
  generated_by: string | null;
  schema_version: 1;
  headline: InspectionSnapshotHeadline;
  readiness: InspectionReadinessReport;
  filing_cabinet: FilingCabinetIndex;
  routing_health: RoutingHealthSummary;
  job_queue: JobQueueStatus;
  oversight_inbox: OversightSummary;
  manager_verify_queue: ManagerVerifyQueue;
  returned_records: ReturnedRecordsSummary;
  notifications: NotificationStream;
  saved_time: SavedTimeDashboard;
}

export interface InspectionSnapshotOptions {
  generatedBy?: string | null;
}

export function generateInspectionSnapshot(
  homeId: string,
  opts: InspectionSnapshotOptions = {},
): InspectionSnapshot {
  const generated_at = new Date().toISOString();

  const readiness            = computeInspectionReadiness(homeId);
  const filing_cabinet       = loadFilingCabinetIndex(homeId);
  const routing_health       = loadRoutingHealth(homeId);
  const job_queue            = loadJobQueueStatus(homeId);
  const oversight_inbox      = loadOversightInbox(homeId);
  const manager_verify_queue = loadManagerVerifyQueue(homeId);
  const returned_records     = loadReturnedRecordsQueue(homeId);
  const notifications        = loadNotifications(homeId);
  const saved_time           = loadSavedTimeDashboard(homeId);

  const reg40_open = db.caraReg40Triages
    .findAll(homeId)
    .filter((t) => t.status === "pending").length;

  const reg45_ai_draft = db.caraReg45EvidenceItems
    .findAll(homeId)
    .filter((r) => r.status === "ai_draft").length;

  const annex_pending = db.annexAEvidenceQueue
    .findAll()
    .filter((a) => a.home_id === homeId && a.manager_decision === "pending").length;

  const jobs_failures =
    job_queue.jobs_by_status.failed +
    job_queue.jobs_by_status.retry_required +
    job_queue.routes_by_status.failed +
    job_queue.routes_by_status.retry_required;

  const headline: InspectionSnapshotHeadline = {
    readiness_score: readiness.overall_score,
    readiness_severity: readiness.severity,
    filing_total: filing_cabinet.total,
    filing_unverified_pct: filing_cabinet.unverified_pct,
    oversight_total: oversight_inbox.total,
    oversight_critical: oversight_inbox.by_priority.critical,
    manager_verify_total: manager_verify_queue.total,
    manager_verify_critical: manager_verify_queue.by_priority.critical,
    manager_verify_sensitive: manager_verify_queue.sensitive_count,
    returned_total: returned_records.total,
    returned_safeguarding_sensitive: returned_records.safeguarding_sensitive_count,
    notifications_total: notifications.total,
    notifications_critical: notifications.by_severity.critical,
    routing_failed_routes: routing_health.failed_route_count,
    routing_failed_jobs: routing_health.failed_job_count,
    jobs_health: job_queue.health,
    jobs_failures,
    saved_time_hours_30d: saved_time.last_30_days.total_hours,
    saved_time_hours_all_time: saved_time.all_time.total_hours,
    open_reg40_triages: reg40_open,
    ai_draft_reg45_evidence: reg45_ai_draft,
    pending_annex_a_evidence: annex_pending,
  };

  const id = `snap_${homeId}_${generated_at.replace(/[:.]/g, "")}`;

  return {
    id,
    home_id: homeId,
    generated_at,
    generated_by: opts.generatedBy ?? null,
    schema_version: 1,
    headline,
    readiness,
    filing_cabinet,
    routing_health,
    job_queue,
    oversight_inbox,
    manager_verify_queue,
    returned_records,
    notifications,
    saved_time,
  };
}

// ── Persistence (M31) ────────────────────────────────────────────────────────
//
// Snapshots are immutable evidence. Once persisted they are never modified.
// The id is deterministic per home + generated_at so re-saving the same
// snapshot is a no-op. Read APIs surface them in newest-first order.

export interface PersistedSnapshotRow {
  id: string;
  home_id: string;
  generated_at: string;
  generated_by: string | null;
  schema_version: number;
  readiness_score: number;
  readiness_severity: string;
}

export function persistInspectionSnapshot(snap: InspectionSnapshot): PersistedInspectionSnapshot {
  const row: PersistedInspectionSnapshot = {
    id: snap.id,
    home_id: snap.home_id,
    generated_at: snap.generated_at,
    generated_by: snap.generated_by,
    schema_version: snap.schema_version,
    readiness_score: snap.headline.readiness_score,
    readiness_severity: snap.headline.readiness_severity,
    payload: snap,
  };
  return db.inspectionSnapshots.create(row);
}

export function listPersistedSnapshots(homeId: string): PersistedSnapshotRow[] {
  return db.inspectionSnapshots
    .findAll(homeId)
    .map(({ payload: _payload, ...row }) => row)
    .sort((a, b) => b.generated_at.localeCompare(a.generated_at));
}

export function getPersistedSnapshot(id: string): PersistedInspectionSnapshot | null {
  return db.inspectionSnapshots.findById(id);
}

