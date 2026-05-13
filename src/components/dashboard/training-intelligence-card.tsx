"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TRAINING & DEVELOPMENT INTELLIGENCE CARD
// Dashboard card for mandatory training compliance, DBS status,
// qualifications tracking, and ARIA workforce intelligence (Reg 33/34).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Shield, BookOpen, Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_COMPLIANCE = {
  overallComplianceRate: 87.5,
  fullyCompliantStaff: 5,
  totalStaff: 8,
  expiredCount: 4,
  expiringCount: 3,
};

const TRAINING_MATRIX = [
  { type: "Safeguarding", current: 7, expiring: 1, expired: 0 },
  { type: "First Aid", current: 6, expiring: 0, expired: 2 },
  { type: "Fire Safety", current: 8, expiring: 0, expired: 0 },
  { type: "PI Training", current: 7, expiring: 1, expired: 0 },
  { type: "Medication", current: 6, expiring: 1, expired: 1 },
  { type: "PREVENT", current: 8, expiring: 0, expired: 0 },
];

const DBS_STATUS = {
  totalStaff: 8,
  cleared: 7,
  pending: 1,
  expired: 0,
  updateService: 5,
};

const QUALIFICATION_STATUS = {
  level3Achieved: 5,
  level3InProgress: 2,
  level3NotStarted: 1,
};

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "mandatory_expired", severity: "high", message: "Sarah J — First Aid certification expired 15 Apr. Book refresher course urgently." },
  { type: "training_expiring", severity: "medium", message: "3 training certificates expiring within 30 days (PI Training × 2, Medication × 1). Schedule renewal." },
  { type: "dbs_pending", severity: "medium", message: "New starter Ryan K — DBS application submitted, awaiting clearance. Cannot work unsupervised until cleared." },
];

const ARIA_INSIGHTS = [
  "Training compliance at 87.5% — 5 of 8 staff fully compliant. 4 expired certificates need immediate attention (2× First Aid, 1× Medication, 1× CSE/CCE). Schedule training within 2 weeks. Reg 33 requires all staff to be suitably trained.",
  "DBS compliance strong — 7 of 8 cleared, 1 pending (new starter). 5 staff registered with DBS Update Service enabling annual online checks. Consider enrolling remaining 2 permanent staff on the update service.",
  "Positive: 5 staff have achieved Level 3 Diploma, 2 in progress. All fire safety and PREVENT training current. 100% PI training coverage (7 current + 1 expiring). Reg 34 fitness of workers standards well evidenced.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function TrainingIntelligenceCard() {
  const c = DEMO_COMPLIANCE;
  const dbs = DBS_STATUS;
  const quals = QUALIFICATION_STATUS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand" />
            Training & Development
          </CardTitle>
          <Link href="/training" className="text-xs text-brand hover:underline flex items-center gap-1">
            Training <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2" style={{ background: c.overallComplianceRate >= 90 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", c.overallComplianceRate >= 90 ? "text-green-600" : "text-amber-600")}>
              {c.overallComplianceRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">
              {c.fullyCompliantStaff}/{c.totalStaff}
            </p>
            <p className="text-[10px] text-muted-foreground">Compliant</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", c.expiredCount > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", c.expiredCount > 0 ? "text-red-600" : "text-green-600")}>
              {c.expiredCount}
            </p>
            <p className="text-[10px] text-muted-foreground">Expired</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", c.expiringCount > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", c.expiringCount > 0 ? "text-amber-600" : "text-green-600")}>
              {c.expiringCount}
            </p>
            <p className="text-[10px] text-muted-foreground">Expiring</p>
          </div>
        </div>

        {/* ── Training matrix ────────────────────────────────────────── */}

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            Mandatory Training
          </p>
          <div className="space-y-1">
            {TRAINING_MATRIX.map((t) => (
              <div key={t.type} className="flex items-center gap-2 text-xs">
                <span className="w-24 text-muted-foreground">{t.type}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-400" style={{ width: `${(t.current / 8) * 100}%` }} />
                  <div className="h-full bg-amber-400" style={{ width: `${(t.expiring / 8) * 100}%` }} />
                  <div className="h-full bg-red-400" style={{ width: `${(t.expired / 8) * 100}%` }} />
                </div>
                <span className="w-16 text-right tabular-nums font-medium text-[10px]">
                  {t.current}
                  {t.expiring > 0 && <span className="text-amber-500"> +{t.expiring}</span>}
                  {t.expired > 0 && <span className="text-red-500"> -{t.expired}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── DBS status ──────────────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Shield className={cn("h-4 w-4", dbs.expired > 0 ? "text-red-500" : dbs.pending > 0 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">DBS Status</p>
              <p className="text-[10px] text-muted-foreground">
                {dbs.cleared} cleared · {dbs.pending} pending · {dbs.updateService} on update service
              </p>
            </div>
          </div>
          {dbs.expired > 0 ? (
            <Badge className="text-[10px] bg-red-100 text-red-700">
              {dbs.expired} expired
            </Badge>
          ) : dbs.pending > 0 ? (
            <Badge className="text-[10px] bg-amber-100 text-amber-700">
              {dbs.pending} pending
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All clear
            </Badge>
          )}
        </div>

        {/* ── Qualifications ──────────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Award className={cn("h-4 w-4", quals.level3NotStarted > 0 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">Level 3 Diploma</p>
              <p className="text-[10px] text-muted-foreground">
                {quals.level3Achieved} achieved · {quals.level3InProgress} in progress · {quals.level3NotStarted} not started
              </p>
            </div>
          </div>
          <Badge className={cn("text-[10px]", quals.level3NotStarted === 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
            {Math.round((quals.level3Achieved / 8) * 100)}%
          </Badge>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Training Alerts
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

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Training Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-red-200 bg-red-50 text-red-800"
                  : i === 1 ? "border-blue-200 bg-blue-50 text-blue-800"
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
