"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SAFER RECRUITMENT INTELLIGENCE CARD
// Dashboard card for DBS checks, staff references, pre-employment checklists,
// recruitment compliance, and ARIA safer recruitment intelligence.
// CHR 2015 Reg 32 (fitness of staff), Reg 33 (employment of staff),
// Schedule 1 & 2, SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, ChevronRight, AlertTriangle, Brain,
  FileCheck, UserCheck, Clock, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_RECRUITMENT_METRICS = {
  total_staff: 12,
  dbs_valid: 10,
  dbs_expiring: 1,
  dbs_expired: 1,
  dbs_compliance: 83,
  update_service_registered: 7,
  references_total: 24,
  references_verified: 20,
  references_outstanding: 2,
  references_unsatisfactory: 0,
  checks_total: 144,
  checks_completed: 128,
  checks_pending: 14,
  checks_concern: 2,
  checks_completion_rate: 89,
};

const DEMO_DBS_STATUS = [
  { name: "Staff A", type: "Enhanced + Barred", expiry: "2027-06-15", status: "valid" },
  { name: "Staff B", type: "Enhanced + Barred", expiry: "2026-07-22", status: "expiring" },
  { name: "Staff C", type: "Enhanced + Barred", expiry: "2026-03-10", status: "expired" },
  { name: "Staff D", type: "Enhanced + Barred", expiry: "2028-01-30", status: "valid" },
];

const DEMO_CHECK_SUMMARY = [
  { type: "DBS Check", completed: 10, total: 12 },
  { type: "Identity Verification", completed: 12, total: 12 },
  { type: "Right to Work", completed: 12, total: 12 },
  { type: "Two References", completed: 11, total: 12 },
  { type: "Qualifications", completed: 11, total: 12 },
  { type: "Employment History Gaps", completed: 10, total: 12 },
  { type: "Health Declaration", completed: 12, total: 12 },
  { type: "Safeguarding Declaration", completed: 12, total: 12 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "dbs_expired", severity: "critical", message: "1 staff member has an expired DBS. They must not work unsupervised until renewed (Reg 32)." },
  { type: "dbs_expiring", severity: "high", message: "1 DBS expiring within 90 days. Initiate renewal process now to avoid lapse." },
  { type: "checks_concern", severity: "medium", message: "2 pre-employment check items flagged with concerns — review and document risk assessment." },
];

const ARIA_INSIGHTS = [
  "1 staff member working with an expired DBS — this is a critical Ofsted compliance failure under Reg 32. Immediate action required: either suspend from unsupervised duties or obtain emergency DBS update service check. Document the risk assessment and interim measures.",
  "Overall recruitment compliance at 89%. 2 outstanding references (both employer references for recently hired staff). Chase referees and set a 7-day deadline. Ofsted expects 2 satisfactory references before any unsupervised contact with children.",
  "DBS Update Service uptake: 58% (7 of 12 staff). Increasing this reduces renewal burden and prevents lapses. Schedule 2 requires ongoing fitness checks. 128 of 144 pre-employment checks completed. Identity and health declarations at 100%. Employment history gaps analysis needs attention for 2 staff.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function SaferRecruitmentCard() {
  const r = DEMO_RECRUITMENT_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Safer Recruitment
          </CardTitle>
          <Link href="/safer-recruitment-tracker" className="text-xs text-brand hover:underline flex items-center gap-1">
            Recruitment <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", r.dbs_compliance >= 95 ? "bg-green-50" : r.dbs_compliance >= 80 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", r.dbs_compliance >= 95 ? "text-green-600" : r.dbs_compliance >= 80 ? "text-amber-600" : "text-red-600")}>
              {r.dbs_compliance}%
            </p>
            <p className="text-[10px] text-muted-foreground">DBS Valid</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", r.dbs_expired === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", r.dbs_expired === 0 ? "text-green-600" : "text-red-600")}>
              {r.dbs_expired}
            </p>
            <p className="text-[10px] text-muted-foreground">Expired</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", r.references_outstanding === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", r.references_outstanding === 0 ? "text-green-600" : "text-amber-600")}>
              {r.references_outstanding}
            </p>
            <p className="text-[10px] text-muted-foreground">Refs Due</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", r.checks_completion_rate >= 95 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", r.checks_completion_rate >= 95 ? "text-green-600" : "text-amber-600")}>
              {r.checks_completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Checks Done</p>
          </div>
        </div>

        {/* ── DBS tracker ─────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <FileCheck className="h-3 w-3" />
            DBS Status
          </p>
          {DEMO_DBS_STATUS.map((d) => (
            <div key={d.name} className="flex items-center justify-between rounded border p-2 text-xs">
              <div className="flex items-center gap-2 flex-1">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium truncate">{d.name}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-muted-foreground tabular-nums">
                  {new Date(d.expiry).toLocaleDateString("en-GB", { month: "short", year: "2-digit" })}
                </span>
                <Badge className={cn(
                  "text-[10px]",
                  d.status === "valid" ? "bg-green-100 text-green-700"
                    : d.status === "expiring" ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700",
                )}>
                  {d.status === "valid" ? <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> : <Clock className="h-2.5 w-2.5 mr-0.5" />}
                  {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* ── Pre-employment check summary ────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Pre-Employment Checks
          </p>
          {DEMO_CHECK_SUMMARY.map((c) => (
            <div key={c.type} className="flex items-center gap-2 text-xs">
              <span className="flex-1 truncate">{c.type}</span>
              <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    c.completed === c.total ? "bg-green-500" : "bg-amber-500",
                  )}
                  style={{ width: `${Math.round((c.completed / c.total) * 100)}%` }}
                />
              </div>
              <span className={cn(
                "tabular-nums font-medium w-10 text-right",
                c.completed === c.total ? "text-green-600" : "text-amber-600",
              )}>
                {c.completed}/{c.total}
              </span>
            </div>
          ))}
        </div>

        {/* ── Reference stats ─────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <UserCheck className="h-3 w-3 text-indigo-500" />
            References
          </p>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <p className="text-sm font-bold tabular-nums text-blue-600">{r.references_total}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold tabular-nums text-green-600">{r.references_verified}</p>
              <p className="text-[10px] text-muted-foreground">Verified</p>
            </div>
            <div className="text-center">
              <p className={cn("text-sm font-bold tabular-nums", r.references_outstanding > 0 ? "text-amber-600" : "text-green-600")}>{r.references_outstanding}</p>
              <p className="text-[10px] text-muted-foreground">Outstanding</p>
            </div>
            <div className="text-center">
              <p className={cn("text-sm font-bold tabular-nums", r.references_unsatisfactory > 0 ? "text-red-600" : "text-green-600")}>{r.references_unsatisfactory}</p>
              <p className="text-[10px] text-muted-foreground">Concern</p>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Recruitment Alerts
            </p>
            {DEMO_ALERTS.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  alert.severity === "critical" ? "border-red-300 bg-red-50 text-red-800"
                    : alert.severity === "high" ? "border-red-200 bg-red-50 text-red-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Recruitment Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-red-200 bg-red-50 text-red-800"
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
