// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD PRACTICE-INTELLIGENCE PACK .docx RENDERER (§31)
//
// Renders the export model to a real Word (.docx) binary. Kept separate from
// the pure model/HTML/JSON so those stay trivially testable. Carries the
// child statement, every dimension's confidence and gaps, and the
// contradictions / missing-information flags verbatim.
// ══════════════════════════════════════════════════════════════════════════════

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { ChildTwinExportModel } from "./child-twin-export";

export async function renderChildTwinDocx(model: ChildTwinExportModel): Promise<Buffer> {
  const h = model.header;
  const body: Paragraph[] = [];

  body.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Child Practice-Intelligence Pack")] }));
  body.push(new Paragraph({ children: [new TextRun({ text: h.childName, italics: true, size: 22 })] }));
  body.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Twin generated ${h.generatedAt.slice(0, 16).replace("T", " ")} · pack generated ${h.packGeneratedAt.slice(0, 16).replace("T", " ")} · engine v${h.engineVersion} · export v${model.version}`,
          size: 18,
        }),
      ],
    }),
  );
  body.push(new Paragraph({ text: "" }));

  body.push(new Paragraph({ children: [new TextRun({ text: model.childStatement, bold: true, size: 20 })] }));
  body.push(new Paragraph({ text: "" }));

  for (const s of model.sections) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`${s.label} — ${s.confidenceLabel}`)] }));
    if (s.lines.length === 0) {
      body.push(new Paragraph({ children: [new TextRun({ text: "Nothing on record for this dimension.", italics: true, size: 18 })] }));
    }
    for (const line of s.lines) {
      body.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(line)] }));
    }
    body.push(
      new Paragraph({
        children: [new TextRun({ text: `${s.evidenceCount} evidence record${s.evidenceCount === 1 ? "" : "s"}`, italics: true, size: 18 })],
      }),
    );
    if (s.gaps.length) {
      body.push(new Paragraph({ children: [new TextRun({ text: `Gaps: ${s.gaps.join("; ")}`, italics: true, size: 18 })] }));
    }
  }

  const flagBlock = (title: string, items: string[], emptyText: string) => {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] }));
    if (items.length === 0) {
      body.push(new Paragraph({ children: [new TextRun({ text: emptyText, italics: true, size: 18 })] }));
      return;
    }
    for (const item of items) body.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(item)] }));
  };
  flagBlock("Where the picture disagrees with itself — review prompts, not verdicts", model.contradictions, "No contradictions flagged.");
  flagBlock("What Cara does not know about this child — a gap is intelligence too", model.missingInformation, "No missing-information flags.");

  const doc = new Document({ sections: [{ children: body }] });
  return Packer.toBuffer(doc);
}
