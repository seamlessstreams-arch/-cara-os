// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD PRACTICE-INTELLIGENCE PACK (§31)
//
// Turns one ChildTwin into a pack for a review, a new key worker, or the child
// themselves one day: the whole child across every dimension — identity first,
// risks late and never the headline — with each dimension's CONFIDENCE, its
// evidence count and its gaps carried onto the page. Contradictions and
// missing information are first-class sections: flagged as intelligence, not
// papered over. Pure model + HTML + JSON here; the .docx renderer lives beside
// it so the model stays trivially testable.
// ══════════════════════════════════════════════════════════════════════════════

import type { ChildTwin, TwinConfidence } from "./types";

export const CHILD_TWIN_EXPORT_VERSION = "1.0.0";

export const CHILD_STATEMENT =
  "This pack holds the whole child — identity, strengths, aspirations, voice, relationships, memories, progress — never a child reduced to incidents or risk. Significance outweighs frequency throughout: one meaningful conversation may matter more than twenty routine observations. Where the picture disagrees with itself, or where Cara simply does not know, that is said plainly — a gap is intelligence too.";

export const CONFIDENCE_LABELS: Record<TwinConfidence, string> = {
  high: "High confidence",
  moderate: "Moderate confidence",
  low: "Low confidence",
  none: "No evidence in the records",
};

export interface TwinExportSection {
  key: string;
  label: string;
  confidence: TwinConfidence;
  confidenceLabel: string;
  evidenceCount: number;
  gaps: string[];
  /** The dimension's content, flattened to display lines. Empty + confidence
   *  "none" means the records hold nothing — stated, never hidden. */
  lines: string[];
}

export interface ChildTwinExportModel {
  version: string;
  childStatement: string;
  header: {
    childId: string;
    childName: string;
    generatedAt: string;
    packGeneratedAt: string;
    engineVersion: string;
  };
  sections: TwinExportSection[];
  /** Where the picture disagrees with itself — review prompts, not verdicts. */
  contradictions: string[];
  /** What CARA does NOT know — a gap is intelligence too. */
  missingInformation: string[];
}

const li = (label: string, v: string | number | null | undefined): string | null =>
  v === null || v === undefined || v === "" ? null : `${label}: ${v}`;
const list = (label: string, items: string[] | undefined): string | null =>
  items && items.length ? `${label}: ${items.join("; ")}` : null;

function lines(...items: Array<string | null>): string[] {
  return items.filter((x): x is string => !!x);
}

export function buildChildTwinExportModel(
  twin: ChildTwin,
  packGeneratedAt: string = new Date().toISOString(),
): ChildTwinExportModel {
  const section = (key: string, label: string, dim: { confidence: TwinConfidence; evidence: unknown[]; gaps: string[] }, contentLines: string[]): TwinExportSection => ({
    key,
    label,
    confidence: dim.confidence,
    confidenceLabel: CONFIDENCE_LABELS[dim.confidence],
    evidenceCount: dim.evidence.length,
    gaps: dim.gaps,
    lines: contentLines,
  });

  const i = twin.identity.data;
  const sections: TwinExportSection[] = [
    section("identity", "Who they are", twin.identity, lines(
      li("Age", i.age), li("Culture", i.culture), li("Faith", i.faith),
      list("Interests", i.interests), list("What makes them happy", i.whatMakesThemHappy),
      list("Personality", i.personality), list("Communication preferences", i.communicationPreferences),
      list("Sensory needs", i.sensoryNeeds),
    )),
    section("strengths", "Strengths and achievements", twin.strengths, lines(
      list("Strengths", twin.strengths.data.strengths),
      ...twin.strengths.data.achievements.map((a) =>
        `${a.date.slice(0, 10)} — ${a.title}${a.celebratedHow ? ` (celebrated: ${a.celebratedHow})` : ""}`),
    )),
    section("aspirations", "Who they are becoming", twin.aspirations,
      twin.aspirations.data.aspirations.map((a) =>
        `${a.domain}: ${a.aspiration}${a.nextSteps.length ? ` — next: ${a.nextSteps.join("; ")}` : ""}`)),
    section("lifeStory", "Memories that matter", twin.lifeStory,
      twin.lifeStory.data.memories.map((m) => `${m.date.slice(0, 10)} — ${m.title}${m.childVoice ? ` · in their words: "${m.childVoice}"` : ""}`)),
    section("voice", "In their own words", twin.voice,
      twin.voice.data.recentQuotes.map((q) => `${q.date.slice(0, 10)} — "${q.quote}" (${q.source})`)),
    section("relationships", "Relationships", twin.relationships, lines(
      list("Trusted adults", twin.relationships.data.trustedAdults),
      li("Key connector", twin.relationships.data.keyConnector),
      li("Relational status", twin.relationships.data.relationalStatus),
      list("Friendships", twin.relationships.data.friendships),
      list("Friendship concerns", twin.relationships.data.friendshipConcerns),
    )),
    section("emotional", "Feeling and regulating", twin.emotional, lines(
      li("Status", twin.emotional.data.status), li("Trend", twin.emotional.data.trend),
      li("Peak time", twin.emotional.data.peakTime),
      list("Triggers", twin.emotional.data.triggers), list("What helps", twin.emotional.data.whatHelps),
      list("Phrases that help", twin.emotional.data.phrasesThatHelp),
      list("Phrases that escalate", twin.emotional.data.phrasesThatEscalate),
    )),
    section("progress", "Direction of travel", twin.progress, lines(
      li("Trajectory", twin.progress.data.trajectory), li("Headline", twin.progress.data.headline),
      list("Focus areas", twin.progress.data.focus),
    )),
    section("protectiveFactors", "Protective factors", twin.protectiveFactors,
      twin.protectiveFactors.data.factors.map((f) => `${f.label} (${f.source})`)),
    section("livedExperience", "Does life here feel like a childhood?", twin.livedExperience, lines(
      li("Meaningful moments (30d, significance-weighted — not a tally)", twin.livedExperience.data.meaningfulMoments30d),
      list("Celebrations", twin.livedExperience.data.celebrations),
      list("Ordinary childhood signals", twin.livedExperience.data.ordinarySignals),
    )),
    section("goodParenting", "Does the care read like excellent parenting?", twin.goodParenting, lines(
      li("Lived-experience read", twin.goodParenting.data.livedExperienceRead),
      ...twin.goodParenting.data.signalsPresent.map((s) => li(s.label, s.count)),
      list("Thin signals — a prompt to notice, never blame", twin.goodParenting.data.signalsThin),
    )),
    // Deliberately late, mirroring the twin itself: risks are held
    // proportionately and are never the headline of this pack.
    section("risksAndNeeds", "Risks and needs — held proportionately", twin.risksAndNeeds, lines(
      list("Open risk areas", twin.risksAndNeeds.data.openRiskAreas),
      list("Known triggers", twin.risksAndNeeds.data.knownTriggers),
    )),
    section("curiosity", "Professional curiosity — worth noticing, never verdicts", twin.curiosity, lines(
      list("Noticed patterns", twin.curiosity.data.noticedPatterns),
      ...twin.curiosity.data.reflectiveQuestions.map((q) => `Question to sit with: ${q}`),
    )),
  ];

  return {
    version: CHILD_TWIN_EXPORT_VERSION,
    childStatement: CHILD_STATEMENT,
    header: {
      childId: twin.childId,
      childName: twin.name,
      generatedAt: twin.generatedAt,
      packGeneratedAt,
      engineVersion: twin.engineVersion,
    },
    sections,
    contradictions: twin.contradictions,
    missingInformation: twin.missingInformation,
  };
}

export function renderChildTwinJson(model: ChildTwinExportModel): string {
  return JSON.stringify(model, null, 2);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderChildTwinHtml(model: ChildTwinExportModel): string {
  const h = model.header;

  const sectionsHtml = model.sections
    .map((s) => {
      const body = s.lines.length
        ? `<ul>${s.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`
        : `<p class="none">Nothing on record for this dimension.</p>`;
      const gaps = s.gaps.length
        ? `<p class="gaps">Gaps: ${esc(s.gaps.join("; "))}</p>`
        : "";
      return `
    <section class="dimension confidence-${s.confidence}">
      <h2>${esc(s.label)} <span class="confidence">${esc(s.confidenceLabel)}</span></h2>
      ${body}
      <p class="sources">${s.evidenceCount} evidence record${s.evidenceCount === 1 ? "" : "s"}</p>
      ${gaps}
    </section>`;
    })
    .join("");

  const flagBlock = (title: string, items: string[], emptyText: string) => `
    <section class="flags">
      <h2>${esc(title)}</h2>
      ${items.length ? `<ul>${items.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : `<p class="none">${esc(emptyText)}</p>`}
    </section>`;

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>Child Practice-Intelligence Pack — ${esc(h.childName)}</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; margin: 2.5rem auto; max-width: 48rem; color: #1a1a1a; line-height: 1.55; }
  .meta, .sources, .none, .gaps { color: #555; font-size: 0.9rem; }
  .statement { border: 1px solid #999; padding: 0.8rem 1rem; font-weight: 600; margin: 1.2rem 0; }
  section { margin: 1.1rem 0; }
  h2 { border-bottom: 1px solid #ccc; padding-bottom: 0.15rem; }
  .confidence { display: inline-block; border: 1px solid #777; border-radius: 3px; padding: 0 0.4rem; font-size: 0.78rem; margin-left: 0.35rem; }
  .gaps { font-style: italic; }
  li { margin-bottom: 0.35rem; }
  @media print { body { margin: 0.5in; } }
</style>
</head>
<body>
<header>
  <h1>Child Practice-Intelligence Pack</h1>
  <p class="meta">${esc(h.childName)}</p>
  <p class="meta">Twin generated ${esc(h.generatedAt.slice(0, 16).replace("T", " "))} · pack generated ${esc(h.packGeneratedAt.slice(0, 16).replace("T", " "))} · engine v${esc(h.engineVersion)} · export v${esc(model.version)}</p>
</header>

<p class="statement">${esc(model.childStatement)}</p>

${sectionsHtml}

${flagBlock("Where the picture disagrees with itself — review prompts, not verdicts", model.contradictions, "No contradictions flagged.")}
${flagBlock("What Cara does not know about this child — a gap is intelligence too", model.missingInformation, "No missing-information flags.")}
</body>
</html>`;
}
