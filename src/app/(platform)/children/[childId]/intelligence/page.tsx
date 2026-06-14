"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — CHILD INTELLIGENCE OVERVIEW
//
// Summary dashboard for Cara intelligence related to a specific child.
// Shows report stats, risk profile, recent activity, and quick actions.
// ══════════════════════════════════════════════════════════════════════════════

import React, { use } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  FileText,
  Clock,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Heart,
  Plus,
  List,
  ChevronRight,
  BarChart3,
  Quote,
} from "lucide-react";

// ── Child name lookup ───────────────────────────────────────────────────────

const CHILD_NAMES: Record<string, string> = {
  "child_1": "Jayden Mitchell",
  "child_2": "Amara Osei",
  "child_3": "Reuben Walsh",
  "demo-child-1": "Jayden Mitchell",
  "demo-child-2": "Amara Osei",
  "demo-child-3": "Reuben Walsh",
};

// ── Demo Activity Data ──────────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  type: "report_generated" | "report_approved" | "report_locked" | "evidence_scan" | "challenge_run";
  label: string;
  date: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

function getDemoActivity(): ActivityItem[] {
  return [
    { id: "act-1", type: "report_locked", label: "Weekly Report locked and filed", date: "11 May 2026", icon: ShieldCheck },
    { id: "act-2", type: "report_approved", label: "Weekly Report approved by Sarah Thompson", date: "11 May 2026", icon: FileText },
    { id: "act-3", type: "challenge_run", label: "Challenge mode: 2 warnings, 0 critical", date: "10 May 2026", icon: AlertTriangle },
    { id: "act-4", type: "evidence_scan", label: "Evidence scan: 18 items retrieved for weekly report", date: "10 May 2026", icon: BarChart3 },
    { id: "act-5", type: "report_generated", label: "Social Worker Update draft generated", date: "9 May 2026", icon: Sparkles },
  ];
}

// ── Component ───────────────────────────────────────────────────────────────

export default function ChildIntelligencePage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  const childName = CHILD_NAMES[childId] ?? childId;
  const activity = getDemoActivity();

  return (
    <PageShell title={`Cara Intelligence — ${childName}`}>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--cs-cara-gold-bg)" }}
        >
          <Sparkles className="h-5 w-5" style={{ color: "var(--cs-cara-gold)" }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--cs-navy)" }}>
            Cara Intelligence — {childName}
          </h1>
          <p className="text-sm" style={{ color: "var(--cs-text-muted)" }}>
            AI-assisted report generation, evidence analysis, and insights
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--cs-cara-gold-bg)" }}>
              <FileText className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>Total Reports</p>
              <p className="text-lg font-semibold" style={{ color: "var(--cs-navy)" }}>5</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>Pending Review</p>
              <p className="text-lg font-semibold" style={{ color: "var(--cs-navy)" }}>1</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
              <ShieldCheck className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>Risk Tier</p>
              <p className="text-lg font-semibold" style={{ color: "var(--cs-navy)" }}>
                <Badge variant="success" className="text-xs">Low</Badge>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>Evidence Gaps</p>
              <p className="text-lg font-semibold" style={{ color: "var(--cs-navy)" }}>2</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/children/${childId}/reports/new`} className="block">
              <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                <Plus className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
                Generate Weekly Report
              </Button>
            </Link>
            <Link href={`/children/${childId}/reports`} className="block">
              <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                <List className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
                View All Reports
              </Button>
            </Link>
            <Link href={`/cara-studio/therapeutic-profile?childId=${childId}`} className="block">
              <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                <Heart className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
                Therapeutic Profile
              </Button>
            </Link>
            <Link href={`/cara/reg45`} className="block">
              <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                <TrendingUp className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
                Reg 45 Evidence
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Cara Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                  style={{ borderColor: "var(--cs-border)" }}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "var(--cs-cara-gold-bg)" }}
                  >
                    <item.icon className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--cs-navy)" }}>
                      {item.label}
                    </p>
                    <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>
                      {item.date}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--cs-text-muted)" }} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
