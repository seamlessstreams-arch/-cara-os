"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — REGULATORY REPORTING CARD
// Dashboard widget showing statutory report status, upcoming deadlines,
// compliance tracking for Reg 44/45, and ARIA-flagged gaps.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, ChevronRight, AlertTriangle, CheckCircle2,
  Clock, Calendar, Brain, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_REPORTS = {
  reg44: {
    lastSubmitted: "2026-04-28",
    nextDue: "2026-05-26",
    daysUntilDue: 13,
    countLast12Months: 11,
    compliant: false,
    status: "due_soon" as const,
  },
  reg45: {
    lastSubmitted: "2026-01-15",
    nextDue: "2026-07-15",
    daysUntilDue: 63,
    countLast12Months: 2,
    compliant: true,
    status: "on_track" as const,
  },
};

const ACTIVE_REPORTS = [
  {
    id: "rr_1",
    type: "reg44",
    title: "Reg 44 Visit Report — May 2026",
    status: "in_progress",
    progress: 58,
    author: "Sarah Whitfield (IV)",
    dueDate: "2026-05-26",
  },
  {
    id: "rr_2",
    type: "reg45",
    title: "Reg 45 Quality of Care Review — H1 2026",
    status: "draft",
    progress: 15,
    author: "Darren Laville (RM)",
    dueDate: "2026-07-15",
  },
];

const ARIA_FLAGS = [
  "April Reg 44 flagged 2 unresolved recommendations — these must be addressed before the May visit report.",
  "Reg 45 review is due in 63 days. Start gathering children's voice feedback and stakeholder questionnaires now to allow adequate analysis time.",
];

// ── Status helpers ───────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-700", label: "In Progress" },
  review: { bg: "bg-amber-100", text: "text-amber-700", label: "Under Review" },
  approved: { bg: "bg-green-100", text: "text-green-700", label: "Approved" },
  submitted: { bg: "bg-green-100", text: "text-green-700", label: "Submitted" },
};

function dueColour(days: number): string {
  if (days < 0) return "text-red-600";
  if (days <= 14) return "text-amber-600";
  return "text-green-600";
}

// ── Component ────────────────────────────────────────────────────────────────

export function RegulatoryReportingCard() {
  const reg44 = DEMO_REPORTS.reg44;
  const reg45 = DEMO_REPORTS.reg45;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand" />
            Statutory Reporting
          </CardTitle>
          <Link href="/quality/reg-44" className="text-xs text-brand hover:underline flex items-center gap-1">
            Reports <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Compliance strip ─────────────────────────────────────────── */}

        <div className="grid grid-cols-2 gap-3">
          {/* Reg 44 */}
          <div className={cn(
            "rounded-lg border p-3",
            reg44.compliant ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50",
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold">Reg 44</span>
              {reg44.compliant ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last submitted</span>
                <span className="font-medium">{reg44.lastSubmitted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next due</span>
                <span className={cn("font-bold", dueColour(reg44.daysUntilDue))}>
                  {reg44.daysUntilDue}d
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">12-month count</span>
                <span className={cn("font-medium", reg44.countLast12Months >= 12 ? "text-green-600" : "text-amber-600")}>
                  {reg44.countLast12Months}/12
                </span>
              </div>
            </div>
          </div>

          {/* Reg 45 */}
          <div className={cn(
            "rounded-lg border p-3",
            reg45.compliant ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50",
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold">Reg 45</span>
              {reg45.compliant ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last submitted</span>
                <span className="font-medium">{reg45.lastSubmitted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next due</span>
                <span className={cn("font-bold", dueColour(reg45.daysUntilDue))}>
                  {reg45.daysUntilDue}d
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">12-month count</span>
                <span className={cn("font-medium", reg45.countLast12Months >= 2 ? "text-green-600" : "text-amber-600")}>
                  {reg45.countLast12Months}/2
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Active reports ───────────────────────────────────────────── */}

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Active Reports</p>
          {ACTIVE_REPORTS.map((report) => {
            const badge = STATUS_BADGE[report.status] ?? STATUS_BADGE.draft;
            return (
              <div key={report.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{report.title}</p>
                    <p className="text-[10px] text-muted-foreground">{report.author}</p>
                  </div>
                  <Badge className={cn("text-[10px] flex-shrink-0", badge.bg, badge.text)}>
                    {badge.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${report.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                    {report.progress}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" /> Due: {report.dueDate}
                  </span>
                  <Link href={`/quality/${report.type === "reg44" ? "reg-44" : "reg-45"}`} className="text-brand hover:underline flex items-center gap-0.5">
                    Open <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── ARIA flags ───────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Flags
          </p>
          {ARIA_FLAGS.map((flag, i) => (
            <div
              key={i}
              className="rounded border border-purple-100 bg-purple-50 p-2.5 text-xs text-purple-800 leading-relaxed"
            >
              {flag}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
