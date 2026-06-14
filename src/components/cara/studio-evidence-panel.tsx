"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, AlertTriangle, CheckCircle } from "lucide-react";
import type { CaraSource } from "@/types/cara-studio";
import { CARA_SOURCE_TYPE_LABELS } from "@/types/cara-studio";
import { formatDistanceToNow } from "date-fns";

interface CaraStudioEvidencePanelProps {
  sources: CaraSource[];
  confidenceScore: number | null;
  onAddSource?: () => void;
}

const CONFIDENCE_COLOURS: Record<string, string> = {
  approved: "text-green-700 bg-green-50",
  pending: "text-yellow-700 bg-yellow-50",
  unverified: "text-red-700 bg-red-50",
};

export function CaraStudioEvidencePanel({
  sources,
  confidenceScore,
  onAddSource,
}: CaraStudioEvidencePanelProps) {
  return (
    <div className="space-y-4">
      {/* Overall confidence */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Evidence confidence</span>
        <Badge
          variant="outline"
          className={
            (confidenceScore ?? 0) >= 70
              ? "text-green-700 border-green-200"
              : (confidenceScore ?? 0) >= 40
                ? "text-yellow-700 border-yellow-200"
                : "text-red-600 border-red-200"
          }
        >
          {confidenceScore !== null ? `${confidenceScore}%` : "Not scored"}
        </Badge>
      </div>

      {/* Source count */}
      <div className="text-xs text-muted-foreground">
        {sources.length} source{sources.length !== 1 ? "s" : ""} used
        {sources.length === 0 && " — output is based on general practice guidance only"}
      </div>

      {/* Warning if no sources */}
      {sources.length === 0 && (
        <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            No indexed sources were available. This output is based on general practice principles.
            Verify all content against the child's actual records before use.
          </span>
        </div>
      )}

      {/* Sources list */}
      {sources.length > 0 && (
        <div className="space-y-2">
          {sources.map((source) => (
            <div key={source.id} className="border rounded-md p-2.5 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-1.5 min-w-0">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs font-medium leading-snug line-clamp-2">{source.title}</p>
                </div>
                {source.linked_record_id && (
                  <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" asChild>
                    <a href={`#source-${source.linked_record_id}`}>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {CARA_SOURCE_TYPE_LABELS[source.source_type as keyof typeof CARA_SOURCE_TYPE_LABELS] ?? source.source_type}
                </Badge>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-sm ${CONFIDENCE_COLOURS[source.approval_status] ?? ""}`}
                >
                  {source.approval_status}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(source.source_date), { addSuffix: true })}
                </span>
              </div>
              {source.summary && (
                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {source.summary}
                </p>
              )}
              {source.is_sensitive && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  Sensitive record
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {onAddSource && (
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={onAddSource}>
          Add source
        </Button>
      )}

      {/* Disclaimer */}
      <div className="text-[10px] text-muted-foreground border-t pt-3 flex gap-1.5">
        <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-600" />
        <span>
          Cara uses only indexed and approved sources. Unverified records are flagged.
          A human must confirm all evidence before approval.
        </span>
      </div>
    </div>
  );
}
