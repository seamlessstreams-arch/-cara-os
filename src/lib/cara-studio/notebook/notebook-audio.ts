// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO NOTEBOOK — audio briefing script (pure)
//
// Cara's answer to a NotebookLM "Audio Overview": a two-voice briefing SCRIPT
// composed deterministically from the live-safe whole-child briefing. It is read
// aloud / recorded / played with the browser's text-to-speech — we never
// GENERATE audio (nothing to hallucinate), and every line only says what the
// records show. Host frames the conversation; Analyst answers from the briefing.
// ══════════════════════════════════════════════════════════════════════════════

import type { NotebookBriefing } from "./notebook-briefing";

export type AudioSpeaker = "Host" | "Analyst";
export interface AudioLine { speaker: AudioSpeaker; text: string }
export interface NotebookAudioScript {
  title: string;
  intro: string;
  lines: AudioLine[];
  wordCount: number;
  durationLabel: string;
}

function joinNicely(xs: string[]): string {
  const clean = xs.map((x) => x.replace(/\.$/, "").trim()).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]}, and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

export function buildNotebookAudioScript(b: NotebookBriefing): NotebookAudioScript {
  const name = b.firstName;
  const window = b.windowLabel.split("·")[0].trim().toLowerCase();
  const lines: AudioLine[] = [];
  const H = (text: string) => lines.push({ speaker: "Host", text });
  const A = (text: string) => lines.push({ speaker: "Analyst", text });

  H(`Welcome to this week's briefing on ${name}. We're looking at the ${window}. So — what's the overall picture?`);
  A(b.headline);

  if (b.needsYou.length) {
    H("What needs the team's attention?");
    for (const s of b.needsYou) A(s.text);
  } else {
    H("Anything flagged for attention?");
    A("No — nothing's flagged this fortnight. A settled picture.");
  }

  if (b.working.length) {
    H("And what's going well?");
    for (const s of b.working) A(s.text);
  }

  if (b.gaps.length) {
    H("Is there anything the record doesn't tell us?");
    A(`A few gaps worth naming: ${joinNicely(b.gaps)}. And importantly — Cara flags these rather than guessing at them.`);
  }

  H(`Thanks. That's ${name}'s fortnight — every line straight from the records, nothing invented. We'll pick it up again next week.`);

  const wordCount = lines.reduce((n, l) => n + l.text.split(/\s+/).filter(Boolean).length, 0);
  const mins = Math.max(1, Math.round(wordCount / 150));
  return {
    title: `${name} — weekly audio briefing`,
    intro: "A two-voice briefing you can read aloud, record, or play with your device's text-to-speech. Deterministic — it only says what the records show.",
    lines,
    wordCount,
    durationLabel: `about ${mins} min`,
  };
}
