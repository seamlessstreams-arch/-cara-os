"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF RECORDING QUALITY PATHWAY
//
// Per-staff intelligence view: maps each practitioner's Writing Assistant
// engagement (accept / ignore patterns) onto KB practice-framework skill
// domains (21 Skills + PACE Model + Psychological Safety). Surfaces
// supervision discussion prompts grounded in what the data shows.
//
// No LLM calls. Fully deterministic.
// ══════════════════════════════════════════════════════════════════════════════

import { formatRate } from "@/lib/metrics/rate";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/use-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type KBSignal = "progressing" | "developing" | "needs_support";

interface IssueStat {
  type: string;
  total: number;
  accepted: number;
  ignored: number;
}

interface KBAlignment {
  frameworkId: string;
  frameworkTitle: string;
  signal: KBSignal;
  reason: string;
  supervisionPrompt: string;
}

interface StaffRecordingProfile {
  staffId: string;
  name: string;
  jobTitle: string | null;
  role: string | null;
  totalFlagged: number;
  accepted: number;
  ignored: number;
  acceptanceRate: number | null;
  firstEntry: string | null;
  latestEntry: string | null;
  hasData: boolean;
  issueBreakdown: IssueStat[];
  topIssueType: string | null;
  kbAlignment: KBAlignment[];
  overallSignal: KBSignal;
}

interface StaffRecordingQualitySummary {
  totalStaff: number;
  staffWithData: number;
  progressing: number;
  developing: number;
  needsSupport: number;
  topTeamIssueType: string | null;
  avgAcceptanceRate: number | null;
  frameworks: Array<{ id: string; title: string; shortDesc: string }>;
}

interface StaffRecordingQualityPathwayResponse {
  profiles: StaffRecordingProfile[];
  summary: StaffRecordingQualitySummary;
}
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Users,
  MessageSquare,
  CheckCircle2,
  CircleDot,
  CircleAlert,
  Sparkles,
  BarChart2,
} from "lucide-react";

// ── Signal config ─────────────────────────────────────────────────────────────

const SIGNAL_CONFIG: Record<KBSignal, { label: string; icon: React.ElementType; cls: string; badgeCls: string }> = {
  progressing: {
    label: "Progressing",
    icon: TrendingUp,
    cls: "border-emerald-200 bg-emerald-50",
    badgeCls: "border-emerald-300 text-emerald-700 bg-emerald-50",
  },
  developing: {
    label: "Developing",
    icon: CircleDot,
    cls: "border-amber-200 bg-amber-50",
    badgeCls: "border-amber-300 text-amber-700 bg-amber-50",
  },
  needs_support: {
    label: "Needs support",
    icon: CircleAlert,
    cls: "border-red-200 bg-red-50",
    badgeCls: "border-red-300 text-red-700 bg-red-50",
  },
};

// ── Issue type labels ─────────────────────────────────────────────────────────

const ISSUE_LABELS: Record<string, string> = {
  "safeguarding-quality":  "Recording quality",
  "tone":                  "Tone & language",
  "writing-to-child":      "Writing to the child",
  "clarity":               "Clarity",
  "professional-language": "Professional language",
  "chronology":            "Chronology",
  "spelling":              "Spelling",
  "grammar":               "Grammar",
  "punctuation":           "Punctuation",
};

// ── Staff profile card ────────────────────────────────────────────────────────

function ProfileCard({ profile }: { profile: StaffRecordingProfile }) {
  const [expanded, setExpanded] = useState(false);
  const sig = SIGNAL_CONFIG[profile.overallSignal];
  const SigIcon = sig.icon;

  if (!profile.hasData) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3 opacity-60">
        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          <Users className="h-4 w-4 text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-700">{profile.name}</p>
          <p className="text-xs text-slate-400">{profile.jobTitle ?? profile.role ?? ""}</p>
        </div>
        <span className="ml-auto text-xs text-slate-400">No writing audit data yet</span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border shadow-sm overflow-hidden", sig.cls)}>
      {/* Header row */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 text-sm font-semibold text-slate-700">
          {profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
            <Badge variant="outline" className={cn("text-[10px] font-medium py-0 px-1.5", sig.badgeCls)}>
              <SigIcon className="h-2.5 w-2.5 mr-0.5" />
              {sig.label}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">{profile.jobTitle ?? profile.role ?? ""}</p>
        </div>

        {/* Stats strip */}
        <div className="hidden sm:flex items-center gap-4 shrink-0 text-right">
          <div>
            <p className="text-xs text-slate-500">Flagged</p>
            <p className="text-sm font-semibold text-slate-800">{profile.totalFlagged}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Accepted</p>
            <p className="text-sm font-semibold text-emerald-700">{profile.accepted}</p>
          </div>
          {profile.acceptanceRate !== null && (
            <div>
              <p className="text-xs text-slate-500">Rate</p>
              <p className="text-sm font-semibold text-slate-800">{formatRate(profile.acceptanceRate)}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse" : "Expand"}
          className="shrink-0 rounded p-1 text-slate-500 hover:text-slate-700 transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/50 px-4 pb-4 pt-3 bg-white/60 space-y-4">
          {/* Issue breakdown */}
          {profile.issueBreakdown.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1">
                <BarChart2 className="h-3.5 w-3.5" />
                Suggestions by area
              </p>
              <div className="space-y-1.5">
                {profile.issueBreakdown.map((stat) => {
                  const pct = stat.total > 0 ? Math.round((stat.accepted / stat.total) * 100) : null;
                  return (
                    <div key={stat.type} className="flex items-center gap-2">
                      <span className="w-40 shrink-0 text-xs text-slate-600 truncate">
                        {ISSUE_LABELS[stat.type] ?? stat.type}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", (pct ?? 0) >= 70 ? "bg-emerald-400" : (pct ?? 0) >= 40 ? "bg-amber-400" : "bg-red-400")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 shrink-0 w-20 text-right">
                        {stat.accepted}/{stat.total} accepted
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* KB alignment */}
          {profile.kbAlignment.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                Practice framework alignment
              </p>
              <div className="space-y-2">
                {profile.kbAlignment.map((a) => {
                  const aSig = SIGNAL_CONFIG[a.signal];
                  const AIcon = aSig.icon;
                  return (
                    <div key={a.frameworkId} className={cn("rounded-lg border p-3", aSig.cls)}>
                      <div className="flex items-center gap-2 mb-1">
                        <AIcon className="h-3.5 w-3.5 shrink-0" />
                        <a
                          href="/cara-knowledge-base"
                          className="text-xs font-semibold text-violet-700 hover:underline"
                        >
                          {a.frameworkTitle}
                        </a>
                        <Badge variant="outline" className={cn("text-[10px] py-0 px-1.5 ml-auto", aSig.badgeCls)}>
                          {aSig.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{a.reason}</p>
                      <div className="rounded-lg bg-white/70 border border-white px-2.5 py-2 flex gap-2">
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
                        <p className="text-xs text-slate-700 italic leading-relaxed">{a.supervisionPrompt}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StaffRecordingQualityPathwayPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["staff-recording-quality-pathway"],
    queryFn: () =>
      api.get<{ data: StaffRecordingQualityPathwayResponse }>("/staff-recording-quality-pathway"),
    staleTime: 60_000,
  });
  const result = data?.data;

  const [filterSignal, setFilterSignal] = useState<KBSignal | "all">("all");

  const filtered = result
    ? result.profiles.filter((p) => filterSignal === "all" || (p.hasData && (p.overallSignal as string) === filterSignal))
    : [];

  return (
    <PageShell
      title="Recording Quality Pathway"
      subtitle="How each practitioner is engaging with Cara's writing guidance — mapped to the 21 Skills and PACE frameworks"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400 mr-3" />
          <span className="text-sm text-slate-500">Analysing recording patterns…</span>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700 font-medium">Could not load recording pathway data</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">

          {/* ── Summary tiles ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{result.summary.staffWithData}</p>
              <p className="text-xs text-slate-500 mt-0.5">Staff with data</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{result.summary.progressing}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Progressing</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{result.summary.developing}</p>
              <p className="text-xs text-amber-600 mt-0.5">Developing</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{result.summary.needsSupport}</p>
              <p className="text-xs text-red-600 mt-0.5">Needs support</p>
            </div>
          </div>

          {/* ── Team insight strip ──────────────────────────────────────── */}
          {(result.summary.avgAcceptanceRate !== null || result.summary.topTeamIssueType) && (
            <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-slate-50 p-4 flex flex-wrap gap-4 items-center">
              <Sparkles className="h-4 w-4 text-violet-600 shrink-0" />
              <div className="flex flex-wrap gap-6">
                {result.summary.avgAcceptanceRate !== null && (
                  <div>
                    <p className="text-xs text-slate-500">Team acceptance rate</p>
                    <p className="text-sm font-semibold text-slate-800">{formatRate(result.summary.avgAcceptanceRate)}</p>
                  </div>
                )}
                {result.summary.topTeamIssueType && (
                  <div>
                    <p className="text-xs text-slate-500">Most common area flagged</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {ISSUE_LABELS[result.summary.topTeamIssueType] ?? result.summary.topTeamIssueType}
                    </p>
                  </div>
                )}
                {result.summary.frameworks.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500">Grounded in</p>
                    <p className="text-sm font-semibold text-violet-700">
                      {result.summary.frameworks.map((f) => f.title).join(" · ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Filter chips ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2">
            {(["all", "progressing", "developing", "needs_support"] as const).map((sig) => {
              const cfg = sig === "all" ? null : SIGNAL_CONFIG[sig];
              const count =
                sig === "all"
                  ? result.profiles.filter((p) => p.hasData).length
                  : result.profiles.filter((p) => p.hasData && p.overallSignal === sig).length;
              return (
                <button
                  key={sig}
                  type="button"
                  onClick={() => setFilterSignal(sig)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    filterSignal === sig
                      ? sig === "all"
                        ? "border-slate-800 bg-slate-800 text-white"
                        : cn(cfg?.cls, "border-current")
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                  )}
                >
                  {sig === "all" ? "All staff" : (SIGNAL_CONFIG[sig].label)} ({count})
                </button>
              );
            })}
          </div>

          {/* ── Staff profiles ───────────────────────────────────────────── */}
          <div className="space-y-3">
            {filtered
              .sort((a, b) => {
                // Sort: has data first, then by signal severity
                if (a.hasData !== b.hasData) return a.hasData ? -1 : 1;
                const rank: Record<KBSignal, number> = { needs_support: 0, developing: 1, progressing: 2 };
                return rank[a.overallSignal] - rank[b.overallSignal];
              })
              .map((profile) => (
                <ProfileCard key={profile.staffId} profile={profile} />
              ))}
          </div>

          {/* ── Professional note ────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex gap-3">
            <CheckCircle2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-700">Professional accountability</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                This view shows how each practitioner is engaging with Cara&apos;s writing guidance — it does not
                evaluate clinical judgement or make performance decisions. Supervision prompts are suggestions only;
                managers retain full discretion. Cara advises, the manager decides.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {result.summary.frameworks.map((f) => (
                  <a
                    key={f.id}
                    href="/cara-knowledge-base"
                    className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-2 py-0.5 text-[11px] text-violet-700 hover:bg-violet-100 transition-colors"
                  >
                    <BookOpen className="h-2.5 w-2.5" />
                    {f.title}
                  </a>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </PageShell>
  );
}
