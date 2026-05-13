"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ENVIRONMENTAL SAFETY INTELLIGENCE CARD
// Dashboard card for fire safety, legionella, electrical, gas safety,
// PAT testing, COSHH, compliance, and ARIA safety intelligence.
// CHR 2015 Reg 25 (premises safety), Reg 44 (fire safety),
// Health and Safety at Work Act 1974. SCCIF: Well-Led.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, ChevronRight, AlertTriangle, Brain,
  Flame, CheckCircle2, Clock, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_checks: 14,
  compliant: 12,
  compliance_rate: 85.7,
  overdue: 1,
  non_compliant: 1,
  expiring_certs: 1,
  expired_certs: 0,
  open_actions: 3,
  critical_actions: 0,
  drills_this_year: 4,
  avg_evac_time: 95,
};

const DEMO_COMPLIANCE = [
  { category: "Fire Safety", status: "compliant", nextDue: "2026-06-15" },
  { category: "Gas Safety", status: "compliant", nextDue: "2026-08-01" },
  { category: "Electrical", status: "compliant", nextDue: "2026-09-10" },
  { category: "Legionella", status: "overdue", nextDue: "2026-05-01" },
  { category: "PAT Testing", status: "compliant", nextDue: "2026-11-20" },
  { category: "COSHH", status: "non_compliant", nextDue: "2026-05-30" },
];

const DEMO_DRILLS = [
  { date: "2026-05-06", type: "unannounced", evacuated: true, time: 88 },
  { date: "2026-03-12", type: "planned", evacuated: true, time: 102 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "overdue", severity: "high", message: "Legionella check is 12 days overdue — next due was 1 May 2026. Schedule immediately." },
  { type: "non_compliant", severity: "high", message: "COSHH assessment non-compliant — cleaning product storage needs review. 1 remedial action outstanding." },
];

const ARIA_INSIGHTS = [
  "14 compliance areas tracked — 85.7% compliant. 12/14 checks fully compliant. 1 overdue (legionella), 1 non-compliant (COSHH). 3 open remedial actions, none critical. All certificates valid except electrical EIC expiring in 4 months — plan renewal.",
  "Fire safety: 4 drills this year. Average evacuation time: 95 seconds (target: under 120s). All persons successfully evacuated in every drill. Last unannounced drill (6 May) achieved 88 seconds — improvement from 102 seconds in March. Strong Reg 44 compliance.",
  "Action required: (1) Schedule legionella check this week. (2) Complete COSHH reassessment for cleaning product storage — new products added in April not yet assessed. (3) Begin planning electrical certificate renewal (due September). Overall premises safety is strong — address the two outstanding items to achieve 100% compliance.",
];

const statusColor: Record<string, string> = {
  compliant: "bg-green-100 text-green-700",
  partially_compliant: "bg-blue-100 text-blue-700",
  non_compliant: "bg-red-100 text-red-700",
  overdue: "bg-amber-100 text-amber-700",
};

// ── Component ────────────────────────────────────────────────────────────────

export function EnvironmentalSafetyCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Environmental Safety
          </CardTitle>
          <Link href="/environmental-safety" className="text-xs text-brand hover:underline flex items-center gap-1">
            Compliance <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.compliance_rate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.compliance_rate >= 90 ? "text-green-600" : "text-amber-600")}>
              {m.compliance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Compliant</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.overdue === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.overdue === 0 ? "text-green-600" : "text-red-600")}>
              {m.overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.open_actions}</p>
            <p className="text-[10px] text-muted-foreground">Actions</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.drills_this_year}</p>
            <p className="text-[10px] text-muted-foreground">Fire Drills</p>
          </div>
        </div>

        {/* ── Compliance overview ─────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Compliance Status
          </p>
          {DEMO_COMPLIANCE.map((c) => (
            <div key={c.category} className="flex items-center justify-between rounded border p-2 text-xs">
              <span className="font-medium">{c.category}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(c.nextDue).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
                <Badge className={cn("text-[10px]", statusColor[c.status])}>
                  {c.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* ── Fire drills ─────────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-500" />
            Recent Fire Drills
          </p>
          {DEMO_DRILLS.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">
                  {new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
                <Badge variant="outline" className="text-[10px]">{d.type}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="tabular-nums font-medium">{d.time}s</span>
                <Badge className={cn("text-[10px]", d.evacuated ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                  {d.evacuated ? "all clear" : "issue"}
                </Badge>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs pt-1 border-t">
            <span className="text-muted-foreground flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              Avg evacuation
            </span>
            <span className="font-bold tabular-nums text-blue-600">{m.avg_evac_time}s</span>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Safety Alerts
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
            ARIA Safety Intelligence
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
