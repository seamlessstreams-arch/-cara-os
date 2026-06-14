// ══════════════════════════════════════════════════════════════════════════════
// Cara — RECORDING QUALITY SCORER
//
// Analyses daily log entries, incident records, and key work session records
// for quality indicators. Gives staff and managers feedback on recording
// quality without requiring an AI call — pure deterministic scoring.
//
// Quality dimensions:
//   - Length/detail: is the record substantive?
//   - Child voice: does it capture the young person's words?
//   - Factual clarity: does it describe observable behaviours vs opinions?
//   - Actionability: does it include follow-up or next steps?
//   - Regulatory awareness: does it reference relevant framework where appropriate?
//   - Timeliness: was it recorded promptly?
//   - Emotional context: does it capture mood and wellbeing?
//
// Outputs a score 0-100 plus specific improvement suggestions.
// Pure function — no side effects, no API calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export interface RecordingInput {
  content: string;
  entryType: string;
  recordedAt?: string;        // ISO datetime when saved
  eventTime?: string;         // when the event happened
  childName?: string;
  moodScore?: number | null;
  isSignificant?: boolean;
  hasLinkedIncident?: boolean;
}

export interface QualityDimension {
  name: string;
  score: number;            // 0-100
  weight: number;           // relative importance
  feedback?: string;        // improvement suggestion
}

export interface QualityScore {
  overall: number;          // 0-100 weighted average
  grade: "excellent" | "good" | "adequate" | "needs_improvement" | "insufficient";
  dimensions: QualityDimension[];
  suggestions: string[];
  strengths: string[];
  wordCount: number;
  hasChildVoice: boolean;
  hasActionableContent: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CHILD_VOICE_PATTERNS = [
  /[""].+?[""]/g,                          // Quoted speech
  /said\s+[""]?.+?[""]?/gi,               // "said something"
  /told\s+(me|us|staff)\s+/gi,            // "told me/us/staff"
  /asked\s+(if|for|about|whether)\s+/gi,  // "asked if/for"
  /expressed\s+(that|a|their|his|her)\s+/gi, // "expressed that"
  /\b(child|young person|yp)\s+said/gi,   // "young person said"
  /in\s+their\s+(own\s+)?words/gi,        // "in their own words"
  /verbatim/gi,                            // explicit verbatim markers
];

const FACTUAL_INDICATORS = [
  /at\s+\d{1,2}[:.]\d{2}/gi,             // time references
  /\d+\s+(minutes?|mins?|hours?)/gi,     // duration
  /observed\s+/gi,                         // factual observation language
  /noticed\s+/gi,
  /witnessed\s+/gi,
  /appeared\s+to\s+/gi,
  /body\s+language/gi,
  /facial\s+expression/gi,
  /tone\s+of\s+voice/gi,
];

const ACTION_INDICATORS = [
  /follow[- ]up/gi,
  /next\s+step/gi,
  /action\s*:/gi,
  /will\s+(need\s+to|be|check|follow|speak|contact|arrange)/gi,
  /need(s)?\s+to\s+/gi,
  /to\s+be\s+(reviewed|discussed|raised|shared)/gi,
  /handover/gi,
  /key\s+worker\s+(to|should|will)/gi,
  /manager\s+(to|should|will|needs)/gi,
  /flagged\s+(for|with|to)/gi,
  /shared\s+(with|at)/gi,
];

const OPINION_LANGUAGE = [
  /\bi\s+think\b/gi,
  /\bi\s+feel\s+like\b/gi,
  /\bin\s+my\s+opinion\b/gi,
  /\bprobably\b/gi,
  /\bseems\s+like\b/gi,
  /\bI\s+reckon\b/gi,
  /\balways\b/gi,                // absolute language
  /\bnever\b/gi,
  /\beveryone\b/gi,
];

const REGULATORY_LANGUAGE = [
  /care\s+plan/gi,
  /placement\s+plan/gi,
  /risk\s+assessment/gi,
  /reg(ulation)?\s+\d+/gi,
  /safeguarding/gi,
  /welfare/gi,
  /behaviour\s+support/gi,
  /de-escalat/gi,
  /PACE/g,
  /therapeutic/gi,
  /trauma[\s-]informed/gi,
  /child('s)?\s+voice/gi,
  /consent/gi,
  /confidential/gi,
];

const EMOTIONAL_CONTEXT = [
  /mood/gi,
  /anxious|anxiety/gi,
  /calm(ed)?\b/gi,
  /upset|distressed/gi,
  /happy|cheerful|bright/gi,
  /withdrawn|quiet/gi,
  /angry|frustrated/gi,
  /settled|relaxed/gi,
  /excited|enthusiastic/gi,
  /tearful|crying/gi,
  /low\s+(mood|spirits)/gi,
  /positive\s+(mood|spirits|demeanour)/gi,
];

// ── Scorer ───────────────────────────────────────────────────────────────────

export function scoreRecordingQuality(input: RecordingInput): QualityScore {
  const content = input.content ?? "";
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Early return for empty content
  if (wordCount === 0) {
    return {
      overall: 0,
      grade: "insufficient",
      dimensions: [
        { name: "Detail", score: 0, weight: 20, feedback: "No content recorded." },
        { name: "Child Voice", score: 0, weight: 25, feedback: "No content recorded." },
        { name: "Factual Clarity", score: 0, weight: 20, feedback: "No content recorded." },
        { name: "Actionability", score: 0, weight: 15, feedback: "No content recorded." },
        { name: "Emotional Context", score: 0, weight: 10, feedback: "No content recorded." },
        { name: "Framework Awareness", score: 0, weight: 10, feedback: "No content recorded." },
      ],
      suggestions: ["This entry is empty. Record what happened, who was involved, and how the young person responded."],
      strengths: [],
      wordCount: 0,
      hasChildVoice: false,
      hasActionableContent: false,
    };
  }

  const dimensions: QualityDimension[] = [];
  const suggestions: string[] = [];
  const strengths: string[] = [];

  // ─── 1. Length/Detail (weight: 20) ─────────────────────────────────────────
  let lengthScore: number;
  if (wordCount >= 150) lengthScore = 100;
  else if (wordCount >= 100) lengthScore = 85;
  else if (wordCount >= 60) lengthScore = 70;
  else if (wordCount >= 30) lengthScore = 50;
  else if (wordCount >= 15) lengthScore = 30;
  else lengthScore = 10;

  let lengthFeedback: string | undefined;
  if (wordCount < 30) {
    lengthFeedback = "This entry is very brief. Aim for at least 60 words to provide sufficient context for colleagues and regulators.";
    suggestions.push("Add more detail — describe what happened, who was involved, and how the young person responded");
  } else if (wordCount < 60) {
    lengthFeedback = "Consider adding more detail. Good records help the team understand context without needing to ask follow-up questions.";
    suggestions.push("Expand the entry — include specific observations about behaviour, mood, and any actions taken");
  } else if (wordCount >= 100) {
    strengths.push("Good level of detail in this record");
  }

  dimensions.push({ name: "Detail", score: lengthScore, weight: 20, feedback: lengthFeedback });

  // ─── 2. Child Voice (weight: 25) ──────────────────────────────────────────
  let childVoiceScore = 0;
  let hasChildVoice = false;

  for (const pattern of CHILD_VOICE_PATTERNS) {
    if (pattern.test(content)) {
      hasChildVoice = true;
      childVoiceScore = Math.min(100, childVoiceScore + 30);
    }
    pattern.lastIndex = 0;
  }

  // Check for direct quotes (strongest indicator)
  const quoteMatches = content.match(/[""].+?[""]/g);
  if (quoteMatches && quoteMatches.length > 0) {
    childVoiceScore = Math.min(100, childVoiceScore + 40);
    hasChildVoice = true;
    strengths.push("Captures the young person's voice through direct quotes");
  }

  if (!hasChildVoice) {
    childVoiceScore = input.entryType === "contact" || input.entryType === "key_work" ? 20 : 40;
    suggestions.push("Include the young person's own words where possible — direct quotes show their voice is being heard");
  }

  dimensions.push({
    name: "Child Voice",
    score: childVoiceScore,
    weight: 25,
    feedback: !hasChildVoice ? "No direct quotes or child voice captured. Ofsted inspectors look for evidence that children's views are recorded." : undefined,
  });

  // ─── 3. Factual Clarity (weight: 20) ──────────────────────────────────────
  let factualScore = 50; // baseline

  let factualMatches = 0;
  for (const pattern of FACTUAL_INDICATORS) {
    if (pattern.test(content)) factualMatches++;
    pattern.lastIndex = 0;
  }
  factualScore = Math.min(100, 50 + factualMatches * 12);

  let opinionCount = 0;
  for (const pattern of OPINION_LANGUAGE) {
    if (pattern.test(content)) opinionCount++;
    pattern.lastIndex = 0;
  }

  if (opinionCount > 2) {
    factualScore = Math.max(20, factualScore - opinionCount * 10);
    suggestions.push("Reduce opinion language ('I think', 'probably', 'always') — describe what you observed, not what you interpreted");
  }

  if (factualMatches >= 3) {
    strengths.push("Uses specific, observable language with time references");
  }

  dimensions.push({
    name: "Factual Clarity",
    score: factualScore,
    weight: 20,
    feedback: factualScore < 60 ? "Use more factual, observable language. Describe specific behaviours, times, and durations rather than general impressions." : undefined,
  });

  // ─── 4. Actionability (weight: 15) ────────────────────────────────────────
  let actionScore = 40; // baseline
  let hasActionableContent = false;

  let actionMatches = 0;
  for (const pattern of ACTION_INDICATORS) {
    if (pattern.test(content)) actionMatches++;
    pattern.lastIndex = 0;
  }

  if (actionMatches > 0) {
    hasActionableContent = true;
    actionScore = Math.min(100, 40 + actionMatches * 20);
  }

  if (input.isSignificant && !hasActionableContent) {
    actionScore = 20;
    suggestions.push("This is flagged as significant but has no follow-up actions. What should the next shift team do?");
  }

  if (actionMatches >= 2) {
    strengths.push("Includes clear follow-up actions or next steps");
  }

  dimensions.push({
    name: "Actionability",
    score: actionScore,
    weight: 15,
    feedback: !hasActionableContent ? "Consider adding what happens next — actions to follow up, things to monitor, or information to share at handover." : undefined,
  });

  // ─── 5. Emotional Context (weight: 10) ────────────────────────────────────
  let emotionalScore = 30;
  let emotionalMatches = 0;

  for (const pattern of EMOTIONAL_CONTEXT) {
    if (pattern.test(content)) emotionalMatches++;
    pattern.lastIndex = 0;
  }

  emotionalScore = Math.min(100, 30 + emotionalMatches * 20);

  if (input.moodScore !== null && input.moodScore !== undefined) {
    emotionalScore = Math.min(100, emotionalScore + 20);
  }

  if (emotionalMatches >= 2) {
    strengths.push("Captures emotional context and mood");
  } else if (emotionalMatches === 0) {
    suggestions.push("Include emotional context — how did the young person seem? What was their mood?");
  }

  dimensions.push({
    name: "Emotional Context",
    score: emotionalScore,
    weight: 10,
    feedback: emotionalMatches === 0 ? "No emotional or mood context. Record how the young person appeared to feel." : undefined,
  });

  // ─── 6. Regulatory Awareness (weight: 10) ─────────────────────────────────
  let regScore = 50; // baseline — not always needed
  let regMatches = 0;

  for (const pattern of REGULATORY_LANGUAGE) {
    if (pattern.test(content)) regMatches++;
    pattern.lastIndex = 0;
  }

  if (regMatches > 0) regScore = Math.min(100, 50 + regMatches * 15);

  // Regulatory language more important for significant entries
  if (input.isSignificant && regMatches === 0) {
    regScore = 30;
    suggestions.push("For significant entries, reference the relevant care plan or risk assessment where the record connects");
  }

  dimensions.push({
    name: "Framework Awareness",
    score: regScore,
    weight: 10,
    feedback: input.isSignificant && regMatches === 0 ? "Link to relevant plans or assessments." : undefined,
  });

  // ─── Calculate Overall ─────────────────────────────────────────────────────
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  const overall = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight
  );

  let grade: QualityScore["grade"];
  if (overall >= 85) grade = "excellent";
  else if (overall >= 70) grade = "good";
  else if (overall >= 55) grade = "adequate";
  else if (overall >= 35) grade = "needs_improvement";
  else grade = "insufficient";

  return {
    overall,
    grade,
    dimensions,
    suggestions: suggestions.slice(0, 4),
    strengths: strengths.slice(0, 3),
    wordCount,
    hasChildVoice,
    hasActionableContent,
  };
}

// ── Batch Scoring ────────────────────────────────────────────────────────────

export interface BatchQualityResult {
  averageScore: number;
  averageGrade: QualityScore["grade"];
  totalRecords: number;
  childVoicePresent: number;
  childVoicePercent: number;
  actionablePercent: number;
  gradeDistribution: Record<QualityScore["grade"], number>;
  topSuggestions: string[];
  topStrengths: string[];
}

export function scoreBatch(inputs: RecordingInput[]): BatchQualityResult {
  if (inputs.length === 0) {
    return {
      averageScore: 0,
      averageGrade: "insufficient",
      totalRecords: 0,
      childVoicePresent: 0,
      childVoicePercent: 0,
      actionablePercent: 0,
      gradeDistribution: { excellent: 0, good: 0, adequate: 0, needs_improvement: 0, insufficient: 0 },
      topSuggestions: [],
      topStrengths: [],
    };
  }

  const results = inputs.map(scoreRecordingQuality);
  const totalScore = results.reduce((sum, r) => sum + r.overall, 0);
  const averageScore = Math.round(totalScore / results.length);

  const childVoicePresent = results.filter((r) => r.hasChildVoice).length;
  const actionableCount = results.filter((r) => r.hasActionableContent).length;

  const gradeDistribution: Record<QualityScore["grade"], number> = {
    excellent: 0,
    good: 0,
    adequate: 0,
    needs_improvement: 0,
    insufficient: 0,
  };
  for (const r of results) gradeDistribution[r.grade]++;

  // Most common suggestions
  const suggestionCounts = new Map<string, number>();
  for (const r of results) {
    for (const s of r.suggestions) {
      suggestionCounts.set(s, (suggestionCounts.get(s) ?? 0) + 1);
    }
  }
  const topSuggestions = [...suggestionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s);

  const strengthCounts = new Map<string, number>();
  for (const r of results) {
    for (const s of r.strengths) {
      strengthCounts.set(s, (strengthCounts.get(s) ?? 0) + 1);
    }
  }
  const topStrengths = [...strengthCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s);

  let averageGrade: QualityScore["grade"];
  if (averageScore >= 85) averageGrade = "excellent";
  else if (averageScore >= 70) averageGrade = "good";
  else if (averageScore >= 55) averageGrade = "adequate";
  else if (averageScore >= 35) averageGrade = "needs_improvement";
  else averageGrade = "insufficient";

  return {
    averageScore,
    averageGrade,
    totalRecords: inputs.length,
    childVoicePresent,
    childVoicePercent: Math.round((childVoicePresent / inputs.length) * 100),
    actionablePercent: Math.round((actionableCount / inputs.length) * 100),
    gradeDistribution,
    topSuggestions,
    topStrengths,
  };
}

// ── Grade Labels ─────────────────────────────────────────────────────────────

export const GRADE_LABELS: Record<QualityScore["grade"], { label: string; colour: string }> = {
  excellent: { label: "Excellent", colour: "text-emerald-700" },
  good: { label: "Good", colour: "text-blue-700" },
  adequate: { label: "Adequate", colour: "text-amber-700" },
  needs_improvement: { label: "Needs Improvement", colour: "text-orange-700" },
  insufficient: { label: "Insufficient", colour: "text-red-700" },
};
