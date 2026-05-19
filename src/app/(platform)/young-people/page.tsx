"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  AlertTriangle, User, Shield, Calendar, GraduationCap,
  ChevronRight, ChevronDown, Clock, ClipboardList, Search, Heart,
  Pill, MapPin, Flame, BookOpen, UserX, Users,
  Target, TrendingUp, TrendingDown, Minus, ExternalLink,
  FileText, ShieldAlert,
} from "lucide-react";
import { useYoungPeople, type YPEnriched } from "@/hooks/use-young-people";
import { useChildExperienceLatest } from "@/hooks/use-intelligence";
import { useCarePlans } from "@/hooks/use-care-plans";
import { useOutcomes } from "@/hooks/use-outcomes";
import { useKeyWorkingSessions } from "@/hooks/use-key-working";
import { useAuthContext } from "@/contexts/auth-context";
import type { CarePlan } from "@/types/extended";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const YP_EXPORT_COLS: ExportColumn<YPEnriched>[] = [
  { header: "First Name", accessor: (yp) => yp.preferred_name ?? yp.first_name },
  { header: "Last Name", accessor: (yp) => yp.last_name },
  { header: "Date of Birth", accessor: (yp) => yp.date_of_birth },
  { header: "Age", accessor: (yp) => String(yp.age) },
  { header: "Gender", accessor: (yp) => yp.gender },
  { header: "Status", accessor: (yp) => yp.status },
  { header: "Placement Start", accessor: (yp) => yp.placement_start },
  { header: "Local Authority", accessor: (yp) => yp.local_authority },
  { header: "Social Worker", accessor: (yp) => yp.social_worker_name },
  { header: "Key Worker", accessor: (yp) => yp.key_worker?.full_name ?? "" },
  { header: "Legal Status", accessor: (yp) => yp.legal_status },
  { header: "Risk Flags", accessor: (yp) => yp.risk_flags.join(", ") },
  { header: "Open Incidents", accessor: (yp) => String(yp.open_incidents) },
  { header: "Missing Episodes", accessor: (yp) => String(yp.missing_episodes_total) },
  { header: "Active Medications", accessor: (yp) => String(yp.active_medications) },
  { header: "School", accessor: (yp) => yp.school_name ?? "" },
  { header: "Allergies", accessor: (yp) => yp.allergies.join(", ") },
];

type StatusTab = "current" | "former" | "all";
type RiskFilter = "all" | "high_risk" | "missing_history" | "no_key_worker" | "no_recent_log";
type SortKey = "name" | "age" | "risk" | "placement";

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 animate-pulse space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-24 bg-slate-100 rounded" />
        </div>
        <div className="h-6 w-16 bg-slate-100 rounded-full" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-5/6" />
      </div>
    </div>
  );
}

// ── YP Intelligence Score ─────────────────────────────────────────────────────

function YPIntelligenceScore({ childId }: { childId: string }) {
  const { data, isLoading } = useChildExperienceLatest(childId);

  if (isLoading) {
    return <div className="h-8 w-14 rounded-full bg-slate-100 animate-pulse" />;
  }

  const snapshot = data?.data;
  if (!snapshot) return null;

  const score = snapshot.overall_score;
  const delta = snapshot.score_delta;

  // Trend indicator
  const trendChar =
    delta === null || delta === 0
      ? "—"
      : delta > 0
      ? "▲"
      : "▼";

  // Colour band
  const pillClass =
    score >= 80
      ? "bg-emerald-100 text-emerald-800"
      : score >= 60
      ? "bg-teal-100 text-teal-800"
      : score >= 40
      ? "bg-amber-100 text-amber-800"
      : "bg-red-100 text-red-800";

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
        Wellbeing
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
          pillClass
        )}
      >
        <span>{trendChar}</span>
        <span>{score}</span>
      </span>
    </div>
  );
}

// ── Care Plan RAG helpers ─────────────────────────────────────────────────────

const DOMAINS = [
  ["health",                "Health"],
  ["education",             "Education"],
  ["emotional_behavioural", "Emotional"],
  ["identity",              "Identity"],
  ["family_social",         "Family"],
  ["independence",          "Independence"],
  ["placement_stability",   "Placement"],
  ["safety",                "Safety"],
] as [string, string][];

function carePlanRag(plan: CarePlan): "red" | "amber" | "green" {
  const goals = plan.goals;
  if (goals.some((g) => g.status === "attention_needed")) return "red";
  if (goals.every((g) => g.status === "achieved" || g.status === "closed")) return "green";
  return "amber";
}

function lacDaysLabel(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (days < 0)  return `LAC overdue ${Math.abs(days)}d`;
  if (days === 0) return "LAC today";
  return `LAC in ${days}d`;
}

// ── Expanded card sub-components ─────────────────────────────────────────────

function CarePlanExpanded({ carePlan, childId }: { carePlan: CarePlan | null | undefined; childId: string }) {
  const router = useRouter();

  if (!carePlan) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 text-center">
        <ClipboardList className="h-5 w-5 text-slate-300 mx-auto mb-1.5" />
        <p className="text-xs font-medium text-slate-500 mb-1">No care plan yet</p>
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/care-plans?child_id=${childId}`); }}
          className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Create care plan
        </button>
      </div>
    );
  }

  const rag = carePlanRag(carePlan);
  const onTrack = carePlan.goals.filter((g) => g.status === "on_track").length;
  const attention = carePlan.goals.filter((g) => g.status === "attention_needed").length;
  const achieved = carePlan.goals.filter((g) => g.status === "achieved").length;
  const total = carePlan.goals.length;
  const lacLabel = lacDaysLabel(carePlan.next_lac_review);

  return (
    <div className={cn(
      "rounded-xl border px-4 py-3 space-y-2",
      rag === "red" ? "bg-red-50/50 border-red-200" :
      rag === "amber" ? "bg-amber-50/50 border-amber-200" :
      "bg-emerald-50/50 border-emerald-100",
    )}>
      <div className="flex items-center gap-2">
        <ClipboardList className={cn("h-4 w-4 shrink-0",
          rag === "red" ? "text-red-500" : rag === "amber" ? "text-amber-500" : "text-emerald-500",
        )} />
        <span className="text-xs font-semibold text-slate-700">Care Plan Status</span>
        <Badge variant={rag === "red" ? "destructive" : rag === "amber" ? "warning" : "success"} className="text-[9px] ml-auto rounded-full">
          {rag === "red" ? "Attention Needed" : rag === "amber" ? "In Progress" : "On Track"}
        </Badge>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded-lg bg-white/60 p-1.5">
          <div className="text-sm font-bold text-slate-700">{total}</div>
          <div className="text-[9px] text-slate-500">Goals</div>
        </div>
        <div className="rounded-lg bg-white/60 p-1.5">
          <div className="text-sm font-bold text-emerald-600">{onTrack}</div>
          <div className="text-[9px] text-slate-500">On Track</div>
        </div>
        <div className="rounded-lg bg-white/60 p-1.5">
          <div className="text-sm font-bold text-red-600">{attention}</div>
          <div className="text-[9px] text-slate-500">Attention</div>
        </div>
        <div className="rounded-lg bg-white/60 p-1.5">
          <div className="text-sm font-bold text-blue-600">{achieved}</div>
          <div className="text-[9px] text-slate-500">Achieved</div>
        </div>
      </div>
      {/* Domain RAG dots with labels */}
      <div className="flex flex-wrap gap-1.5">
        {DOMAINS.map(([domain, label]) => {
          const dg = carePlan.goals.filter((g) => g.domain === domain);
          if (dg.length === 0) return null;
          const dr = dg.some((g) => g.status === "attention_needed") ? "red"
            : dg.every((g) => g.status === "achieved" || g.status === "closed") ? "green"
            : "amber";
          return (
            <span key={domain} className={cn(
              "inline-flex items-center gap-1 text-[9px] font-medium rounded-full px-2 py-0.5 border",
              dr === "red" ? "bg-red-100 text-red-700 border-red-200" :
              dr === "amber" ? "bg-amber-100 text-amber-700 border-amber-200" :
              "bg-emerald-100 text-emerald-700 border-emerald-200",
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                dr === "red" ? "bg-red-500" : dr === "amber" ? "bg-amber-400" : "bg-emerald-500",
              )} />
              {label}
            </span>
          );
        })}
      </div>
      {lacLabel && (
        <div className="text-[10px] text-slate-500">
          <Calendar className="h-3 w-3 inline mr-1" />
          {lacLabel}
        </div>
      )}
    </div>
  );
}

function OutcomesSummary({ childId }: { childId: string }) {
  const { data, isLoading } = useOutcomes({ childId });

  if (isLoading) {
    return <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />;
  }

  const childStats = data?.per_child?.find((c) => c.child_id === childId);
  const meta = data?.meta;

  if (!childStats && !meta) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 text-center">
        <Target className="h-5 w-5 text-slate-300 mx-auto mb-1.5" />
        <p className="text-xs text-slate-400">No outcome targets set</p>
      </div>
    );
  }

  const activeTargets = childStats?.active_targets ?? meta?.active_targets ?? 0;
  const improving = childStats?.improving ?? meta?.improving ?? 0;
  const stable = childStats?.stable ?? meta?.stable ?? 0;
  const declining = childStats?.declining ?? meta?.declining ?? 0;
  const avgRating = childStats?.avg_rating ?? meta?.avg_rating ?? 0;

  return (
    <div className="rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-purple-500 shrink-0" />
        <span className="text-xs font-semibold text-slate-700">Outcomes</span>
        {avgRating > 0 && (
          <span className="text-[10px] text-slate-500 ml-auto">
            Avg rating: <strong className="text-purple-700">{avgRating.toFixed(1)}</strong>
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded-lg bg-white/60 p-1.5">
          <div className="text-sm font-bold text-purple-600">{activeTargets}</div>
          <div className="text-[9px] text-slate-500">Active</div>
        </div>
        <div className="rounded-lg bg-white/60 p-1.5">
          <div className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-0.5">
            <TrendingUp className="h-3 w-3" />{improving}
          </div>
          <div className="text-[9px] text-slate-500">Improving</div>
        </div>
        <div className="rounded-lg bg-white/60 p-1.5">
          <div className="text-sm font-bold text-slate-600 flex items-center justify-center gap-0.5">
            <Minus className="h-3 w-3" />{stable}
          </div>
          <div className="text-[9px] text-slate-500">Stable</div>
        </div>
        <div className="rounded-lg bg-white/60 p-1.5">
          <div className="text-sm font-bold text-red-600 flex items-center justify-center gap-0.5">
            <TrendingDown className="h-3 w-3" />{declining}
          </div>
          <div className="text-[9px] text-slate-500">Declining</div>
        </div>
      </div>
    </div>
  );
}

function KeyWorkingLastSession({ childId }: { childId: string }) {
  const { data, isLoading } = useKeyWorkingSessions({ childId });

  if (isLoading) {
    return <div className="h-8 rounded-lg bg-slate-100 animate-pulse" />;
  }

  const sessions = data?.data ?? [];
  const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const last = sorted[0];

  if (!last) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 rounded-lg border border-dashed border-slate-200 px-3 py-2">
        <BookOpen className="h-3.5 w-3.5 shrink-0" />
        <span>No key working sessions recorded</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-slate-600 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2">
      <BookOpen className="h-3.5 w-3.5 shrink-0 text-teal-500" />
      <span>
        Last key working: <strong>{formatRelative(last.date)}</strong>
        <span className="text-slate-400 ml-1">({last.type.replace(/_/g, " ")} &middot; {last.duration}min)</span>
      </span>
      <span className="ml-auto text-[10px] text-slate-400">{sessions.length} total</span>
    </div>
  );
}

function QuickLinks({ childId }: { childId: string }) {
  const router = useRouter();
  const links = [
    { label: "Care Plan", href: `/care-plans?child_id=${childId}`, icon: ClipboardList, color: "text-emerald-600" },
    { label: "Key Working", href: `/key-working?child_id=${childId}`, icon: BookOpen, color: "text-teal-600" },
    { label: "Risk Assessments", href: `/risk-assessments?child_id=${childId}`, icon: ShieldAlert, color: "text-red-600" },
    { label: "Education", href: `/education?child_id=${childId}`, icon: GraduationCap, color: "text-blue-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {links.map((link) => (
        <button
          key={link.label}
          onClick={(e) => { e.stopPropagation(); router.push(link.href); }}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-all group/link"
        >
          <link.icon className={cn("h-3.5 w-3.5 shrink-0", link.color)} />
          <span>{link.label}</span>
          <ExternalLink className="h-3 w-3 ml-auto text-slate-300 group-hover/link:text-blue-400 transition-colors" />
        </button>
      ))}
    </div>
  );
}

// ── YP Card ───────────────────────────────────────────────────────────────────

interface YPCardProps {
  yp: YPEnriched;
  onNavigate: () => void;
  carePlan?: CarePlan | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function YPCard({ yp, onNavigate, carePlan, isExpanded, onToggleExpand }: YPCardProps) {
  const displayName = yp.preferred_name ?? yp.first_name;
  const hasRisk = yp.risk_flags.length > 0;

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all cursor-pointer group",
        hasRisk && "ring-1 ring-amber-200",
        isExpanded && "lg:col-span-3 ring-2 ring-blue-200 shadow-lg",
      )}
      onClick={onToggleExpand}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Avatar name={displayName} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-slate-900 truncate">
              {displayName} {yp.last_name}
            </div>
            <div className="text-xs text-slate-500">
              Age {yp.age} — {yp.local_authority}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge
              variant={yp.status === "current" ? "success" : "secondary"}
              className="rounded-full capitalize text-[10px]"
            >
              {yp.status}
            </Badge>
            {hasRisk && (
              <Badge variant="warning" className="rounded-full text-[9px] gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                Risk
              </Badge>
            )}
            <YPIntelligenceScore childId={yp.id} />
          </div>
        </div>

        {/* Risk flags */}
        {hasRisk && (
          <div className="flex flex-wrap gap-1 mb-3">
            {yp.risk_flags.map((flag) => (
              <Badge key={flag} variant="warning" className="text-[9px] rounded-full gap-0.5 px-2 py-0.5">
                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                {flag}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <div className={cn(
              "text-lg font-bold",
              yp.open_incidents > 0 ? "text-red-600" : "text-emerald-600"
            )}>
              {yp.open_incidents}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">Incidents</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <div className={cn(
              "text-lg font-bold",
              yp.active_tasks > 0 ? "text-amber-600" : "text-slate-900"
            )}>
              {yp.active_tasks}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">Tasks</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <div className="text-lg font-bold text-blue-600">{yp.active_medications}</div>
            <div className="text-[10px] text-slate-500 leading-tight">Meds</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <div className={cn(
              "text-lg font-bold",
              yp.missing_episodes_total > 0 ? "text-violet-600" : "text-slate-900"
            )}>
              {yp.missing_episodes_total}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">Missing</div>
          </div>
        </div>

        {/* Key info */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>
              Key Worker:{" "}
              <strong>{yp.key_worker?.full_name ?? "Unassigned"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Shield className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">SW: {yp.social_worker_name}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>Placed: {formatDate(yp.placement_start)}</span>
          </div>
          {yp.school_name && (
            <div className="flex items-center gap-2 text-slate-600">
              <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{yp.school_name}</span>
            </div>
          )}
        </div>

        {/* Allergies */}
        {yp.allergies.length > 0 && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            <strong>Allergy:</strong> {yp.allergies.join(", ")}
          </div>
        )}

        {/* Care plan strip (collapsed view) */}
        {!isExpanded && carePlan && (() => {
          const rag      = carePlanRag(carePlan);
          const attention = carePlan.goals.filter((g) => g.status === "attention_needed").length;
          const lacLabel  = lacDaysLabel(carePlan.next_lac_review);
          const lacOverdue = carePlan.next_lac_review
            ? new Date(carePlan.next_lac_review) < new Date()
            : false;
          return (
            <div className={cn(
              "mt-3 rounded-xl border px-3 py-2 flex items-center gap-2 flex-wrap",
              rag === "red"   ? "bg-red-50 border-red-200" :
              rag === "amber" ? "bg-amber-50 border-amber-200" :
              "bg-emerald-50 border-emerald-100",
            )}>
              <ClipboardList className={cn("h-3 w-3 shrink-0",
                rag === "red" ? "text-red-500" : rag === "amber" ? "text-amber-500" : "text-emerald-500",
              )} />
              <span className={cn("text-[10px] font-semibold",
                rag === "red" ? "text-red-700" : rag === "amber" ? "text-amber-700" : "text-emerald-700",
              )}>
                Care Plan
              </span>

              {/* Domain RAG dots */}
              <div className="flex items-center gap-1 flex-wrap">
                {DOMAINS.map(([domain, label]) => {
                  const dg = carePlan.goals.filter((g) => g.domain === domain);
                  if (dg.length === 0) return null;
                  const dr = dg.some((g) => g.status === "attention_needed") ? "red"
                    : dg.every((g) => g.status === "achieved" || g.status === "closed") ? "green"
                    : "amber";
                  return (
                    <div key={domain} title={label} className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      dr === "red" ? "bg-red-500" : dr === "amber" ? "bg-amber-400" : "bg-emerald-500",
                    )} />
                  );
                })}
              </div>

              {/* Attention count */}
              {attention > 0 && (
                <span className="ml-auto text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full">
                  {attention} attention
                </span>
              )}

              {/* LAC countdown */}
              {lacLabel && (
                <span className={cn(
                  "text-[9px] font-semibold px-1.5 py-0.5 rounded-full border",
                  lacOverdue
                    ? "bg-red-100 text-red-700 border-red-200"
                    : "bg-slate-100 text-slate-600 border-slate-200",
                )}>
                  {lacLabel}
                </span>
              )}
            </div>
          );
        })()}

        {/* Last log */}
        {yp.last_log_date && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
            <Clock className="h-3 w-3" />
            Last log: {formatDate(yp.last_log_date)}
          </div>
        )}

        {/* ── Expanded sections ──────────────────────────────────────────── */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-4" onClick={(e) => e.stopPropagation()}>
            {/* Care plan detailed status */}
            <CarePlanExpanded carePlan={carePlan} childId={yp.id} />

            {/* Outcomes summary */}
            <OutcomesSummary childId={yp.id} />

            {/* Key working last session */}
            <KeyWorkingLastSession childId={yp.id} />

            {/* Quick links */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Quick Links</p>
              <QuickLinks childId={yp.id} />
            </div>

            {/* Smart Link Panel */}
            <SmartLinkPanel
              sourceType="young_person"
              sourceId={yp.id}
              childId={yp.id}
            />

            {/* View full profile button */}
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(); }}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              View full profile
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* View more cue (collapsed) */}
        {!isExpanded && (
          <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors">
            <ChevronRight className="h-3 w-3" />
            Click to expand
          </div>
        )}

        {/* Collapse cue (expanded) */}
        {isExpanded && (
          <div
            className="mt-3 flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            onClick={onToggleExpand}
          >
            <ChevronDown className="h-3 w-3 rotate-180" />
            Collapse
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ status }: { status: StatusTab }) {
  return (
    <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
      <User className="h-12 w-12 text-slate-200 mb-4" />
      <div className="text-slate-500 font-medium mb-1">
        {status === "former" ? "No former placements recorded" : "No young people found"}
      </div>
      <div className="text-sm text-slate-400">
        {status === "former"
          ? "Former placements will appear here when a placement ends."
          : "Try a different status filter."}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function YoungPeoplePage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("current");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";

  const { data, isLoading, isError } = useYoungPeople(activeTab);
  const carePlansQuery = useCarePlans({ homeId });

  const youngPeople = data?.data ?? [];
  const meta = data?.meta;

  // Map child_id → latest care plan so each card can access it without extra fetches
  const carePlanByChild = useMemo(() => {
    const map: Record<string, CarePlan> = {};
    (carePlansQuery.data?.data ?? []).forEach((plan) => {
      if (!map[plan.child_id]) map[plan.child_id] = plan;
    });
    return map;
  }, [carePlansQuery.data]);

  // Summary stats (based on current tab data)
  const stats = useMemo(() => {
    const current = youngPeople.filter((yp) => yp.status === "current");
    const withRisk = current.filter((yp) => yp.risk_flags.length > 0).length;
    const withMissing = current.filter((yp) => yp.missing_episodes_total > 0).length;
    const noKeyWorker = current.filter((yp) => !yp.key_worker).length;
    const onMeds = current.filter((yp) => yp.active_medications > 0).length;
    const totalIncidents = current.reduce((s, yp) => s + yp.open_incidents, 0);

    // No log in 2+ days
    const today = new Date();
    const noRecentLog = current.filter((yp) => {
      if (!yp.last_log_date) return true;
      const days = Math.floor((today.getTime() - new Date(yp.last_log_date).getTime()) / 86400000);
      return days > 2;
    }).length;

    return {
      total: current.length,
      withRisk,
      withMissing,
      noKeyWorker,
      onMeds,
      totalIncidents,
      noRecentLog,
    };
  }, [youngPeople]);

  // Filter and sort
  const filteredYP = useMemo(() => {
    let result = youngPeople;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((yp) => {
        const name = `${yp.preferred_name ?? yp.first_name} ${yp.last_name}`.toLowerCase();
        const la = (yp.local_authority ?? "").toLowerCase();
        const kw = (yp.key_worker?.full_name ?? "").toLowerCase();
        const sw = (yp.social_worker_name ?? "").toLowerCase();
        return name.includes(q) || la.includes(q) || kw.includes(q) || sw.includes(q);
      });
    }

    // Risk filter
    const today = new Date();
    switch (riskFilter) {
      case "high_risk":
        result = result.filter((yp) => yp.risk_flags.length > 0);
        break;
      case "missing_history":
        result = result.filter((yp) => yp.missing_episodes_total > 0);
        break;
      case "no_key_worker":
        result = result.filter((yp) => !yp.key_worker);
        break;
      case "no_recent_log":
        result = result.filter((yp) => {
          if (!yp.last_log_date) return true;
          const days = Math.floor((today.getTime() - new Date(yp.last_log_date).getTime()) / 86400000);
          return days > 2;
        });
        break;
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return (a.preferred_name ?? a.first_name).localeCompare(b.preferred_name ?? b.first_name);
        case "age":
          return (b.age ?? 0) - (a.age ?? 0);
        case "risk":
          return b.risk_flags.length - a.risk_flags.length;
        case "placement":
          return new Date(b.placement_start ?? 0).getTime() - new Date(a.placement_start ?? 0).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [youngPeople, search, riskFilter, sortKey]);

  const tabs: { key: StatusTab; label: string }[] = [
    { key: "current", label: `Current${meta ? ` (${meta.current})` : ""}` },
    { key: "former", label: `Former${meta ? ` (${meta.former})` : ""}` },
    { key: "all", label: `All${meta ? ` (${meta.total})` : ""}` },
  ];

  const riskFilters: { key: RiskFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: youngPeople.length },
    { key: "high_risk", label: "Risk Flags", count: stats.withRisk },
    { key: "missing_history", label: "Missing History", count: stats.withMissing },
    { key: "no_key_worker", label: "No Key Worker", count: stats.noKeyWorker },
    { key: "no_recent_log", label: "No Recent Log", count: stats.noRecentLog },
  ];

  return (
    <PageShell
      title="Young People"
      subtitle={
        meta
          ? `${meta.current} current placement${meta.current !== 1 ? "s" : ""} · ${meta.high_risk} with risk flags`
          : "Loading..."
      }
      ariaContext={{ pageTitle: "Young People", sourceType: "child_record" }}
      quickCreateContext={{ module: "young-people", defaultTaskCategory: "young_person_plans", defaultFormType: "welfare_check", preferredTab: "form" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filteredYP} columns={YP_EXPORT_COLS} filename="young-people" />
          <PrintButton title="Young People" subtitle="Oak House — Children in Placement" targetId="young-people-content" />
          <SmartUploadButton variant="inline" label="Upload Document" uploadContext="Young people — care document upload" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="young-people-content" className="space-y-6 animate-fade-in">

        {/* Summary stats (only show for current tab) */}
        {activeTab === "current" && !isLoading && stats.total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
              <Heart className="h-4 w-4 text-rose-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-slate-800 tabular-nums">{stats.total}</div>
              <div className="text-[10px] text-slate-500">Current</div>
            </div>
            <div className={cn("rounded-xl border p-3 text-center", stats.withRisk > 0 ? "border-red-200 bg-red-50" : "border-slate-200 bg-white")}>
              <AlertTriangle className={cn("h-4 w-4 mx-auto mb-1", stats.withRisk > 0 ? "text-red-500" : "text-slate-300")} />
              <div className={cn("text-lg font-bold tabular-nums", stats.withRisk > 0 ? "text-red-700" : "text-slate-400")}>{stats.withRisk}</div>
              <div className="text-[10px] text-slate-500">Risk Flags</div>
            </div>
            <div className={cn("rounded-xl border p-3 text-center", stats.totalIncidents > 0 ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-white")}>
              <Flame className={cn("h-4 w-4 mx-auto mb-1", stats.totalIncidents > 0 ? "text-orange-500" : "text-slate-300")} />
              <div className={cn("text-lg font-bold tabular-nums", stats.totalIncidents > 0 ? "text-orange-700" : "text-slate-400")}>{stats.totalIncidents}</div>
              <div className="text-[10px] text-slate-500">Open Incidents</div>
            </div>
            <div className={cn("rounded-xl border p-3 text-center", stats.withMissing > 0 ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-white")}>
              <MapPin className={cn("h-4 w-4 mx-auto mb-1", stats.withMissing > 0 ? "text-violet-500" : "text-slate-300")} />
              <div className={cn("text-lg font-bold tabular-nums", stats.withMissing > 0 ? "text-violet-700" : "text-slate-400")}>{stats.withMissing}</div>
              <div className="text-[10px] text-slate-500">Missing Hx</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
              <Pill className={cn("h-4 w-4 mx-auto mb-1", stats.onMeds > 0 ? "text-teal-500" : "text-slate-300")} />
              <div className={cn("text-lg font-bold tabular-nums", stats.onMeds > 0 ? "text-teal-700" : "text-slate-400")}>{stats.onMeds}</div>
              <div className="text-[10px] text-slate-500">On Meds</div>
            </div>
            <div className={cn("rounded-xl border p-3 text-center", stats.noKeyWorker > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
              <UserX className={cn("h-4 w-4 mx-auto mb-1", stats.noKeyWorker > 0 ? "text-amber-500" : "text-slate-300")} />
              <div className={cn("text-lg font-bold tabular-nums", stats.noKeyWorker > 0 ? "text-amber-700" : "text-slate-400")}>{stats.noKeyWorker}</div>
              <div className="text-[10px] text-slate-500">No KW</div>
            </div>
            <div className={cn("rounded-xl border p-3 text-center", stats.noRecentLog > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
              <BookOpen className={cn("h-4 w-4 mx-auto mb-1", stats.noRecentLog > 0 ? "text-amber-500" : "text-slate-300")} />
              <div className={cn("text-lg font-bold tabular-nums", stats.noRecentLog > 0 ? "text-amber-700" : "text-slate-400")}>{stats.noRecentLog}</div>
              <div className="text-[10px] text-slate-500">No Log 2d+</div>
            </div>
          </div>
        )}

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
              }}
              className={cn(
                "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px",
                activeTab === tab.key
                  ? "border-blue-600 text-blue-700 bg-blue-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Risk filter + Sort */}
        {!isLoading && youngPeople.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, LA, key worker or social worker..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap items-center">
              {riskFilters.filter((f) => f.key === "all" || f.count > 0).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setRiskFilter(f.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                    riskFilter === f.key
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-rose-300",
                  )}
                >
                  {f.label} {f.key !== "all" && `(${f.count})`}
                </button>
              ))}
              <span className="text-slate-300 mx-1">|</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-200"
              >
                <option value="name">Sort: Name</option>
                <option value="age">Sort: Age</option>
                <option value="risk">Sort: Risk</option>
                <option value="placement">Sort: Placement</option>
              </select>
            </div>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Failed to load young people. Please refresh the page.
          </div>
        )}

        {/* Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : filteredYP.length === 0 && youngPeople.length > 0 ? (
            <div className="col-span-3 text-center py-12 text-slate-400">
              <Search className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">No children match your search or filters</p>
              <p className="text-xs mt-1">Try adjusting the search or filter criteria</p>
            </div>
          ) : filteredYP.length === 0 ? (
            <EmptyState status={activeTab} />
          ) : (
            filteredYP.map((yp) => (
              <YPCard
                key={yp.id}
                yp={yp}
                onNavigate={() => router.push(`/young-people/${yp.id}`)}
                carePlan={carePlanByChild[yp.id] ?? null}
                isExpanded={expandedId === yp.id}
                onToggleExpand={() => setExpandedId(expandedId === yp.id ? null : yp.id)}
              />
            ))
          )}
        </div>

        {/* Results count when filtered */}
        {!isLoading && (search || riskFilter !== "all") && filteredYP.length > 0 && (
          <div className="text-center text-[11px] text-slate-400">
            Showing {filteredYP.length} of {youngPeople.length} children
          </div>
        )}

      </div>

      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={14}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Young People — children in placement, placement details, care orders, child profiles, keyworker assignments, current placements, care planning, Reg 45 children quality evidence"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
