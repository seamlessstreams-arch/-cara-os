// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — batch rewrite engine
//
// Pure function that applies all "safe" (preservesMeaning:true, literal
// replacement, no human judgement required) fixes in a single back-to-front
// pass so earlier offsets stay valid after each replacement.
//
// Safeguarding and guidance issues are NEVER auto-applied here — they carry
// requiresHumanJudgement:true and/or have no literal replacementText.
// ══════════════════════════════════════════════════════════════════════════════

import type { WritingIssue } from "./types";

function isAutoFixable(issue: WritingIssue): boolean {
  if (issue.requiresHumanJudgement) return false;
  const fix = issue.suggestions[0];
  return Boolean(fix?.preservesMeaning && fix.replacementText.trim().length > 0);
}

/**
 * Applies all auto-fixable suggestions in a single pass and returns the
 * rewritten text plus the list of issues that were actually applied.
 */
export function applyAutoFixes(
  text: string,
  issues: WritingIssue[],
): { text: string; applied: WritingIssue[] } {
  const applicable = issues.filter(isAutoFixable).sort((a, b) => b.start - a.start);

  let result = text;
  const applied: WritingIssue[] = [];
  for (const issue of applicable) {
    if (result.slice(issue.start, issue.end) === issue.originalText) {
      result =
        result.slice(0, issue.start) +
        issue.suggestions[0].replacementText +
        result.slice(issue.end);
      applied.push(issue);
    }
  }
  return { text: result, applied };
}

/** Number of auto-fixable issues in the list. */
export function countAutoFixes(issues: WritingIssue[]): number {
  return issues.filter(isAutoFixable).length;
}
