import { z } from "zod";

export const CaraRoleModeSchema = z.enum([
  "practitioner",
  "senior",
  "deputy_manager",
  "registered_manager",
  "responsible_individual",
  "operations",
  "director",
  "commissioner",
  "ofsted_mock",
]);

export type CaraRoleMode = z.infer<typeof CaraRoleModeSchema>;

export const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const CaraEvidenceItemSchema = z.object({
  sourceTable: z.string(),
  sourceId: z.string().uuid(),
  sourceDate: z.string().optional(),
  sourceTitle: z.string().optional(),
  sourceExcerpt: z.string().min(1),
  sourceAuthorId: z.string().uuid().optional().nullable(),
  relevanceScore: z.number().min(0).max(100).default(0),
  evidenceType: z.string().default("record"),
  regulationRefs: z.array(z.string()).default([]),
  qualityStandardRefs: z.array(z.string()).default([]),
});

export type CaraEvidenceItem = z.infer<typeof CaraEvidenceItemSchema>;

export const CaraSuggestedUpdateSchema = z.object({
  targetTable: z.string(),
  targetId: z.string().uuid().optional().nullable(),
  updateType: z.enum(["create", "update", "review", "archive", "task", "notification"]),
  title: z.string(),
  rationale: z.string(),
  suggestedPayload: z.record(z.string(), z.any()).default({}),
  riskLevel: RiskLevelSchema.default("low"),
});

export type CaraSuggestedUpdate = z.infer<typeof CaraSuggestedUpdateSchema>;

export const CaraOutputSchema = z.object({
  answer: z.string(),
  executiveSummary: z.string().optional(),
  childVoiceProtected: z.boolean().default(true),
  confidence: z.number().min(0).max(100),
  safetyFlags: z.array(z.string()).default([]),
  evidenceUsed: z.array(CaraEvidenceItemSchema).default([]),
  suggestedUpdates: z.array(CaraSuggestedUpdateSchema).default([]),
  missingEvidence: z.array(z.string()).default([]),
  managementOversightRequired: z.boolean().default(false),
  regulatoryRefs: z.array(z.string()).default([]),
  qualityStandardRefs: z.array(z.string()).default([]),
  practicePrompts: z.array(z.string()).default([]),
  nextBestActions: z.array(
    z.object({
      title: z.string(),
      ownerRole: z.string(),
      duePriority: z.enum(["today", "this_week", "this_month", "monitor"]),
      rationale: z.string(),
    })
  ).default([]),
});

export type CaraOutput = z.infer<typeof CaraOutputSchema>;

export const CaraRequestSchema = z.object({
  homeId: z.string().uuid(),
  childId: z.string().uuid().optional().nullable(),
  roleMode: CaraRoleModeSchema.default("practitioner"),
  featureKey: z.string(),
  userQuestion: z.string().min(3),
  strictEvidenceMode: z.boolean().default(true),
  includeTherapeuticLens: z.boolean().default(true),
  includeOfstedLens: z.boolean().default(true),
  includeStaffDevelopmentLens: z.boolean().default(false),
});

export type CaraRequest = z.infer<typeof CaraRequestSchema>;
