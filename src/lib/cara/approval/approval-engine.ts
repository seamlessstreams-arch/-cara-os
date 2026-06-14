// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Human Approval Engine
//
// AI must never be treated as the legal decision-maker. All high-risk
// outputs require human review and approval before official use.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraApprovalRecord,
  CaraApprovalStatus,
  CaraTaskResult,
  CaraTaskType,
  CaraRole,
  CaraRiskLevel,
} from "../core/types";
import { TASKS_REQUIRING_APPROVAL } from "../core/constants";
import { CaraPermissionDeniedError } from "../core/errors";
import { canApprove, getMaxApprovalRisk } from "../rbac/ai-permissions";

// ── CaraApprovalEngine ────────────────────────────────────────────────────

export class CaraApprovalEngine {
  private approvals: Map<string, CaraApprovalRecord> = new Map();

  /**
   * Create an approval record from a task result.
   */
  createApprovalRecord(
    result: CaraTaskResult,
    organisationId: string,
    homeId?: string,
    childId?: string,
  ): CaraApprovalRecord {
    const record: CaraApprovalRecord = {
      id: crypto.randomUUID(),
      taskResultId: result.id,
      taskType: result.taskType,
      generatedByModel: result.model,
      provider: result.provider,
      riskLevel: result.riskLevel,
      sensitivityLevel: result.sensitivityLevel,
      promptHash: result.promptHash,
      redactionApplied: result.redactionApplied,
      status: "draft_ai_generated",
      generatedAt: result.generatedAt,
      organisationId,
      homeId,
      childId,
    };

    this.approvals.set(record.id, record);
    return record;
  }

  /**
   * Submit a draft for review.
   */
  submitForReview(approvalId: string, submittedBy: string): CaraApprovalRecord {
    const record = this.getRecord(approvalId);

    if (record.status !== "draft_ai_generated") {
      throw new Error(`Cannot submit: current status is '${record.status}'`);
    }

    record.status = "pending_review";
    this.approvals.set(approvalId, record);
    return record;
  }

  /**
   * Approve an AI output after human review.
   */
  approve(
    approvalId: string,
    reviewerUserId: string,
    reviewerRole: CaraRole,
    notes?: string,
  ): CaraApprovalRecord {
    const record = this.getRecord(approvalId);

    // Validate reviewer has permission to approve this task type
    if (!canApprove(reviewerRole, record.taskType)) {
      throw new CaraPermissionDeniedError(reviewerRole, `approve '${record.taskType}'`);
    }

    // Validate reviewer can approve at this risk level
    const maxRisk = getMaxApprovalRisk(reviewerRole);
    if (!canApproveRiskLevel(maxRisk, record.riskLevel)) {
      throw new CaraPermissionDeniedError(
        reviewerRole,
        `approve risk level '${record.riskLevel}' (max: '${maxRisk}')`,
      );
    }

    if (record.status !== "pending_review" && record.status !== "draft_ai_generated") {
      throw new Error(`Cannot approve: current status is '${record.status}'`);
    }

    record.status = "approved";
    record.reviewedBy = reviewerUserId;
    record.reviewedAt = new Date().toISOString();
    record.approvalNotes = notes;
    record.finalisedBy = reviewerUserId;
    record.finalisedAt = new Date().toISOString();

    this.approvals.set(approvalId, record);
    return record;
  }

  /**
   * Reject an AI output.
   */
  reject(
    approvalId: string,
    reviewerUserId: string,
    reviewerRole: CaraRole,
    reason: string,
  ): CaraApprovalRecord {
    const record = this.getRecord(approvalId);

    if (!canApprove(reviewerRole, record.taskType)) {
      throw new CaraPermissionDeniedError(reviewerRole, `review '${record.taskType}'`);
    }

    record.status = "rejected";
    record.reviewedBy = reviewerUserId;
    record.reviewedAt = new Date().toISOString();
    record.approvalNotes = reason;

    this.approvals.set(approvalId, record);
    return record;
  }

  /**
   * Mark as amended by human (human has edited the AI output).
   */
  markAmended(
    approvalId: string,
    amendedBy: string,
    notes?: string,
  ): CaraApprovalRecord {
    const record = this.getRecord(approvalId);

    record.status = "amended_by_human";
    record.reviewedBy = amendedBy;
    record.reviewedAt = new Date().toISOString();
    record.approvalNotes = notes ?? "Content amended by human reviewer";

    this.approvals.set(approvalId, record);
    return record;
  }

  /**
   * Archive an approval record.
   */
  archive(approvalId: string): CaraApprovalRecord {
    const record = this.getRecord(approvalId);
    record.status = "archived";
    this.approvals.set(approvalId, record);
    return record;
  }

  /**
   * Get pending approval queue for a specific role/home.
   */
  getPendingApprovals(filters?: {
    organisationId?: string;
    homeId?: string;
    taskType?: CaraTaskType;
    riskLevel?: CaraRiskLevel;
  }): CaraApprovalRecord[] {
    let results = Array.from(this.approvals.values()).filter(
      r => r.status === "pending_review" || r.status === "draft_ai_generated",
    );

    if (filters?.organisationId) {
      results = results.filter(r => r.organisationId === filters.organisationId);
    }
    if (filters?.homeId) {
      results = results.filter(r => r.homeId === filters.homeId);
    }
    if (filters?.taskType) {
      results = results.filter(r => r.taskType === filters.taskType);
    }
    if (filters?.riskLevel) {
      results = results.filter(r => r.riskLevel === filters.riskLevel);
    }

    return results.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  }

  /**
   * Check if a task type requires approval.
   */
  requiresApproval(taskType: CaraTaskType): boolean {
    return TASKS_REQUIRING_APPROVAL.includes(taskType);
  }

  /**
   * Get a record by ID.
   */
  getRecord(approvalId: string): CaraApprovalRecord {
    const record = this.approvals.get(approvalId);
    if (!record) {
      throw new Error(`Approval record '${approvalId}' not found`);
    }
    return record;
  }

  /**
   * Get approval history for audit.
   */
  getApprovalHistory(filters?: {
    organisationId?: string;
    homeId?: string;
    status?: CaraApprovalStatus;
    limit?: number;
  }): CaraApprovalRecord[] {
    let results = Array.from(this.approvals.values());

    if (filters?.organisationId) {
      results = results.filter(r => r.organisationId === filters.organisationId);
    }
    if (filters?.homeId) {
      results = results.filter(r => r.homeId === filters.homeId);
    }
    if (filters?.status) {
      results = results.filter(r => r.status === filters.status);
    }

    return results
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
      .slice(0, filters?.limit ?? 50);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

const RISK_ORDER: CaraRiskLevel[] = ["low", "medium", "high", "critical"];

function canApproveRiskLevel(maxRisk: CaraRiskLevel, targetRisk: CaraRiskLevel): boolean {
  return RISK_ORDER.indexOf(maxRisk) >= RISK_ORDER.indexOf(targetRisk);
}

// Singleton
export const caraApprovalEngine = new CaraApprovalEngine();
