"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WORKFORCE DIVERSITY & EQUALITY INTELLIGENCE CARD
// CHR 2015 Reg 16; Equality Act 2010; PSED.
// SCCIF: Leadership & Management — "The workforce is diverse
// and reflects the community."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users2, ChevronRight, AlertTriangle, Brain,
  Accessibility, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_records: 30,
  diversity_coverage: 100,
  disclosure_rate: 73.3,
  training_completed_rate: 66.7,
  training_overdue_count: 3,
  adjustments_in_place: 4,
  discrimination_reported_count: 0,
  average_inclusive_practice: 7.8,
};

const DEMO_RECORDS: { staff: string; category: string; training: string; adjustment: string }[] = [
  { staff: "Sarah M.", category: "Ethnicity", training: "Completed", adjustment: "N/A" },
  { staff: "James T.", category: "Disability", training: "Completed", adjustment: "In Place" },
  { staff: "Lisa K.", category: "Religion", training: "Overdue", adjustment: "N/A" },
  { staff: "David W.", category: "Gender", training: "Completed", adjustment: "N/A" },
  { staff: "Emma R.", category: "Age Group", training: "In Progress", adjustment: "Requested" },
  { staff: "Mark P.", category: "Sexual Orientation", training: "Overdue", adjustment: "N/A" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "training_overdue", severity: "high", message: "3 staff members have overdue equality training — schedule immediately." },
  { type: "adjustments_pending", severity: "medium", message: "1 reasonable adjustment has been requested — review and implement per Equality Act 2010." },
];

const ARIA_INSIGHTS = [
  "30 diversity records, 100% staff coverage. Disclosure: 73.3%. Training completed: 66.7%. Overdue: 3. Adjustments: 4 in place. Discrimination: 0. Inclusive practice: 7.8/10.",
  "Priority: 3 equality training overdue — schedule. 1 reasonable adjustment pending. Disclosure at 73.3% — encourage voluntary disclosure. Zero discrimination positive.",
  "Positive: 100% staff covered. Zero discrimination reports. Inclusive practice 7.8/10 strong. 4 reasonable adjustments demonstrate commitment. Consider diversity champions programme.",
];

const TRAINING_BADGES: Record<string, { label: string; color: string }> = {
  "Completed": { label: "Done", color: "text-green-700 bg-green-50 border-green-200" },
  "In Progress": { label: "In Prog", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Overdue": { label: "Overdue", color: "text-red-700 bg-red-50 border-red-200" },
  "Not Started": { label: "Not Started", color: "text-slate-600 bg-slate-50 border-slate-200" },
  "Refresher Due": { label: "Refresh", color: "text-amber-700 bg-amber-50 border-amber-200" },
};

export function WorkforceDiversityCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users2 className="h-4 w-4 text-brand" />
            Workforce Diversity
          </CardTitle>
          <Link href="/workforce-diversity" className="text-xs text-brand hover:underline flex items-center gap-1">
            Diversity <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.training_completed_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Trained</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.training_overdue_count > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.training_overdue_count > 0 ? "text-red-600" : "text-green-600")}>{m.training_overdue_count}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.discrimination_reported_count > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.discrimination_reported_count > 0 ? "text-red-600" : "text-green-600")}>{m.discrimination_reported_count}</p>
            <p className="text-[10px] text-muted-foreground">Discrim</p>
          </div>
          <div className="text-center rounded-lg bg-purple-50 p-2">
            <p className="text-lg font-bold tabular-nums text-purple-600">{m.average_inclusive_practice}</p>
            <p className="text-[10px] text-muted-foreground">Inclusive</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Accessibility className="h-3 w-3" />Staff Records</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => {
              const badge = TRAINING_BADGES[r.training] ?? TRAINING_BADGES["Not Started"];
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckCircle2 className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="font-medium">{r.staff}</span>
                    <span className="text-muted-foreground truncate">{r.category} · {r.adjustment}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Diversity Alerts</p>
            {DEMO_ALERTS.map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Diversity Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
