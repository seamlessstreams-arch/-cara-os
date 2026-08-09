// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF DEVELOPMENT PACK .docx RENDERER (§31)
//
// Renders the export model to a real Word (.docx) binary. Kept separate from
// the pure model/HTML/JSON so those stay trivially testable. Carries the tone
// note, the no-data honesty and the engine's disclaimer verbatim.
// ══════════════════════════════════════════════════════════════════════════════

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { StaffSkillsExportModel } from "./staff-skills-export";
import { londonDateTimeStr } from "@/lib/utils";

export async function renderStaffSkillsDocx(model: StaffSkillsExportModel): Promise<Buffer> {
  const h = model.header;
  const body: Paragraph[] = [];

  body.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Staff Development Pack")] }));
  body.push(
    new Paragraph({
      children: [new TextRun({ text: `${h.staffName} · last ${h.windowDays} days, as of ${h.asOf}`, italics: true, size: 20 })],
    }),
  );
  body.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Pack generated ${londonDateTimeStr(h.generatedAt)} · engine v${h.engineVersion} · export v${model.version}`,
          size: 18,
        }),
      ],
    }),
  );
  body.push(new Paragraph({ text: "" }));

  body.push(new Paragraph({ children: [new TextRun({ text: model.toneNote, bold: true, size: 20 })] }));
  if (model.noDataStatement) {
    body.push(new Paragraph({ children: [new TextRun({ text: model.noDataStatement, italics: true, size: 20 })] }));
  }
  body.push(new Paragraph({ text: "" }));

  body.push(new Paragraph({ children: [new TextRun({ text: `Overall picture: ${model.overallLabel}`, bold: true, size: 22 })] }));
  body.push(new Paragraph({ text: "" }));

  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("The five practice lenses")] }));
  for (const l of model.lenses) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`${l.label} — ${l.signalLabel}`)] }));
    body.push(new Paragraph({ children: [new TextRun(l.detail)] }));
    body.push(
      new Paragraph({
        children: [new TextRun({ text: `${l.sourceCount} source record${l.sourceCount === 1 ? "" : "s"}`, italics: true, size: 18 })],
      }),
    );
  }

  const listBlock = (title: string, items: string[]) => {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] }));
    if (items.length === 0) {
      body.push(new Paragraph({ children: [new TextRun({ text: "None recorded in this window.", italics: true, size: 18 })] }));
      return;
    }
    for (const item of items) body.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(item)] }));
  };
  listBlock("Strengths", model.strengths);
  listBlock("Growing edges", model.developmentAreas);

  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Supervision prompts")] }));
  if (model.promptGroups.length === 0) {
    body.push(new Paragraph({ children: [new TextRun({ text: "No supervision prompts generated for this window.", italics: true, size: 18 })] }));
  }
  for (const g of model.promptGroups) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(g.label)] }));
    for (const p of g.prompts) body.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(p)] }));
  }

  body.push(new Paragraph({ text: "" }));
  body.push(new Paragraph({ children: [new TextRun({ text: model.disclaimer, bold: true, size: 20 })] }));

  const doc = new Document({ sections: [{ children: body }] });
  return Packer.toBuffer(doc);
}
