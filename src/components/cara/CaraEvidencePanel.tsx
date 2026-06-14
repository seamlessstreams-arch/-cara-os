"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  MessageSquare,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EvidenceItem } from "@/lib/cara/orchestrator/types";

// ══════════════════════════════════════════════════════════════════════════════
// CaraEvidencePanel — expandable panel showing evidence used in a response
//
// Renders each evidence item with type icon, title, date, excerpt, confidence
// bar, source link. Includes empty state and evidence-gap warnings.
// ══════════════════════════════════════════════════════════════════════════════

const SOURCE_ICONS: Record<string, typeof FileText> = {
  daily_log: ClipboardList,
  incident: AlertTriangle,
  key_work: MessageSquare,
  placement_plan: BookOpen,
  risk_assessment: ShieldCheck,
  regulation: FileText,
  default: FileText,
};

function getSourceIcon(sourceTable: string) {
  return SOURCE_ICONS[sourceTable] ?? SOURCE_ICONS.default;
}

function getConfidenceLevel(score: number): {
  label: string;
  color: string;
  width: string;
} {
  if (score >= 0.8) return { label: "High", color: "bg-emerald-500", width: `${score * 100}%` };
  if (score >= 0.5) return { label: "Medium", color: "bg-amber-500", width: `${score * 100}%` };
  return { label: "Low", color: "bg-red-400", width: `${score * 100}%` };
}

type CaraEvidencePanelProps = {
  evidence: EvidenceItem[];
  /** If true, show a warning that evidence gaps were detected */
  hasGaps?: boolean;
  className?: string;
};

export function CaraEvidencePanel({
  evidence,
  hasGaps = false,
  className,
}: CaraEvidencePanelProps) {
  const [expanded, setExpanded] = useState(false);

  const hasEvidence = evidence.length > 0;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="gap-1.5 text-[var(--cs-text-secondary)] hover:text-[var(--cs-navy)]"
      >
        <BookOpen className="size-4" />
        <span>
          Evidence ({evidence.length} source{evidence.length !== 1 ? "s" : ""})
        </span>
        {expanded ? (
          <ChevronUp className="size-3.5" />
        ) : (
          <ChevronDown className="size-3.5" />
        )}
      </Button>

      {expanded && (
        <div className="space-y-3">
          {/* Evidence gap warning */}
          {hasGaps && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                Evidence gaps detected — some areas lacked supporting documentation.
              </span>
            </div>
          )}

          {/* Empty state */}
          {!hasEvidence && (
            <div className="rounded-xl border border-dashed border-[var(--cs-border)] px-4 py-6 text-center text-sm text-[var(--cs-text-gentle)]">
              No evidence sources were used for this response.
            </div>
          )}

          {/* Evidence items */}
          {hasEvidence && (
            <div className="space-y-2">
              {evidence.map((item, index) => {
                const Icon = getSourceIcon(item.sourceTable);
                const confidence = getConfidenceLevel(item.relevanceScore);

                return (
                  <Card
                    key={`${item.sourceId}-${index}`}
                    className="p-3 hover:shadow-none"
                  >
                    <div className="space-y-2">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--cs-surface)] text-[var(--cs-text-secondary)]">
                            <Icon className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--cs-navy)]">
                              {item.sourceTitle ?? item.sourceTable.replace(/_/g, " ")}
                            </p>
                            {item.sourceDate && (
                              <p className="flex items-center gap-1 text-xs text-[var(--cs-text-gentle)]">
                                <Calendar className="size-3" />
                                {new Date(item.sourceDate).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Confidence badge */}
                        <Badge
                          variant={
                            confidence.label === "High"
                              ? "success"
                              : confidence.label === "Medium"
                                ? "warning"
                                : "destructive"
                          }
                          className="shrink-0 text-[10px]"
                        >
                          {confidence.label}
                        </Badge>
                      </div>

                      {/* Excerpt */}
                      {item.sourceExcerpt && (
                        <p className="line-clamp-2 text-xs leading-relaxed text-[var(--cs-text-secondary)]">
                          {item.sourceExcerpt}
                        </p>
                      )}

                      {/* Confidence bar */}
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn("h-full rounded-full transition-all", confidence.color)}
                            style={{ width: confidence.width }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--cs-text-gentle)]">
                          {Math.round(item.relevanceScore * 100)}%
                        </span>
                      </div>

                      {/* Regulation refs */}
                      {item.regulationRefs.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.regulationRefs.map((ref) => (
                            <Badge
                              key={ref}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {ref}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Source link */}
                      {item.sourceId && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs text-[var(--cs-info)] hover:underline"
                          onClick={() => {
                            // Navigate to the source record
                            window.open(
                              `/dashboard/records/${item.sourceTable}/${item.sourceId}`,
                              "_blank",
                            );
                          }}
                        >
                          <ExternalLink className="size-3" />
                          View source record
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
