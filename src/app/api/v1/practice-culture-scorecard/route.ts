// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE CULTURE SCORECARD
// GET /api/v1/practice-culture-scorecard
//
// Synthesises five practice-quality intelligence dimensions into a single
// management health picture. Each dimension is scored 0–100 and RAG-rated.
//
// Dimensions:
//   1. Recording Quality      — Writing Assistant engagement (WAUD acceptance)
//   2. Child Voice Presence   — Voice markers in records
//   3. Therapeutic Language   — Absence of criminalising/moralising patterns
//   4. Strengths Documentation — Presence of achievement/connection language
//   5. Framework Engagement   — Active KB practice frameworks
//
// All computed directly from the store. No internal API calls.
// All deterministic. No LLM calls.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";

type RAGStatus = "progressing" | "developing" | "needs_support";

function rag(score: number): RAGStatus {
  if (score >= 65) return "progressing";
  if (score >= 40) return "developing";
  return "needs_support";
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// ── Voice presence patterns (minimal subset) ──────────────────────────────────

const VOICE_PATTERNS = [
  /\bsaid\b/i, /\btold me\b/i, /\bexplained\b/i, /\bexpressed\b/i,
  // Quote pattern uses DOUBLE quotes only (straight + smart). Single quotes are
  // dominated by contractions/possessives ("home's … didn't" is not quoted speech);
  // genuine single-quoted speech is still caught by the verb cues (said/told/…).
  /\bmentioned\b/i, /\bfelt that\b/i, /\bchose to\b/i, /["“”]([^"“”]{5,})["“”]/,
];

function hasVoice(text: string): boolean {
  if (!text || text.length < 10) return false;
  return VOICE_PATTERNS.some((p) => p.test(text));
}

// ── Problematic language patterns (minimal subset) ────────────────────────────

const PROBLEM_PHRASES = [
  "manipulative", "attention seeking", "attention-seeking", "non-compliant",
  "non compliant", "defiant", "naughty", "refused to comply", "refused to engage",
  "criminal damage", "assaulted", "tantrum", "meltdown", "crocodile tears",
  "being silly", "overreacting", "making a fuss", "failed to comply",
  "failed to follow", "wouldn't listen",
];

// Whole-word, negation-aware match: stops "manipulative" firing inside
// "manipulatives", "regulated" inside "dysregulated", and stops "no tantrum"/
// "not manipulative" from counting against the therapeutic-language score.
const SC_NEGATION_RE = /\b(no|not|never|without|cannot|nobody|none|denied|refused)\b|n['’]t\b/;
function scNegated(lower: string, idx: number): boolean {
  let p = lower.slice(Math.max(0, idx - 25), idx);
  const s = Math.max(
    p.lastIndexOf("."), p.lastIndexOf("!"), p.lastIndexOf("?"),
    p.lastIndexOf(";"), p.lastIndexOf(","),
  );
  if (s >= 0) p = p.slice(s + 1);
  return SC_NEGATION_RE.test(p);
}
function anyPhrase(lower: string, phrases: string[]): boolean {
  for (const phrase of phrases) {
    const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(lower)) !== null) {
      if (!scNegated(lower, m.index)) return true;
    }
  }
  return false;
}

function hasProblematic(text: string): boolean {
  if (!text) return false;
  return anyPhrase(text.toLowerCase(), PROBLEM_PHRASES);
}

// ── Strengths language patterns (minimal subset) ──────────────────────────────

const STRENGTHS_PHRASES = [
  "managed to", "achieved", "made progress", "improved", "did well",
  "connected with", "enjoyed", "laughed", "smiled", "responded well",
  "coped", "regulated", "bounced back", "asked for help", "de-escalated",
  "seemed happy", "proud", "excited", "in good spirits", "was settled",
  "participated", "joined in",
];

function hasStrengths(text: string): boolean {
  if (!text) return false;
  return anyPhrase(text.toLowerCase(), STRENGTHS_PHRASES);
}

// ── KB framework engagement (minimal) ────────────────────────────────────────

const KB_FRAMEWORK_IDS = [
  "model_pace", "skills_21_residential", "concept_psychological_safety",
  "concept_aces", "model_ddp", "concept_rupture_repair",
] as const;

const WA_ISSUE_TO_FW: Record<string, string> = {
  tone: "model_pace", "professional-language": "model_pace",
  "safeguarding-quality": "skills_21_residential", "writing-to-child": "skills_21_residential",
  clarity: "skills_21_residential", chronology: "skills_21_residential",
};

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const store = getStore();

  // ── Dimension 1: Recording Quality (WAUD acceptance) ─────────────────────
  const waud = (store.writingAssistantAuditEvents ?? []) as Array<{
    action: string; issue_type: string; created_at: string;
  }>;
  const practiceIssueTypes = new Set(["safeguarding-quality", "tone", "writing-to-child", "chronology", "clarity", "professional-language"]);
  const practiceWaud = waud.filter((e) => practiceIssueTypes.has(e.issue_type));
  const waAccepted = practiceWaud.filter((e) => e.action === "accepted").length;
  const recordingQualityScore = practiceWaud.length > 0
    ? clamp((waAccepted / practiceWaud.length) * 100)
    : 50; // neutral when no data

  // ── Dimension 2: Child Voice Presence ────────────────────────────────────
  const incidents  = (store.incidents ?? [])  as Array<{ child_id: string; description: string }>;
  const dailyLog   = (store.dailyLog ?? [])   as Array<{ child_id: string; content: string }>;
  const keyWorking = (store.keyWorkingSessions ?? []) as Array<{ child_id: string; child_voice: string }>;

  const voiceTexts = [
    ...incidents.map((i) => i.description),
    ...dailyLog.map((e) => e.content),
    ...keyWorking.map((k) => k.child_voice ?? ""),
  ];
  const voiceTotal = voiceTexts.length;
  const voiceWithMarkers = voiceTexts.filter(hasVoice).length;
  const childVoiceScore = voiceTotal > 0 ? clamp((voiceWithMarkers / voiceTotal) * 100) : 50;

  // ── Dimension 3: Therapeutic Language ────────────────────────────────────
  const behaviourLog = (store.behaviourLog ?? []) as Array<{
    behaviour: string; antecedent: string; consequence: string;
  }>;
  const languageTexts = [
    ...incidents.map((i) => i.description),
    ...dailyLog.map((e) => e.content),
    ...behaviourLog.map((e) => [e.behaviour, e.antecedent, e.consequence].join(" ")),
  ];
  const languageTotal = languageTexts.length;
  const languageFlagged = languageTexts.filter(hasProblematic).length;
  const flagRate = languageTotal > 0 ? languageFlagged / languageTotal : 0;
  // Neutral 50 when there's no language corpus — an empty home has not earned a
  // perfect "no criminalising language" rating (consistent with the other dims).
  const therapeuticLanguageScore = languageTotal > 0 ? clamp((1 - flagRate) * 100) : 50;

  // ── Dimension 4: Strengths Documentation ─────────────────────────────────
  const strengthsTexts = languageTexts; // same corpus
  const strengthsTotal = strengthsTexts.length;
  const strengthsFound = strengthsTexts.filter(hasStrengths).length;
  const strengthsDocScore = strengthsTotal > 0 ? clamp((strengthsFound / strengthsTotal) * 100) : 50;

  // ── Dimension 5: Framework Engagement ────────────────────────────────────
  const engagedFrameworks = new Set<string>();
  for (const e of waud) {
    if (e.action === "accepted") {
      const fw = WA_ISSUE_TO_FW[e.issue_type];
      if (fw) engagedFrameworks.add(fw);
    }
  }
  const reflSups = (store.reflectiveSupervisions ?? []) as Array<{ pace_examples: string }>;
  if (reflSups.some((s) => s.pace_examples && s.pace_examples.trim().length > 10)) {
    engagedFrameworks.add("model_pace");
    engagedFrameworks.add("concept_psychological_safety");
  }
  const incSessions = (store.caraIncidentSessions ?? []) as unknown[];
  if (incSessions.length > 0) {
    engagedFrameworks.add("model_pace");
    engagedFrameworks.add("concept_rupture_repair");
  }
  const paceProfiles = (store.childPaceProfiles ?? []) as Array<{ trustedAdults: string[]; traumaInformedStrategies: string[] }>;
  if (paceProfiles.some((p) => p.trustedAdults?.length > 0)) engagedFrameworks.add("model_pace");
  if (paceProfiles.some((p) => p.traumaInformedStrategies?.length > 0)) engagedFrameworks.add("concept_aces");
  const practiceObs = (store.practiceObservations ?? []) as Array<{ domains_observed: string[] }>;
  if (practiceObs.some((o) => o.domains_observed?.includes("therapeutic_relationships"))) engagedFrameworks.add("model_ddp");
  if (practiceObs.some((o) => o.domains_observed?.includes("self_care_and_resilience"))) engagedFrameworks.add("concept_psychological_safety");

  const frameworkEngagementScore = clamp((engagedFrameworks.size / KB_FRAMEWORK_IDS.length) * 100);

  // ── Dimension summary ─────────────────────────────────────────────────────

  const dimensions = [
    {
      id: "recording_quality",
      label: "Recording Quality",
      description: "Staff acceptance of Writing Assistant KB-grounded feedback",
      score: recordingQualityScore,
      status: rag(recordingQualityScore),
      dataPoints: practiceWaud.length,
      improvementPrompt:
        "Review which types of Cara suggestions are being dismissed most. Use supervision to explore: what feels unhelpful about the feedback, and what would make it land better?",
    },
    {
      id: "child_voice",
      label: "Child Voice Presence",
      description: "Children's own words and views appear in records",
      score: childVoiceScore,
      status: rag(childVoiceScore),
      dataPoints: voiceTotal,
      improvementPrompt:
        "Explore in supervision: 'After each shift, can you name one thing a child said — and did you write it down?' Help staff see voice-capture as part of quality recording.",
    },
    {
      id: "therapeutic_language",
      label: "Therapeutic Language",
      description: "Absence of criminalising or moralising language patterns",
      score: therapeuticLanguageScore,
      status: rag(therapeuticLanguageScore),
      dataPoints: languageTotal,
      improvementPrompt:
        "Use the Care Language Audit for a shared staff development session. Ask: 'What would a child feel if they read this record?' Build a shared vocabulary for describing behaviour as communication.",
    },
    {
      id: "strengths_documentation",
      label: "Strengths Documentation",
      description: "Records celebrate achievement, connection, and resilience",
      score: strengthsDocScore,
      status: rag(strengthsDocScore),
      dataPoints: strengthsTotal,
      improvementPrompt:
        "Introduce a 'strengths spotlight' in handover: one thing each child managed today. Over time this shapes how staff see children — and how children see themselves through staff's eyes.",
    },
    {
      id: "framework_engagement",
      label: "Framework Engagement",
      description: "Cara Knowledge Base frameworks actively engaged across engines",
      score: frameworkEngagementScore,
      status: rag(frameworkEngagementScore),
      dataPoints: engagedFrameworks.size,
      improvementPrompt:
        "Review the Practice Framework Usage dashboard to identify which frameworks are dormant. Use Cara Studio to create a learning activity grounded in the least-engaged framework.",
    },
  ] as const;

  const overallScore = clamp(
    dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length,
  );
  const overallStatus = rag(overallScore);

  const lowestDimension = [...dimensions].sort((a, b) => a.score - b.score)[0];
  const highestDimension = [...dimensions].sort((a, b) => b.score - a.score)[0];

  const totalRecordsAnalysed =
    incidents.length + dailyLog.length + behaviourLog.length + keyWorking.length;

  return NextResponse.json({
    data: {
      overallScore,
      overallStatus,
      dimensions: dimensions.map((d) => ({ ...d })),
      summary: {
        priorityDimension: lowestDimension.id,
        priorityLabel: lowestDimension.label,
        priorityPrompt: lowestDimension.improvementPrompt,
        strongestDimension: highestDimension.id,
        strongestLabel: highestDimension.label,
        totalRecordsAnalysed,
        frameworksEngaged: engagedFrameworks.size,
        totalFrameworks: KB_FRAMEWORK_IDS.length,
      },
    },
  });
}
