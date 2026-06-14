"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraDiffViewer
//
// Side-by-side or inline diff view comparing original text with Cara-generated
// output. Helps staff see exactly what Cara changed before approving.
// Used in the approval workflow and command panel.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  Eye,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CaraDiffViewerProps {
  originalText: string;
  generatedText: string;
  commandLabel?: string;
  className?: string;
}

type ViewMode = "side_by_side" | "inline" | "generated_only";

/** Simple word-level diff — finds additions/removals */
function computeWordDiff(
  original: string,
  generated: string,
): Array<{ type: "same" | "added" | "removed"; text: string }> {
  const origWords = original.split(/(\s+)/);
  const genWords = generated.split(/(\s+)/);
  const result: Array<{ type: "same" | "added" | "removed"; text: string }> =
    [];

  // Simple LCS-based diff for readability
  let i = 0;
  let j = 0;
  while (i < origWords.length && j < genWords.length) {
    if (origWords[i] === genWords[j]) {
      result.push({ type: "same", text: origWords[i] });
      i++;
      j++;
    } else {
      // Look ahead in generated for a match
      let foundInGen = -1;
      for (let k = j + 1; k < Math.min(j + 10, genWords.length); k++) {
        if (origWords[i] === genWords[k]) {
          foundInGen = k;
          break;
        }
      }

      // Look ahead in original for a match
      let foundInOrig = -1;
      for (let k = i + 1; k < Math.min(i + 10, origWords.length); k++) {
        if (origWords[k] === genWords[j]) {
          foundInOrig = k;
          break;
        }
      }

      if (foundInGen !== -1 && (foundInOrig === -1 || foundInGen - j <= foundInOrig - i)) {
        // Words were added in generated
        for (let k = j; k < foundInGen; k++) {
          result.push({ type: "added", text: genWords[k] });
        }
        j = foundInGen;
      } else if (foundInOrig !== -1) {
        // Words were removed from original
        for (let k = i; k < foundInOrig; k++) {
          result.push({ type: "removed", text: origWords[k] });
        }
        i = foundInOrig;
      } else {
        // Direct replacement
        result.push({ type: "removed", text: origWords[i] });
        result.push({ type: "added", text: genWords[j] });
        i++;
        j++;
      }
    }
  }

  // Remaining words
  while (i < origWords.length) {
    result.push({ type: "removed", text: origWords[i] });
    i++;
  }
  while (j < genWords.length) {
    result.push({ type: "added", text: genWords[j] });
    j++;
  }

  return result;
}

/** Count changes in a diff */
function countChanges(
  diff: Array<{ type: "same" | "added" | "removed"; text: string }>,
): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const d of diff) {
    if (d.type === "added" && d.text.trim()) added++;
    if (d.type === "removed" && d.text.trim()) removed++;
  }
  return { added, removed };
}

export function CaraDiffViewer({
  originalText,
  generatedText,
  commandLabel,
  className,
}: CaraDiffViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("inline");
  const [expanded, setExpanded] = useState(true);

  const diff = useMemo(
    () => computeWordDiff(originalText, generatedText),
    [originalText, generatedText],
  );
  const { added, removed } = useMemo(() => countChanges(diff), [diff]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-4 py-3 border-b border-[var(--cs-border)] hover:bg-gray-50/50 transition-colors"
      >
        <ArrowLeftRight className="h-4 w-4 text-[var(--cs-cara-gold)]" />
        <span className="text-sm font-semibold text-[var(--cs-navy)]">
          Changes{commandLabel ? ` — ${commandLabel}` : ""}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          {added > 0 && (
            <span className="text-[10px] font-medium text-green-600 bg-green-50 rounded-full px-2 py-0.5">
              +{added} added
            </span>
          )}
          {removed > 0 && (
            <span className="text-[10px] font-medium text-red-600 bg-red-50 rounded-full px-2 py-0.5">
              −{removed} removed
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          )}
        </div>
      </button>

      {expanded && (
        <>
          {/* View mode toggle */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--cs-border)] bg-gray-50/50">
            {([
              { mode: "inline" as const, label: "Inline", icon: Eye },
              {
                mode: "side_by_side" as const,
                label: "Side by side",
                icon: ArrowLeftRight,
              },
              {
                mode: "generated_only" as const,
                label: "Result only",
                icon: Sparkles,
              },
            ] as const).map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors",
                  viewMode === mode
                    ? "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)] border border-[var(--cs-cara-gold-soft)]"
                    : "text-[var(--cs-text-muted)] hover:bg-gray-100",
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-4">
            {viewMode === "inline" && (
              <div className="text-sm leading-relaxed text-[var(--cs-text-secondary)]">
                {diff.map((d, i) => (
                  <span
                    key={i}
                    className={cn(
                      d.type === "added" &&
                        "bg-green-100 text-green-800 rounded px-0.5",
                      d.type === "removed" &&
                        "bg-red-100 text-red-800 line-through rounded px-0.5",
                    )}
                  >
                    {d.text}
                  </span>
                ))}
              </div>
            )}

            {viewMode === "side_by_side" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="h-3 w-3 text-[var(--cs-text-muted)]" />
                    <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">
                      Original
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed text-[var(--cs-text-secondary)] rounded-lg bg-gray-50 p-3">
                    {originalText}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)]" />
                    <span className="text-[10px] font-semibold text-[var(--cs-cara-gold)] uppercase tracking-wider">
                      Cara Output
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed text-[var(--cs-text-secondary)] rounded-lg bg-[var(--cs-cara-gold-bg)] p-3 border border-[var(--cs-cara-gold-soft)]">
                    {generatedText}
                  </div>
                </div>
              </div>
            )}

            {viewMode === "generated_only" && (
              <div className="text-sm leading-relaxed text-[var(--cs-text-secondary)]">
                {generatedText}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Expose pure helpers for testing
export const _testing = { computeWordDiff, countChanges };
