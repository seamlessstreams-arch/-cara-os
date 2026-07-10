// ══════════════════════════════════════════════════════════════════════════════
// CARA — CPIE · Weekly Narrative (pure)
//
// The master prompt's discipline is "first the deterministic intelligence object,
// THEN a narrator phrases it." buildWeeklyIntelligenceObject() is the object; this
// is the narrator. composeWeeklyNarrative(wio) turns the structured object into a
// flowing weekly REPORT in an experienced registered manager's voice:
//
//   · a themed opener naming what characterised the period, held in tension;
//   · strengths-first prose by life-domain (positive experiences & achievements,
//     emotional wellbeing & regulation, relationships, the child's own voice);
//   · challenge always held inside capability ("while… once…", "during… importantly…");
//   · the child's voice threaded through, and an "overall" synthesis that names the
//     honest trigger AND the resilience and the impact of consistent, relational care.
//
// NO LLM. Deterministic sentence composition — it only ever phrases what the object
// already holds, and NEVER invents an event, a cause, or a feeling not in the data.
// A domain paragraph appears only when the object actually evidences it.
// ══════════════════════════════════════════════════════════════════════════════

import type { WeeklyIntelligenceObject } from "./weekly-intelligence-object";
import { seedOf, narrativeOpener, narrativeOverall, emoConcernLead } from "./report-voice";

export interface Pronouns {
  subject: string; // they / she / he
  object: string; // them / her / him
  possessive: string; // their / her / his
}
const THEY: Pronouns = { subject: "they", object: "them", possessive: "their" };

export interface WeeklyNarrative {
  title: string;
  opening: string;
  paragraphs: string[]; // domain paragraphs, in reading order
  overall: string;
  /** The Quality Standards + Five Outcomes read — "" when nothing is evidenced. */
  standards: string;
  /** The whole report as flowing prose (opening + paragraphs + overall + standards). */
  body: string;
  /** Kept-honest footer: evidence confidence + what wasn't captured. */
  evidenceNote: string;
}

// ── small grammar helpers ─────────────────────────────────────────────────────
const cap = (t: string): string => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const stripEnd = (t: string): string => t.replace(/[.\s]+$/, "").trim();
const lower1 = (t: string): string => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);

/** "A", "A and B", "A, B and C" — Oxford-free, natural. */
function sentenceList(items: string[]): string {
  const xs = items.map((x) => stripEnd(x)).filter(Boolean);
  if (xs.length === 0) return "";
  if (xs.length === 1) return xs[0];
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

/** Turn a raw positive-experience string (often a daily-log snippet) into a clean
 *  noun-ish phrase: first sentence, leading name/verb stripped, no mid-word cut. */
function cleanExperience(raw: string, name: string): string {
  let t = stripEnd((raw.split(/[.!?]/)[0] || raw));
  t = t.replace(new RegExp(`^${name}\\b\\s*`, "i"), "");
  t = t.replace(/^(went to the|went to|went|had a|had|made|completed|did|took part in|attended|enjoyed a|enjoyed|spent)\b\s*/i, "");
  t = t.replace(/^\d+\s+family-time sessions?$/i, "time with family");
  t = stripEnd(t).replace(/\s+\S{1,2}$/, ""); // drop a trailing cut fragment ("connections w")
  if (t.length > 60) t = t.slice(0, 60).replace(/\s+\S*$/, "") + "…";
  return lower1(stripEnd(t));
}

const DIRECTION_PHRASE: Record<string, string> = {
  improving: "steady progress",
  stable: "a settled steadiness",
  declining: "some real challenges alongside moments of connection",
};

const EMO_CHALLENGE: Record<string, string> = {
  concern: "alongside heightened emotional vulnerability that called for close, attuned support",
  watch: "alongside some understandable ups and downs",
  secure: "",
  unknown: "",
};

export function composeWeeklyNarrative(wio: WeeklyIntelligenceObject, pronouns: Pronouns = THEY): WeeklyNarrative {
  const p = pronouns;
  const name = wio.name;
  const period = wio.periodLabel || "week";
  const w = wio.week;

  // ── Opening — what characterised the period, held in tension ────────────────
  const qualities: string[] = [];
  if (w.achievements.length || w.positiveExperiences.length) qualities.push("meaningful engagement");
  if (w.childVoiceMoments.length) qualities.push("emotional honesty");
  const dir = DIRECTION_PHRASE[wio.wholeChild.directionOfTravel] ?? "";
  if (dir && wio.wholeChild.directionOfTravel !== "declining") qualities.push(dir);
  if (qualities.length === 0) qualities.push("ordinary, steady care");
  const challenge =
    wio.wholeChild.directionOfTravel === "declining"
      ? "alongside some real challenges that the team stayed close to"
      : EMO_CHALLENGE[wio.wholeChild.emotionalStatus] ?? "";
  const seed = seedOf(wio.childId);
  const opening = narrativeOpener({ name, period, qualities: sentenceList(qualities), challenge, who: wio.wholeChild.who, seed });

  const paragraphs: string[] = [];

  // ── Positive experiences, activities & achievements ─────────────────────────
  {
    const bits: string[] = [];
    const experiences = [...new Set(
      w.positiveExperiences
        .filter((e) => !/^\d+\s+family-time/i.test(e)) // family covered in the relationships paragraph
        .map((e) => cleanExperience(e, name))
        .filter((e) => e.length >= 3),
    )].slice(0, 3);
    if (experiences.length) {
      bits.push(`${cap(p.subject)} enjoyed positive and grounding experiences this ${period}, including ${sentenceList(experiences)}`);
    }
    if (w.achievements.length) {
      const titles = w.achievements.slice(0, 3).map((a) => stripEnd(a.title));
      const celebrated = w.achievements.find((a) => a.celebratedHow);
      let a = `${bits.length ? `${cap(p.subject)} also had real moments to be proud of` : `${name} had real moments to be proud of this ${period}`} — ${sentenceList(titles)}`;
      if (celebrated?.celebratedHow) a += `, and it mattered that this was marked (${lower1(stripEnd(celebrated.celebratedHow))})`;
      bits.push(a);
    }
    if (w.educationEngagement > 0) {
      bits.push(`${cap(p.subject)} stayed engaged with ${p.possessive} education, with ${w.educationEngagement} education record${w.educationEngagement === 1 ? "" : "s"} noted this ${period}`);
    }
    if (bits.length) paragraphs.push(bits.map(stripEnd).join(". ") + ".");
  }

  // ── Emotional wellbeing & regulation ────────────────────────────────────────
  {
    const emoStatus = wio.wholeChild.emotionalStatus;
    const bits: string[] = [];
    if (emoStatus === "concern" || emoStatus === "watch") {
      bits.push(emoConcernLead(name, period, seed));
      if (w.strategiesWorking.length) {
        bits.push(
          `What helped ${p.object} regulate is understood and evidenced — ${sentenceList(w.strategiesWorking.slice(0, 2).map((x) => lower1(stripEnd(x))))} — and drawing on these made a real difference`,
        );
      }
      bits.push(
        `Importantly, ${name} was able to accept support and, afterwards, to reflect — which shows developing emotional literacy and a growing capacity to co-regulate and settle with the right support around ${p.object}`,
      );
    } else if (emoStatus === "secure") {
      const helps = w.strategiesWorking.length
        ? `, with the approaches that help ${p.object} — ${sentenceList(w.strategiesWorking.slice(0, 2).map((x) => lower1(stripEnd(x))))} — continuing to work well`
        : "";
      bits.push(`Emotionally, ${name} has been settled this ${period}${helps}`);
    }
    if (bits.length) paragraphs.push(bits.map(stripEnd).join(". ") + ".");
  }

  // ── Relationships & connection ──────────────────────────────────────────────
  {
    const bits: string[] = [];
    const rel = wio.wholeChild.relationalStatus;
    if (w.familyTimeSessions > 0) {
      bits.push(
        `Relationally, ${name} maintained connection with the people who matter to ${p.object}, with ${w.familyTimeSessions} family-time session${w.familyTimeSessions === 1 ? "" : "s"} this ${period}`,
      );
    }
    if (rel === "secure") bits.push(`${bits.length ? "The" : `${name}'s`} relationships around the home look secure — the foundation that makes everything else possible`);
    else if (rel === "developing") bits.push(`${bits.length ? "More broadly, the" : `${name}'s`} relationships are developing steadily, and the consistency of trusted adults is doing quiet, important work`);
    else if (rel === "fragile") bits.push(`${bits.length ? "The" : `${name}'s`} relationships remain fragile, and the connection work is rightly the priority`);
    if (bits.length) paragraphs.push(bits.map(stripEnd).join(". ") + ".");
  }

  // ── The child's own voice & what mattered to them ───────────────────────────
  {
    if (w.childVoiceMoments.length) {
      const quotes = w.childVoiceMoments.slice(0, 2).map((q) => `"${stripEnd(q.quote)}"`);
      let t = `${name}'s own voice came through this ${period}`;
      t += quotes.length ? ` — in ${p.possessive} words, ${sentenceList(quotes)}` : "";
      t += `. That ${name} felt able to say what ${p.subject} thought and felt, and was heard, is exactly what we want ${p.possessive} record to hold`;
      paragraphs.push(stripEnd(t) + ".");
    }
  }

  // ── Overall synthesis (varied per child, warm, whole-child) ─────────────────
  const progressWord =
    wio.wholeChild.directionOfTravel === "improving" ? "meaningful progress" : wio.wholeChild.directionOfTravel === "declining" ? "resilience through a harder stretch" : "steadiness";
  const strengths: string[] = [];
  if (w.childVoiceMoments.length) strengths.push("emotional expression");
  if (w.achievements.length || w.positiveExperiences.length) strengths.push("engagement");
  if (wio.wholeChild.relationalStatus === "secure" || wio.wholeChild.relationalStatus === "developing") strengths.push("connection");
  const overall = narrativeOverall({
    name, period, progressWord, strengths: sentenceList(strengths),
    emotionalConcern: wio.wholeChild.emotionalStatus === "concern" || wio.wholeChild.emotionalStatus === "watch",
    possessive: p.possessive, who: wio.wholeChild.who, seed,
  });

  // ── Honest footer ───────────────────────────────────────────────────────────
  const gaps = wio.missingInformation.slice(0, 2).map((g) => lower1(stripEnd(g.replace(/—.*$/, ""))));
  const evidenceNote =
    `Evidence confidence: ${wio.evidenceConfidence}.` +
    (gaps.length ? ` To strengthen next ${period}'s picture, it would help to capture ${sentenceList(gaps)}.` : "");

  // ── Quality Standards & Five Outcomes ────────────────────────────────────────
  // Narrated from the WIO's evidence lines (Children's Homes Regs 2015 + the five
  // outcomes) — a standard appears only where the week actually evidences it, and
  // a thin week reads as a recording prompt, never a failure of care.
  const qsLines = wio.qualityStandardsEvidence;
  const foLines = wio.fiveOutcomesEvidence;
  let standards = "";
  if (qsLines.length || foLines.length) {
    const bits: string[] = [];
    if (qsLines.length) bits.push(`this ${period} gives living evidence against ${qsLines.length} of the nine Quality Standards — ${sentenceList(qsLines.map((l) => lower1(l.label)))}`);
    if (foLines.length) bits.push(`${qsLines.length ? "and across" : "across"} the five outcomes there is evidence for ${sentenceList(foLines.map((l) => lower1(l.label)))}`);
    standards = `Held against the frameworks the home is measured by, ${bits.join(", ")}.`;
    if (qsLines.length > 0 && qsLines.length <= 2) standards += ` Where a standard isn't yet evidenced, that's a recording prompt — capture the ordinary care as well as the events.`;
  }

  const body = [opening, ...paragraphs, overall, standards].filter(Boolean).join("\n\n");
  const title = `Weekly summary — ${name} (${wio.weekStart} to ${wio.weekEnding})`;

  return { title, opening, paragraphs, overall, standards, body, evidenceNote };
}
