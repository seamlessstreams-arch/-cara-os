"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BODY MAP INTELLIGENCE CARD
// Dashboard card for body map observations, safeguarding marks,
// and injury documentation tracking.
// CHR 2015 Reg 12/36/34. SCCIF: Safety.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PersonStanding, ChevronRight, AlertTriangle, Brain,
  Camera, ShieldAlert, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_records: 8,
  records_this_month: 2,
  safeguarding_referrals: 1,
  photographs_taken: 6,
  manager_informed_rate: 87.5,
  follow_ups_pending: 1,
  unexplained_marks: 1,
  inconsistent_explanations: 1,
  self_harm_marks: 1,
};

const DEMO_RECORDS: {
  child: string;
  markType: string;
  location: string;
  date: string;
  source: string;
  managerInformed: boolean;
}[] = [
  { child: "Child A", markType: "Bruise", location: "Left Arm", date: "2026-05-11", source: "Child", managerInformed: true },
  { child: "Child C", markType: "Self-Harm", location: "Right Arm", date: "2026-05-08", source: "Staff Witnessed", managerInformed: true },
  { child: "Child B", markType: "Scratch", location: "Head/Face", date: "2026-04-29", source: "Unknown", managerInformed: true },
  { child: "Child D", markType: "Cut", location: "Left Hand", date: "2026-04-15", source: "Child", managerInformed: true },
  { child: "Child A", markType: "Bruise", location: "Right Leg", date: "2026-04-10", source: "Inconsistent", managerInformed: false },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "inconsistent_explanation", severity: "critical", message: "Inconsistent explanation for bruise on Child A (right leg, 2026-04-10) — safeguarding assessment required." },
  { type: "self_harm", severity: "critical", message: "Self-harm mark recorded for Child C (2026-05-08) — ensure safety plan is in place and therapeutic support is available." },
  { type: "manager_not_informed", severity: "high", message: "Manager not informed about bruise on Child A (2026-04-10) — notify registered manager immediately." },
];

const ARIA_INSIGHTS = [
  "8 body map entries recorded. 2 this month. 1 safeguarding referral made. Photographs taken for 75% of entries. Manager informed rate: 87.5%. 1 follow-up pending. 1 unexplained mark, 1 inconsistent explanation, 1 self-harm mark.",
  "Priority: Child A has an inconsistent explanation for a bruise — this requires immediate safeguarding assessment. Child C's self-harm mark needs safety plan review and ongoing therapeutic support monitoring.",
  "Good practice: Photography rate is high (75%). Gap: 1 entry without manager notification. Ensure all body map entries are reviewed by the registered manager within 24 hours of recording. Consider refresher training on body map documentation.",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  Child: { label: "Child", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Staff Witnessed": { label: "Witnessed", color: "text-green-700 bg-green-50 border-green-200" },
  Unknown: { label: "Unknown", color: "text-red-700 bg-red-50 border-red-200" },
  Inconsistent: { label: "Inconsistent", color: "text-red-700 bg-red-50 border-red-200" },
};

// ── Component ────────────────────────────────────────────────────────────────

export function BodyMapCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <PersonStanding className="h-4 w-4 text-brand" />
            Body Maps
          </CardTitle>
          <Link href="/body-maps" className="text-xs text-brand hover:underline flex items-center gap-1">
            Body Maps <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.records_this_month}</p>
            <p className="text-[10px] text-muted-foreground">This Month</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.safeguarding_referrals === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.safeguarding_referrals === 0 ? "text-green-600" : "text-red-600")}>
              {m.safeguarding_referrals}
            </p>
            <p className="text-[10px] text-muted-foreground">Referrals</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.unexplained_marks === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.unexplained_marks === 0 ? "text-green-600" : "text-red-600")}>
              {m.unexplained_marks}
            </p>
            <p className="text-[10px] text-muted-foreground">Unexplained</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.follow_ups_pending === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.follow_ups_pending === 0 ? "text-green-600" : "text-amber-600")}>
              {m.follow_ups_pending}
            </p>
            <p className="text-[10px] text-muted-foreground">Follow-ups</p>
          </div>
        </div>

        {/* ── Recent entries ──────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Camera className="h-3 w-3" />
            Recent Body Map Entries
          </p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((rec, i) => {
              const sourceBadge = SOURCE_BADGES[rec.source] ?? SOURCE_BADGES.Unknown;
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium">{rec.child}</span>
                    <span className="text-muted-foreground truncate">{rec.markType} — {rec.location}</span>
                    {!rec.managerInformed && <ShieldAlert className="h-3 w-3 text-red-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-muted-foreground">{rec.date}</span>
                    <Badge variant="outline" className={cn("text-[10px]", sourceBadge.color)}>
                      {sourceBadge.label}
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
              Body Map Alerts
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
            ARIA Body Map Intelligence
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
