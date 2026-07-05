// ══════════════════════════════════════════════════════════════════════════════
// CARA — INSPECTION EVIDENCE PACK .docx RENDERER (§23)
//
// Renders the export model to a real Word (.docx) binary. Kept separate from the
// pure model/HTML/JSON so those stay trivially testable. Carries the no-grade
// statement; emits no grade vocabulary.
// ══════════════════════════════════════════════════════════════════════════════

import { Document, Packer, Paragraph, HeadingLevel, TextRun, Footer, PageNumber } from "docx";
import type { InspectionExportModel } from "./inspection-export";

export async function renderInspectionDocx(model: InspectionExportModel): Promise<Buffer> {
  const h = model.header;
  const body: Paragraph[] = [];

  body.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Inspection Evidence Pack")] }));
  body.push(new Paragraph({ children: [new TextRun({ text: `${h.homeName} · ${h.scopeLabel} · generated ${h.generatedAt}`, italics: true, size: 20 })] }));
  body.push(new Paragraph({ children: [new TextRun({ text: h.headline, size: 20 })] }));
  body.push(new Paragraph({ children: [new TextRun({ text: `Strong: ${h.areasStrong}   Developing: ${h.areasDeveloping}   Limited: ${h.areasLimited}`, size: 20 })] }));
  body.push(new Paragraph({ text: "" }));

  // The no-grade statement — prominent, bold.
  body.push(new Paragraph({ children: [new TextRun({ text: model.noGradeStatement, bold: true, size: 20 })] }));
  body.push(new Paragraph({ text: "" }));

  if (model.priorities.length) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Priority gaps to address first")] }));
    for (const p of model.priorities) {
      body.push(new Paragraph({ children: [new TextRun({ text: `${p.label} (${p.area})`, bold: true })] }));
      body.push(new Paragraph({ children: [new TextRun(p.detail)] }));
      if (p.children.length) body.push(new Paragraph({ children: [new TextRun({ text: `Children: ${p.children.join(", ")}`, italics: true, size: 18 })] }));
    }
    body.push(new Paragraph({ text: "" }));
  }

  for (const a of model.areas) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(a.label)] }));
    body.push(new Paragraph({ children: [new TextRun({ text: a.strengthLabel, italics: true })] }));
    body.push(new Paragraph({ children: [new TextRun(a.summary)] }));

    body.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Evidence available")] }));
    if (a.evidence.length) {
      for (const e of a.evidence) body.push(new Paragraph({ children: [new TextRun({ text: `• ${e.label} (${e.count}) — ${e.detail}` })] }));
    } else {
      body.push(new Paragraph({ children: [new TextRun({ text: "No evidence catalogued for this area yet.", italics: true })] }));
    }

    body.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Gaps an inspector may probe")] }));
    if (a.gaps.length) {
      for (const g of a.gaps) {
        body.push(new Paragraph({ children: [new TextRun({ text: `• [${g.severity}] ${g.label} — ${g.detail}` })] }));
        if (g.children.length) body.push(new Paragraph({ children: [new TextRun({ text: `   Children: ${g.children.join(", ")}`, italics: true, size: 18 })] }));
      }
    } else {
      body.push(new Paragraph({ children: [new TextRun({ text: "No open gaps flagged for this area.", italics: true })] }));
    }
    body.push(new Paragraph({ text: "" }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [new Paragraph({ children: [new TextRun({ text: "Cara Inspection Intelligence · no Ofsted grade predicted · page ", size: 16 }), new TextRun({ children: [PageNumber.CURRENT], size: 16 })] })],
          }),
        },
        children: body,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
