"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA INTELLIGENCE HUB
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useAriaSafeguardingFlags,
  useAriaRecommendations,
  useKeyWorkSessions,
  useAriaAssessments,
  useAriaOversight,
  useChildResources,
  useAriaAuditTrail,
} from "@/hooks/use-intelligence";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useAuthContext } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import {
  Sparkles, Shield, Lightbulb, CalendarDays, Brain,
  ScanSearch, ClipboardList, BookOpen, Users, Layers,
  CheckCircle2, ChevronRight, AlertTriangle, FileText,
} from "lucide-react";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Young people ──────────────────────────────────────────────────────────────

// ── Feature sections config ───────────────────────────────────────────────────
const FEATURES = [
  {
    href: "/intelligence/aria/situation",
    title: "Situation Review",
    description: "AI-powered structured analysis of any situation",
    icon: Brain,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    href: "/intelligence/aria/oversight-radar",
    title: "Oversight Radar",
    description: "Scan for missing evidence and oversight gaps",
    icon: ScanSearch,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    href: "/intelligence/aria/oversight",
    title: "Management Oversight",
    description: "Generate professional oversight comments",
    icon: ClipboardList,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    href: "/intelligence/aria/keywork",
    title: "Key Work Builder",
    description: "Plan and build structured key work sessions",
    icon: BookOpen,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    href: "/intelligence/aria/resources",
    title: "Child Resources",
    description: "Create child-friendly resources and worksheets",
    icon: FileText,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-100",
  },
  {
    href: "/intelligence/aria/interactive",
    title: "Interactive Sessions",
    description: "Staff-led session tools for direct child work",
    icon: Users,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
  {
    href: "/intelligence/aria/reflective",
    title: "Reflective Practice",
    description: "PACE-informed staff debrief after difficult events",
    icon: Brain,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
  {
    href: "/intelligence/aria/safeguarding",
    title: "Safeguarding Flags",
    description: "AI-detected safeguarding concerns",
    icon: Shield,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  {
    href: "/intelligence/aria/recommendations",
    title: "Recommendations",
    description: "Suggested next actions from ARIA",
    icon: Lightbulb,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  {
    href: "/intelligence/aria/audit",
    title: "Audit Trail",
    description: "Evidence trail for all AI-generated content",
    icon: Layers,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-100",
  },
];

// ── Summary stat card ─────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  label,
  href,
  variant,
}: {
  title: string;
  value: number | string;
  label: string;
  href: string;
  variant: "red" | "amber" | "blue" | "green";
}) {
  const colours = {
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", value: "text-red-600", btn: "text-red-600 hover:text-red-800" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", value: "text-amber-600", btn: "text-amber-600 hover:text-amber-800" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", value: "text-blue-600", btn: "text-blue-600 hover:text-blue-800" },
    green: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", value: "text-emerald-600", btn: "text-emerald-600 hover:text-emerald-800" },
  };
  const c = colours[variant];
  return (
    <div className={cn("rounded-2xl border p-4 space-y-1", c.bg, c.border)}>
      <div className={cn("text-[11px] font-semibold uppercase tracking-wider", c.text)}>{title}</div>
      <div className={cn("text-3xl font-bold tabular-nums", c.value)}>{value}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <Link href={href} className={cn("text-xs font-medium flex items-center gap-0.5", c.btn)}>
          View <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AriaHubPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const ypQuery = useYoungPeople("current");
  const youngPeople = (ypQuery.data?.data ?? []).map(yp => ({ id: yp.id, name: yp.preferred_name ?? yp.first_name }));
  const { data: flagData } = useAriaSafeguardingFlags({ homeId });
  const { data: recData } = useAriaRecommendations({ homeId });
  const { data: kwData } = useKeyWorkSessions({ homeId });
  const { data: assessData } = useAriaAssessments({ homeId });
  const { data: oversightData } = useAriaOversight({ homeId });
  const { data: resourceData } = useChildResources({ homeId });
  const { data: auditData } = useAriaAuditTrail({ homeId });

  const openFlags = useMemo(() => (flagData?.data ?? []).filter((f) => f.status === "open"), [flagData]);
  const pendingRecs = useMemo(() => (recData?.data ?? []).filter((r) => r.status === "pending"), [recData]);
  const urgentRecs = useMemo(() => pendingRecs.filter((r) => r.priority === "urgent"), [pendingRecs]);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const kwThisWeek = useMemo(
    () => (kwData?.data ?? []).filter((s) => new Date(s.created_at) >= weekStart),
    [kwData]
  );

  const hasCriticalFlags = openFlags.some((f) => f.severity === "critical");

  return (
    <PageShell
      title="ARIA Intelligence"
      subtitle="AI-powered intelligence tools for child care"
      showQuickCreate={false}
      actions={<SmartUploadButton variant="inline" label="Upload Supporting Document" uploadContext="ARIA Intelligence — supporting document upload" />}
    >
      <div className="space-y-6 animate-fade-in">

        {/* Critical banner */}
        {hasCriticalFlags && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-300 bg-red-50 p-4">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm font-semibold text-red-700">
              Critical safeguarding flags require immediate attention. Review now.
            </p>
            <Link href="/intelligence/aria/safeguarding" className="ml-auto shrink-0">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-8">
                Review Flags
              </Button>
            </Link>
          </div>
        )}

        {/* Header banner */}
        <div className="rounded-2xl bg-slate-900 p-6 text-white space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">ARIA Intelligence</h2>
              <p className="text-sm text-slate-300">Adaptive Reflective Intelligence Assistant</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            ARIA supports your practice with AI-powered analysis, structured session planning, safeguarding detection,
            and evidence generation — all designed to save time and improve outcomes for the young people in your care.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {youngPeople.map((yp) => (
              <span key={yp.id} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                {yp.name}
              </span>
            ))}
            <span className="rounded-full bg-violet-600/40 px-3 py-1 text-xs font-medium text-violet-200">
              Oak House
            </span>
          </div>
        </div>

        {/* Top summary stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Open Safeguarding Flags"
            value={openFlags.length}
            label={openFlags.length === 0 ? "All clear" : `${openFlags.filter((f) => f.severity === "critical").length} critical`}
            href="/intelligence/aria/safeguarding"
            variant={openFlags.length === 0 ? "green" : openFlags.some((f) => f.severity === "critical") ? "red" : "amber"}
          />
          <StatCard
            title="Pending Recommendations"
            value={pendingRecs.length}
            label={urgentRecs.length > 0 ? `${urgentRecs.length} urgent` : "No urgent items"}
            href="/intelligence/aria/recommendations"
            variant={urgentRecs.length > 0 ? "amber" : "blue"}
          />
          <StatCard
            title="Key Work Sessions This Week"
            value={kwThisWeek.length}
            label={`${(kwData?.data ?? []).length} total sessions`}
            href="/intelligence/aria/keywork"
            variant="blue"
          />
        </div>

        {/* Feature grid */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">All ARIA Features</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.href} href={feature.href} className="group">
                  <Card className={cn("border transition-all hover:shadow-md hover:-translate-y-0.5", feature.border)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", feature.bg)}>
                          <Icon className={cn("h-4.5 w-4.5", feature.color)} style={{ width: "1.125rem", height: "1.125rem" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-slate-900">{feature.title}</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Assessments", value: (assessData?.data ?? []).length, icon: Brain },
            { label: "Oversight Drafts", value: (oversightData?.data ?? []).length, icon: ClipboardList },
            { label: "Child Resources", value: (resourceData?.data ?? []).length, icon: FileText },
            { label: "Audit Entries", value: (auditData?.data ?? []).length, icon: Layers },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-white p-3 flex items-center gap-3">
              <Icon className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-lg font-bold text-slate-900">{value}</div>
                <div className="text-[10px] text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Safety notice */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-800">Professional Judgement Always Required</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              ARIA supports professional judgement — it does not replace it. All AI-generated content requires
              human review and approval before becoming part of a child&apos;s record. ARIA is a tool to assist
              skilled practitioners, not a substitute for professional expertise.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
