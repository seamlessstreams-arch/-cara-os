// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Quality Assurance Engine
//
// Reviews records for quality, identifies gaps, and generates QA feedback.
// Checks for: missing detail, weak analysis, poor reflection, safeguarding
// gaps, missing voice of the child, and compliance concerns.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraQAReviewRequest,
  CaraQAReviewResult,
  CaraTaskRequest,
  CaraRiskLevel,
} from "../core/types";
import { CaraModelRouter } from "../router/model-router";

// ── QA Review Criteria ────────────────────────────────────────────────────

export const QA_CRITERIA = [
  "voice_of_child",
  "professional_analysis",
  "care_plan_links",
  "risk_assessment_links",
  "management_oversight",
  "follow_up_actions",
  "recording_quality",
  "timeliness",
  "safeguarding_awareness",
  "professional_curiosity",
  "evidence_base",
  "tone_and_language",
  "outcome_focus",
  "pattern_recognition",
  "diversity_and_identity",
] as const;

export type QACriterion = typeof QA_CRITERIA[number];

// ── CaraQualityAssuranceEngine ────────────────────────────────────────────

export class CaraQualityAssuranceEngine {
  private router: CaraModelRouter;

  constructor(router?: CaraModelRouter) {
    this.router = router ?? new CaraModelRouter();
  }

  /**
   * Review a record for quality.
   */
  async reviewRecord(request: CaraQAReviewRequest): Promise<CaraQAReviewResult> {
    const prompt = this.buildQAPrompt(request);
    const systemPrompt = this.buildSystemPrompt();

    const taskRequest: CaraTaskRequest = {
      taskType: "quality_assurance_review",
      userId: request.userId,
      userRole: request.userRole,
      organisationId: request.organisationId,
      homeId: request.homeId,
      childId: request.childId,
      prompt,
      systemPrompt,
      options: {
        preferredProvider: "anthropic",
        returnStructured: true,
        structuredSchema: QA_OUTPUT_SCHEMA,
        temperature: 0.5,
        maxTokens: 3000,
      },
    };

    const result = await this.router.executeTask(taskRequest);
    return this.parseQAOutput(result, request);
  }

  /**
   * Quick quality check without full AI review (rule-based).
   * Runs locally without external AI calls.
   */
  quickCheck(content: string, recordType: string): QuickQAResult {
    const issues: string[] = [];
    const strengths: string[] = [];
    let score = 100;

    // Check length
    if (content.length < 100) {
      issues.push("Record is very brief — may lack sufficient detail");
      score -= 20;
    }

    // Voice of the child
    const childVoicePatterns = /\b(said|told|expressed|felt|wanted|wished|asked|explained)\b/i;
    const directQuotes = /"[^"]+"/g;
    if (!childVoicePatterns.test(content) && !directQuotes.test(content)) {
      issues.push("No evidence of voice of the child in record");
      score -= 15;
    } else {
      strengths.push("Voice of the child included");
    }

    // Analysis vs description
    const analyticalWords = /\b(because|therefore|suggests|indicates|shows|demonstrates|reflects)\b/i;
    if (!analyticalWords.test(content)) {
      issues.push("Record appears descriptive rather than analytical");
      score -= 10;
    } else {
      strengths.push("Includes analytical language");
    }

    // Care plan reference
    const carePlanRef = /\b(care plan|placement plan|target|outcome|goal)\b/i;
    if (!carePlanRef.test(content)) {
      issues.push("No reference to care plan or outcomes");
      score -= 10;
    }

    // Follow-up actions
    const actionWords = /\b(action|follow.?up|next step|to do|will|plan to)\b/i;
    if (!actionWords.test(content)) {
      issues.push("No follow-up actions identified");
      score -= 10;
    } else {
      strengths.push("Follow-up actions noted");
    }

    // Professional curiosity
    const curiosityWords = /\b(wonder|curious|consider|explore|unclear|investigate)\b/i;
    if (curiosityWords.test(content)) {
      strengths.push("Evidence of professional curiosity");
    }

    // Judgemental language
    const judgementalWords = /\b(naughty|bad|lazy|manipulat|attention.?seeking|difficult child|challenging behaviour)\b/i;
    if (judgementalWords.test(content)) {
      issues.push("Potentially judgemental language detected");
      score -= 15;
    }

    // Safeguarding awareness
    if (recordType === "incident" || recordType === "daily_log") {
      const safeguardingRef = /\b(safeguard|concern|risk|welfare|protect)\b/i;
      if (!safeguardingRef.test(content) && content.length > 300) {
        issues.push("No safeguarding consideration evident");
        score -= 10;
      }
    }

    // Timeliness check (look for time references)
    const timeRef = /\b(\d{1,2}:\d{2}|am|pm|morning|afternoon|evening|night)\b/i;
    if (timeRef.test(content)) {
      strengths.push("Time references included");
    }

    return {
      score: Math.max(0, score),
      issues,
      strengths,
      escalationLevel: score < 40 ? "high" : score < 60 ? "medium" : "low",
    };
  }

  // ── Private Methods ─────────────────────────────────────────────────────

  private buildQAPrompt(request: CaraQAReviewRequest): string {
    return [
      `Review the following ${request.recordType} record for quality against best practice standards.`,
      "",
      `Record type: ${request.recordType}`,
      `Record ID: ${request.recordId}`,
      "",
      "--- RECORD CONTENT ---",
      request.recordContent,
      "--- END RECORD ---",
      "",
      "Assess against these criteria:",
      "1. Voice of the child — is the child's perspective captured?",
      "2. Professional analysis — is there thinking beyond description?",
      "3. Links to care plan — are outcomes referenced?",
      "4. Links to risk assessment — are risks considered?",
      "5. Management oversight — is there evidence of oversight?",
      "6. Follow-up actions — are next steps clear?",
      "7. Recording quality — is it clear, timely, factual?",
      "8. Safeguarding awareness — are concerns identified?",
      "9. Professional curiosity — is there probing/wondering?",
      "10. Evidence base — does it reference other records/patterns?",
      "11. Tone and language — is it non-judgemental, child-centred?",
      "",
      "Provide: qaScore (0-100), strengths, concerns, requiredActions,",
      "suggestedOversightNote, suggestedStaffFeedback, escalationLevel (low/medium/high/critical).",
    ].join("\n");
  }

  private buildSystemPrompt(): string {
    return [
      "You are a Quality Assurance reviewer for children's residential care records.",
      "You assess recording quality against Ofsted good practice standards, CHR 2015, and SCCIF.",
      "",
      "Be constructive and specific. Identify both strengths and areas for improvement.",
      "Do not use harsh or demotivating language — this is about improving practice.",
      "",
      "Key principles:",
      "- The voice of the child must be central",
      "- Records should be analytical, not just descriptive",
      "- Professional curiosity should be evident",
      "- Language should be non-judgemental and trauma-informed",
      "- Links to care plan outcomes strengthen records",
      "- Management oversight demonstrates accountability",
      "- Clear follow-up actions show progress tracking",
      "",
      "Escalation guide:",
      "- Low: Minor improvements needed, staff guidance sufficient",
      "- Medium: Significant gaps requiring team leader review",
      "- High: Serious concerns requiring manager intervention",
      "- Critical: Safeguarding gap or dangerous practice",
    ].join("\n");
  }

  private parseQAOutput(result: any, request: CaraQAReviewRequest): CaraQAReviewResult {
    const parsed = result.structuredOutput ?? {};

    return {
      id: result.id,
      recordId: request.recordId,
      qaScore: (parsed.qaScore as number) ?? 50,
      strengths: (parsed.strengths as string[]) ?? [],
      concerns: (parsed.concerns as string[]) ?? [],
      requiredActions: (parsed.requiredActions as string[]) ?? [],
      suggestedOversightNote: (parsed.suggestedOversightNote as string) ?? "",
      suggestedStaffFeedback: (parsed.suggestedStaffFeedback as string) ?? "",
      relatedEvidence: (parsed.relatedEvidence as string[]) ?? [],
      escalationLevel: (parsed.escalationLevel as CaraRiskLevel) ?? "low",
      escalationRecommendation: parsed.escalationRecommendation as string | undefined,
      dueDate: parsed.dueDate as string | undefined,
      responsiblePerson: parsed.responsiblePerson as string | undefined,
      generatedAt: result.generatedAt,
      model: result.model,
      approvalStatus: result.approvalStatus,
    };
  }
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface QuickQAResult {
  score: number;
  issues: string[];
  strengths: string[];
  escalationLevel: CaraRiskLevel;
}

// ── Schema ────────────────────────────────────────────────────────────────

const QA_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    qaScore: { type: "number", minimum: 0, maximum: 100 },
    strengths: { type: "array", items: { type: "string" } },
    concerns: { type: "array", items: { type: "string" } },
    requiredActions: { type: "array", items: { type: "string" } },
    suggestedOversightNote: { type: "string" },
    suggestedStaffFeedback: { type: "string" },
    relatedEvidence: { type: "array", items: { type: "string" } },
    escalationLevel: { type: "string", enum: ["low", "medium", "high", "critical"] },
    escalationRecommendation: { type: "string" },
  },
};

// Singleton
export const caraQAEngine = new CaraQualityAssuranceEngine();
