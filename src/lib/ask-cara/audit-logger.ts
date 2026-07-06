// ══════════════════════════════════════════════════════════════════════════════
// CARA — ASK CARA AUDIT TRAIL (§21)
//
// Every Ask CARA interaction produces an audit event: who, role, home, mode,
// intent, task card, rule version, whether manager review is required, whether an
// external-AI declaration was involved, whether a prohibited request was
// triggered, and the deterministic-only state. Input/output are HASHED (SHA-256)
// — raw sensitive text is never stored in the audit log.
//
// Server-only (uses node:crypto). Pure builder — the route persists the result.
// ══════════════════════════════════════════════════════════════════════════════

import { createHash } from "crypto";

export const ASK_CARA_AUDIT_VERSION = "1.0.0";

export function hashText(text: string | undefined): string | undefined {
  if (!text) return undefined;
  return "sha256:" + createHash("sha256").update(text, "utf8").digest("hex").slice(0, 32);
}

export interface AuditEventInput {
  userId?: string;
  role?: string;
  homeId?: string;
  childId?: string;
  sessionId?: string;
  mode: string; // "ask"
  intent: string;
  taskCard?: string;
  inputText?: string; // hashed, never stored raw
  outputText?: string; // hashed, never stored raw
  ruleVersion?: string;
  sources?: string[];
  managerReviewRequired?: boolean;
  externalAiDeclared?: boolean;
  prohibitedTriggered?: boolean;
  deterministicOnly: boolean;
}

export interface AskCaraAuditEvent {
  id: string;
  userId?: string;
  role?: string;
  homeId?: string;
  childId?: string;
  sessionId?: string;
  mode: string;
  intent: string;
  taskCard?: string;
  inputHash?: string;
  outputHash?: string;
  ruleVersion?: string;
  sources?: string[];
  managerReviewRequired: boolean;
  externalAiDeclared: boolean;
  prohibitedTriggered: boolean;
  deterministicOnly: boolean;
  createdAt: string;
  version: string;
}

export function buildAuditEvent(input: AuditEventInput, meta: { id: string; createdAt: string }): AskCaraAuditEvent {
  return {
    id: meta.id,
    userId: input.userId,
    role: input.role,
    homeId: input.homeId,
    childId: input.childId,
    sessionId: input.sessionId,
    mode: input.mode,
    intent: input.intent,
    taskCard: input.taskCard,
    inputHash: hashText(input.inputText),
    outputHash: hashText(input.outputText),
    ruleVersion: input.ruleVersion,
    sources: input.sources,
    managerReviewRequired: !!input.managerReviewRequired,
    externalAiDeclared: !!input.externalAiDeclared,
    prohibitedTriggered: !!input.prohibitedTriggered,
    deterministicOnly: input.deterministicOnly,
    createdAt: meta.createdAt,
    version: ASK_CARA_AUDIT_VERSION,
  };
}
