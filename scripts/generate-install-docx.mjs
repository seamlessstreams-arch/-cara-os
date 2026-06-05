// Editable Word version of the install guide. Run: node scripts/generate-install-docx.mjs
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, LevelFormat, BorderStyle, WidthType, ShadingType, VerticalAlign, HeadingLevel,
} from "docx";
import { readFileSync, writeFileSync } from "node:fs";

const TEAL = "119488", NAVY = "0f1e36", GREY = "56627a", MUTED = "8a93a6", CORAL = "d9685c";
const QR = "/Users/darrenlaville/cornerstone-v2/docs/install-guide/cornerstone-install-qr.png";
const OUT = "/Users/darrenlaville/cornerstone-v2/docs/install-guide/Cornerstone-Install-Guide.docx";
const CW = 9026; // content width (A4, 1" margins)

const stepRef = (id, steps) =>
  steps.map((t) => new Paragraph({
    numbering: { reference: id, level: 0 },
    spacing: { after: 70 },
    children: [new TextRun({ text: t, size: 21, color: NAVY })],
  }));

function deviceCell(width, title, tag, ref, steps) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 120, bottom: 120, left: 150, right: 150 },
    borders: { top: B, bottom: B, left: B, right: B },
    verticalAlign: VerticalAlign.TOP,
    children: [
      new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: title, bold: true, size: 24, color: NAVY })] }),
      new Paragraph({ spacing: { after: 110 }, children: [new TextRun({ text: tag, size: 18, color: MUTED })] }),
      ...stepRef(ref, steps),
    ],
  });
}

const B = { style: BorderStyle.SINGLE, size: 4, color: "e6e9ef" };

const doc = new Document({
  numbering: {
    config: ["ios", "android", "pc"].map((reference) => ({
      reference,
      levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 340, hanging: 240 } } } }],
    })),
  },
  styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1080, right: 1440, bottom: 900, left: 1440 } } },
    children: [
      // Title
      new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: "Install Cornerstone", bold: true, size: 48, color: NAVY })] }),
      new Paragraph({
        spacing: { after: 60 }, border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: TEAL, space: 8 } },
        children: [new TextRun({ text: "Care OS for Children’s Homes — add it to your phone, tablet or computer in under a minute.", size: 22, color: GREY })],
      }),

      // Address + QR row
      new Table({
        width: { size: CW, type: WidthType.DXA }, columnWidths: [5826, 3200],
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
        rows: [new TableRow({ children: [
          new TableCell({
            width: { size: 5826, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "f1faf7", type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 200, right: 160 },
            children: [
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "OPEN THIS ADDRESS IN YOUR BROWSER", bold: true, size: 16, color: "0b6f66" })] }),
              new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "cornerstone-v2-fresh.vercel.app", bold: true, size: 30, color: NAVY })] }),
              new Paragraph({ children: [new TextRun({ text: "There’s no App Store download — Cornerstone installs straight from the web, then gets its own icon and opens full-screen like a normal app.", size: 19, color: GREY })] }),
            ],
          }),
          new TableCell({
            width: { size: 3200, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, shading: { fill: "f1faf7", type: ShadingType.CLEAR },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new ImageRun({ type: "png", data: readFileSync(QR), transformation: { width: 132, height: 132 }, altText: { title: "Install QR code", description: "QR code linking to the Cornerstone install page", name: "QR" } })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Scan to open", bold: true, size: 17, color: MUTED })] }),
            ],
          }),
        ] })],
      }),

      new Paragraph({ spacing: { after: 60 }, children: [] }),

      // Three device sections
      new Table({
        width: { size: CW, type: WidthType.DXA }, columnWidths: [3009, 3008, 3009],
        rows: [new TableRow({ children: [
          deviceCell(3009, "📱 iPhone / iPad", "Use Safari (not Chrome)", "ios", [
            "Open Safari and go to the address above", "Tap the Share button (square with an up-arrow)", "Tap Add to Home Screen", "Tap Add — the Cornerstone icon appears" ]),
          deviceCell(3008, "🤖 Android", "Use Chrome", "android", [
            "Open Chrome and go to the address above", "Tap the Install app prompt, or the ⋮ menu", "Choose Install app / Add to Home screen", "Confirm Install — it’s added to your apps" ]),
          deviceCell(3009, "💻 Computer", "Chrome or Edge", "pc", [
            "Open Chrome/Edge and go to the address above", "Click the install icon in the address bar", "Or ⋮ menu → Install Cornerstone…", "It opens in its own window" ]),
        ] })],
      }),

      new Paragraph({ spacing: { after: 60 }, children: [] }),

      // Good to know box
      new Table({
        width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
        rows: [new TableRow({ children: [new TableCell({
          width: { size: CW, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 200, right: 200 },
          children: [
            new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "Good to know", bold: true, size: 24, color: "ffffff" })] }),
            new Paragraph({ spacing: { after: 50 }, children: [new TextRun({ text: "✅  Free", bold: true, size: 20, color: "ffffff" }), new TextRun({ text: "  — no account or app store needed", size: 20, color: "c6cedd" })] }),
            new Paragraph({ spacing: { after: 50 }, children: [new TextRun({ text: "🔄  Auto-updates", bold: true, size: 20, color: "ffffff" }), new TextRun({ text: "  — always the latest version", size: 20, color: "c6cedd" })] }),
            new Paragraph({ spacing: { after: 50 }, children: [new TextRun({ text: "📶  Works on a weak signal", bold: true, size: 20, color: "ffffff" }), new TextRun({ text: "  — the app still opens offline", size: 20, color: "c6cedd" })] }),
            new Paragraph({ children: [new TextRun({ text: "🔒  Safety:", bold: true, size: 20, color: CORAL }), new TextRun({ text: "  live care data is never shown offline by design — a banner makes the offline state clear.", size: 20, color: "c6cedd" })] }),
          ],
        })] })],
      }),

      new Paragraph({ spacing: { before: 160 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Cornerstone — Oak House. If a step looks different, your browser may have moved a menu; the option is always called Install or Add to Home Screen.", size: 17, color: MUTED })] }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
writeFileSync(OUT, buf);
console.log("wrote", OUT, buf.length, "bytes");
