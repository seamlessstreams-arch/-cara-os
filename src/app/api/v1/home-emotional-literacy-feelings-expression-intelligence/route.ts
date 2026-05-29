// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME EMOTIONAL LITERACY & FEELINGS EXPRESSION INTELLIGENCE API ROUTE
// GET /api/v1/home-emotional-literacy-feelings-expression-intelligence
// Cross-domain composite: emotionIdentificationRecords + feelingsVocabularyRecords +
// expressionToolRecords + therapeuticJournalRecords + staffAttunementRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeEmotionalLiteracyFeelingsExpression,
  type EmotionIdentificationInput,
  type FeelingsVocabularyInput,
  type ExpressionToolInput,
  type TherapeuticJournalInput,
  type StaffAttunementInput,
} from "@/lib/engines/home-emotional-literacy-feelings-expression-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    // ── Emotion Identification Records ──────────────────────────────────
    const rawIdRecords = (store.emotionIdentificationRecords ?? []) as any[];
    const emotion_identification_records: EmotionIdentificationInput[] = rawIdRecords.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      assessment_date: (r.assessment_date ?? today).toString(),
      assessor_id: r.assessor_id ?? "",
      emotions_presented: r.emotions_presented ?? 0,
      emotions_correctly_identified: r.emotions_correctly_identified ?? 0,
      baseline_score: r.baseline_score ?? 1,
      current_score: r.current_score ?? 1,
      method: r.method ?? "observation",
      child_engaged: !!r.child_engaged,
      child_enjoyed: !!r.child_enjoyed,
      nuanced_emotions_identified: !!r.nuanced_emotions_identified,
      context_understanding: !!r.context_understanding,
      self_recognition: !!r.self_recognition,
      empathy_demonstrated: !!r.empathy_demonstrated,
      progress_since_last: r.progress_since_last ?? "first_assessment",
      created_at: (r.created_at ?? today).toString(),
    }));

    // ── Feelings Vocabulary Records ─────────────────────────────────────
    const rawVocabRecords = (store.feelingsVocabularyRecords ?? []) as any[];
    const feelings_vocabulary_records: FeelingsVocabularyInput[] = rawVocabRecords.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      assessment_date: (r.assessment_date ?? today).toString(),
      assessor_id: r.assessor_id ?? "",
      total_feeling_words_known: r.total_feeling_words_known ?? 0,
      new_words_since_last: r.new_words_since_last ?? 0,
      vocabulary_tier: r.vocabulary_tier ?? "basic",
      can_differentiate_similar: !!r.can_differentiate_similar,
      uses_feelings_spontaneously: !!r.uses_feelings_spontaneously,
      applies_in_context: !!r.applies_in_context,
      multilingual_expression: !!r.multilingual_expression,
      creative_expression: !!r.creative_expression,
      age_appropriate: !!r.age_appropriate,
      progress_since_last: r.progress_since_last ?? "first_assessment",
      created_at: (r.created_at ?? today).toString(),
    }));

    // ── Expression Tool Records ─────────────────────────────────────────
    const rawToolRecords = (store.expressionToolRecords ?? []) as any[];
    const expression_tool_records: ExpressionToolInput[] = rawToolRecords.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      tool_type: r.tool_type ?? "other",
      date_introduced: (r.date_introduced ?? today).toString(),
      date_last_used: r.date_last_used ?? null,
      times_used: r.times_used ?? 0,
      child_initiated_use: r.child_initiated_use ?? 0,
      effectiveness_rating: r.effectiveness_rating ?? 3,
      child_preference_rating: r.child_preference_rating ?? 3,
      staff_confidence_using: !!r.staff_confidence_using,
      accessible_to_child: !!r.accessible_to_child,
      culturally_appropriate: !!r.culturally_appropriate,
      adapted_for_needs: !!r.adapted_for_needs,
      created_at: (r.created_at ?? today).toString(),
    }));

    // ── Therapeutic Journal Records ─────────────────────────────────────
    const rawJournalRecords = (store.therapeuticJournalRecords ?? []) as any[];
    const therapeutic_journal_records: TherapeuticJournalInput[] = rawJournalRecords.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      entry_date: (r.entry_date ?? today).toString(),
      journal_type: r.journal_type ?? "written",
      emotions_expressed: Array.isArray(r.emotions_expressed) ? r.emotions_expressed : [],
      depth_rating: r.depth_rating ?? 3,
      child_initiated: !!r.child_initiated,
      staff_supported: !!r.staff_supported,
      staff_responded: !!r.staff_responded,
      response_timely: !!r.response_timely,
      therapeutic_value_rating: r.therapeutic_value_rating ?? 3,
      child_found_helpful: !!r.child_found_helpful,
      confidentiality_maintained: r.confidentiality_maintained !== false,
      linked_to_keywork: !!r.linked_to_keywork,
      created_at: (r.created_at ?? today).toString(),
    }));

    // ── Staff Attunement Records ────────────────────────────────────────
    const rawAttunementRecords = (store.staffAttunementRecords ?? []) as any[];
    const staff_attunement_records: StaffAttunementInput[] = rawAttunementRecords.map((r: any) => ({
      id: r.id ?? "",
      staff_id: r.staff_id ?? "",
      child_id: r.child_id ?? "",
      observation_date: (r.observation_date ?? today).toString(),
      observer_id: r.observer_id ?? "",
      recognised_emotional_state: !!r.recognised_emotional_state,
      responded_appropriately: !!r.responded_appropriately,
      used_emotional_language: !!r.used_emotional_language,
      validated_feelings: !!r.validated_feelings,
      offered_coping_strategy: !!r.offered_coping_strategy,
      followed_individual_plan: !!r.followed_individual_plan,
      co_regulation_effective: !!r.co_regulation_effective,
      missed_emotional_cues: !!r.missed_emotional_cues,
      repair_attempted_after_rupture: !!r.repair_attempted_after_rupture,
      training_completed: !!r.training_completed,
      confidence_rating: r.confidence_rating ?? 3,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeEmotionalLiteracyFeelingsExpression({
      today,
      total_children,
      emotion_identification_records,
      feelings_vocabulary_records,
      expression_tool_records,
      therapeutic_journal_records,
      staff_attunement_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
