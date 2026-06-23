// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — word-level diff
//
// Pure, deterministic longest-common-subsequence diff between the original text
// and a rewrite, so staff can see EXACTLY what changed before they apply it.
// Lossless: tokens are words + the whitespace between them, so the segments
// reconstruct both the original and the rewritten text exactly. No network.
// ══════════════════════════════════════════════════════════════════════════════

export type DiffOp = "same" | "added" | "removed";

export interface DiffSegment {
  type: DiffOp;
  text: string;
}

/** Split into words and the whitespace runs between them (kept, for lossless diff). */
function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

/**
 * Word-level diff of `before` → `after`. Returns ordered segments tagged
 * same / added / removed. Adjacent segments of the same type are merged.
 */
export function diffWords(before: string, after: string): DiffSegment[] {
  const a = tokenize(before);
  const b = tokenize(after);
  const m = a.length;
  const n = b.length;

  // LCS length table (dp[i][j] = LCS of a[i..], b[j..]).
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Backtrack into raw per-token ops.
  const raw: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      raw.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      raw.push({ type: "removed", text: a[i] });
      i++;
    } else {
      raw.push({ type: "added", text: b[j] });
      j++;
    }
  }
  while (i < m) raw.push({ type: "removed", text: a[i++] });
  while (j < n) raw.push({ type: "added", text: b[j++] });

  // Merge adjacent same-type segments for compact rendering.
  const merged: DiffSegment[] = [];
  for (const seg of raw) {
    const last = merged[merged.length - 1];
    if (last && last.type === seg.type) last.text += seg.text;
    else merged.push({ ...seg });
  }
  return merged;
}

/** Whether the rewrite changed anything. */
export function hasChanges(segments: DiffSegment[]): boolean {
  return segments.some((s) => s.type !== "same");
}

/** Count of added / removed word-runs — a compact "N changes" summary. */
export function changeCount(segments: DiffSegment[]): number {
  return segments.filter((s) => s.type !== "same").length;
}
