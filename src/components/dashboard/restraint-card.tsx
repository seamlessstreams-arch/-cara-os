"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PHYSICAL INTERVENTION INTELLIGENCE CARD
// Dashboard card for restraint incidents, compliance metrics, de-escalation
// rates, notification tracking, and ARIA behaviour pattern intelligence.
// CHR 2015 Reg 19 (behaviour management), Reg 20 (restraint).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Hand, ChevronRight, AlertTriangle, Brain,
  ShieldCheck, UserCheck, FileCheck, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_ANALYSIS = {
  total_incidents: 8,
  avg_duration_minutes: 4.2,
  with_injuries: 1,
  injury_rate: 13,
  de_escalation_success_rate: 88,
  debrief_completion_rate: 75,
  manager_review_rate: 63,
  child_views_rate: 88,
  body_map_rate: 100,
  notification_compliance: 50,
};

const DEMO_BY_TYPE = [
  { type: "Physical Restraint", count: 4 },
  { type: "Guided Away", count: 2 },
  { type: "Holding", count: 1 },
  { type: "Separation", count: 1 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "incomplete_notification", severity: "high", message: "Restraint of Jayden on 2026-05-10: social worker not notified (Reg 35/40)." },
  { type: "no_debrief", severity: "medium", message: "Post-incident debrief not completed for restraint of Amara on 2026-05-08." },
  { type: "repeated_restraint", severity: "high", message: "Jayden has 4 restraint incidents — review behaviour support plan and consider referral to CAMHS/specialist." },
];

const ARIA_INSIGHTS = [
  "Jayden accounts for 50% of all restraints this month (4/8). Cross-reference with antecedent data — 3 of 4 incidents occurred during transitions (mealtimes, bedtime). Review sensory regulation strategies and consider environmental modifications.",
  "Notification compliance at 50% — 4 incidents have incomplete notifications. Social worker and parent/carer notifications must be completed within 24 hours per Reg 35. Review notification workflow and assign responsibility.",
  "De-escalation attempted in 88% of incidents — above sector benchmark. Body maps completed for 100%. Average duration 4.2 minutes. 1 injury recorded (minor). Manager review rate (63%) needs improvement to 100% for Reg 45 evidence.",
];

// ── Component ────────────────────────────────────────────────────────────────

function ComplianceBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            value >= 90 ? "bg-green-400" : value >= 70 ? "bg-amber-400" : "bg-red-400",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn(
        "w-8 text-right tabular-nums font-medium",
        value >= 90 ? "text-green-600" : value >= 70 ? "text-amber-600" : "text-red-600",
      )}>
        {value}%
      </span>
    </div>
  );
}

export function RestraintCard() {
  const a = DEMO_ANALYSIS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Hand className="h-4 w-4 text-brand" />
            Physical Interventions
          </CardTitle>
          <Link href="/restraint" className="text-xs text-brand hover:underline flex items-center gap-1">
            Records <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", a.total_incidents === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", a.total_incidents === 0 ? "text-green-600" : "text-amber-600")}>
              {a.total_incidents}
            </p>
            <p className="text-[10px] text-muted-foreground">Incidents</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {a.avg_duration_minutes}m
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Duration</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", a.with_injuries === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", a.with_injuries === 0 ? "text-green-600" : "text-red-600")}>
              {a.with_injuries}
            </p>
            <p className="text-[10px] text-muted-foreground">Injuries</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", a.de_escalation_success_rate >= 80 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", a.de_escalation_success_rate >= 80 ? "text-green-600" : "text-amber-600")}>
              {a.de_escalation_success_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">De-escal.</p>
          </div>
        </div>

        {/* ── Type breakdown ──────────────────────────────────────────── */}

        <div className="grid grid-cols-2 gap-1.5">
          {DEMO_BY_TYPE.map((t) => (
            <div key={t.type} className="flex items-center justify-between rounded border p-2 text-xs">
              <span className="truncate">{t.type}</span>
              <Badge variant="outline" className="text-[10px] tabular-nums ml-1">{t.count}</Badge>
            </div>
          ))}
        </div>

        {/* ── Compliance metrics ──────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Post-Incident Compliance
          </p>
          <ComplianceBar label="Body maps" value={a.body_map_rate} />
          <ComplianceBar label="Child views" value={a.child_views_rate} />
          <ComplianceBar label="De-escalation" value={a.de_escalation_success_rate} />
          <ComplianceBar label="Debrief" value={a.debrief_completion_rate} />
          <ComplianceBar label="Manager review" value={a.manager_review_rate} />
          <ComplianceBar label="Notifications" value={a.notification_compliance} />
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Intervention Alerts
            </p>
            {DEMO_ALERTS.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  alert.severity === "critical"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : alert.severity === "high"
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
            ARIA Behaviour Intelligence
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
