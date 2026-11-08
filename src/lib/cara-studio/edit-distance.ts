// ══════════════════════════════════════════════════════════════════════════════
// ARTEFACT EDIT DISTANCE — deterministic, per-section change scoring.
//
// Phase 1.3. When an AI-drafted artefact is committed, we record HOW MUCH a human
// changed per section (0 = untouched … 100 = fully rewritten) — never the full
// text (no duplication of child content), only the scores. Pure + keyless.
// ══════════════════════════════════════════════════════════════════════════════

export interface SectionEditScore {
  section_key: string;
  /** 0 (unchanged) … 100 (completely rewritten). */
  change_score: number;
  ai_len: number;
  committed_len: number;
}

function words(text: string): string[] {
  return (text ?? "").toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

function countMap(ws: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const w of ws) m.set(w, (m.get(w) ?? 0) + 1);
  return m;
}

/**
 * Word-level change ratio 0..100 — the symmetric multiset difference of words
 * over the total word count. Deterministic and cheap (no O(n·m) edit distance),
 * robust to reordering within a section.
 */
export function wordChangeScore(a: string, b: string): number {
  const wa = words(a);
  const wb = words(b);
  if (wa.length === 0 && wb.length === 0) return 0;
  const ca = countMap(wa);
  const cb = countMap(wb);
  let changed = 0;
  for (const [w, n] of ca) changed += Math.max(0, n - (cb.get(w) ?? 0));
  for (const [w, n] of cb) changed += Math.max(0, n - (ca.get(w) ?? 0));
  const total = wa.length + wb.length;
  return Math.round((100 * changed) / total);
}

/**
 * Split content into named sections by markdown headings (`# …`) or bold labels
 * (`**Label**`). Content with no headings becomes a single "body" section.
 */
export function splitSections(text: string): { key: string; body: string }[] {
  const lines = (text ?? "").split(/\r?\n/);
  const sections: { key: string; body: string[] }[] = [];
  let current: { key: string; body: string[] } | null = null;

  const headingOf = (line: string): string | null => {
    const md = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (md) return md[1].trim();
    const bold = line.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (bold) return bold[1].trim();
    return null;
  };

  for (const line of lines) {
    const h = headingOf(line);
    if (h !== null) {
      current = { key: h.toLowerCase(), body: [] };
      sections.push(current);
    } else {
      if (!current) {
        current = { key: "body", body: [] };
        sections.push(current);
      }
      current.body.push(line);
    }
  }

  return sections.map((s) => ({ key: s.key, body: s.body.join("\n").trim() }));
}

/**
 * Per-section change scores between the original AI draft and the committed
 * (possibly human-edited) version. Sections present on only one side score 100.
 */
export function sectionEditScores(aiDraft: string, committed: string): SectionEditScore[] {
  const mapA = new Map(splitSections(aiDraft).map((s) => [s.key, s.body]));
  const mapC = new Map(splitSections(committed).map((s) => [s.key, s.body]));

  const keys: string[] = [];
  for (const k of [...mapA.keys(), ...mapC.keys()]) if (!keys.includes(k)) keys.push(k);

  return keys.map((k) => {
    const a = mapA.get(k) ?? "";
    const b = mapC.get(k) ?? "";
    return { section_key: k, change_score: wordChangeScore(a, b), ai_len: a.length, committed_len: b.length };
  });
}
