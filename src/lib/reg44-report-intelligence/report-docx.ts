// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 REPORT .docx RENDERER
//
// Renders the export model to a real Word (.docx) binary using the `docx`
// library, matching the A–Q form headings with a title, meta line, page
// numbering and the sign-off + addenda. Kept separate from the pure model so the
// model/HTML/JSON stay trivially testable.
// ══════════════════════════════════════════════════════════════════════════════

import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, Footer, PageNumber } from "docx";
import type { Reg44ExportModel } from "./report-export";

export async function renderReg44Docx(model: Reg44ExportModel): Promise<Buffer> {
  const h = model.header;
  const body: Paragraph[] = [];

  body.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Regulation 44 Independent Visitor — Monthly Visit Report")] }));
  body.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${h.homeName}${h.ofstedUrn ? ` · URN ${h.ofstedUrn}` : ""} · Reporting month: ${h.month}`, italics: true, size: 20 }),
      ],
    }),
  );
  if (h.visitorName || h.visitDate) {
    body.push(new Paragraph({ children: [new TextRun({ text: `Visitor: ${h.visitorName || "—"}   Visit date: ${h.visitDate || "—"}`, size: 20 })] }));
  }
  body.push(new Paragraph({ text: "" }));

  for (const s of model.sections) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`${s.key}. ${s.label}`)] }));
    for (const line of (s.content || "").split("\n")) {
      body.push(new Paragraph({ children: [new TextRun(line)] }));
    }
  }

  body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Sign-off and distribution")] }));
  if (model.signOff.signed) {
    body.push(new Paragraph({ children: [new TextRun({ text: `Signed off: ${model.signOff.decision} by ${model.signOff.signedBy} on ${model.signOff.signedAt}. This report is locked.`, bold: true })] }));
    if (model.signOff.overrideReason) body.push(new Paragraph({ children: [new TextRun(`Override reason: ${model.signOff.overrideReason}`)] }));
  } else {
    body.push(new Paragraph({ children: [new TextRun({ text: "Not yet signed off.", italics: true })] }));
  }

  if (model.addenda.length) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Addenda")] }));
    for (const a of model.addenda) {
      body.push(new Paragraph({ children: [new TextRun({ text: `${a.at} — ${a.author}: `, bold: true }), new TextRun(a.text)] }));
    }
  }

  body.push(new Paragraph({ text: "" }));
  body.push(new Paragraph({ children: [new TextRun({ text: model.disclaimer, italics: true, size: 18, color: "666666" })] }));

  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], size: 16 })] })],
          }),
        },
        children: body,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
