// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Studio Engine
//
// Generates child-centred, therapeutic, and educational resources.
// Considers child age, communication style, trauma history, strengths,
// interests, and care plan goals.
//
// Preferred routing: Anthropic for warm, reflective content.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraStudioRequest,
  CaraStudioOutput,
  CaraStudioSessionType,
  CaraTaskRequest,
  CaraTaskResult,
} from "../core/types";
import { CaraModelRouter } from "../router/model-router";

// ── CaraStudioEngine ──────────────────────────────────────────────────────

export class CaraStudioEngine {
  private router: CaraModelRouter;

  constructor(router?: CaraModelRouter) {
    this.router = router ?? new CaraModelRouter();
  }

  /**
   * Generate a structured session plan or resource.
   */
  async generate(request: CaraStudioRequest): Promise<CaraStudioOutput> {
    const prompt = this.buildPrompt(request);
    const systemPrompt = this.buildSystemPrompt(request.type);

    const taskRequest: CaraTaskRequest = {
      taskType: this.mapSessionTypeToTaskType(request.type),
      userId: request.userId,
      userRole: request.userRole,
      organisationId: request.organisationId,
      homeId: request.homeId,
      childId: request.childId,
      staffId: request.staffId,
      prompt,
      systemPrompt,
      context: request.childContext,
      options: {
        preferredProvider: "anthropic",
        returnStructured: true,
        structuredSchema: STUDIO_OUTPUT_SCHEMA,
        temperature: 0.8,
        maxTokens: 4096,
      },
    };

    const result = await this.router.executeTask(taskRequest);

    return this.parseStudioOutput(result, request.type);
  }

  // ── Private Methods ─────────────────────────────────────────────────────

  private buildPrompt(request: CaraStudioRequest): string {
    const parts: string[] = [];

    parts.push(`Generate a ${getSessionTypeLabel(request.type)} plan.`);
    parts.push("");

    // Child context
    if (request.childContext) {
      const ctx = request.childContext;
      if (ctx.childAge) parts.push(`Child age: ${ctx.childAge} years`);
      if (ctx.childName) parts.push(`Child: ${ctx.childName}`);
      if (ctx.childCommunicationStyle) parts.push(`Communication style: ${ctx.childCommunicationStyle}`);
      if (ctx.childLearningNeeds?.length) parts.push(`Learning needs: ${ctx.childLearningNeeds.join(", ")}`);
      if (ctx.childStrengths?.length) parts.push(`Strengths: ${ctx.childStrengths.join(", ")}`);
      if (ctx.childInterests?.length) parts.push(`Interests: ${ctx.childInterests.join(", ")}`);
      if (ctx.knownTriggers?.length) parts.push(`Known triggers: ${ctx.knownTriggers.join(", ")}`);
      if (ctx.childRiskProfile) parts.push(`Risk profile: ${ctx.childRiskProfile}`);
      if (ctx.carePlanGoals?.length) parts.push(`Care plan goals: ${ctx.carePlanGoals.join(", ")}`);
      if (ctx.culturalIdentity) parts.push(`Cultural identity: ${ctx.culturalIdentity}`);
      if (ctx.trustedAdults?.length) parts.push(`Trusted adults: ${ctx.trustedAdults.join(", ")}`);
      if (ctx.recentIncidents?.length) parts.push(`Recent incidents: ${ctx.recentIncidents.join(", ")}`);
      if (ctx.safeguardingConcerns?.length) parts.push(`Safeguarding concerns: ${ctx.safeguardingConcerns.join(", ")}`);
      if (ctx.previousSessions?.length) parts.push(`Previous sessions: ${ctx.previousSessions.join("; ")}`);
    }

    parts.push("");

    if (request.focusArea) {
      parts.push(`Focus area: ${request.focusArea}`);
    }
    if (request.duration) {
      parts.push(`Duration: ${request.duration} minutes`);
    }
    if (request.additionalInstructions) {
      parts.push(`Additional guidance: ${request.additionalInstructions}`);
    }

    parts.push("");
    parts.push("Generate a complete, structured session plan including all fields in the schema.");
    parts.push("Ensure content is age-appropriate, trauma-informed, and strengths-based.");

    return parts.join("\n");
  }

  private buildSystemPrompt(type: CaraStudioSessionType): string {
    const base = [
      "You are Cara Studio — a therapeutic and educational resource generator for children's residential care.",
      "You create warm, child-centred, evidence-informed session plans and resources.",
      "",
      "Core principles:",
      "- Trauma-informed: never re-traumatise, build safety first",
      "- Strengths-based: lead with what the child can do",
      "- Age and stage appropriate: match developmental level",
      "- Relationship-centred: build on trusted connections",
      "- Culturally sensitive: respect identity and heritage",
      "- Therapeutic: purposeful, not just activity for activity's sake",
      "",
      "Always include:",
      "- Clear purpose linked to care plan outcomes",
      "- Preparation notes for the staff member",
      "- Risk considerations specific to this child",
      "- Adaptations for different circumstances",
      "- Recording prompts to capture progress",
      "",
    ];

    const typeGuidance = SESSION_TYPE_GUIDANCE[type];
    if (typeGuidance) {
      base.push(typeGuidance);
    }

    return base.join("\n");
  }

  private mapSessionTypeToTaskType(type: CaraStudioSessionType): any {
    switch (type) {
      case "keywork_session":
        return "keywork_session_plan";
      case "direct_work":
      case "therapeutic_activity":
      case "emotional_regulation":
      case "independence_skills":
      case "relationship_work":
      case "behaviour_support":
      case "restorative_conversation":
        return "direct_work_session";
      case "staff_briefing":
      case "shift_handover_briefing":
        return "staff_briefing";
      case "reflective_supervision":
        return "staff_supervision_reflection";
      case "training_pack":
        return "training_material_generation";
      default:
        return "creative_resource_generation";
    }
  }

  private parseStudioOutput(result: CaraTaskResult, type: CaraStudioSessionType): CaraStudioOutput {
    const parsed = result.structuredOutput ?? {};

    return {
      id: result.id,
      type,
      sessionTitle: (parsed.sessionTitle as string) ?? `${getSessionTypeLabel(type)} Session`,
      purpose: (parsed.purpose as string) ?? "",
      intendedOutcome: (parsed.intendedOutcome as string) ?? "",
      materialsNeeded: (parsed.materialsNeeded as string[]) ?? [],
      preparationNotes: (parsed.preparationNotes as string) ?? "",
      openingScript: (parsed.openingScript as string) ?? "",
      mainActivity: (parsed.mainActivity as string) ?? "",
      reflectiveQuestions: (parsed.reflectiveQuestions as string[]) ?? [],
      closingActivity: (parsed.closingActivity as string) ?? "",
      riskConsiderations: (parsed.riskConsiderations as string[]) ?? [],
      staffGuidance: (parsed.staffGuidance as string) ?? "",
      adaptations: (parsed.adaptations as string[]) ?? [],
      recordingPrompts: (parsed.recordingPrompts as string[]) ?? [],
      followUpActions: (parsed.followUpActions as string[]) ?? [],
      carePlanLinks: (parsed.carePlanLinks as string[]) ?? [],
      qualityStandardsMapping: (parsed.qualityStandardsMapping as string[]) ?? [],
      generatedAt: result.generatedAt,
      model: result.model,
      provider: result.provider,
      approvalStatus: result.approvalStatus,
    };
  }
}

// ── Schema ────────────────────────────────────────────────────────────────

const STUDIO_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    sessionTitle: { type: "string" },
    purpose: { type: "string" },
    intendedOutcome: { type: "string" },
    materialsNeeded: { type: "array", items: { type: "string" } },
    preparationNotes: { type: "string" },
    openingScript: { type: "string" },
    mainActivity: { type: "string" },
    reflectiveQuestions: { type: "array", items: { type: "string" } },
    closingActivity: { type: "string" },
    riskConsiderations: { type: "array", items: { type: "string" } },
    staffGuidance: { type: "string" },
    adaptations: { type: "array", items: { type: "string" } },
    recordingPrompts: { type: "array", items: { type: "string" } },
    followUpActions: { type: "array", items: { type: "string" } },
    carePlanLinks: { type: "array", items: { type: "string" } },
    qualityStandardsMapping: { type: "array", items: { type: "string" } },
  },
};

// ── Guidance ──────────────────────────────────────────────────────────────

const SESSION_TYPE_GUIDANCE: Partial<Record<CaraStudioSessionType, string>> = {
  keywork_session:
    "A keywork session builds the therapeutic relationship. " +
    "Include time for check-in, purposeful activity, and reflection. " +
    "Link to care plan outcomes.",
  direct_work:
    "Direct work uses activities to explore feelings, experiences, and understanding. " +
    "Use creative, non-directive approaches where possible.",
  emotional_regulation:
    "Focus on co-regulation first, self-regulation second. " +
    "Teach practical techniques appropriate to the child's age and stage. " +
    "Never punish emotional dysregulation.",
  missing_return_discussion:
    "This is a sensitive return conversation after a missing-from-care episode. " +
    "Prioritise the child's safety and emotional state. " +
    "Explore push/pull factors without blame. " +
    "Follow the Return Home Interview framework.",
  exploitation_awareness:
    "Age-appropriate exploration of exploitation risks. " +
    "Never blame the child. Build understanding of healthy relationships, " +
    "consent, and how to seek help. Use scenario-based discussion.",
  restorative_conversation:
    "Follow a restorative approach: what happened, who was affected, " +
    "what needs to happen to make things right. " +
    "Focus on repairing relationships, not punishment.",
  reflective_supervision:
    "Support staff reflection on practice. Use Kolb's cycle or Gibbs' model. " +
    "Explore emotional impact, challenge thinking, and identify development needs.",
};

// ── Helpers ───────────────────────────────────────────────────────────────

function getSessionTypeLabel(type: CaraStudioSessionType): string {
  const labels: Record<CaraStudioSessionType, string> = {
    keywork_session: "Keywork Session",
    direct_work: "Direct Work",
    social_story: "Social Story",
    flashcards: "Flashcards",
    therapeutic_activity: "Therapeutic Activity",
    emotional_regulation: "Emotional Regulation",
    independence_skills: "Independence Skills",
    missing_return_discussion: "Missing From Care Return Discussion",
    exploitation_awareness: "Exploitation Awareness",
    relationship_work: "Relationship Work",
    behaviour_support: "Behaviour Support",
    restorative_conversation: "Restorative Conversation",
    child_friendly_summary: "Child-Friendly Summary",
    visual_worksheet: "Visual Worksheet",
    training_pack: "Training Pack",
    reflective_supervision: "Reflective Supervision",
    shift_handover_briefing: "Shift Handover Briefing",
    staff_briefing: "Staff Briefing",
  };
  return labels[type];
}

export { getSessionTypeLabel };

// Singleton
export const caraStudioEngine = new CaraStudioEngine();
