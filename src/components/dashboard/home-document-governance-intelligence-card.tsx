"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DOCUMENT GOVERNANCE INTELLIGENCE CARD
// Home-level: document management, expiry tracking, read receipt compliance,
// and version control.
// CHR 2015 Reg 13. SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, FileStack,
  BookOpen, PenLine, Timer, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeDocumentGovernanceIntelligence } from "@/hooks/use-home-document-governance-intelligence";
import type { DocumentRating } from "@/lib/engines/home-document-governance-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<DocumentRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-red-200 bg-red-50 text-red-800",
  soon: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-blue-200 bg-blue-50 text-blue-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeDocumentGovernanceIntelligenceCard() {
  const { data, isLoading } = useHomeDocumentGovernanceIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const ratingStyle = RATING_STYLES[d.document_rating] ?? RATING_STYLES.insufficient_data;
  const hasExpired = d.inventory_profile.expired_count > 0;
  const lowRead = d.read_compliance_profile.avg_read_rate < 50;
  const isAlert = hasExpired || lowRead || d.document_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileStack className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-indigo-500")} />
            <span className="text-slate-900">Document Governance</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.document_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.document_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.document_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Documents */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-lg font-bold tabular-nums text-slate-600">
                  {d.inventory_profile.total_documents}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Documents</p>
            </div>

            {/* Read Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.read_compliance_profile.avg_read_rate >= 80 ? "text-green-600" :
                  d.read_compliance_profile.avg_read_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.read_compliance_profile.avg_read_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Read Rate</p>
            </div>

            {/* Sign Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <PenLine className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.read_compliance_profile.avg_sign_rate >= 80 ? "text-green-600" :
                  d.read_compliance_profile.avg_sign_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.read_compliance_profile.avg_sign_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Signed</p>
            </div>

            {/* Expired */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Timer className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.inventory_profile.expired_count === 0 ? "text-green-600" : "text-red-600"
                )}>
                  {d.inventory_profile.expired_count === 0 ? "0" : d.inventory_profile.expired_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Expired</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.document_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Library</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Categories: <span className="font-medium text-slate-600">{d.inventory_profile.category_count}</span></p>
                <p>Avg version: <span className="font-medium text-slate-600">{d.inventory_profile.avg_version}</span></p>
                {d.inventory_profile.expiring_soon_count > 0 && (
                  <p>Expiring soon: <span className="font-medium text-amber-600">{d.inventory_profile.expiring_soon_count}</span></p>
                )}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Compliance</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Requiring sign: <span className="font-medium text-slate-600">{d.inventory_profile.requiring_sign}</span></p>
                <p>Fully read: <span className={cn("font-medium",
                  d.read_compliance_profile.fully_read_count === d.read_compliance_profile.documents_requiring_sign ? "text-green-600" : "text-amber-600"
                )}>{d.read_compliance_profile.fully_read_count}</span></p>
                {d.read_compliance_profile.unread_count > 0 && (
                  <p>Unread: <span className="font-medium text-red-600">{d.read_compliance_profile.unread_count}</span></p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Strengths */}
        {d.strengths.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Strengths ({d.strengths.length})
            </p>
            {d.strengths.slice(0, 3).map((s, i) => (
              <div key={i} className="rounded border border-green-200 bg-green-50 p-2.5 text-xs text-green-800 leading-relaxed">
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Concerns */}
        {d.concerns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Concerns ({d.concerns.length})
            </p>
            {d.concerns.slice(0, 3).map((c, i) => (
              <div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 leading-relaxed">
                {c}
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {d.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Recommendations ({d.recommendations.length})
            </p>
            {d.recommendations.slice(0, 3).map((rec) => (
              <div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}>
                <div className="flex items-start justify-between gap-2">
                  <span>{rec.recommendation}</span>
                  {rec.regulatory_ref && (
                    <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ARIA Document Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Document Intelligence
            </p>
            {d.insights.slice(0, 3).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
