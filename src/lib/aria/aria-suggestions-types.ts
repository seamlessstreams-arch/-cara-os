// ══════════════════════════════════════════════════════════════════════════════
// ARIA V1 — SUGGESTION TYPES
// Mirrors the schema in supabase/migrations/014_aria_suggestions.sql.
// ══════════════════════════════════════════════════════════════════════════════

export type AriaSuggestionType =
  | "management_oversight"
  | "risk_review"
  | "plan_review"
  | "behaviour_support_review"
  | "key_work"
  | "safeguarding_review"
  | "staff_debrief"
  | "notification"
  | "task"
  | "linked_record_review"
  | "handover_update"
  | "incident_analysis";

export type AriaSuggestionRiskLevel = "urgent" | "high" | "medium" | "low";

export type AriaSuggestionConfidence = "low" | "medium" | "high";

export type AriaSuggestionStatus =
  | "draft"
  | "awaiting_review"
  | "approved"
  | "amended_and_approved"
  | "rejected"
  | "no_action_required"
  | "committed"
  | "archived";

export type AriaSuggestionAuditAction =
  | "suggestion_created"
  | "suggestion_viewed"
  | "draft_generated"
  | "draft_edited"
  | "suggestion_approved"
  | "suggestion_rejected"
  | "suggestion_no_action"
  | "suggestion_committed"
  | "task_created"
  | "linked_records_suggested"
  | "ai_provider_called"
  | "mock_mode_used"
  | "error";

export type LinkedRecordType =
  | "child_profile"
  | "incident"
  | "risk_assessment"
  | "placement_plan"
  | "behaviour_support_plan"
  | "key_work"
  | "safeguarding"
  | "staff_debrief"
  | "management_oversight"
  | "notification"
  | "task";

export interface AriaSuggestion {
  id: string;
  organisationId?: string;
  homeId?: string;
  childId?: string;
  staffId?: string;
  relatedRecordType: string;
  relatedRecordId?: string;
  suggestionType: AriaSuggestionType;
  title: string;
  summary?: string;
  reason?: string;
  suggestedAction?: string;
  draftText?: string;
  finalText?: string;
  riskLevel: AriaSuggestionRiskLevel;
  confidenceLevel: AriaSuggestionConfidence;
  status: AriaSuggestionStatus;
  requiresApproval: boolean;
  reviewerRole?: string;
  createdBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  rejectedBy?: string;
  committedBy?: string;
  rejectionReason?: string;
  aiProvider?: string;
  mockMode: boolean;
  createdAt: string;
  reviewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  committedAt?: string;
  updatedAt: string;
  linkedRecords?: AriaSuggestionLink[];
}

export interface AriaSuggestionLink {
  id: string;
  suggestionId: string;
  linkedRecordType: LinkedRecordType;
  linkedRecordId?: string;
  relationshipType?: string;
  reason?: string;
  suggestedAction?: string;
  riskLevel?: string;
  requiresApproval: boolean;
  createdAt: string;
}

export interface AriaSuggestionAuditEntry {
  id: string;
  organisationId?: string;
  homeId?: string;
  suggestionId?: string;
  actorUserId?: string;
  actorRole?: string;
  action: AriaSuggestionAuditAction;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface IncidentInput {
  incidentId: string;
  incidentType: string;
  severity: string;
  description: string;
  immediateAction?: string;
  childId?: string;
  staffId?: string;
  homeId?: string;
  organisationId?: string;
}
