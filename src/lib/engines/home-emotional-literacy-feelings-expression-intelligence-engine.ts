// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME EMOTIONAL LITERACY & FEELINGS EXPRESSION INTELLIGENCE ENGINE
// Measures emotional literacy development across the home — emotion identification
// skills, feelings vocabulary breadth, expression tool provision, therapeutic
// journaling engagement, and staff attunement to emotional needs.
// Tracks how well the home equips children with the language, tools, and
// confidence to identify, name, and express their emotions in healthy ways.
// Pure deterministic engine — no imports, no LLM, no external deps.
// Ofsted CHR 2015 Reg 5 (Engaging with the wider system of professionals),
// Reg 12 (Positive relationships), SCCIF Experiences & Progress.
// Store keys: emotionIdentificationRecords, feelingsVocabularyRecords,
//             expressionToolRecords, therapeuticJournalRecords,
//             staffAttunementRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface EmotionIdentificationInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessor_id: string;
  emotions_presented: number;          // total emotions shown/tested
  emotions_correctly_identified: number;
  baseline_score: number;              // 1-10
  current_score: number;               // 1-10
  method: "visual_cards" | "role_play" | "story_based" | "digital_tool" | "observation" | "other";
  child_engaged: boolean;
  child_enjoyed: boolean;
  nuanced_emotions_identified: boolean; // beyond basic happy/sad/angry
  context_understanding: boolean;       // understands why someone might feel X
  self_recognition: boolean;            // can identify own emotions
  empathy_demonstrated: boolean;        // recognises emotions in others
  progress_since_last: "improved" | "maintained" | "declined" | "first_assessment";
  created_at: string;
}

export interface FeelingsVocabularyInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessor_id: string;
  total_feeling_words_known: number;
  new_words_since_last: number;
  vocabulary_tier: "basic" | "intermediate" | "advanced" | "nuanced";
  can_differentiate_similar: boolean;   // e.g. sad vs disappointed vs grief
  uses_feelings_spontaneously: boolean; // uses vocabulary without prompting
  applies_in_context: boolean;          // uses correct words for situations
  multilingual_expression: boolean;     // can express feelings in heritage language
  creative_expression: boolean;         // uses art/music/writing to express
  age_appropriate: boolean;
  progress_since_last: "improved" | "maintained" | "declined" | "first_assessment";
  created_at: string;
}

export interface ExpressionToolInput {
  id: string;
  child_id: string;
  tool_type: "emotion_wheel" | "feelings_thermometer" | "mood_tracker" | "worry_box" | "calm_corner" | "art_therapy" | "music_therapy" | "sand_tray" | "puppets" | "social_stories" | "breathing_cards" | "body_map" | "digital_app" | "other";
  date_introduced: string;
  date_last_used: string | null;
  times_used: number;
  child_initiated_use: number;          // how many times child chose to use it
  effectiveness_rating: number;         // 1-5
  child_preference_rating: number;      // 1-5
  staff_confidence_using: boolean;
  accessible_to_child: boolean;         // can child access it independently
  culturally_appropriate: boolean;
  adapted_for_needs: boolean;           // adapted for SEND/developmental needs
  created_at: string;
}

export interface TherapeuticJournalInput {
  id: string;
  child_id: string;
  entry_date: string;
  journal_type: "written" | "drawn" | "digital" | "audio" | "photo" | "mixed_media" | "structured_prompt" | "free_form";
  emotions_expressed: string[];         // emotions identified in the entry
  depth_rating: number;                 // 1-5 how deeply child explored feelings
  child_initiated: boolean;
  staff_supported: boolean;
  staff_responded: boolean;             // staff acknowledged/responded to entry
  response_timely: boolean;             // staff responded within reasonable time
  therapeutic_value_rating: number;     // 1-5
  child_found_helpful: boolean;
  confidentiality_maintained: boolean;
  linked_to_keywork: boolean;           // discussed in keywork session
  created_at: string;
}

export interface StaffAttunementInput {
  id: string;
  staff_id: string;
  child_id: string;
  observation_date: string;
  observer_id: string;
  recognised_emotional_state: boolean;
  responded_appropriately: boolean;
  used_emotional_language: boolean;     // staff modelled feelings vocabulary
  validated_feelings: boolean;          // acknowledged child's emotions as valid
  offered_coping_strategy: boolean;
  followed_individual_plan: boolean;    // followed child's emotional support plan
  co_regulation_effective: boolean;     // helped child regulate
  missed_emotional_cues: boolean;       // failed to notice distress signals
  repair_attempted_after_rupture: boolean;
  training_completed: boolean;          // completed emotional literacy training
  confidence_rating: number;            // 1-5 staff confidence in emotional support
  created_at: string;
}

export interface EmotionalLiteracyInput {
  today: string;
  total_children: number;
  emotion_identification_records: EmotionIdentificationInput[];
  feelings_vocabulary_records: FeelingsVocabularyInput[];
  expression_tool_records: ExpressionToolInput[];
  therapeutic_journal_records: TherapeuticJournalInput[];
  staff_attunement_records: StaffAttunementInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type EmotionalLiteracyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface EmotionalLiteracyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface EmotionalLiteracyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface EmotionalLiteracyResult {
  emotional_literacy_rating: EmotionalLiteracyRating;
  emotional_literacy_score: number;
  headline: string;

  // ── Core rates ──
  emotion_identification_rate: number;
  vocabulary_breadth_rate: number;
  expression_tool_rate: number;
  journal_engagement_rate: number;
  staff_attunement_rate: number;
  child_progress_rate: number;

  // ── Supplementary metrics ──
  total_assessments: number;
  children_assessed: number;
  avg_identification_score: number;
  nuanced_emotion_rate: number;
  self_recognition_rate: number;
  empathy_rate: number;
  context_understanding_rate: number;

  avg_vocabulary_words: number;
  spontaneous_use_rate: number;
  creative_expression_rate: number;
  vocabulary_progress_rate: number;

  total_tools_available: number;
  unique_tool_types: number;
  child_initiated_tool_use_rate: number;
  tool_accessibility_rate: number;
  avg_tool_effectiveness: number;

  total_journal_entries: number;
  children_journaling: number;
  child_initiated_journal_rate: number;
  staff_response_rate: number;
  avg_journal_depth: number;
  journal_keywork_link_rate: number;

  total_attunement_observations: number;
  emotional_recognition_rate: number;
  appropriate_response_rate: number;
  validation_rate: number;
  co_regulation_rate: number;
  missed_cues_rate: number;
  repair_rate: number;
  staff_training_rate: number;

  strengths: string[];
  concerns: string[];
  recommendations: EmotionalLiteracyRecommendation[];
  insights: EmotionalLiteracyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): EmotionalLiteracyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 100) / 100;
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: EmotionalLiteracyRating,
  score: number,
  headline: string,
): EmotionalLiteracyResult {
  return {
    emotional_literacy_rating: rating,
    emotional_literacy_score: score,
    headline,
    emotion_identification_rate: 0,
    vocabulary_breadth_rate: 0,
    expression_tool_rate: 0,
    journal_engagement_rate: 0,
    staff_attunement_rate: 0,
    child_progress_rate: 0,
    total_assessments: 0,
    children_assessed: 0,
    avg_identification_score: 0,
    nuanced_emotion_rate: 0,
    self_recognition_rate: 0,
    empathy_rate: 0,
    context_understanding_rate: 0,
    avg_vocabulary_words: 0,
    spontaneous_use_rate: 0,
    creative_expression_rate: 0,
    vocabulary_progress_rate: 0,
    total_tools_available: 0,
    unique_tool_types: 0,
    child_initiated_tool_use_rate: 0,
    tool_accessibility_rate: 0,
    avg_tool_effectiveness: 0,
    total_journal_entries: 0,
    children_journaling: 0,
    child_initiated_journal_rate: 0,
    staff_response_rate: 0,
    avg_journal_depth: 0,
    journal_keywork_link_rate: 0,
    total_attunement_observations: 0,
    emotional_recognition_rate: 0,
    appropriate_response_rate: 0,
    validation_rate: 0,
    co_regulation_rate: 0,
    missed_cues_rate: 0,
    repair_rate: 0,
    staff_training_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPUTE FUNCTION
// ══════════════════════════════════════════════════════════════════════════════

export function computeEmotionalLiteracyFeelingsExpression(
  input: EmotionalLiteracyInput,
): EmotionalLiteracyResult {
  const {
    total_children,
    emotion_identification_records,
    feelings_vocabulary_records,
    expression_tool_records,
    therapeutic_journal_records,
    staff_attunement_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    emotion_identification_records.length === 0 &&
    feelings_vocabulary_records.length === 0 &&
    expression_tool_records.length === 0 &&
    therapeutic_journal_records.length === 0 &&
    staff_attunement_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess emotional literacy and feelings expression.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate/15 ────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No emotional literacy data recorded despite children on placement — emotional support practices require urgent attention.",
      ),
      concerns: [
        "No emotion identification, vocabulary, expression tool, journaling, or staff attunement records exist despite active placements — children's emotional literacy development cannot be evidenced.",
        "Without emotional literacy records, the home cannot demonstrate that children are being supported to understand and express their feelings as required under Reg 5 and Reg 12.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured emotion identification assessments for every child to establish baselines and track emotional literacy development over time.",
          urgency: "immediate",
          regulatory_ref: "Reg 5 — Engaging with professionals, Reg 12 — Positive relationships",
        },
        {
          rank: 2,
          recommendation:
            "Provide age-appropriate expression tools (emotion wheels, feelings thermometers, mood trackers) and ensure staff are trained to use them with children.",
          urgency: "immediate",
          regulatory_ref: "Reg 12 — Positive relationships, SCCIF Experiences & Progress",
        },
        {
          rank: 3,
          recommendation:
            "Introduce therapeutic journaling opportunities so children can explore and express their emotions in a supported, confidential environment.",
          urgency: "soon",
          regulatory_ref: "Reg 12 — Positive relationships",
        },
      ],
      insights: [
        {
          text: "The complete absence of emotional literacy records means Ofsted cannot verify that children are being supported to develop emotional language, identify their feelings, or express themselves safely. This represents a fundamental gap in Reg 12 positive relationships evidence.",
          severity: "critical",
        },
      ],
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // DOMAIN 1: Emotion Identification Metrics
  // ════════════════════════════════════════════════════════════════════════

  const totalIdRecords = emotion_identification_records.length;
  const childrenWithIdAssessment = new Set(
    emotion_identification_records.map((r) => r.child_id),
  ).size;

  // Identification rate: children assessed / total children
  const emotionIdentificationRate = pct(childrenWithIdAssessment, total_children);

  // Average identification score (current_score out of 10, scaled to %)
  const idScores = emotion_identification_records.map((r) => r.current_score);
  const avgIdScore = avg(idScores);

  // Correct identification rate across all assessments
  const totalPresented = emotion_identification_records.reduce((s, r) => s + r.emotions_presented, 0);
  const totalCorrect = emotion_identification_records.reduce((s, r) => s + r.emotions_correctly_identified, 0);
  const correctIdRate = pct(totalCorrect, totalPresented);

  // Nuanced emotion recognition
  const nuancedCount = emotion_identification_records.filter((r) => r.nuanced_emotions_identified).length;
  const nuancedRate = pct(nuancedCount, totalIdRecords);

  // Self-recognition
  const selfRecCount = emotion_identification_records.filter((r) => r.self_recognition).length;
  const selfRecognitionRate = pct(selfRecCount, totalIdRecords);

  // Empathy demonstrated
  const empathyCount = emotion_identification_records.filter((r) => r.empathy_demonstrated).length;
  const empathyRate = pct(empathyCount, totalIdRecords);

  // Context understanding
  const contextCount = emotion_identification_records.filter((r) => r.context_understanding).length;
  const contextRate = pct(contextCount, totalIdRecords);

  // Engagement rate
  const idEngagedCount = emotion_identification_records.filter((r) => r.child_engaged).length;
  const idEngagementRate = pct(idEngagedCount, totalIdRecords);

  // Progress tracking
  const idImproved = emotion_identification_records.filter((r) => r.progress_since_last === "improved").length;
  const idDeclined = emotion_identification_records.filter((r) => r.progress_since_last === "declined").length;
  const idNonFirst = emotion_identification_records.filter((r) => r.progress_since_last !== "first_assessment").length;
  const idProgressRate = pct(idImproved, idNonFirst);

  // ════════════════════════════════════════════════════════════════════════
  // DOMAIN 2: Feelings Vocabulary Metrics
  // ════════════════════════════════════════════════════════════════════════

  const totalVocabRecords = feelings_vocabulary_records.length;
  const childrenWithVocab = new Set(
    feelings_vocabulary_records.map((r) => r.child_id),
  ).size;

  // Vocabulary breadth rate: children with vocab assessment / total children
  const vocabularyBreadthRate = pct(childrenWithVocab, total_children);

  // Average words known
  const wordCounts = feelings_vocabulary_records.map((r) => r.total_feeling_words_known);
  const avgVocabWords = avg(wordCounts);

  // Tier distribution
  const advancedOrNuanced = feelings_vocabulary_records.filter(
    (r) => r.vocabulary_tier === "advanced" || r.vocabulary_tier === "nuanced",
  ).length;
  const advancedVocabRate = pct(advancedOrNuanced, totalVocabRecords);

  // Spontaneous use
  const spontaneousCount = feelings_vocabulary_records.filter((r) => r.uses_feelings_spontaneously).length;
  const spontaneousUseRate = pct(spontaneousCount, totalVocabRecords);

  // Creative expression
  const creativeCount = feelings_vocabulary_records.filter((r) => r.creative_expression).length;
  const creativeExpressionRate = pct(creativeCount, totalVocabRecords);

  // Can differentiate similar emotions
  const differentiateCount = feelings_vocabulary_records.filter((r) => r.can_differentiate_similar).length;
  const differentiateRate = pct(differentiateCount, totalVocabRecords);

  // Applies in context
  const appliesContextCount = feelings_vocabulary_records.filter((r) => r.applies_in_context).length;
  const appliesContextRate = pct(appliesContextCount, totalVocabRecords);

  // Age appropriate
  const ageAppropriateCount = feelings_vocabulary_records.filter((r) => r.age_appropriate).length;
  const ageAppropriateRate = pct(ageAppropriateCount, totalVocabRecords);

  // Progress
  const vocabImproved = feelings_vocabulary_records.filter((r) => r.progress_since_last === "improved").length;
  const vocabNonFirst = feelings_vocabulary_records.filter((r) => r.progress_since_last !== "first_assessment").length;
  const vocabProgressRate = pct(vocabImproved, vocabNonFirst);

  // Multilingual
  const multilingualCount = feelings_vocabulary_records.filter((r) => r.multilingual_expression).length;
  const multilingualRate = pct(multilingualCount, totalVocabRecords);

  // ════════════════════════════════════════════════════════════════════════
  // DOMAIN 3: Expression Tool Metrics
  // ════════════════════════════════════════════════════════════════════════

  const totalToolRecords = expression_tool_records.length;
  const childrenWithTools = new Set(
    expression_tool_records.map((r) => r.child_id),
  ).size;

  // Expression tool rate: children with tools / total children
  const expressionToolRate = pct(childrenWithTools, total_children);

  // Unique tool types in use
  const uniqueToolTypes = new Set(expression_tool_records.map((r) => r.tool_type)).size;

  // Child-initiated tool use
  const totalToolUses = expression_tool_records.reduce((s, r) => s + r.times_used, 0);
  const totalChildInitiated = expression_tool_records.reduce((s, r) => s + r.child_initiated_use, 0);
  const childInitiatedToolRate = pct(totalChildInitiated, totalToolUses);

  // Tool accessibility
  const accessibleTools = expression_tool_records.filter((r) => r.accessible_to_child).length;
  const toolAccessibilityRate = pct(accessibleTools, totalToolRecords);

  // Average effectiveness
  const toolEffectivenessScores = expression_tool_records.map((r) => r.effectiveness_rating);
  const avgToolEffectiveness = avg(toolEffectivenessScores);

  // Average child preference
  const toolPreferenceScores = expression_tool_records.map((r) => r.child_preference_rating);
  const avgToolPreference = avg(toolPreferenceScores);

  // Staff confidence
  const staffConfidentTools = expression_tool_records.filter((r) => r.staff_confidence_using).length;
  const staffToolConfidenceRate = pct(staffConfidentTools, totalToolRecords);

  // Culturally appropriate
  const culturallyAppropriateTools = expression_tool_records.filter((r) => r.culturally_appropriate).length;
  const culturallyAppropriateRate = pct(culturallyAppropriateTools, totalToolRecords);

  // Adapted for needs
  const adaptedTools = expression_tool_records.filter((r) => r.adapted_for_needs).length;
  const adaptedToolRate = pct(adaptedTools, totalToolRecords);

  // ════════════════════════════════════════════════════════════════════════
  // DOMAIN 4: Therapeutic Journaling Metrics
  // ════════════════════════════════════════════════════════════════════════

  const totalJournalEntries = therapeutic_journal_records.length;
  const childrenJournaling = new Set(
    therapeutic_journal_records.map((r) => r.child_id),
  ).size;

  // Journal engagement rate: children journaling / total children
  const journalEngagementRate = pct(childrenJournaling, total_children);

  // Child-initiated journaling
  const childInitiatedJournals = therapeutic_journal_records.filter((r) => r.child_initiated).length;
  const childInitiatedJournalRate = pct(childInitiatedJournals, totalJournalEntries);

  // Staff response rate
  const staffRespondedJournals = therapeutic_journal_records.filter((r) => r.staff_responded).length;
  const staffResponseRate = pct(staffRespondedJournals, totalJournalEntries);

  // Timely response rate
  const timelyResponses = therapeutic_journal_records.filter((r) => r.response_timely).length;
  const timelyResponseRate = pct(timelyResponses, totalJournalEntries);

  // Average journal depth
  const depthScores = therapeutic_journal_records.map((r) => r.depth_rating);
  const avgJournalDepth = avg(depthScores);

  // Therapeutic value
  const therapeuticValues = therapeutic_journal_records.map((r) => r.therapeutic_value_rating);
  const avgTherapeuticValue = avg(therapeuticValues);

  // Child found helpful
  const helpfulJournals = therapeutic_journal_records.filter((r) => r.child_found_helpful).length;
  const helpfulRate = pct(helpfulJournals, totalJournalEntries);

  // Linked to keywork
  const linkedToKeywork = therapeutic_journal_records.filter((r) => r.linked_to_keywork).length;
  const keyworkLinkRate = pct(linkedToKeywork, totalJournalEntries);

  // Confidentiality maintained
  const confidentialMaintained = therapeutic_journal_records.filter((r) => r.confidentiality_maintained).length;
  const confidentialityRate = pct(confidentialMaintained, totalJournalEntries);

  // Journal type diversity
  const journalTypes = new Set(therapeutic_journal_records.map((r) => r.journal_type)).size;

  // Average emotions per entry
  const totalEmotionsExpressed = therapeutic_journal_records.reduce(
    (s, r) => s + r.emotions_expressed.length,
    0,
  );
  const avgEmotionsPerEntry = totalJournalEntries > 0
    ? Math.round((totalEmotionsExpressed / totalJournalEntries) * 100) / 100
    : 0;

  // ════════════════════════════════════════════════════════════════════════
  // DOMAIN 5: Staff Attunement Metrics
  // ════════════════════════════════════════════════════════════════════════

  const totalAttunementObs = staff_attunement_records.length;
  const uniqueStaffObserved = new Set(
    staff_attunement_records.map((r) => r.staff_id),
  ).size;

  // Staff attunement rate (composite of key indicators)
  const recognisedCount = staff_attunement_records.filter((r) => r.recognised_emotional_state).length;
  const emotionalRecognitionRate = pct(recognisedCount, totalAttunementObs);

  const respondedAppropriately = staff_attunement_records.filter((r) => r.responded_appropriately).length;
  const appropriateResponseRate = pct(respondedAppropriately, totalAttunementObs);

  const usedEmotionalLanguage = staff_attunement_records.filter((r) => r.used_emotional_language).length;
  const emotionalLanguageRate = pct(usedEmotionalLanguage, totalAttunementObs);

  const validatedFeelings = staff_attunement_records.filter((r) => r.validated_feelings).length;
  const validationRate = pct(validatedFeelings, totalAttunementObs);

  const offeredCoping = staff_attunement_records.filter((r) => r.offered_coping_strategy).length;
  const copingOfferRate = pct(offeredCoping, totalAttunementObs);

  const followedPlan = staff_attunement_records.filter((r) => r.followed_individual_plan).length;
  const planFollowRate = pct(followedPlan, totalAttunementObs);

  const coRegulationEffective = staff_attunement_records.filter((r) => r.co_regulation_effective).length;
  const coRegulationRate = pct(coRegulationEffective, totalAttunementObs);

  const missedCues = staff_attunement_records.filter((r) => r.missed_emotional_cues).length;
  const missedCuesRate = pct(missedCues, totalAttunementObs);

  const repairAttempted = staff_attunement_records.filter((r) => r.repair_attempted_after_rupture).length;
  const repairRate = pct(repairAttempted, totalAttunementObs);

  const trainingCompleted = staff_attunement_records.filter((r) => r.training_completed).length;
  const staffTrainingRate = pct(trainingCompleted, totalAttunementObs);

  const confidenceScores = staff_attunement_records.map((r) => r.confidence_rating);
  const avgStaffConfidence = avg(confidenceScores);

  // Composite staff attunement rate (weighted average of key indicators)
  const staffAttunementRate =
    totalAttunementObs > 0
      ? Math.round(
          (emotionalRecognitionRate * 0.25 +
            appropriateResponseRate * 0.25 +
            validationRate * 0.2 +
            coRegulationRate * 0.15 +
            emotionalLanguageRate * 0.15),
        )
      : 0;

  // ════════════════════════════════════════════════════════════════════════
  // DOMAIN 6: Child Progress Rate (composite)
  // ════════════════════════════════════════════════════════════════════════

  // Combine progress indicators across domains
  const progressIndicators: number[] = [];
  if (idNonFirst > 0) progressIndicators.push(idProgressRate);
  if (vocabNonFirst > 0) progressIndicators.push(vocabProgressRate);
  if (totalToolRecords > 0) progressIndicators.push(childInitiatedToolRate);
  if (totalJournalEntries > 0) progressIndicators.push(helpfulRate);

  const childProgressRate =
    progressIndicators.length > 0
      ? Math.round(progressIndicators.reduce((s, v) => s + v, 0) / progressIndicators.length)
      : 0;

  // ════════════════════════════════════════════════════════════════════════
  // SCORING: base = 52, max bonuses = +28, 4 penalties
  // ════════════════════════════════════════════════════════════════════════

  let score = 52;

  // --- Bonus 1: Emotion identification coverage (+5 / +3) ---
  if (emotionIdentificationRate >= 90) score += 5;
  else if (emotionIdentificationRate >= 70) score += 3;

  // --- Bonus 2: Vocabulary breadth coverage (+4 / +2) ---
  if (vocabularyBreadthRate >= 90) score += 4;
  else if (vocabularyBreadthRate >= 70) score += 2;

  // --- Bonus 3: Expression tool provision (+4 / +2) ---
  if (expressionToolRate >= 90) score += 4;
  else if (expressionToolRate >= 70) score += 2;

  // --- Bonus 4: Journal engagement (+4 / +2) ---
  if (journalEngagementRate >= 80) score += 4;
  else if (journalEngagementRate >= 60) score += 2;

  // --- Bonus 5: Staff attunement (+5 / +3) ---
  if (staffAttunementRate >= 85) score += 5;
  else if (staffAttunementRate >= 70) score += 3;

  // --- Bonus 6: Child progress rate (+3 / +1) ---
  if (childProgressRate >= 80) score += 3;
  else if (childProgressRate >= 60) score += 1;

  // --- Bonus 7: Self-recognition & empathy (+3 / +1) ---
  if (selfRecognitionRate >= 80 && empathyRate >= 80) score += 3;
  else if (selfRecognitionRate >= 60 || empathyRate >= 60) score += 1;

  // Max bonuses total: 5+4+4+4+5+3+3 = 28

  // ── Penalties (guarded by array.length > 0) ───────────────────────────

  // Penalty 1: Low identification coverage
  if (emotion_identification_records.length > 0 && emotionIdentificationRate < 40) {
    score -= 6;
  }

  // Penalty 2: Low staff attunement
  if (staff_attunement_records.length > 0 && staffAttunementRate < 50) {
    score -= 6;
  }

  // Penalty 3: High missed cues rate
  if (staff_attunement_records.length > 0 && missedCuesRate > 30) {
    score -= 4;
  }

  // Penalty 4: No expression tools despite children present
  if (expression_tool_records.length > 0 && expressionToolRate < 30) {
    score -= 4;
  }

  score = clamp(score, 0, 100);

  const emotional_literacy_rating = toRating(score);

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  // --- Emotion identification strengths ---
  if (emotionIdentificationRate >= 90 && totalIdRecords > 0) {
    strengths.push(
      `${emotionIdentificationRate}% of children have emotion identification assessments — excellent coverage ensuring every child's emotional literacy baseline is understood.`,
    );
  } else if (emotionIdentificationRate >= 70 && totalIdRecords > 0) {
    strengths.push(
      `${emotionIdentificationRate}% of children assessed for emotion identification — good coverage of emotional literacy baselines.`,
    );
  }

  if (nuancedRate >= 70 && totalIdRecords > 0) {
    strengths.push(
      `${nuancedRate}% of assessments show nuanced emotion recognition — children are moving beyond basic emotional categories to identify complex feelings.`,
    );
  }

  if (selfRecognitionRate >= 80 && totalIdRecords > 0) {
    strengths.push(
      `${selfRecognitionRate}% self-recognition rate — children can identify their own emotional states, a critical foundation for emotional regulation.`,
    );
  }

  if (empathyRate >= 80 && totalIdRecords > 0) {
    strengths.push(
      `${empathyRate}% empathy demonstration rate — children are recognising and responding to emotions in others, showing strong social-emotional development.`,
    );
  }

  if (contextRate >= 80 && totalIdRecords > 0) {
    strengths.push(
      `${contextRate}% context understanding rate — children understand why people feel certain emotions, demonstrating mature emotional reasoning.`,
    );
  }

  if (idEngagementRate >= 90 && totalIdRecords > 0) {
    strengths.push(
      `${idEngagementRate}% engagement in emotion identification activities — children are actively participating in their emotional literacy development.`,
    );
  }

  // --- Vocabulary strengths ---
  if (vocabularyBreadthRate >= 90 && totalVocabRecords > 0) {
    strengths.push(
      `${vocabularyBreadthRate}% of children have feelings vocabulary assessments — comprehensive tracking of emotional language development.`,
    );
  }

  if (spontaneousUseRate >= 70 && totalVocabRecords > 0) {
    strengths.push(
      `${spontaneousUseRate}% of children use feelings vocabulary spontaneously — emotional language is embedded in daily life, not just structured sessions.`,
    );
  }

  if (advancedVocabRate >= 50 && totalVocabRecords > 0) {
    strengths.push(
      `${advancedVocabRate}% of children at advanced or nuanced vocabulary tier — children are developing sophisticated emotional language.`,
    );
  }

  if (differentiateRate >= 70 && totalVocabRecords > 0) {
    strengths.push(
      `${differentiateRate}% can differentiate similar emotions — children distinguish between feelings like disappointment and sadness, showing depth of understanding.`,
    );
  }

  if (creativeExpressionRate >= 60 && totalVocabRecords > 0) {
    strengths.push(
      `${creativeExpressionRate}% use creative expression to communicate feelings — the home supports multiple pathways for emotional expression.`,
    );
  }

  if (multilingualRate > 0 && totalVocabRecords > 0) {
    strengths.push(
      `${multilingualRate}% express feelings in their heritage language — the home values cultural identity in emotional expression.`,
    );
  }

  // --- Expression tool strengths ---
  if (expressionToolRate >= 90 && totalToolRecords > 0) {
    strengths.push(
      `${expressionToolRate}% of children have access to expression tools — excellent provision of emotional expression resources.`,
    );
  }

  if (uniqueToolTypes >= 5) {
    strengths.push(
      `${uniqueToolTypes} different expression tool types available — children have diverse options for communicating their feelings.`,
    );
  }

  if (childInitiatedToolRate >= 50 && totalToolRecords > 0) {
    strengths.push(
      `${childInitiatedToolRate}% of tool use is child-initiated — children are independently choosing to use expression tools, showing genuine engagement.`,
    );
  }

  if (toolAccessibilityRate >= 90 && totalToolRecords > 0) {
    strengths.push(
      `${toolAccessibilityRate}% tool accessibility rate — expression tools are readily available for children to access independently.`,
    );
  }

  if (avgToolEffectiveness >= 4.0 && totalToolRecords > 0) {
    strengths.push(
      `Average tool effectiveness rating of ${avgToolEffectiveness}/5 — expression tools are making a meaningful difference in children's ability to communicate feelings.`,
    );
  }

  if (staffToolConfidenceRate >= 80 && totalToolRecords > 0) {
    strengths.push(
      `${staffToolConfidenceRate}% staff confidence in using expression tools — staff are well-equipped to support children's emotional expression.`,
    );
  }

  // --- Journaling strengths ---
  if (journalEngagementRate >= 80 && totalJournalEntries > 0) {
    strengths.push(
      `${journalEngagementRate}% of children engaged in therapeutic journaling — strong participation in reflective emotional expression.`,
    );
  }

  if (childInitiatedJournalRate >= 50 && totalJournalEntries > 0) {
    strengths.push(
      `${childInitiatedJournalRate}% of journal entries are child-initiated — children are proactively choosing to explore their emotions through journaling.`,
    );
  }

  if (staffResponseRate >= 80 && totalJournalEntries > 0) {
    strengths.push(
      `${staffResponseRate}% staff response rate to journal entries — children know their emotional expressions are read, valued, and acknowledged.`,
    );
  }

  if (avgJournalDepth >= 4.0 && totalJournalEntries > 0) {
    strengths.push(
      `Average journal depth rating of ${avgJournalDepth}/5 — children are exploring their emotions with genuine depth and reflection.`,
    );
  }

  if (keyworkLinkRate >= 70 && totalJournalEntries > 0) {
    strengths.push(
      `${keyworkLinkRate}% of journal entries linked to keywork sessions — emotional journaling is integrated into the therapeutic relationship.`,
    );
  }

  if (confidentialityRate >= 95 && totalJournalEntries > 0) {
    strengths.push(
      "Confidentiality maintained across virtually all journal entries — children can trust that their emotional expression is safe and private.",
    );
  }

  if (journalTypes >= 4) {
    strengths.push(
      `${journalTypes} different journaling formats available — children can choose how they express their emotions (written, drawn, digital, audio, and more).`,
    );
  }

  // --- Staff attunement strengths ---
  if (staffAttunementRate >= 85 && totalAttunementObs > 0) {
    strengths.push(
      `${staffAttunementRate}% composite staff attunement rate — staff consistently recognise, validate, and respond to children's emotional states.`,
    );
  }

  if (emotionalRecognitionRate >= 90 && totalAttunementObs > 0) {
    strengths.push(
      `${emotionalRecognitionRate}% emotional state recognition rate — staff are attuned to children's feelings and pick up on emotional cues.`,
    );
  }

  if (validationRate >= 85 && totalAttunementObs > 0) {
    strengths.push(
      `${validationRate}% feelings validation rate — staff consistently acknowledge children's emotions as valid, building emotional safety.`,
    );
  }

  if (coRegulationRate >= 80 && totalAttunementObs > 0) {
    strengths.push(
      `${coRegulationRate}% effective co-regulation rate — staff successfully help children regulate their emotions through attuned support.`,
    );
  }

  if (missedCuesRate <= 10 && totalAttunementObs > 0) {
    strengths.push(
      `Only ${missedCuesRate}% missed emotional cues — staff are highly attuned and rarely miss children's distress signals.`,
    );
  }

  if (emotionalLanguageRate >= 80 && totalAttunementObs > 0) {
    strengths.push(
      `${emotionalLanguageRate}% of staff model emotional language — children hear feelings vocabulary used naturally by the adults around them.`,
    );
  }

  if (staffTrainingRate >= 90 && totalAttunementObs > 0) {
    strengths.push(
      `${staffTrainingRate}% of observed staff have completed emotional literacy training — the team has strong foundational knowledge.`,
    );
  }

  if (repairRate >= 80 && totalAttunementObs > 0) {
    strengths.push(
      `${repairRate}% repair attempt rate after relational ruptures — staff model healthy emotional repair, teaching children that relationships can recover.`,
    );
  }

  // --- Progress strengths ---
  if (childProgressRate >= 80) {
    strengths.push(
      `${childProgressRate}% child progress rate across emotional literacy domains — children are demonstrably growing in their emotional capabilities.`,
    );
  }

  if (idProgressRate >= 80 && idNonFirst > 0) {
    strengths.push(
      `${idProgressRate}% of children showing improvement in emotion identification — targeted support is producing measurable outcomes.`,
    );
  }

  if (vocabProgressRate >= 80 && vocabNonFirst > 0) {
    strengths.push(
      `${vocabProgressRate}% of children expanding their feelings vocabulary — emotional language is growing over time.`,
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  const concerns: string[] = [];

  // --- Identification concerns ---
  if (emotionIdentificationRate < 40 && totalIdRecords > 0) {
    concerns.push(
      `Only ${emotionIdentificationRate}% of children have emotion identification assessments — the majority of children's emotional literacy baselines are unknown.`,
    );
  } else if (emotionIdentificationRate < 70 && emotionIdentificationRate >= 40 && totalIdRecords > 0) {
    concerns.push(
      `${emotionIdentificationRate}% emotion identification coverage — some children have not been assessed, limiting ability to track their emotional literacy development.`,
    );
  }

  if (totalIdRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No emotion identification assessments recorded — the home has no baseline data on children's ability to recognise and name emotions.",
    );
  }

  if (selfRecognitionRate < 40 && totalIdRecords > 0) {
    concerns.push(
      `Only ${selfRecognitionRate}% self-recognition rate — most children struggle to identify their own emotional states, limiting their ability to self-regulate.`,
    );
  }

  if (idDeclined > 0 && totalIdRecords > 0) {
    concerns.push(
      `${idDeclined} assessment${idDeclined !== 1 ? "s" : ""} show${idDeclined === 1 ? "s" : ""} declined emotion identification skills — some children are regressing and may need additional support.`,
    );
  }

  // --- Vocabulary concerns ---
  if (vocabularyBreadthRate < 40 && totalVocabRecords > 0) {
    concerns.push(
      `Only ${vocabularyBreadthRate}% of children have feelings vocabulary assessments — most children's emotional language development is not being tracked.`,
    );
  }

  if (totalVocabRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No feelings vocabulary assessments recorded — the home cannot evidence that children's emotional language is developing.",
    );
  }

  if (spontaneousUseRate < 30 && totalVocabRecords > 0) {
    concerns.push(
      `Only ${spontaneousUseRate}% of children use feelings vocabulary spontaneously — emotional language is not transferring to everyday situations.`,
    );
  }

  if (ageAppropriateRate < 60 && totalVocabRecords > 0) {
    concerns.push(
      `Only ${ageAppropriateRate}% of children at age-appropriate vocabulary level — many children's emotional language is below what would be expected for their age.`,
    );
  }

  // --- Expression tool concerns ---
  if (expressionToolRate < 30 && totalToolRecords > 0) {
    concerns.push(
      `Only ${expressionToolRate}% of children have access to expression tools — most children lack structured resources for communicating feelings.`,
    );
  } else if (expressionToolRate < 60 && expressionToolRate >= 30 && totalToolRecords > 0) {
    concerns.push(
      `${expressionToolRate}% expression tool coverage — not all children have access to tools that help them communicate their emotions.`,
    );
  }

  if (totalToolRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No expression tools recorded — the home is not providing structured resources for children to communicate their feelings.",
    );
  }

  if (toolAccessibilityRate < 50 && totalToolRecords > 0) {
    concerns.push(
      `Only ${toolAccessibilityRate}% of expression tools are accessible to children independently — tools exist but children cannot easily reach or use them.`,
    );
  }

  if (avgToolEffectiveness < 2.5 && totalToolRecords > 0) {
    concerns.push(
      `Average tool effectiveness only ${avgToolEffectiveness}/5 — the expression tools in use are not making a meaningful impact on children's ability to communicate feelings.`,
    );
  }

  if (staffToolConfidenceRate < 50 && totalToolRecords > 0) {
    concerns.push(
      `Only ${staffToolConfidenceRate}% staff confidence in using expression tools — staff may not be skilled enough to support children effectively with available resources.`,
    );
  }

  // --- Journaling concerns ---
  if (journalEngagementRate < 30 && totalJournalEntries > 0) {
    concerns.push(
      `Only ${journalEngagementRate}% of children engaged in therapeutic journaling — most children are missing this valuable channel for emotional expression.`,
    );
  }

  if (totalJournalEntries === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No therapeutic journal entries recorded — the home is not offering children structured opportunities for reflective emotional expression.",
    );
  }

  if (staffResponseRate < 50 && totalJournalEntries > 0) {
    concerns.push(
      `Only ${staffResponseRate}% staff response rate to journal entries — children who share their feelings through journaling are not consistently being acknowledged.`,
    );
  }

  if (confidentialityRate < 90 && totalJournalEntries > 0) {
    concerns.push(
      `Confidentiality maintained in only ${confidentialityRate}% of journal entries — breaches in journal confidentiality will undermine children's trust in emotional expression.`,
    );
  }

  if (avgJournalDepth < 2.5 && totalJournalEntries > 0) {
    concerns.push(
      `Average journal depth only ${avgJournalDepth}/5 — children are not exploring their emotions with sufficient depth, suggesting the journaling approach may need reviewing.`,
    );
  }

  // --- Staff attunement concerns ---
  if (staffAttunementRate < 50 && totalAttunementObs > 0) {
    concerns.push(
      `Composite staff attunement rate only ${staffAttunementRate}% — staff are not consistently recognising, validating, or responding to children's emotional states.`,
    );
  } else if (staffAttunementRate < 70 && staffAttunementRate >= 50 && totalAttunementObs > 0) {
    concerns.push(
      `Staff attunement rate at ${staffAttunementRate}% — while some staff show good emotional awareness, consistency across the team needs improvement.`,
    );
  }

  if (totalAttunementObs === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No staff attunement observations recorded — the home cannot evidence that staff are emotionally attuned to children's needs.",
    );
  }

  if (missedCuesRate > 30 && totalAttunementObs > 0) {
    concerns.push(
      `${missedCuesRate}% missed emotional cues — staff are frequently failing to notice when children are in distress, undermining emotional safety.`,
    );
  } else if (missedCuesRate > 15 && missedCuesRate <= 30 && totalAttunementObs > 0) {
    concerns.push(
      `${missedCuesRate}% missed emotional cues — some staff miss children's emotional signals, which can leave children feeling unnoticed.`,
    );
  }

  if (validationRate < 50 && totalAttunementObs > 0) {
    concerns.push(
      `Only ${validationRate}% feelings validation rate — children's emotions are frequently not being acknowledged as valid, which can suppress emotional expression.`,
    );
  }

  if (coRegulationRate < 50 && totalAttunementObs > 0) {
    concerns.push(
      `Only ${coRegulationRate}% effective co-regulation — staff are not consistently helping children manage their emotions, leaving children to cope alone.`,
    );
  }

  if (staffTrainingRate < 50 && totalAttunementObs > 0) {
    concerns.push(
      `Only ${staffTrainingRate}% of observed staff have completed emotional literacy training — insufficient training undermines the team's ability to support children's emotional development.`,
    );
  }

  if (repairRate < 40 && totalAttunementObs > 0) {
    concerns.push(
      `Only ${repairRate}% repair attempt rate after relational ruptures — unrepaired ruptures damage the staff-child relationship and children's sense of emotional safety.`,
    );
  }

  // --- Progress concerns ---
  if (childProgressRate < 30 && childProgressRate > 0) {
    concerns.push(
      `Only ${childProgressRate}% child progress rate — most children are not demonstrating improvement in emotional literacy, suggesting interventions may need reviewing.`,
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  const recommendations: EmotionalLiteracyRecommendation[] = [];
  let rank = 0;

  // --- Immediate ---

  if (totalIdRecords === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement emotion identification assessments for all children to establish baselines — without this data the home cannot evidence emotional literacy development under Reg 12.",
      urgency: "immediate",
      regulatory_ref: "Reg 12 — Positive relationships, SCCIF Experiences & Progress",
    });
  }

  if (emotionIdentificationRate < 40 && totalIdRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Urgently extend emotion identification assessments — only ${emotionIdentificationRate}% of children are assessed. Every child needs a baseline to track their emotional literacy journey.`,
      urgency: "immediate",
      regulatory_ref: "Reg 5 — Engaging with professionals, Reg 12 — Positive relationships",
    });
  }

  if (staffAttunementRate < 50 && totalAttunementObs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review staff emotional literacy training and practice — composite attunement is below 50%, meaning children's emotional needs are not being consistently met.",
      urgency: "immediate",
      regulatory_ref: "Reg 12 — Positive relationships, SCCIF Experiences & Progress",
    });
  }

  if (totalAttunementObs === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin structured observations of staff emotional attunement — the home has no evidence that staff recognise and respond to children's emotional states.",
      urgency: "immediate",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (missedCuesRate > 30 && totalAttunementObs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Address the ${missedCuesRate}% missed emotional cues rate through targeted training on recognising children's distress signals, non-verbal communication, and emotional regulation needs.`,
      urgency: "immediate",
      regulatory_ref: "Reg 12 — Positive relationships, Reg 5",
    });
  }

  if (totalToolRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide age-appropriate expression tools (emotion wheels, feelings thermometers, calm corners) so children have structured resources for communicating their feelings.",
      urgency: "immediate",
      regulatory_ref: "Reg 12 — Positive relationships, SCCIF Experiences & Progress",
    });
  }

  if (expressionToolRate < 30 && totalToolRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Urgently increase expression tool coverage — only ${expressionToolRate}% of children have access. Every child should have personalised tools to help them express emotions.`,
      urgency: "immediate",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (validationRate < 50 && totalAttunementObs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Train all staff in feelings validation — children whose emotions are not acknowledged as valid learn to suppress their feelings, which is harmful to emotional development.",
      urgency: "immediate",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  // --- Soon ---

  if (totalVocabRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Assess children's feelings vocabulary and establish a vocabulary development programme — emotional language is the foundation for therapeutic progress.",
      urgency: "soon",
      regulatory_ref: "Reg 12 — Positive relationships, SCCIF Experiences & Progress",
    });
  }

  if (vocabularyBreadthRate < 40 && totalVocabRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Extend vocabulary assessments to more children — only ${vocabularyBreadthRate}% assessed. Consider embedding feelings vocabulary into daily routines and keywork sessions.`,
      urgency: "soon",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (spontaneousUseRate < 30 && totalVocabRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Focus on transferring feelings vocabulary to everyday situations — children know the words but are not using them spontaneously. Model emotional language in daily interactions.",
      urgency: "soon",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (totalJournalEntries === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Introduce therapeutic journaling with age-appropriate formats (written, drawn, digital, audio) so children have a private channel for exploring and expressing emotions.",
      urgency: "soon",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (staffResponseRate < 50 && totalJournalEntries > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Improve staff response rate to journal entries (currently ${staffResponseRate}%) — children need to know their emotional expression is valued and acknowledged.`,
      urgency: "soon",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (toolAccessibilityRate < 50 && totalToolRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Improve tool accessibility — only ${toolAccessibilityRate}% of expression tools are accessible to children independently. Place tools in communal areas and children's rooms.`,
      urgency: "soon",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (staffToolConfidenceRate < 50 && totalToolRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Provide staff training on expression tools — only ${staffToolConfidenceRate}% of staff feel confident using them. Staff need practical skills to support children's emotional expression.`,
      urgency: "soon",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (staffTrainingRate < 50 && totalAttunementObs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Ensure all staff complete emotional literacy training — only ${staffTrainingRate}% have done so. This is foundational to supporting children's emotional development.`,
      urgency: "soon",
      regulatory_ref: "Reg 12 — Positive relationships, SCCIF Leadership & Management",
    });
  }

  if (coRegulationRate < 50 && totalAttunementObs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop staff co-regulation skills through training and practice supervision — children need attuned adults to help them manage overwhelming emotions.",
      urgency: "soon",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (repairRate < 40 && totalAttunementObs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Train staff in relational repair after ruptures — children need to see that relationships can recover from difficult moments, which builds emotional resilience.",
      urgency: "soon",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (selfRecognitionRate < 40 && totalIdRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop targeted interventions for self-recognition of emotions — use emotion check-ins, body scanning, and reflective activities to help children connect with their internal emotional states.",
      urgency: "soon",
      regulatory_ref: "Reg 12 — Positive relationships, SCCIF Experiences & Progress",
    });
  }

  // --- Planned ---

  if (emotionIdentificationRate >= 40 && emotionIdentificationRate < 70 && totalIdRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Extend emotion identification coverage from ${emotionIdentificationRate}% towards 90% — ensure all children have opportunities to develop emotional recognition skills.`,
      urgency: "planned",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (vocabularyBreadthRate >= 40 && vocabularyBreadthRate < 70 && totalVocabRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Expand vocabulary assessment coverage from ${vocabularyBreadthRate}% — integrate feelings vocabulary tracking into routine keywork sessions.`,
      urgency: "planned",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (journalEngagementRate < 60 && journalEngagementRate >= 30 && totalJournalEntries > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Increase journaling engagement from ${journalEngagementRate}% — offer diverse formats (art, digital, audio) and ensure children know journaling is available and confidential.`,
      urgency: "planned",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (keyworkLinkRate < 50 && totalJournalEntries > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Strengthen the link between journaling and keywork — only ${keyworkLinkRate}% of entries are discussed in keywork sessions. This integration deepens the therapeutic value.`,
      urgency: "planned",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (expressionToolRate >= 30 && expressionToolRate < 70 && totalToolRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Expand expression tool access from ${expressionToolRate}% towards full coverage — every child should have personalised tools matched to their developmental stage and preferences.`,
      urgency: "planned",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (uniqueToolTypes < 4 && totalToolRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Diversify the range of expression tools — currently ${uniqueToolTypes} type${uniqueToolTypes !== 1 ? "s" : ""} available. Consider adding emotion wheels, calm corners, art materials, digital apps, or social stories.`,
      urgency: "planned",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (staffAttunementRate >= 50 && staffAttunementRate < 70 && totalAttunementObs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Develop a structured staff attunement improvement plan — current composite rate of ${staffAttunementRate}% shows inconsistency that targeted practice supervision could address.`,
      urgency: "planned",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (emotionalLanguageRate < 60 && totalAttunementObs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Encourage staff to model emotional language more consistently — currently ${emotionalLanguageRate}%. Children learn feelings vocabulary by hearing adults name emotions naturally.`,
      urgency: "planned",
      regulatory_ref: "Reg 12 — Positive relationships",
    });
  }

  if (childProgressRate < 60 && childProgressRate >= 30) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review emotional literacy interventions where children are not progressing — consider whether approaches need adjusting, intensifying, or whether specialist input is required.",
      urgency: "planned",
      regulatory_ref: "Reg 5 — Engaging with professionals, Reg 12 — Positive relationships",
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  const insights: EmotionalLiteracyInsight[] = [];

  // -- Critical insights --

  if (totalIdRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No emotion identification assessments exist for any child. Ofsted expects the home to actively develop children's emotional literacy under Reg 12. Without baselines, no progress can be measured and no targeted support can be planned.",
      severity: "critical",
    });
  }

  if (emotionIdentificationRate < 40 && totalIdRecords > 0) {
    insights.push({
      text: `Only ${emotionIdentificationRate}% of children have emotion identification assessments. The majority of children's emotional literacy development is invisible to the home, making it impossible to demonstrate progress under SCCIF Experiences & Progress.`,
      severity: "critical",
    });
  }

  if (staffAttunementRate < 50 && totalAttunementObs > 0) {
    insights.push({
      text: `Composite staff attunement at ${staffAttunementRate}% means children are not consistently experiencing emotionally attuned care. Ofsted will view this as a failure to build positive relationships under Reg 12 — children need adults who notice, understand, and respond to their emotional world.`,
      severity: "critical",
    });
  }

  if (missedCuesRate > 30 && totalAttunementObs > 0) {
    insights.push({
      text: `Staff miss emotional cues ${missedCuesRate}% of the time. Children whose distress goes unnoticed learn that their feelings do not matter, which can lead to escalation, withdrawal, or emotional shutdown. This directly undermines Reg 12 positive relationships.`,
      severity: "critical",
    });
  }

  if (expressionToolRate < 30 && totalToolRecords > 0) {
    insights.push({
      text: `Only ${expressionToolRate}% of children have access to expression tools. Without structured ways to communicate feelings, children may resort to behaviour as their primary emotional outlet — increasing incidents and undermining placement stability.`,
      severity: "critical",
    });
  }

  if (validationRate < 50 && totalAttunementObs > 0) {
    insights.push({
      text: `Only ${validationRate}% feelings validation rate. When children's emotions are not acknowledged as valid, they learn to hide or suppress feelings. This is antithetical to emotional literacy development and may cause long-term harm.`,
      severity: "critical",
    });
  }

  if (confidentialityRate < 80 && totalJournalEntries > 0) {
    insights.push({
      text: `Confidentiality maintained in only ${confidentialityRate}% of journal entries. Breaches in journaling confidentiality will destroy children's trust in emotional expression and may cause them to shut down completely.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (emotionIdentificationRate >= 40 && emotionIdentificationRate < 70 && totalIdRecords > 0) {
    insights.push({
      text: `Emotion identification coverage at ${emotionIdentificationRate}% — improving but some children are still without assessments. Every child deserves a personalised emotional literacy plan based on their unique strengths and needs.`,
      severity: "warning",
    });
  }

  if (selfRecognitionRate >= 40 && selfRecognitionRate < 60 && totalIdRecords > 0) {
    insights.push({
      text: `Self-recognition at ${selfRecognitionRate}% — some children can identify their own emotions, but others are still disconnected from their internal emotional experience. Daily emotion check-ins could strengthen this skill.`,
      severity: "warning",
    });
  }

  if (selfRecognitionRate < 40 && totalIdRecords > 0) {
    insights.push({
      text: `Only ${selfRecognitionRate}% of children can identify their own emotions. Self-recognition is the foundation of emotional regulation — without it, children cannot begin to manage their feelings.`,
      severity: "warning",
    });
  }

  if (spontaneousUseRate >= 30 && spontaneousUseRate < 60 && totalVocabRecords > 0) {
    insights.push({
      text: `${spontaneousUseRate}% spontaneous vocabulary use — children know feelings words but do not consistently use them in everyday situations. Staff modelling and daily emotional check-ins can bridge this gap.`,
      severity: "warning",
    });
  }

  if (vocabularyBreadthRate >= 40 && vocabularyBreadthRate < 70 && totalVocabRecords > 0) {
    insights.push({
      text: `Vocabulary assessment coverage at ${vocabularyBreadthRate}% — not all children's emotional language development is being tracked. Embedding vocabulary tracking into keywork would improve coverage.`,
      severity: "warning",
    });
  }

  if (staffAttunementRate >= 50 && staffAttunementRate < 70 && totalAttunementObs > 0) {
    insights.push({
      text: `Staff attunement at ${staffAttunementRate}% — some staff show good emotional awareness but practice is inconsistent. Reflective supervision focused on emotional attunement could strengthen the whole team.`,
      severity: "warning",
    });
  }

  if (missedCuesRate > 15 && missedCuesRate <= 30 && totalAttunementObs > 0) {
    insights.push({
      text: `${missedCuesRate}% missed emotional cues. While not at critical levels, every missed cue represents a child whose emotional needs went unmet. Targeted observation skills training could reduce this.`,
      severity: "warning",
    });
  }

  if (staffResponseRate >= 50 && staffResponseRate < 80 && totalJournalEntries > 0) {
    insights.push({
      text: `Staff respond to ${staffResponseRate}% of journal entries. Consistent acknowledgement of children's written emotional expression is essential — unanswered journals signal that feelings do not matter.`,
      severity: "warning",
    });
  }

  if (journalEngagementRate >= 30 && journalEngagementRate < 60 && totalJournalEntries > 0) {
    insights.push({
      text: `${journalEngagementRate}% journaling engagement — some children are benefiting but others are missing out. Consider different formats (art, audio, digital) to engage children who may not connect with traditional written journaling.`,
      severity: "warning",
    });
  }

  if (expressionToolRate >= 30 && expressionToolRate < 70 && totalToolRecords > 0) {
    insights.push({
      text: `Expression tool coverage at ${expressionToolRate}% — not all children have personalised tools for emotional expression. Children without tools may lack healthy outlets for difficult feelings.`,
      severity: "warning",
    });
  }

  if (avgToolEffectiveness >= 2.5 && avgToolEffectiveness < 3.5 && totalToolRecords > 0) {
    insights.push({
      text: `Average tool effectiveness at ${avgToolEffectiveness}/5 — tools are having some impact but could be more effective. Review which tools work best for individual children and adjust provision.`,
      severity: "warning",
    });
  }

  if (childProgressRate >= 30 && childProgressRate < 60) {
    insights.push({
      text: `Child progress rate at ${childProgressRate}% — improvement is happening but not for all children. Individual review of children not progressing may identify barriers or need for specialist input.`,
      severity: "warning",
    });
  }

  if (coRegulationRate >= 50 && coRegulationRate < 70 && totalAttunementObs > 0) {
    insights.push({
      text: `Co-regulation effectiveness at ${coRegulationRate}% — staff sometimes help children regulate but not consistently. Strengthening co-regulation skills through practice supervision would benefit both staff and children.`,
      severity: "warning",
    });
  }

  if (staffTrainingRate >= 50 && staffTrainingRate < 80 && totalAttunementObs > 0) {
    insights.push({
      text: `${staffTrainingRate}% of staff have emotional literacy training — training gaps mean some staff lack foundational skills for supporting children's emotional development.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (emotional_literacy_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding emotional literacy practice — children are systematically supported to identify, name, and express their emotions through diverse tools, skilled staff, and integrated therapeutic approaches. This is strong evidence for Reg 12 positive relationships and SCCIF Experiences & Progress.",
      severity: "positive",
    });
  }

  if (emotionIdentificationRate >= 90 && nuancedRate >= 70 && totalIdRecords > 0) {
    insights.push({
      text: `${emotionIdentificationRate}% assessment coverage with ${nuancedRate}% nuanced recognition — children are developing sophisticated emotional awareness that goes beyond basic feelings. This depth of emotional literacy supports resilience and healthy relationships.`,
      severity: "positive",
    });
  }

  if (selfRecognitionRate >= 80 && empathyRate >= 80 && totalIdRecords > 0) {
    insights.push({
      text: `${selfRecognitionRate}% self-recognition and ${empathyRate}% empathy — children can both identify their own emotions and recognise feelings in others. This dual capability is fundamental to healthy social-emotional development.`,
      severity: "positive",
    });
  }

  if (staffAttunementRate >= 85 && totalAttunementObs > 0) {
    insights.push({
      text: `${staffAttunementRate}% composite staff attunement demonstrates that the team is deeply attuned to children's emotional worlds. Children experience consistent emotional responsiveness, which builds trust, security, and willingness to be vulnerable.`,
      severity: "positive",
    });
  }

  if (validationRate >= 85 && coRegulationRate >= 80 && totalAttunementObs > 0) {
    insights.push({
      text: `${validationRate}% validation with ${coRegulationRate}% effective co-regulation — children's feelings are consistently acknowledged and staff skilfully help children manage overwhelming emotions. This is outstanding relational practice.`,
      severity: "positive",
    });
  }

  if (spontaneousUseRate >= 70 && totalVocabRecords > 0) {
    insights.push({
      text: `${spontaneousUseRate}% spontaneous feelings vocabulary use — emotional language is embedded in the home's culture, not confined to structured sessions. Children naturally name and discuss their feelings in everyday conversations.`,
      severity: "positive",
    });
  }

  if (childInitiatedToolRate >= 50 && childInitiatedJournalRate >= 50 && totalToolRecords > 0 && totalJournalEntries > 0) {
    insights.push({
      text: `Children initiate ${childInitiatedToolRate}% of tool use and ${childInitiatedJournalRate}% of journal entries — children are taking ownership of their emotional expression, choosing to use resources independently rather than only when directed by staff.`,
      severity: "positive",
    });
  }

  if (avgJournalDepth >= 4.0 && helpfulRate >= 80 && totalJournalEntries > 0) {
    insights.push({
      text: `Journal depth averaging ${avgJournalDepth}/5 with ${helpfulRate}% of children finding journaling helpful — therapeutic journaling is a genuine tool for emotional processing, not just a recording exercise.`,
      severity: "positive",
    });
  }

  if (staffResponseRate >= 90 && keyworkLinkRate >= 70 && totalJournalEntries > 0) {
    insights.push({
      text: `${staffResponseRate}% staff response rate with ${keyworkLinkRate}% keywork integration — children's written emotional expression is consistently acknowledged and woven into their therapeutic relationship with their keyworker.`,
      severity: "positive",
    });
  }

  if (childProgressRate >= 80) {
    insights.push({
      text: `${childProgressRate}% child progress rate across emotional literacy domains — the home's approach is producing measurable improvement in children's emotional capabilities. This is strong SCCIF evidence of positive experiences and progress.`,
      severity: "positive",
    });
  }

  if (emotionalLanguageRate >= 80 && totalAttunementObs > 0) {
    insights.push({
      text: `${emotionalLanguageRate}% of staff model emotional language — children hear feelings vocabulary used naturally and consistently by the adults around them, creating an emotionally literate environment.`,
      severity: "positive",
    });
  }

  if (repairRate >= 80 && totalAttunementObs > 0) {
    insights.push({
      text: `${repairRate}% relational repair rate — staff consistently model healthy emotional recovery after difficult moments, teaching children that relationships can withstand conflict and be restored.`,
      severity: "positive",
    });
  }

  if (uniqueToolTypes >= 5 && toolAccessibilityRate >= 90 && totalToolRecords > 0) {
    insights.push({
      text: `${uniqueToolTypes} tool types with ${toolAccessibilityRate}% accessibility — the home offers a rich, accessible range of expression tools ensuring every child can find a pathway to communicate their feelings.`,
      severity: "positive",
    });
  }

  if (creativeExpressionRate >= 60 && multilingualRate > 0 && totalVocabRecords > 0) {
    insights.push({
      text: `${creativeExpressionRate}% creative expression and ${multilingualRate}% multilingual emotional expression — the home embraces diverse pathways for emotional communication, including cultural and creative approaches.`,
      severity: "positive",
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // HEADLINE
  // ════════════════════════════════════════════════════════════════════════

  let headline: string;

  if (emotional_literacy_rating === "outstanding") {
    headline =
      "Outstanding emotional literacy — children are expertly supported to identify, name, and express their feelings through diverse tools, attuned staff, and integrated therapeutic approaches.";
  } else if (emotional_literacy_rating === "good") {
    headline = `Good emotional literacy practice — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (emotional_literacy_rating === "adequate") {
    headline = `Adequate emotional literacy — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children can confidently identify and express their emotions.`;
  } else {
    headline = `Emotional literacy practice is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children develop essential emotional skills.`;
  }

  // ════════════════════════════════════════════════════════════════════════
  // RETURN
  // ════════════════════════════════════════════════════════════════════════

  return {
    emotional_literacy_rating,
    emotional_literacy_score: score,
    headline,

    emotion_identification_rate: emotionIdentificationRate,
    vocabulary_breadth_rate: vocabularyBreadthRate,
    expression_tool_rate: expressionToolRate,
    journal_engagement_rate: journalEngagementRate,
    staff_attunement_rate: staffAttunementRate,
    child_progress_rate: childProgressRate,

    total_assessments: totalIdRecords,
    children_assessed: childrenWithIdAssessment,
    avg_identification_score: avgIdScore,
    nuanced_emotion_rate: nuancedRate,
    self_recognition_rate: selfRecognitionRate,
    empathy_rate: empathyRate,
    context_understanding_rate: contextRate,

    avg_vocabulary_words: avgVocabWords,
    spontaneous_use_rate: spontaneousUseRate,
    creative_expression_rate: creativeExpressionRate,
    vocabulary_progress_rate: vocabProgressRate,

    total_tools_available: totalToolRecords,
    unique_tool_types: uniqueToolTypes,
    child_initiated_tool_use_rate: childInitiatedToolRate,
    tool_accessibility_rate: toolAccessibilityRate,
    avg_tool_effectiveness: avgToolEffectiveness,

    total_journal_entries: totalJournalEntries,
    children_journaling: childrenJournaling,
    child_initiated_journal_rate: childInitiatedJournalRate,
    staff_response_rate: staffResponseRate,
    avg_journal_depth: avgJournalDepth,
    journal_keywork_link_rate: keyworkLinkRate,

    total_attunement_observations: totalAttunementObs,
    emotional_recognition_rate: emotionalRecognitionRate,
    appropriate_response_rate: appropriateResponseRate,
    validation_rate: validationRate,
    co_regulation_rate: coRegulationRate,
    missed_cues_rate: missedCuesRate,
    repair_rate: repairRate,
    staff_training_rate: staffTrainingRate,

    strengths,
    concerns,
    recommendations,
    insights,
  };
}
