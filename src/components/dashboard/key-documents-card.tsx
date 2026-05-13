"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — KEY DOCUMENTS INTELLIGENCE CARD
// Dashboard card for statutory document tracking — care plans, placement plans,
// PEPs, risk assessments, and review status.
// CHR 2015 Reg 36/14/8/16. SCCIF: Well-Led.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderCheck, ChevronRight, AlertTriangle, Brain,
  FileText, CheckCircle2, Clock, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_documents: 42,
  current_count: 34,
  due_review_count: 5,
  overdue_count: 2,
  draft_count: 1,
  not_created_count: 0,
  document_coverage: 100,
  social_worker_approved_rate: 81.0,
  child_contributed_rate: 64.3,
  care_plans_current: 6,
  placement_plans_current: 6,
  risk_assessments_current: 5,
};

const DEMO_DOCUMENTS: {
  child: string;
  docType: string;
  status: string;
  reviewDue: string | null;
}[] = [
  { child: "Child A", docType: "Care Plan", status: "current", reviewDue: "2026-06-15" },
  { child: "Child B", docType: "Risk Assessment", status: "overdue", reviewDue: "2026-04-30" },
  { child: "Child C", docType: "PEP", status: "due_review", reviewDue: "2026-05-18" },
  { child: "Child D", docType: "Placement Plan", status: "current", reviewDue: "2026-07-01" },
  { child: "Child E", docType: "Behaviour Support Plan", status: "due_review", reviewDue: "2026-05-25" },
  { child: "Child F", docType: "Health Plan", status: "overdue", reviewDue: "2026-04-15" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "document_overdue", severity: "high", message: "Risk Assessment for Child B is overdue for review — review was due 2026-04-30." },
  { type: "document_overdue", severity: "high", message: "Health Plan for Child F is overdue for review — review was due 2026-04-15." },
  { type: "review_due", severity: "medium", message: "5 documents are due for review within the next 30 days — schedule reviews promptly." },
];

const ARIA_INSIGHTS = [
  "42 key documents across 6 children. 34 current, 5 due review, 2 overdue, 1 draft. 100% document coverage. SW approved: 81%. Child contribution: 64.3%. All children have care plans and placement plans.",
  "Priority: 2 overdue documents (Child B risk assessment, Child F health plan) need immediate attention. 5 documents due for review this month. Child B's risk assessment being overdue is a compliance concern.",
  "Positive: All 6 children have current care plans and placement plans. Opportunity: Increase child contribution rate from 64.3% — children should be involved in shaping their own plans wherever appropriate.",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_BADGES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  current: { label: "Current", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
  due_review: { label: "Due Review", color: "text-amber-700 bg-amber-50 border-amber-200", icon: Clock },
  overdue: { label: "Overdue", color: "text-red-700 bg-red-50 border-red-200", icon: AlertCircle },
  draft: { label: "Draft", color: "text-blue-700 bg-blue-50 border-blue-200", icon: FileText },
  not_yet_created: { label: "Missing", color: "text-red-700 bg-red-50 border-red-200", icon: AlertCircle },
};

// ── Component ────────────────────────────────────────────────────────────────

export function KeyDocumentsCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FolderCheck className="h-4 w-4 text-brand" />
            Key Documents
          </CardTitle>
          <Link href="/key-documents" className="text-xs text-brand hover:underline flex items-center gap-1">
            Documents <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.current_count}</p>
            <p className="text-[10px] text-muted-foreground">Current</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.due_review_count === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.due_review_count === 0 ? "text-green-600" : "text-amber-600")}>
              {m.due_review_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Due Review</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.overdue_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.overdue_count === 0 ? "text-green-600" : "text-red-600")}>
              {m.overdue_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.child_contributed_rate >= 70 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.child_contributed_rate >= 70 ? "text-green-600" : "text-amber-600")}>
              {m.child_contributed_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Child Input</p>
          </div>
        </div>

        {/* ── Document list ───────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Document Status
          </p>
          <div className="space-y-1">
            {DEMO_DOCUMENTS.map((doc, i) => {
              const badge = STATUS_BADGES[doc.status] ?? STATUS_BADGES.current;
              const StatusIcon = badge.icon;
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <StatusIcon className={cn("h-3 w-3 shrink-0", doc.status === "current" ? "text-green-500" : doc.status === "overdue" ? "text-red-500" : "text-amber-500")} />
                    <span className="font-medium">{doc.child}</span>
                    <span className="text-muted-foreground truncate">{doc.docType}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {doc.reviewDue && <span className="text-muted-foreground">{doc.reviewDue}</span>}
                    <Badge variant="outline" className={cn("text-[10px]", badge.color)}>
                      {badge.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Document Alerts
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
            ARIA Documents Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-blue-200 bg-blue-50 text-blue-800"
                  : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-green-200 bg-green-50 text-green-800",
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
