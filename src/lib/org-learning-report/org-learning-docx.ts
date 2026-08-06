// ══════════════════════════════════════════════════════════════════════════════
// CARA — ORGANISATIONAL LEARNING LEADERSHIP PACK .docx RENDERER (§31)
//
// Renders the export model to a real Word (.docx) binary. Kept separate from
// the pure model/HTML/JSON so those stay trivially testable. Carries the
// engine's disclaimer and the "not enough data" honesty verbatim.
// ══════════════════════════════════════════════════════════════════════════════

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { OrgLearningExportModel } from "./org-learning-export";

export async function renderOrgLearningDocx(model: OrgLearningExportModel): Promise<Buffer> {
  const h = model.header;
  const body: Paragraph[] = [];

  body.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Organisational Learning")] }));
  body.push(
    new Paragraph({
      children: [new TextRun({ text: `${h.homeName} · ${h.periodLabel} (last ${h.windowDays} days, as of ${h.asOf})`, italics: true, size: 20 })],
    }),
  );
  body.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Pack generated ${h.generatedAt.slice(0, 16).replace("T", " ")} · engine v${h.engineVersion} · export v${model.version}`,
          size: 18,
        }),
      ],
    }),
  );
  body.push(new Paragraph({ text: "" }));

  body.push(new Paragraph({ children: [new TextRun({ text: model.headline, bold: true, size: 22 })] }));
  body.push(new Paragraph({ text: "" }));

  for (const s of model.sections) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(s.label)] }));
    if (s.insufficientData) {
      body.push(new Paragraph({ children: [new TextRun({ text: s.insufficientDataStatement ?? "", italics: true, size: 18 })] }));
      continue;
    }
    if (s.themes.length === 0) {
      body.push(new Paragraph({ children: [new TextRun({ text: "Looked, and found nothing this period.", italics: true, size: 18 })] }));
      continue;
    }
    for (const t of s.themes) {
      body.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({ text: `[${t.weightLabel}] `, bold: true }),
            new TextRun({ text: t.title, bold: true }),
            new TextRun({ text: ` — ${t.detail}` }),
            new TextRun({ text: `  (${t.evidenceCount} evidence record${t.evidenceCount === 1 ? "" : "s"})`, italics: true, size: 18 }),
          ],
        }),
      );
    }
  }

  body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Coverage and regulation")] }));
  body.push(
    new Paragraph({
      children: [new TextRun({ text: `${model.totalEvidence} evidence record${model.totalEvidence === 1 ? "" : "s"} across the period.`, size: 18 })],
    }),
  );
  for (const r of model.regulatoryLinks) {
    body.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: r, size: 18 })] }));
  }

  body.push(new Paragraph({ text: "" }));
  body.push(new Paragraph({ children: [new TextRun({ text: model.disclaimer, bold: true, size: 20 })] }));

  const doc = new Document({ sections: [{ children: body }] });
  return Packer.toBuffer(doc);
}
