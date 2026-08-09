// ══════════════════════════════════════════════════════════════════════════════
// CARA — STRATEGY DISCUSSION REQUEST .docx RENDERER (§31)
//
// Renders the export model to a real Word (.docx) binary. Kept separate from
// the pure model/HTML/JSON so those stay trivially testable. Carries the
// advisory statement; phrases no judgement as Cara's.
// ══════════════════════════════════════════════════════════════════════════════

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { StrategyExportModel } from "./strategy-export";
import { londonDateTimeStr } from "@/lib/utils";

export async function renderStrategyDocx(model: StrategyExportModel): Promise<Buffer> {
  const h = model.header;
  const body: Paragraph[] = [];

  body.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Strategy Discussion Request")] }));
  body.push(new Paragraph({ children: [new TextRun({ text: `${h.childName} · request ${h.requestId} · ${h.statusLabel}`, italics: true, size: 20 })] }));
  body.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Raised by ${h.createdBy} on ${h.createdAt.slice(0, 10)} · pack generated ${londonDateTimeStr(h.generatedAt)} · v${model.version}`,
          size: 18,
        }),
      ],
    }),
  );
  body.push(new Paragraph({ text: "" }));

  // The advisory statement — prominent, bold.
  body.push(new Paragraph({ children: [new TextRun({ text: model.advisoryStatement, bold: true, size: 20 })] }));
  body.push(new Paragraph({ text: "" }));

  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("The eight reasoning sections")] }));
  for (const s of model.sections) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(s.label)] }));
    body.push(new Paragraph({ children: [new TextRun({ text: s.text, italics: !s.completed })] }));
  }

  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Evidence, separated by kind")] }));
  for (const kind of model.evidence) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(kind.label)] }));
    if (kind.items.length === 0) {
      body.push(new Paragraph({ children: [new TextRun({ text: "None recorded.", italics: true, size: 18 })] }));
    }
    for (const item of kind.items) {
      body.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun(item.text),
            new TextRun({ text: `  (${item.sourceCount} source record${item.sourceCount === 1 ? "" : "s"})`, italics: true, size: 18 }),
          ],
        }),
      );
    }
  }

  const listBlock = (title: string, items: string[]) => {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(title)] }));
    if (items.length === 0) {
      body.push(new Paragraph({ children: [new TextRun({ text: "None recorded.", italics: true, size: 18 })] }));
      return;
    }
    for (const item of items) body.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(item)] }));
  };
  listBlock("Professional interpretation (kept apart from the evidence)", model.professionalInterpretation);
  listBlock("What is genuinely unknown", model.unknowns);
  listBlock("Alternative explanations considered", model.alternativeExplanations);
  body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Urgency")] }));
  body.push(new Paragraph({ children: [new TextRun(model.urgency || "Not recorded.")] }));

  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("The Seven Threshold Reasoning Questions")] }));
  model.thresholdQuestions.forEach((q, i) => {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`Q${i + 1}. ${q.question}`)] }));
    body.push(new Paragraph({ children: [new TextRun({ text: q.answer, italics: !q.answered })] }));
    if (q.answeredBy) {
      body.push(
        new Paragraph({
          children: [new TextRun({ text: `Answered by ${q.answeredBy}${q.answeredAt ? ` on ${q.answeredAt.slice(0, 10)}` : ""}`, italics: true, size: 18 })],
        }),
      );
    }
  });

  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Manager decision")] }));
  body.push(new Paragraph({ children: [new TextRun({ text: model.managerDecision.line, bold: true })] }));
  if (model.managerDecision.reasoning) {
    body.push(new Paragraph({ children: [new TextRun(model.managerDecision.reasoning)] }));
  }

  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Traceability")] }));
  body.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${model.sourceRecordCount} source record${model.sourceRecordCount === 1 ? "" : "s"} linked. If Cara cannot trace it, Cara cannot claim it.`,
          size: 18,
        }),
      ],
    }),
  );
  for (const a of model.auditTrail) {
    body.push(
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: `${londonDateTimeStr(a.at)} — ${a.actor}: ${a.action}${a.detail ? ` (${a.detail})` : ""}`, size: 18 })],
      }),
    );
  }

  const doc = new Document({ sections: [{ children: body }] });
  return Packer.toBuffer(doc);
}
