// ══════════════════════════════════════════════════════════════════════════════
// CARA — STRATEGY DISCUSSION REQUEST EXPORT (§31)
//
// Turns one StrategyDiscussionRequest into a pack a manager can take to the
// local authority: the eight reasoning sections in order, evidence separated
// by KIND and kept apart from interpretation / unknowns / alternative
// explanations, the Seven Threshold Reasoning Questions with whatever answers
// named humans have given, the manager's decision (or its absence), and the
// audit trail. Pure model + HTML + JSON here; the .docx renderer lives beside
// it so the model stays trivially testable.
//
// HARD RULE (matches the engine): Cara assembled and structured this record.
// The threshold judgement belongs to the named manager, and whether a strategy
// discussion is convened is the local authority's decision. The pack states
// this on every export and never phrases either judgement as Cara's.
// ══════════════════════════════════════════════════════════════════════════════

import {
  EVIDENCE_KIND_LABELS,
  SEVEN_THRESHOLD_QUESTIONS,
  STRATEGY_SECTION_LABELS,
  STRATEGY_SECTION_ORDER,
  type EvidenceKind,
  type StrategyDiscussionRequest,
  type StrategySectionKey,
} from "./types";
import { londonDateTimeStr } from "@/lib/utils";

export const STRATEGY_EXPORT_VERSION = "1.0.0";

export const ADVISORY_STATEMENT =
  "Cara assembled and structured this record from the home's existing records; every claim is traced to its sources. The threshold judgement and this request belong to the named manager, and whether a strategy discussion is convened is the local authority's decision. Nothing in this pack is Cara's judgement of significant harm.";

const NOT_COMPLETED = "Not yet completed.";
const NOT_ANSWERED = "Not yet answered.";

const STATUS_LABELS: Record<StrategyDiscussionRequest["status"], string> = {
  draft: "Draft — not yet decided by a manager",
  manager_approved: "Manager approved — strategy discussion requested",
  not_pursued: "Not pursued — threshold judged not met",
};

export interface StrategyExportModel {
  version: string;
  advisoryStatement: string;
  header: {
    requestId: string;
    childName: string;
    status: StrategyDiscussionRequest["status"];
    statusLabel: string;
    createdBy: string;
    createdAt: string;
    generatedAt: string;
  };
  /** The eight reasoning sections, always all eight, in canonical order. */
  sections: Array<{ key: StrategySectionKey; label: string; text: string; completed: boolean }>;
  /** Evidence separated by kind — all four kinds always present. */
  evidence: Array<{
    kind: EvidenceKind;
    label: string;
    items: Array<{ text: string; sourceCount: number }>;
  }>;
  /** Kept apart from the evidence itself, by design. */
  professionalInterpretation: string[];
  unknowns: string[];
  alternativeExplanations: string[];
  urgency: string;
  /** All seven questions, answered or explicitly not. */
  thresholdQuestions: Array<{
    question: string;
    answer: string;
    answeredBy: string | null;
    answeredAt: string | null;
    answered: boolean;
  }>;
  managerDecision: {
    decided: boolean;
    line: string;
    reasoning: string | null;
  };
  sourceRecordCount: number;
  auditTrail: Array<{ at: string; actor: string; action: string; detail: string | null }>;
}

export function buildStrategyExportModel(
  request: StrategyDiscussionRequest,
  generatedAt: string = new Date().toISOString(),
): StrategyExportModel {
  const sections = STRATEGY_SECTION_ORDER.map((key) => {
    const text = (request.sections[key] ?? "").trim();
    return {
      key,
      label: STRATEGY_SECTION_LABELS[key],
      text: text || NOT_COMPLETED,
      completed: text.length > 0,
    };
  });

  const kinds: EvidenceKind[] = ["direct", "reported", "observed", "pattern"];
  const evidence = kinds.map((kind) => ({
    kind,
    label: EVIDENCE_KIND_LABELS[kind],
    items: request.evidence
      .filter((e) => e.kind === kind)
      .map((e) => ({ text: e.text, sourceCount: e.sourceRecords.length })),
  }));

  const thresholdQuestions = SEVEN_THRESHOLD_QUESTIONS.map((question) => {
    const answered = request.thresholdAnswers.find((a) => a.question === question);
    return {
      question,
      answer: answered?.answer.trim() || NOT_ANSWERED,
      answeredBy: answered?.answeredBy ?? null,
      answeredAt: answered?.answeredAt ?? null,
      answered: !!answered?.answer.trim(),
    };
  });

  const d = request.managerDecision;
  const managerDecision = d
    ? {
        decided: true,
        line: `${d.requestDiscussion ? "Strategy discussion REQUESTED" : "Threshold judged NOT met"} — decided by ${d.decidedBy}${d.decidedByRole ? ` (${d.decidedByRole})` : ""} on ${d.decidedAt.slice(0, 10)}.`,
        reasoning: d.reasoning,
      }
    : {
        decided: false,
        line: "No manager decision recorded yet — this remains a draft, not a request.",
        reasoning: null,
      };

  return {
    version: STRATEGY_EXPORT_VERSION,
    advisoryStatement: ADVISORY_STATEMENT,
    header: {
      requestId: request.id,
      childName: request.childName || "Child",
      status: request.status,
      statusLabel: STATUS_LABELS[request.status],
      createdBy: request.createdBy,
      createdAt: request.createdAt,
      generatedAt,
    },
    sections,
    evidence,
    professionalInterpretation: request.professionalInterpretation,
    unknowns: request.unknowns,
    alternativeExplanations: request.alternativeExplanations,
    urgency: request.urgency,
    thresholdQuestions,
    managerDecision,
    sourceRecordCount: request.sourceRecords.length,
    auditTrail: request.auditTrail.map((a) => ({
      at: a.at,
      actor: a.actor,
      action: a.action,
      detail: a.detail ?? null,
    })),
  };
}

export function renderStrategyJson(model: StrategyExportModel): string {
  return JSON.stringify(model, null, 2);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderStrategyHtml(model: StrategyExportModel): string {
  const h = model.header;

  const sectionsHtml = model.sections
    .map(
      (s) => `
    <section class="reasoning ${s.completed ? "completed" : "incomplete"}">
      <h2>${esc(s.label)}</h2>
      <p>${esc(s.text)}</p>
    </section>`,
    )
    .join("");

  const evidenceHtml = model.evidence
    .map(
      (k) => `
    <section class="evidence-kind">
      <h3>${esc(k.label)}</h3>
      ${
        k.items.length
          ? `<ul>${k.items.map((i) => `<li>${esc(i.text)} <span class="sources">(${i.sourceCount} source record${i.sourceCount === 1 ? "" : "s"})</span></li>`).join("")}</ul>`
          : `<p class="none">None recorded.</p>`
      }
    </section>`,
    )
    .join("");

  const listBlock = (title: string, items: string[]) => `
    <section class="list-block">
      <h3>${esc(title)}</h3>
      ${items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : `<p class="none">None recorded.</p>`}
    </section>`;

  const questionsHtml = model.thresholdQuestions
    .map(
      (q, i) => `
    <section class="question ${q.answered ? "answered" : "unanswered"}">
      <h3>Q${i + 1}. ${esc(q.question)}</h3>
      <p>${esc(q.answer)}</p>
      ${q.answeredBy ? `<p class="byline">Answered by ${esc(q.answeredBy)}${q.answeredAt ? ` on ${esc(q.answeredAt.slice(0, 10))}` : ""}</p>` : ""}
    </section>`,
    )
    .join("");

  const auditHtml = model.auditTrail.length
    ? `<ul>${model.auditTrail
        .map((a) => `<li>${esc(londonDateTimeStr(a.at))} — ${esc(a.actor)}: ${esc(a.action)}${a.detail ? ` (${esc(a.detail)})` : ""}</li>`)
        .join("")}</ul>`
    : `<p class="none">No audit entries.</p>`;

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>Strategy Discussion Request — ${esc(h.childName)}</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; margin: 2.5rem auto; max-width: 48rem; color: #1a1a1a; line-height: 1.55; }
  header h1 { margin-bottom: 0.1rem; }
  .meta, .byline, .sources, .none { color: #555; font-size: 0.9rem; }
  .advisory { border: 1px solid #999; padding: 0.8rem 1rem; font-weight: 600; margin: 1.2rem 0; }
  section { margin: 1.1rem 0; }
  h2 { border-bottom: 1px solid #ccc; padding-bottom: 0.15rem; }
  .incomplete p, .unanswered p { color: #777; font-style: italic; }
  .decision { border-left: 4px solid #333; padding-left: 0.9rem; }
  @media print { body { margin: 0.5in; } }
</style>
</head>
<body>
<header>
  <h1>Strategy Discussion Request</h1>
  <p class="meta">${esc(h.childName)} · request ${esc(h.requestId)} · ${esc(h.statusLabel)}</p>
  <p class="meta">Raised by ${esc(h.createdBy)} on ${esc(h.createdAt.slice(0, 10))} · pack generated ${esc(londonDateTimeStr(h.generatedAt))} · v${esc(model.version)}</p>
</header>

<p class="advisory">${esc(model.advisoryStatement)}</p>

<h2>The eight reasoning sections</h2>
${sectionsHtml}

<h2>Evidence, separated by kind</h2>
${evidenceHtml}
${listBlock("Professional interpretation (kept apart from the evidence)", model.professionalInterpretation)}
${listBlock("What is genuinely unknown", model.unknowns)}
${listBlock("Alternative explanations considered", model.alternativeExplanations)}
<section><h3>Urgency</h3><p>${esc(model.urgency || "Not recorded.")}</p></section>

<h2>The Seven Threshold Reasoning Questions</h2>
${questionsHtml}

<h2>Manager decision</h2>
<section class="decision">
  <p><strong>${esc(model.managerDecision.line)}</strong></p>
  ${model.managerDecision.reasoning ? `<p>${esc(model.managerDecision.reasoning)}</p>` : ""}
</section>

<h2>Traceability</h2>
<p class="meta">${model.sourceRecordCount} source record${model.sourceRecordCount === 1 ? "" : "s"} linked. If Cara cannot trace it, Cara cannot claim it.</p>
${auditHtml}
</body>
</html>`;
}
