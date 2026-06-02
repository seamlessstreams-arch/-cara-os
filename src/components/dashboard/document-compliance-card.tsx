"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DOCUMENT COMPLIANCE INTELLIGENCE CARD
// Dashboard card powered by the Document Compliance Intelligence Engine — live data.
// Reg 35 (policies and procedures), Reg 37 (notification), Schedule 1,
// SCCIF: "Does the home have clear policies that staff understand and follow?"
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, ChevronRight, AlertTriangle, Brain, Loader2,
  FileCheck, FileWarning, Shield, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocumentComplianceIntelligence } from "@/hooks/use-document-compliance-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

function formatCategory(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ────────────────────────────────────────────────────────────────

export function DocumentComplianceCard() {
  const { data, isLoading } = useDocumentComplianceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Document Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const o = intel.overview;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Document Compliance
          </CardTitle>
          <Link href="/documents" className="text-xs text-brand hover:underline flex items-center gap-1">
            All Docs <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.avg_sign_off_rate >= 80 ? "bg-green-50" : o.avg_sign_off_rate >= 50 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.avg_sign_off_rate >= 80 ? "text-green-600" : o.avg_sign_off_rate >= 50 ? "text-amber-600" : "text-red-600",
            )}>
              {o.avg_sign_off_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Signed Off</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.documents_expired === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.documents_expired === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.documents_expired}
            </p>
            <p className="text-[10px] text-muted-foreground">Expired</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.documents_expiring_soon === 0 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.documents_expiring_soon === 0 ? "text-green-600" : "text-amber-600",
            )}>
              {o.documents_expiring_soon}
            </p>
            <p className="text-[10px] text-muted-foreground">Expiring</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_documents}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
        </div>

        {/* ── Key metrics bar ──────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.fully_signed_documents}/{o.documents_requiring_sign}</p>
            <p className="text-[10px] text-muted-foreground">Fully Signed</p>
          </div>
          <div>
            <p className={cn("font-bold tabular-nums", o.mandatory_sign_off_rate >= 80 ? "text-green-600" : o.mandatory_sign_off_rate >= 50 ? "text-amber-600" : "text-red-600")}>
              {o.mandatory_sign_off_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Mandatory</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.categories_count}</p>
            <p className="text-[10px] text-muted-foreground">Categories</p>
          </div>
        </div>

        {/* ── Category sign-off rates ─────────────────────────────────── */}

        {intel.category_analysis.filter((ca) => ca.requiring_sign > 0).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <FileCheck className="h-3 w-3" />
              Sign-Off by Category
            </p>
            {intel.category_analysis
              .filter((ca) => ca.requiring_sign > 0)
              .slice(0, 5)
              .map((ca) => (
                <div key={ca.category} className="flex items-center gap-2 text-xs">
                  <span className="w-28 text-right text-muted-foreground capitalize truncate">
                    {formatCategory(ca.category)}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        ca.avg_sign_off_rate >= 80 ? "bg-green-400" : ca.avg_sign_off_rate >= 50 ? "bg-amber-400" : "bg-red-400",
                      )}
                      style={{ width: `${Math.max(4, ca.avg_sign_off_rate)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-medium tabular-nums">{ca.avg_sign_off_rate}%</span>
                </div>
              ))}
          </div>
        )}

        {/* ── Document profiles (outstanding) ─────────────────────────── */}

        {intel.document_profiles.filter((dp) => dp.outstanding_staff.length > 0).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Outstanding Sign-offs
            </p>
            {intel.document_profiles
              .filter((dp) => dp.outstanding_staff.length > 0)
              .sort((a, b) => b.outstanding_staff.length - a.outstanding_staff.length)
              .slice(0, 4)
              .map((dp) => (
                <div key={dp.document_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate flex-1">{dp.title}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge className={cn(
                        "text-[9px]",
                        dp.sign_off_rate >= 80 ? "bg-green-100 text-green-700"
                          : dp.sign_off_rate >= 50 ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700",
                      )}>
                        {dp.sign_off_rate}%
                      </Badge>
                      {dp.is_mandatory && (
                        <Badge className="text-[9px] bg-purple-100 text-purple-700">
                          <Shield className="h-2.5 w-2.5 mr-0.5" />Mandatory
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                    <span className="text-[10px]">{dp.outstanding_staff.length} staff outstanding</span>
                    {dp.days_until_expiry !== null && (
                      <span className={cn(
                        "text-[10px]",
                        dp.days_until_expiry < 0 ? "text-red-600" : dp.days_until_expiry <= 30 ? "text-amber-600" : "",
                      )}>
                        {dp.is_expired ? "Expired" : `${dp.days_until_expiry}d until expiry`}
                      </span>
                    )}
                  </div>
                  {(dp.risk_flags?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(dp.risk_flags ?? []).slice(0, 2).map((flag, i) => (
                        <Badge key={i} className="text-[9px] bg-red-100 text-red-700">
                          <FileWarning className="h-2.5 w-2.5 mr-0.5" />{flag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Document Alerts
            </p>
            {intel.alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium,
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Document Intelligence ──────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Document Intelligence
            </p>
            {intel.insights.slice(0, 3).map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive,
                )}
              >
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
