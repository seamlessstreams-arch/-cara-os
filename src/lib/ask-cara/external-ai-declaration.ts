// ══════════════════════════════════════════════════════════════════════════════
// CARA — EXTERNAL-AI DECLARATION FLOW (§20)
//
// A non-punitive way for staff to declare they used an external AI tool. If they
// used it for anything beyond spelling/grammar, CARA flags the record for manager
// review and offers the safer CARA route (via the substitution matrix). Pure —
// the route persists; this builds and reviews the record.
// ══════════════════════════════════════════════════════════════════════════════

import { saferRouteForDeclaredTask } from "./shadow-ai-substitution-matrix";

export const EXTERNAL_AI_DECLARATION_VERSION = "1.0.0";

export type DeclarationType = "no" | "yes" | "not_sure" | "spelling_grammar_only";
export type ManagerReviewStatus = "not_required" | "pending" | "reviewed";
export type ReviewOutcome = "no_concern" | "guidance_given" | "record_reviewed" | "escalated";

export interface DeclarationInput {
  userId?: string;
  role?: string;
  homeId?: string;
  childId?: string;
  relatedRecordId?: string;
  toolName?: string;
  /** Free text: what they were trying to use the external tool for. */
  declaredTaskType?: string;
  confidentialDataEntered?: boolean;
  outputCopiedIntoCara?: boolean;
  explanation?: string;
  declarationType: DeclarationType;
}

export interface SaferRoute {
  message: string;
  routes: { engine: string; label: string; href?: string }[];
}

export interface ExternalAiDeclaration extends DeclarationInput {
  id: string;
  createdAt: string;
  managerReviewStatus: ManagerReviewStatus;
  saferCaraRoute?: SaferRoute;
  managerReviewedBy?: string;
  managerReviewedAt?: string;
  managerReviewNotes?: string;
  reviewOutcome?: ReviewOutcome;
  version: string;
}

/** Yes / not-sure needs a manager to check governance & safeguarding. */
function reviewRequired(type: DeclarationType): boolean {
  return type === "yes" || type === "not_sure";
}

export function buildDeclaration(input: DeclarationInput, meta: { id: string; createdAt: string }): ExternalAiDeclaration {
  const needsReview = reviewRequired(input.declarationType);
  let saferCaraRoute: SaferRoute | undefined;
  if (needsReview && input.declaredTaskType) {
    const match = saferRouteForDeclaredTask(input.declaredTaskType);
    if (match.matched && match.substitution) {
      saferCaraRoute = { message: match.substitution.saferMessage, routes: match.substitution.caraRoutes };
    }
  }
  return {
    ...input,
    id: meta.id,
    createdAt: meta.createdAt,
    managerReviewStatus: needsReview ? "pending" : "not_required",
    saferCaraRoute,
    version: EXTERNAL_AI_DECLARATION_VERSION,
  };
}

/** The supportive message shown back to the person declaring. */
export function declarationAcknowledgement(decl: ExternalAiDeclaration): string {
  if (decl.managerReviewStatus === "not_required") {
    return "Thanks for checking. That's fine — spelling and grammar support doesn't need a review. CARA can also do that for you locally next time.";
  }
  return "Thank you for declaring this — that takes integrity. A manager may review the related record to make sure information-governance and safeguarding expectations are met. Here's the safer CARA route for next time.";
}

export function reviewDeclaration(
  decl: ExternalAiDeclaration,
  review: { reviewedBy: string; outcome: ReviewOutcome; notes?: string; reviewedAt: string }
): ExternalAiDeclaration {
  return {
    ...decl,
    managerReviewStatus: "reviewed",
    managerReviewedBy: review.reviewedBy,
    managerReviewedAt: review.reviewedAt,
    managerReviewNotes: review.notes,
    reviewOutcome: review.outcome,
  };
}
