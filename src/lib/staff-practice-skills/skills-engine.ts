// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PRACTICE SKILLS (pure engine)
//
// synthesiseStaffPracticeSkills(input) reads a practitioner's existing records —
// competency scores, observations, reflective supervision, recording-quality
// audit and key-work — and brings them together into ONE developmental picture:
// five practice lenses (each with an honest signal + its sources), a synthesised
// list of strengths and growing edges, and a few supportive prompts to bring to
// supervision. It never ranks staff, never grades them, and surfaces wellbeing
// with care. No model calls, no store access.
// ══════════════════════════════════════════════════════════════════════════════

import {
  STAFF_SKILLS_VERSION,
  type PracticeLens,
  type SkillEvidenceRef,
  type SkillSignal,
  type StaffPracticeSkillsInput,
  type StaffPracticeSkillsProfile,
  type StaffSupervisionPrompt,
} from "./types";

const DISCLAIMER =
  "This is a developmental picture drawn from records that already exist — it supports supervision and growth, not performance management. It is never a rank or a grade, and Cara surfaces wellbeing with care, not judgement.";

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

const inWindow = (date: string, asOf: string, windowDays: number): boolean => {
  if (!date) return false;
  const age = daysBetween(date, asOf);
  return age >= 0 && age <= windowDays;
};

const clean = (arr?: string[]): string[] => (arr ?? []).map((s) => (s ?? "").trim()).filter(Boolean);

function dedupeCap(items: string[], cap: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
    if (out.length >= cap) break;
  }
  return out;
}

const humanDomain = (d: string, labels?: Record<string, string>): string =>
  labels?.[d] ?? d.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function synthesiseStaffPracticeSkills(input: StaffPracticeSkillsInput): StaffPracticeSkillsProfile {
  const windowDays = input.windowDays ?? 180;
  const { staffId, staffName, asOf } = input;

  const comp = input.competencyScores.filter((c) => c.staff_id === staffId);
  const obs = input.observations.filter((o) => o.staff_id === staffId && inWindow(o.observation_date, asOf, windowDays));
  const sup = input.supervisions.filter((s) => s.staff_id === staffId && inWindow(s.date, asOf, windowDays));
  const wa = input.recordingAudits.filter((a) => a.staff_id === staffId && inWindow(a.created_at, asOf, windowDays));
  const kw = input.keyWork.filter((k) => k.staff_id === staffId && inWindow(k.date, asOf, windowDays));

  const lenses: PracticeLens[] = [];
  const strengths: string[] = [];
  const developmentAreas: string[] = [];
  const supervisionPrompts: StaffSupervisionPrompt[] = [];

  // ── 1. Competency ─────────────────────────────────────────────────────────
  {
    const scored = comp.filter((c) => typeof c.score === "number");
    const sources: SkillEvidenceRef[] = scored.map((c) => ({ recordType: "competencyScores", recordId: c.id }));
    let signal: SkillSignal = "no_data";
    let detail = `No competency scores are recorded for ${staffName} yet.`;
    if (scored.length > 0) {
      const avg = scored.reduce((s, c) => s + c.score, 0) / scored.length;
      const sorted = [...scored].sort((a, b) => b.score - a.score);
      const top = sorted[0];
      const bottom = sorted[sorted.length - 1];
      signal = avg >= 4 ? "strong" : avg >= 2.5 ? "developing" : "needs_support";
      detail = `Average competency ${avg.toFixed(1)}/5 across ${scored.length} domain(s). Strongest: ${humanDomain(top.domain, input.domainLabels)}.`;
      if (signal === "strong") strengths.push(`${humanDomain(top.domain, input.domainLabels)} (competency)`);
      if (bottom.score <= 2) {
        developmentAreas.push(`${humanDomain(bottom.domain, input.domainLabels)} (competency)`);
        supervisionPrompts.push({ id: "comp_dev", kind: "development", prompt: `Explore ${humanDomain(bottom.domain, input.domainLabels).toLowerCase()} together — what would build confidence here?` });
      }
    }
    lenses.push({ key: "competency", label: "Competency", signal, detail, sources });
  }

  // ── 2. Observed practice ──────────────────────────────────────────────────
  {
    const sources: SkillEvidenceRef[] = obs.map((o) => ({ recordType: "practiceObservations", recordId: o.id }));
    let signal: SkillSignal = "no_data";
    let detail = `No practice observations in the last ${windowDays} days.`;
    if (obs.length > 0) {
      const good = obs.filter((o) => o.outcome === "outstanding" || o.outcome === "meets_standard").length;
      const needs = obs.filter((o) => o.outcome === "requires_support").length;
      signal = needs > 0 ? "needs_support" : good >= Math.ceil(obs.length * 0.6) ? "strong" : "developing";
      detail = `${good} of ${obs.length} observation(s) met or exceeded the standard.`;
      for (const o of obs) {
        strengths.push(...clean(o.strengths_noted));
        developmentAreas.push(...clean(o.areas_for_development));
      }
      if (needs > 0) supervisionPrompts.push({ id: "obs_support", kind: "development", prompt: "A recent observation flagged support needed — agree one concrete next step together." });
    }
    lenses.push({ key: "observed_practice", label: "Observed practice", signal, detail, sources });
  }

  // ── 3. Recording quality (summary of the WA audit — links to the fuller
  //      Recording Quality pathway; this is the at-a-glance signal) ──────────
  {
    const sources: SkillEvidenceRef[] = wa.slice(0, 20).map((a) => ({ recordType: "writingAssistantAuditEvents", recordId: a.id }));
    let signal: SkillSignal = "no_data";
    let detail = `No recording-assistant activity in the last ${windowDays} days.`;
    if (wa.length > 0) {
      const accepted = wa.filter((a) => a.action === "accepted").length;
      const rate = accepted / wa.length;
      // Engaging with the assistant AND acting on it is the healthy signal.
      signal = wa.length >= 5 && rate >= 0.6 ? "strong" : wa.length >= 3 ? "developing" : "needs_support";
      detail = `Acted on ${accepted} of ${wa.length} recording suggestion(s) (${Math.round(rate * 100)}%).`;
      if (signal === "strong") strengths.push("Engages well with recording feedback");
      if (signal === "needs_support") {
        developmentAreas.push("Recording-quality engagement");
        supervisionPrompts.push({ id: "rec_dev", kind: "development", prompt: "Recording feedback is going largely unactioned — is something getting in the way? (See the Recording Quality view.)" });
      }
    }
    lenses.push({ key: "recording_quality", label: "Recording quality", signal, detail, sources });
  }

  // ── 4. Reflective supervision (engagement + wellbeing, held with care) ────
  {
    const sources: SkillEvidenceRef[] = sup.map((s) => ({ recordType: "reflectiveSupervisions", recordId: s.id }));
    let signal: SkillSignal = "no_data";
    let detail = `No reflective supervision recorded in the last ${windowDays} days.`;
    if (sup.length > 0) {
      const mostRecent = [...sup].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
      const daysSince = daysBetween(mostRecent.date, asOf);
      signal = sup.length >= 3 && daysSince <= 45 ? "strong" : daysSince <= 90 ? "developing" : "needs_support";
      detail = `${sup.length} session(s); most recent ${daysSince} day(s) ago.`;
      if (signal === "needs_support") {
        developmentAreas.push("Regular reflective supervision");
        supervisionPrompts.push({ id: "sup_overdue", kind: "development", prompt: "Supervision has lapsed — protect the next session in the diary." });
      }
      for (const s of sup) developmentAreas.push(...clean(s.training_needs));
      // Wellbeing — care for carers, surfaced gently.
      const avgWellbeing = sup.reduce((a, s) => a + (s.wellbeing_score || 0), 0) / sup.length;
      if (avgWellbeing > 0 && avgWellbeing <= 2.5) {
        supervisionPrompts.push({ id: "wellbeing", kind: "wellbeing", prompt: "Recent wellbeing scores are low — check in on how they're doing before anything else." });
      }
    } else {
      developmentAreas.push("Regular reflective supervision");
    }
    lenses.push({ key: "reflective_supervision", label: "Reflective supervision", signal, detail, sources });
  }

  // ── 5. Relational practice (key-work volume + capturing the child's voice) ─
  {
    const sources: SkillEvidenceRef[] = kw.slice(0, 20).map((k) => ({ recordType: "keyWorkingSessions", recordId: k.id }));
    let signal: SkillSignal = "no_data";
    let detail = `No key-work sessions in the last ${windowDays} days.`;
    if (kw.length > 0) {
      const withVoice = kw.filter((k) => (k.child_voice ?? "").trim().length > 0).length;
      const voiceRate = withVoice / kw.length;
      signal = kw.length >= 4 && voiceRate >= 0.6 ? "strong" : kw.length >= 2 ? "developing" : "needs_support";
      detail = `${kw.length} key-work session(s); the child's voice was captured in ${withVoice}.`;
      if (signal === "strong") strengths.push("Relational key-work with the child's voice captured");
    }
    lenses.push({ key: "relational_practice", label: "Relational practice", signal, detail, sources });
  }

  // Add a positive supervision prompt when there's a clear strength to name.
  const uniqueStrengths = dedupeCap(strengths, 6);
  const uniqueDev = dedupeCap(developmentAreas, 6);
  if (uniqueStrengths.length > 0) {
    supervisionPrompts.unshift({ id: "affirm", kind: "strength", prompt: `Name and build on a strength: ${uniqueStrengths[0]}.` });
  }

  const dataLenses = lenses.filter((l) => l.signal !== "no_data");
  const hasData = dataLenses.length > 0;
  const strongCount = lenses.filter((l) => l.signal === "strong").length;
  const needsCount = lenses.filter((l) => l.signal === "needs_support").length;

  let overallPicture: StaffPracticeSkillsProfile["overallPicture"];
  if (!hasData) overallPicture = "insufficient_data";
  else if (strongCount >= 3 && needsCount === 0) overallPicture = "well_established";
  else if (strongCount >= needsCount) overallPicture = "developing_well";
  else overallPicture = "emerging";

  return {
    staffId,
    staffName,
    asOf,
    windowDays,
    hasData,
    lenses,
    strengths: uniqueStrengths,
    developmentAreas: uniqueDev,
    supervisionPrompts: supervisionPrompts.slice(0, 6),
    overallPicture,
    disclaimer: DISCLAIMER,
    engineVersion: STAFF_SKILLS_VERSION,
  };
}

export { STAFF_SKILLS_VERSION };
