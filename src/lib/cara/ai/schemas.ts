// ══════════════════════════════════════════════════════════════════════════════
// Cara REPORTS — ZOD VALIDATION SCHEMAS
//
// Validates every boundary crossing in the Cara Reports pipeline:
// inbound generation requests, AI-produced sections, challenge outputs,
// approval decisions, and suggested actions.
//
// All schemas derive from the canonical types in @/types/cara-reports so the
// type system and the runtime validator stay in sync.
// ══════════════════════════════════════════════════════════════════════════════

import { z } from "zod";
import {
  REPORT_TYPES,
  REPORT_AUDIENCES,
  EVIDENCE_STATUSES,
} from "@/types/cara-reports";

// ── Helpers ────────────────────────────────────────────────────────────────

const uuid = z.string().uuid();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date string");

// ── Report Generation Request ──────────────────────────────────────────────

export const reportGenerationRequestSchema = z.object({
  organisationId: uuid,
  homeId: uuid,
  childId: uuid,
  reportType: z.enum(REPORT_TYPES),
  audience: z.enum(REPORT_AUDIENCES),
  dateRangeStart: dateString,
  dateRangeEnd: dateString,
  requestedBy: z.string().min(1),
  includeSections: z.array(z.string()).optional(),
});

export type ReportGenerationRequestValidated = z.infer<typeof reportGenerationRequestSchema>;

// ── AI-Generated Section Output ────────────────────────────────────────────

export const reportSectionOutputSchema = z.object({
  sectionKey: z.string().min(1),
  sectionTitle: z.string().min(1),
  content: z.string().min(1),
  confidenceScore: z.number().min(0).max(100),
  evidenceStatus: z.enum(EVIDENCE_STATUSES),
  needsManagerReview: z.boolean(),
  evidenceIds: z.array(z.string()),
});

export type ReportSectionOutput = z.infer<typeof reportSectionOutputSchema>;

// ── Full AI Report Output ──────────────────────────────────────────────────

export const reportOutputSchema = z.object({
  summary: z.string().min(1),
  sections: z.array(reportSectionOutputSchema),
});

export type ReportOutput = z.infer<typeof reportOutputSchema>;

// ── Challenge Mode Output ──────────────────────────────────────────────────

export const challengeOutputSchema = z.object({
  challenges: z.array(
    z.object({
      type: z.string().min(1),
      severity: z.string().min(1),
      message: z.string().min(1),
      sectionKey: z.string().optional(),
      suggestion: z.string().optional(),
    }),
  ),
});

export type ChallengeOutput = z.infer<typeof challengeOutputSchema>;

// ── Approval Request ───────────────────────────────────────────────────────

export const approvalRequestSchema = z.object({
  reportId: uuid,
  decision: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
  reviewNote: z.string().optional(),
});

export type ApprovalRequest = z.infer<typeof approvalRequestSchema>;

// ── Suggested Action ───────────────────────────────────────────────────────

export const suggestedActionSchema = z.object({
  actionTitle: z.string().min(1),
  actionDescription: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
});

export type SuggestedAction = z.infer<typeof suggestedActionSchema>;
