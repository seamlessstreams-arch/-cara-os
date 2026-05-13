"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMPLAINTS & NOTIFICATIONS INTELLIGENCE CARD
// Dashboard card for complaints register, Reg 40 notification tracking,
// response compliance, and ARIA complaints intelligence (Reg 39/40).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquareWarning, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Bell, Clock, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_COMPLAINTS = {
  total: 6,
  open: 2,
  investigating: 1,
  responded: 1,
  closed: 2,
  escalated: 0,
  avgResponseDays: 8.5,
  acknowledgedWithin2Days: 5,
  acknowledgedTotal: 5,
  satisfactionRate: 66.7,
  advocacyOfferedRate: 83.3,
};

const DEMO_NOTIFICATIONS = {
  total: 8,
  pending: 1,
  sentOnTime: 6,
  sentLate: 1,
  overdue: 0,
  complianceRate: 85.7,
};

const OPEN_COMPLAINTS = [
  {
    id: "cmp_1",
    category: "contact_arrangements",
    source: "parent",
    complainant: "Sarah W",
    daysOpen: 12,
    stage: "formal_stage1",
    acknowledged: true,
  },
  {
    id: "cmp_2",
    category: "food_nutrition",
    source: "child",
    complainant: "Tyler R",
    daysOpen: 5,
    stage: "informal",
    acknowledged: true,
  },
  {
    id: "cmp_3",
    category: "staff_conduct",
    source: "placing_authority",
    complainant: "LA Social Worker",
    daysOpen: 3,
    stage: "formal_stage1",
    acknowledged: false,
  },
];

const SOURCE_COLOURS: Record<string, string> = {
  child: "bg-pink-100 text-pink-700",
  parent: "bg-blue-100 text-blue-700",
  placing_authority: "bg-purple-100 text-purple-700",
  advocate: "bg-teal-100 text-teal-700",
  staff: "bg-amber-100 text-amber-700",
  professional: "bg-indigo-100 text-indigo-700",
  anonymous: "bg-gray-100 text-gray-600",
};

const ARIA_INSIGHTS = [
  "1 Reg 40 notification sent late this period (serious incident — sent at 26 hours, deadline 24 hours). Review notification workflow to ensure immediate escalation.",
  "Sarah W's complaint about contact arrangements has been open for 12 days. Formal Stage 1 response is due within 20 working days. Prepare response and consider whether mediation may resolve.",
  "Positive: Advocacy offered in 83.3% of complaints. All child complaints had advocacy support. 66.7% complainant satisfaction rate. Reg 39 complaints procedure is being followed consistently.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function ComplaintsNotificationsCard() {
  const c = DEMO_COMPLAINTS;
  const n = DEMO_NOTIFICATIONS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquareWarning className="h-4 w-4 text-brand" />
            Complaints & Notifications
          </CardTitle>
          <Link href="/complaints" className="text-xs text-brand hover:underline flex items-center gap-1">
            Complaints <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", c.open > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", c.open > 0 ? "text-amber-600" : "text-green-600")}>
              {c.open + c.investigating}
            </p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2">
            <p className="text-lg font-bold tabular-nums">{c.avgResponseDays}d</p>
            <p className="text-[10px] text-muted-foreground">Avg Response</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: n.complianceRate >= 100 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", n.complianceRate >= 100 ? "text-green-600" : "text-amber-600")}>
              {n.complianceRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Reg 40 Sent</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", c.satisfactionRate >= 75 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", c.satisfactionRate >= 75 ? "text-green-600" : "text-amber-600")}>
              {c.satisfactionRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Satisfied</p>
          </div>
        </div>

        {/* ── Reg 40 notification bar ──────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Bell className={cn("h-4 w-4", n.pending > 0 || n.overdue > 0 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">Reg 40 Notifications</p>
              <p className="text-[10px] text-muted-foreground">
                {n.sentOnTime} on time · {n.sentLate} late · {n.pending} pending
              </p>
            </div>
          </div>
          {n.overdue > 0 ? (
            <Badge className="text-[10px] bg-red-100 text-red-700">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {n.overdue} overdue
            </Badge>
          ) : n.pending > 0 ? (
            <Badge className="text-[10px] bg-amber-100 text-amber-700">
              <Clock className="h-3 w-3 mr-1" />
              {n.pending} pending
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All sent
            </Badge>
          )}
        </div>

        {/* ── Open complaints ─────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Open Complaints</p>
          {OPEN_COMPLAINTS.map((cmp) => (
            <div key={cmp.id} className="rounded-lg border p-3 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-[10px]", SOURCE_COLOURS[cmp.source] ?? "bg-gray-100 text-gray-600")}>
                    {cmp.source.replace("_", " ")}
                  </Badge>
                  <span className="font-medium">{cmp.category.replace(/_/g, " ")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {!cmp.acknowledged && (
                    <Badge className="text-[10px] bg-red-100 text-red-700">
                      <Send className="h-2.5 w-2.5 mr-0.5" />
                      Not ack&apos;d
                    </Badge>
                  )}
                  <span className={cn("tabular-nums", cmp.daysOpen > 15 ? "text-red-600 font-medium" : "text-muted-foreground")}>
                    {cmp.daysOpen}d
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground">
                From: {cmp.complainant} · Stage: {cmp.stage.replace(/_/g, " ")}
              </p>
            </div>
          ))}
        </div>

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Complaints Intelligence
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
