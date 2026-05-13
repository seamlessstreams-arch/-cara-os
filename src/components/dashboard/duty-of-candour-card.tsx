"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DUTY OF CANDOUR INTELLIGENCE CARD
// Dashboard card for candour obligations, apology tracking, investigations.
// CHR 2015 Reg 20/40. SCCIF: Well-Led — Transparency.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, ChevronRight, AlertTriangle, Brain,
  CheckCircle2, Clock, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_records: 4,
  open_cases: 1,
  closed_cases: 3,
  verbal_apology_given: 4,
  written_apology_sent: 3,
  family_informed_rate: 100,
  ofsted_notified_rate: 75,
  avg_days_to_verbal: 1.5,
  lessons_captured: 3,
};

const DEMO_CASES: {
  child: string;
  trigger: string;
  date: string;
  status: string;
  verbalApology: boolean;
  writtenApology: boolean;
  familyInformed: boolean;
}[] = [
  { child: "Child B", trigger: "Medication Error", date: "2026-05-02", status: "Investigation Underway", verbalApology: true, writtenApology: false, familyInformed: true },
  { child: "Child A", trigger: "Restraint Injury", date: "2026-03-15", status: "Closed", verbalApology: true, writtenApology: true, familyInformed: true },
  { child: "Child D", trigger: "Missing Child", date: "2026-02-08", status: "Closed", verbalApology: true, writtenApology: true, familyInformed: true },
  { child: "Child C", trigger: "Safeguarding Incident", date: "2026-01-20", status: "Closed", verbalApology: true, writtenApology: true, familyInformed: true },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "no_written_apology", severity: "high", message: "Written apology not yet sent for medication error involving Child B (02/05) — verbal apology given 03/05." },
  { type: "investigation_prolonged", severity: "medium", message: "Investigation for medication error involving Child B ongoing for 11 days — review progress and timeline." },
];

const ARIA_INSIGHTS = [
  "4 duty of candour cases: 1 open, 3 closed. 100% verbal apologies given (avg 1.5 days). 75% written apologies sent. 100% families informed. 3/4 have lessons learned captured.",
  "Open case: Child B medication error (02/05) — verbal apology given, written apology pending, investigation underway. Ofsted notified. Family engaged. Recommend completing written apology this week.",
  "Strong transparency culture — all cases have prompt verbal apologies and full family engagement. Learning from closed cases has been embedded: medication protocol updated, restraint debrief process improved.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function DutyOfCandourCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-brand" />
            Duty of Candour
          </CardTitle>
          <Link href="/duty-of-candour" className="text-xs text-brand hover:underline flex items-center gap-1">
            Candour <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.open_cases === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.open_cases === 0 ? "text-green-600" : "text-amber-600")}>
              {m.open_cases}
            </p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.family_informed_rate >= 100 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.family_informed_rate >= 100 ? "text-green-600" : "text-red-600")}>
              {m.family_informed_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Informed</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.avg_days_to_verbal}d</p>
            <p className="text-[10px] text-muted-foreground">Avg Verbal</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.lessons_captured}</p>
            <p className="text-[10px] text-muted-foreground">Lessons</p>
          </div>
        </div>

        {/* ── Cases ───────────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Candour Cases
          </p>
          <div className="space-y-1">
            {DEMO_CASES.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium">{c.child}</span>
                  <span className="text-muted-foreground truncate">{c.trigger}</span>
                  {c.verbalApology && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                  {c.familyInformed && <Heart className="h-3 w-3 text-green-500 shrink-0" />}
                </div>
                <Badge variant="outline" className={cn(
                  "text-[10px] shrink-0",
                  c.status === "Closed"
                    ? "text-green-700 bg-green-50 border-green-200"
                    : "text-amber-700 bg-amber-50 border-amber-200",
                )}>
                  {c.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Candour Alerts
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
            ARIA Candour Intelligence
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
