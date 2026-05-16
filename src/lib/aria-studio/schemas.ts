// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — Zod Schemas
//
// Validation schemas for all API inputs.
// ══════════════════════════════════════════════════════════════════════════════

import { z } from "zod";
import { GENERATION_TYPES, TONES, AUDIENCES, STATUSES } from "./types";

// ── Generate Request ─────────────────────────────────────────────────────────

export const generateRequestSchema = z.object({
  childId: z.string().uuid().optional(),
  generationType: z.enum(GENERATION_TYPES),
  title: z.string().min(3).max(200),
  brief: z.string().min(10).max(2000),
  tone: z.enum(TONES).default("warm_professional"),
  audience: z.enum(AUDIENCES).default("staff"),
  additionalContext: z.string().max(3000).optional(),
});

export type GenerateRequestInput = z.infer<typeof generateRequestSchema>;

// ── Approve/Reject Request ───────────────────────────────────────────────────

export const approvalRequestSchema = z.object({
  generationId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(1000).optional(),
}).refine(
  (data) => data.action !== "reject" || (data.reason && data.reason.length >= 5),
  { message: "Rejection reason is required (min 5 characters)", path: ["reason"] }
);

export type ApprovalRequestInput = z.infer<typeof approvalRequestSchema>;

// ── Commit Request ───────────────────────────────────────────────────────────

export const commitRequestSchema = z.object({
  generationId: z.string().uuid(),
  targetType: z.string().min(1).max(100),
  targetId: z.string().uuid().optional(),
});

export type CommitRequestInput = z.infer<typeof commitRequestSchema>;

// ── Library Query ────────────────────────────────────────────────────────────

export const libraryQuerySchema = z.object({
  childId: z.string().uuid().optional(),
  generationType: z.enum(GENERATION_TYPES).optional(),
  status: z.enum(STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type LibraryQueryInput = z.infer<typeof libraryQuerySchema>;

// ── Profile Builder Input ────────────────────────────────────────────────────

export const profileBuildRequestSchema = z.object({
  childId: z.string().uuid(),
});
