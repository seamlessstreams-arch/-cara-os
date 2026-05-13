"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORDS MANAGEMENT INTELLIGENCE CARD
// Dashboard card for record quality, completeness, access requests,
// data protection, and ARIA records intelligence.
// CHR 2015 Reg 39 (records maintenance), Reg 40 (retention),
// Data Protection Act 2018, UK GDPR. SCCIF: Well-Led.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen, ChevronRight, AlertTriangle, Brain,
  FileCheck, Eye, Shield, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  children_audited: 5,
  total_children: 5,
  avg_completeness: 94,
  avg_quality_score: 4.2,
  open_access_requests: 1,
  avg_response_days: 18,
  overdue_requests: 0,
  chronology_compliance: 100,
};

const DEMO_QUALITY = [
  { child: "Child A", quality: "excellent", completeness: 98, chronology: true },
  { child: "Child B", quality: "good", completeness: 95, chronology: true },
  { child: "Child C", quality: "good", completeness: 92, chronology: true },
  { child: "Child D", quality: "good", completeness: 93, chronology: true },
  { child: "Child E", quality: "adequate", completeness: 88, chronology: true },
];

const DEMO_ACCESS_REQUESTS = [
  { requester: "Mother (Child D)", type: "subject_access", status: "in_progress", daysOpen: 12 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "completeness", severity: "medium", message: "Child E's records are 88% complete — below the 90% target. Missing: updated risk assessment and educational review minutes." },
];

const ARIA_INSIGHTS = [
  "All 5 children have had records audited this quarter. Average completeness: 94% (above 90% target). Average data quality: 4.2/5. All chronologies are up to date. Strongest records: Child A (98% complete, excellent quality). Focus area: Child E (88% complete, adequate quality).",
  "1 active subject access request from Child D's mother — in progress, day 12 of 30-day statutory limit. On track for completion. Average SAR response time: 18 days (within the 30-day legal requirement). No overdue requests.",
  "Records security: all sensitive data stored securely. Third-party data redacted where appropriate. Data retention schedules in place for all children. Recommend: (1) Complete Child E's missing documents. (2) Schedule next records audit for August. Strong Reg 39/40 compliance — records are well-maintained and accessible.",
];

const qualityColor: Record<string, string> = {
  excellent: "bg-green-100 text-green-700",
  good: "bg-blue-100 text-blue-700",
  adequate: "bg-amber-100 text-amber-700",
  poor: "bg-red-100 text-red-700",
  not_assessed: "bg-gray-100 text-gray-700",
};

// ── Component ────────────────────────────────────────────────────────────────

export function RecordsManagementCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-brand" />
            Records Management
          </CardTitle>
          <Link href="/records-management" className="text-xs text-brand hover:underline flex items-center gap-1">
            Records <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.avg_completeness >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.avg_completeness >= 90 ? "text-green-600" : "text-amber-600")}>
              {m.avg_completeness}%
            </p>
            <p className="text-[10px] text-muted-foreground">Complete</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.avg_quality_score}</p>
            <p className="text-[10px] text-muted-foreground">Quality /5</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.chronology_compliance === 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.chronology_compliance === 100 ? "text-green-600" : "text-amber-600")}>
              {m.chronology_compliance}%
            </p>
            <p className="text-[10px] text-muted-foreground">Chronology</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.open_access_requests}</p>
            <p className="text-[10px] text-muted-foreground">Open SARs</p>
          </div>
        </div>

        {/* ── Record quality ──────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <FileCheck className="h-3 w-3" />
            Record Quality by Child
          </p>
          {DEMO_QUALITY.map((c) => (
            <div key={c.child} className="flex items-center justify-between rounded border p-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{c.child}</span>
                <Badge className={cn("text-[10px]", qualityColor[c.quality])}>
                  {c.quality}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 tabular-nums">
                <span className={cn("font-semibold", c.completeness >= 90 ? "text-green-600" : "text-amber-600")}>
                  {c.completeness}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Access requests ─────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Eye className="h-3 w-3 text-blue-500" />
            Subject Access Requests
          </p>
          {DEMO_ACCESS_REQUESTS.length > 0 ? (
            DEMO_ACCESS_REQUESTS.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span>{r.requester}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground tabular-nums">Day {r.daysOpen}/30</span>
                  <Badge variant="outline" className="text-[10px]">{r.status.replace(/_/g, " ")}</Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No active requests</p>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t">
            <div className="text-center">
              <p className="text-sm font-bold tabular-nums text-blue-600">{m.avg_response_days}d</p>
              <p className="text-[10px] text-muted-foreground">Avg Response</p>
            </div>
            <div className="text-center">
              <Shield className="h-4 w-4 mx-auto text-green-500" />
              <p className="text-[10px] text-muted-foreground">Data Secure</p>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Records Alerts
            </p>
            {DEMO_ALERTS.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  alert.severity === "critical" || alert.severity === "high"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ───────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Records Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-blue-200 bg-blue-50 text-blue-800"
                  : i === 1 ? "border-green-200 bg-green-50 text-green-800"
                  : "border-amber-200 bg-amber-50 text-amber-800",
              )}
            >
              {insight}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
