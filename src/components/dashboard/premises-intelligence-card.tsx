"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PREMISES & MAINTENANCE INTELLIGENCE CARD
// Dashboard card for premises safety checks, fire safety compliance,
// maintenance tracking, and ARIA premises intelligence (Reg 25).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Flame, Wrench, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_COMPLIANCE = {
  totalChecks: 28,
  passRate: 92.3,
  failCount: 2,
  statutoryComplianceRate: 88.9,
  overdueChecks: 1,
  followUpsPending: 3,
};

const FIRE_SAFETY_STATUS = [
  { check: "Fire Alarm Test", lastDone: "2026-05-12", status: "current", daysUntil: 5 },
  { check: "Emergency Lighting", lastDone: "2026-05-01", status: "current", daysUntil: 18 },
  { check: "Fire Drill", lastDone: "2026-04-15", status: "current", daysUntil: 63 },
  { check: "Fire Extinguishers", lastDone: "2025-12-01", status: "current", daysUntil: 201 },
  { check: "Fire Risk Assessment", lastDone: "2025-08-20", status: "due_soon", daysUntil: 34 },
];

const MAINTENANCE_SUMMARY = {
  open: 3,
  inProgress: 2,
  completed: 15,
  safetyRisks: 0,
  avgResolutionDays: 4.2,
  overdueUrgent: 0,
};

const RECENT_MAINTENANCE = [
  { title: "Bathroom extractor fan", priority: "medium", status: "in_progress", days: 3 },
  { title: "Garden fence panel", priority: "low", status: "open", days: 5 },
  { title: "Kitchen tap washer", priority: "medium", status: "open", days: 2 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "check_due_soon", severity: "medium", message: "Fire Risk Assessment due within 34 days — schedule with fire safety contractor." },
  { type: "follow_up", severity: "medium", message: "3 follow-up actions outstanding from recent premises checks. Review and action." },
];

const ARIA_INSIGHTS = [
  "Fire safety compliance is strong — all weekly alarm tests current, last fire drill within 90 days. Fire risk assessment due in 34 days — book with approved contractor. Reg 25 fire safety requirements well evidenced.",
  "Maintenance resolution averages 4.2 days which is within the 5-day target. No child safety risks in open requests. 3 open + 2 in-progress requests is manageable. Consider preventive maintenance schedule for kitchen appliances.",
  "Positive: 92.3% check pass rate. Zero child safety risks in maintenance backlog. Statutory compliance at 88.9%. Legionella and water temperature checks current. Reg 25 premises standards well maintained.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function PremisesIntelligenceCard() {
  const c = DEMO_COMPLIANCE;
  const m = MAINTENANCE_SUMMARY;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building className="h-4 w-4 text-brand" />
            Premises & Maintenance
          </CardTitle>
          <Link href="/premises" className="text-xs text-brand hover:underline flex items-center gap-1">
            Premises <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2" style={{ background: c.passRate >= 90 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", c.passRate >= 90 ? "text-green-600" : "text-amber-600")}>
              {c.passRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Pass Rate</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: c.statutoryComplianceRate >= 90 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", c.statutoryComplianceRate >= 90 ? "text-green-600" : "text-amber-600")}>
              {c.statutoryComplianceRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Statutory</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.open > 5 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.open > 5 ? "text-amber-600" : "text-green-600")}>
              {m.open}
            </p>
            <p className="text-[10px] text-muted-foreground">Open Jobs</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.safetyRisks > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.safetyRisks > 0 ? "text-red-600" : "text-green-600")}>
              {m.safetyRisks}
            </p>
            <p className="text-[10px] text-muted-foreground">Safety Risks</p>
          </div>
        </div>

        {/* ── Fire safety status ──────────────────────────────────────── */}

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Flame className="h-3 w-3" />
            Fire Safety
          </p>
          <div className="space-y-1">
            {FIRE_SAFETY_STATUS.map((fs) => (
              <div key={fs.check} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{fs.check}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] tabular-nums text-muted-foreground">{fs.lastDone}</span>
                  <Badge className={cn(
                    "text-[10px]",
                    fs.status === "current" ? "bg-green-100 text-green-700"
                      : fs.status === "due_soon" ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700",
                  )}>
                    {fs.status === "current" ? (
                      <><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Current</>
                    ) : (
                      <>{fs.daysUntil}d</>
                    )}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Maintenance summary ──────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Wrench className={cn("h-4 w-4", m.overdueUrgent > 0 ? "text-red-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">Maintenance</p>
              <p className="text-[10px] text-muted-foreground">
                {m.open} open · {m.inProgress} in progress · {m.avgResolutionDays}d avg resolution
              </p>
            </div>
          </div>
          {m.overdueUrgent > 0 ? (
            <Badge className="text-[10px] bg-red-100 text-red-700">
              {m.overdueUrgent} urgent overdue
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              On track
            </Badge>
          )}
        </div>

        {/* ── Recent maintenance requests ──────────────────────────────── */}

        {RECENT_MAINTENANCE.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Recent Requests
            </p>
            {RECENT_MAINTENANCE.map((req, i) => (
              <div key={i} className="rounded-lg border p-2.5 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{req.title}</span>
                  <Badge variant="outline" className="text-[10px]">{req.priority}</Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge className={cn(
                    "text-[10px]",
                    req.status === "open" ? "bg-blue-100 text-blue-700"
                      : req.status === "in_progress" ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700",
                  )}>
                    {req.status.replace("_", " ")}
                  </Badge>
                  <span className="text-muted-foreground">{req.days}d</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Premises Alerts
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
            ARIA Premises Intelligence
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
