// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGEMENT OVERSIGHT ENGINE · Cara Intelligence
//
// Deterministic, evidence-backed context: the child's lived experience, recent
// context, pattern analysis, professional curiosity and the therapeutic-model
// lens (PACE etc.). No API calls — these are explainable considerations the
// manager weighs, never decisions Cara makes.
// ══════════════════════════════════════════════════════════════════════════════

import type { OversightInput, TherapeuticModel } from "./types";

export interface CaraIntelligenceFindings {
  livedExperienceConsiderations: string[];
  patternFindings: string[];
  professionalCuriosityFindings: string[];
  therapeuticTags: string[];
}

export function buildCaraIntelligence(input: OversightInput): CaraIntelligenceFindings {
  const out: CaraIntelligenceFindings = {
    livedExperienceConsiderations: [],
    patternFindings: [],
    professionalCuriosityFindings: [],
    therapeuticTags: [],
  };

  // ── Lived experience ──────────────────────────────────────────────────────
  const cc = input.childContext;
  if (cc) {
    if (cc.livedExperienceSummary) {
      out.livedExperienceConsiderations.push(`The child's lived experience has been considered: ${cc.livedExperienceSummary}`);
    }
    if ((cc.knownTriggers ?? []).length) {
      out.livedExperienceConsiderations.push(`Known triggers were considered: ${cc.knownTriggers!.join(", ")}.`);
    }
    if ((cc.knownCalmingStrategies ?? []).length) {
      out.livedExperienceConsiderations.push(`The child's calming strategies were considered: ${cc.knownCalmingStrategies!.join(", ")}.`);
    }
    if ((cc.communicationNeeds ?? []).length || (cc.sensoryNeeds ?? []).length) {
      const needs = [...(cc.communicationNeeds ?? []), ...(cc.sensoryNeeds ?? [])];
      out.livedExperienceConsiderations.push(`Communication / sensory needs were considered: ${needs.join(", ")}.`);
    }
    if ((cc.equalityIdentityNeeds ?? []).length) {
      out.livedExperienceConsiderations.push(`Equality and identity needs were considered: ${cc.equalityIdentityNeeds!.join(", ")}.`);
    }
    if ((cc.strengths ?? []).length) {
      out.livedExperienceConsiderations.push(`The child's strengths were recognised: ${cc.strengths!.join(", ")}.`);
    }
  }

  // ── Recent context ────────────────────────────────────────────────────────
  const rc = input.recentContext;
  if (rc) {
    const days = rc.timeframeDays ?? 30;
    const counts: string[] = [];
    if (rc.recentIncidentsCount) counts.push(`${rc.recentIncidentsCount} incident(s)`);
    if (rc.recentMissingEpisodesCount) counts.push(`${rc.recentMissingEpisodesCount} missing episode(s)`);
    if (rc.recentPhysicalInterventionsCount) counts.push(`${rc.recentPhysicalInterventionsCount} physical intervention(s)`);
    if (rc.recentSafeguardingConcernsCount) counts.push(`${rc.recentSafeguardingConcernsCount} safeguarding concern(s)`);
    if (counts.length) {
      out.livedExperienceConsiderations.push(`Recent context (last ${days} days): ${counts.join(", ")}.`);
    }
    if (rc.recentContactImpact) {
      out.professionalCuriosityFindings.push(`Recent family contact may be relevant: ${rc.recentContactImpact}`);
    }
    if (rc.recentSleepPattern) out.professionalCuriosityFindings.push(`Recent sleep pattern may be relevant: ${rc.recentSleepPattern}`);
    if (rc.recentMoodPresentation) out.professionalCuriosityFindings.push(`Recent mood/presentation may be relevant: ${rc.recentMoodPresentation}`);
    if ((rc.recentWorriesRaisedByChild ?? []).length) {
      out.professionalCuriosityFindings.push(`The child has recently raised: ${rc.recentWorriesRaisedByChild!.join("; ")}.`);
    }
    if ((rc.recentPositiveProgress ?? []).length) {
      out.livedExperienceConsiderations.push(`Recent positive progress was noted: ${rc.recentPositiveProgress!.join("; ")}.`);
    }
  }

  // ── Pattern analysis ──────────────────────────────────────────────────────
  const pc = input.patternContext;
  if (pc) {
    const conf = pc.patternConfidence ?? "low";
    if ((pc.repeatedThemes ?? []).length) {
      out.patternFindings.push(`Repeated themes identified (${conf} confidence): ${pc.repeatedThemes!.join(", ")}.`);
    }
    if ((pc.possibleTriggers ?? []).length) {
      out.patternFindings.push(`Possible triggers across recent events: ${pc.possibleTriggers!.join(", ")}.`);
    }
    if (pc.timesOfDayPattern) out.patternFindings.push(`Time-of-day pattern: ${pc.timesOfDayPattern}.`);
    if (pc.locationPattern) out.patternFindings.push(`Location pattern: ${pc.locationPattern}.`);
    if (pc.peerPattern) out.patternFindings.push(`Peer pattern: ${pc.peerPattern}.`);
    if ((pc.deescalationSuccesses ?? []).length) {
      out.patternFindings.push(`What has helped before: ${pc.deescalationSuccesses!.join(", ")} — these should be reinforced.`);
    }
    if (pc.patternDirection && pc.patternDirection !== "unknown") {
      out.patternFindings.push(`Overall direction of travel appears ${pc.patternDirection}.`);
    }
  }
  if (input.repeatedPattern && !(pc?.repeatedThemes ?? []).length) {
    out.patternFindings.push("This event is part of a repeated pattern; pattern analysis should be reviewed to inform the plan.");
  }

  // ── Therapeutic model lens ────────────────────────────────────────────────
  out.therapeuticTags.push(...therapeuticTags(input.therapeuticModel));
  out.professionalCuriosityFindings.push(...therapeuticCuriosity(input.therapeuticModel, input));

  return out;
}

export function therapeuticTags(model: TherapeuticModel | undefined): string[] {
  switch (model) {
    case "PACE":
      return ["PACE", "trauma_informed", "relational_practice"];
    case "trauma_informed":
      return ["trauma_informed"];
    case "therapeutic_parenting":
      return ["therapeutic_parenting", "relational_practice"];
    case "attachment_based":
      return ["attachment_based", "relational_practice"];
    case "restorative":
      return ["restorative_practice"];
    case "positive_behaviour_support":
      return ["positive_behaviour_support"];
    default:
      return [];
  }
}

/** Professional wording the model invites managers to reflect on. */
export function therapeuticCuriosity(model: TherapeuticModel | undefined, input: OversightInput): string[] {
  if (model === "PACE") {
    const out = [
      "In line with PACE-informed practice, staff should remain curious about what this behaviour may be communicating rather than viewing it in isolation.",
      "Staff should respond with acceptance and empathy while maintaining clear, consistent boundaries; management oversight should ensure the response remained relational, proportionate and trauma-informed.",
    ];
    if (input.recordType === "incident" || input.recordType === "physical_intervention") {
      out.push("Curiosity (PACE): consider recent stressors, relationships, family time, education, health, sleep and transitions that may have contributed.");
    }
    return out;
  }
  if (model === "trauma_informed" || model === "therapeutic_parenting" || model === "attachment_based") {
    return [
      "A trauma-informed lens should be maintained: the response should be relational and proportionate, recognising the child may have felt scared, overwhelmed or unsafe.",
    ];
  }
  if (model === "restorative") {
    return ["A restorative approach should focus on repairing relationships and the child's understanding of impact, not punishment."];
  }
  if (model === "positive_behaviour_support") {
    return ["Positive Behaviour Support should focus on antecedents, function of behaviour and proactive strategies recorded in the plan."];
  }
  return [];
}
