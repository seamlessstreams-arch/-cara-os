// CARA STUDIO — splitting one generated output into what staff keep and what is handed to the child.
//
// A session plan carries its piece of work in `producedMaterial`; a material IS the piece of work, with the staff
// notes (guidance, safeguarding, signs to pause...) beside it. Printing the raw output mixed the two, so a child
// could be handed staff-only notes. This is pure so the split is testable: the hand-out holds only what is meant for
// the person doing the activity; everything else stays on the staff sheet.

export type HandoutBlock = { heading: string; body: string; childPrompt?: string; options?: string[] };
export type Handout = {
  materialType: string;
  title: string;
  intro: string;
  blocks: HandoutBlock[];
  lowWritingAlternative: string;
  /** "staff" for materials written for the adult (a script), which are not given to the child. */
  audience: "child" | "staff";
};

// Keys of a generated material that belong on the hand-out, or are production notes for whoever prepares it (kept on
// the staff sheet, not the hand-out).
const MATERIAL_KEYS = new Set(["materialType", "title", "childFriendlyIntro", "blocks", "printableText", "lowWritingAlternative"]);

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : "");

function blocksOf(v: unknown): HandoutBlock[] {
  if (!Array.isArray(v)) return [];
  const out: HandoutBlock[] = [];
  for (const b of v) {
    if (!isObj(b) || !str(b.heading) || !str(b.body)) continue;
    const options = Array.isArray(b.options) ? b.options.filter((o): o is string => typeof o === "string" && o.length > 0) : [];
    out.push({ heading: str(b.heading), body: str(b.body), ...(str(b.childPrompt) ? { childPrompt: str(b.childPrompt) } : {}), ...(options.length ? { options } : {}) });
  }
  return out;
}

function handoutFrom(m: Record<string, unknown>): Handout | null {
  const blocks = blocksOf(m.blocks);
  if (blocks.length === 0 || !str(m.title)) return null;
  const type = str(m.materialType);
  return {
    materialType: type, title: str(m.title), intro: str(m.childFriendlyIntro), blocks, lowWritingAlternative: str(m.lowWritingAlternative),
    audience: type === "staff_script" ? "staff" : "child",
  };
}

/** The piece of work inside an output, or null when the output has none (a plan with no material, a debrief...). */
export function extractHandout(output: Record<string, unknown> | null): Handout | null {
  if (!output) return null;
  if (isObj(output.producedMaterial)) return handoutFrom(output.producedMaterial);
  if (Array.isArray(output.blocks) && str(output.materialType)) return handoutFrom(output);
  return null;
}

/** The output without the piece of work: what prints on the staff sheet. Unchanged when there is no hand-out. */
export function staffSheetOf(output: Record<string, unknown>): Record<string, unknown> {
  if (!extractHandout(output)) return output;
  if (isObj(output.producedMaterial)) {
    const { producedMaterial: _drop, ...rest } = output;
    void _drop;
    return rest;
  }
  return Object.fromEntries(Object.entries(output).filter(([k]) => !MATERIAL_KEYS.has(k)));
}
