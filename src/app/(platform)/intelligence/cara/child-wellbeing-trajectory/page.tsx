"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
type DomainTrajectory = "improving" | "stable" | "declining";
type OverallTrajectory = "thriving" | "progressing" | "holding" | "struggling" | "crisis";

interface WellbeingDomain {
  name: string;
  trajectory: DomainTrajectory;
  detail: string;
  numerator: number;
  denominator: number;
}

interface ChildWellbeingProfile {
  childId: string;
  childName: string;
  placementDays: number;
  domains: WellbeingDomain[];
  improvingDomains: number;
  decliningDomains: number;
  overallTrajectory: OverallTrajectory;
  narrativeSummary: string;
  supervisionPrompt: string;
}

interface WellbeingTrajectorySummary {
  totalChildren: number;
  thriving: number;
  progressing: number;
  holding: number;
  struggling: number;
  crisis: number;
  homeTrend: "positive" | "mixed" | "concerning";
  priorityChildren: string[];
  ofstedNote: string;
}

interface ChildWellbeingTrajectoryResponse {
  data: {
    childProfiles: ChildWellbeingProfile[];
    summary: WellbeingTrajectorySummary;
  };
}

function useChildWellbeingTrajectory() {
  return useQuery<ChildWellbeingTrajectoryResponse>({
    queryKey: ["child-wellbeing-trajectory"],
    queryFn: async () => {
      const res = await fetch("/api/v1/child-wellbeing-trajectory");
      if (!res.ok) throw new Error("Failed to fetch child wellbeing trajectory");
      return res.json();
    },
    staleTime: 120_000,
  });
}

// ── Visual helpers ────────────────────────────────────────────────────────────

const TRAJ_BADGE: Record<OverallTrajectory, string> = {
  thriving:   "bg-emerald-100 text-emerald-800",
  progressing:"bg-blue-100 text-blue-800",
  holding:    "bg-gray-100 text-gray-700",
  struggling: "bg-amber-100 text-amber-800",
  crisis:     "bg-red-100 text-red-800",
};

const TRAJ_LABEL: Record<OverallTrajectory, string> = {
  thriving:   "Thriving",
  progressing:"Progressing",
  holding:    "Holding",
  struggling: "Struggling",
  crisis:     "Crisis",
};

const TRAJ_BORDER: Record<OverallTrajectory, string> = {
  thriving:    "border-emerald-200 bg-emerald-50/30",
  progressing: "border-blue-200 bg-blue-50/30",
  holding:     "border-gray-200 bg-gray-50/20",
  struggling:  "border-amber-200 bg-amber-50/40",
  crisis:      "border-red-200 bg-red-50/50",
};

const DOMAIN_TRAJ_ICON: Record<DomainTrajectory, string> = {
  improving: "↑",
  stable:    "→",
  declining: "↓",
};

const DOMAIN_TRAJ_COLOUR: Record<DomainTrajectory, string> = {
  improving: "text-emerald-600",
  stable:    "text-gray-400",
  declining: "text-red-500",
};

const DOMAIN_TRAJ_BG: Record<DomainTrajectory, string> = {
  improving: "bg-emerald-50 border-emerald-100",
  stable:    "bg-gray-50 border-gray-100",
  declining: "bg-red-50 border-red-100",
};

// ── Domain row ────────────────────────────────────────────────────────────────

function DomainRow({ domain }: { domain: WellbeingDomain }) {
  return (
    <div className={`rounded border px-3 py-2 ${DOMAIN_TRAJ_BG[domain.trajectory]}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-sm font-bold shrink-0 ${DOMAIN_TRAJ_COLOUR[domain.trajectory]}`}>
            {DOMAIN_TRAJ_ICON[domain.trajectory]}
          </span>
          <p className="text-xs font-medium text-gray-700 truncate">{domain.name}</p>
        </div>
        <p className="text-xs text-gray-500 shrink-0 text-right max-w-[140px] truncate">{domain.detail}</p>
      </div>
    </div>
  );
}

// ── Child card ────────────────────────────────────────────────────────────────

function ChildCard({ profile }: { profile: ChildWellbeingProfile }) {
  return (
    <div className={`rounded-lg border p-4 ${TRAJ_BORDER[profile.overallTrajectory]}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{profile.childName}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {profile.placementDays} days in placement ·{" "}
            <span className={`font-medium ${DOMAIN_TRAJ_COLOUR[profile.improvingDomains > profile.decliningDomains ? "improving" : profile.decliningDomains > profile.improvingDomains ? "declining" : "stable"]}`}>
              {profile.improvingDomains} ↑ {profile.decliningDomains} ↓
            </span>
          </p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${TRAJ_BADGE[profile.overallTrajectory]}`}>
          {TRAJ_LABEL[profile.overallTrajectory]}
        </span>
      </div>

      {/* Narrative */}
      <p className="text-xs text-gray-600 mb-3 leading-relaxed">{profile.narrativeSummary}</p>

      {/* Domains */}
      <div className="space-y-1.5 mb-3">
        {profile.domains.map((d) => (
          <DomainRow key={d.name} domain={d} />
        ))}
      </div>

      {/* Supervision prompt */}
      <details open={profile.overallTrajectory === "crisis" || profile.overallTrajectory === "struggling"}>
        <summary className="text-xs font-medium text-indigo-700 cursor-pointer list-none hover:underline select-none">
          Supervision prompt ↓
        </summary>
        <p className="mt-2 text-xs text-gray-700 bg-white/70 rounded p-2 leading-relaxed">
          {profile.supervisionPrompt}
        </p>
      </details>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Filter = OverallTrajectory | "all";

export default function ChildWellbeingTrajectoryPage() {
  const { data, isLoading, isError } = useChildWellbeingTrajectory();
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <PageShell
      title="Child Wellbeing Trajectory"
      description="A 5-domain synthesis of each child's direction of travel — emotional regulation, safety, therapeutic bond, agency, and daily stability. Shows not just where each child is, but whether things are getting better, holding, or getting harder."
    >
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load wellbeing trajectory data. Please refresh.
        </div>
      )}

      {data && (() => {
        const { childProfiles, summary } = data.data;
        const visible = filter === "all" ? childProfiles : childProfiles.filter((c) => c.overallTrajectory === filter);

        return (
          <div className="space-y-6">
            {/* ── Ofsted note ──────────────────────────────────────────── */}
            <div className={`rounded-lg border p-4 ${
              summary.homeTrend === "concerning" ? "border-red-200 bg-red-50"
              : summary.homeTrend === "positive" ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
            }`}>
              <p className="text-sm font-medium text-gray-800">{summary.ofstedNote}</p>
            </div>

            {/* ── Summary tiles ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(["thriving", "progressing", "holding", "struggling", "crisis"] as OverallTrajectory[]).map((traj) => (
                <div key={traj} className={`rounded-xl border p-3 ${TRAJ_BORDER[traj]} cursor-pointer`} onClick={() => setFilter(traj === filter ? "all" : traj)}>
                  <p className={`text-2xl font-bold ${summary[traj] > 0 && (traj === "crisis" || traj === "struggling") ? "text-red-600" : "text-gray-800"}`}>
                    {summary[traj]}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{TRAJ_LABEL[traj]}</p>
                </div>
              ))}
            </div>

            {/* ── Priority children alert ───────────────────────────────── */}
            {summary.priorityChildren.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs font-semibold text-red-800 mb-1">Priority review in next supervision:</p>
                <div className="flex flex-wrap gap-2">
                  {summary.priorityChildren.map((name) => (
                    <span key={name} className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Callout ───────────────────────────────────────────────── */}
            <blockquote className="border-l-4 border-blue-400 bg-blue-50 rounded-r-lg px-4 py-3 text-xs text-blue-900 leading-relaxed italic">
              &ldquo;Children flourish when they feel safe, connected, hopeful, and heard. Our job is to ensure the arc of each child&rsquo;s experience in our care is bending towards those things — and to notice quickly when it isn&rsquo;t.&rdquo;
              <br /><span className="not-italic font-medium mt-1 block">— Regulation 44; DDP Practice Principles; Social Pedagogy</span>
            </blockquote>

            {/* ── Domain legend ─────────────────────────────────────────── */}
            <div className="flex items-center gap-4 text-xs text-gray-600">
              {(["improving", "stable", "declining"] as DomainTrajectory[]).map((t) => (
                <span key={t} className={`flex items-center gap-1 ${DOMAIN_TRAJ_COLOUR[t]}`}>
                  {DOMAIN_TRAJ_ICON[t]} {t}
                </span>
              ))}
              <span className="text-gray-400 ml-2">Click a tile above to filter</span>
            </div>

            {/* ── Filter chips ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
              {([
                { key: "all",        label: `All (${summary.totalChildren})` },
                { key: "crisis",     label: `Crisis (${summary.crisis})` },
                { key: "struggling", label: `Struggling (${summary.struggling})` },
                { key: "holding",    label: `Holding (${summary.holding})` },
                { key: "progressing",label: `Progressing (${summary.progressing})` },
                { key: "thriving",   label: `Thriving (${summary.thriving})` },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── Child cards ───────────────────────────────────────────── */}
            {visible.length === 0 ? (
              <EmptyState compact title="No children in this category." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visible.map((profile) => (
                  <ChildCard key={profile.childId} profile={profile} />
                ))}
              </div>
            )}

            {/* ── Methodology note ──────────────────────────────────────── */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-500 leading-relaxed">
              <span className="font-medium text-gray-600">Five domains: </span>
              (1) Emotional regulation — mood trends in key work and daily log;
              (2) Safety — incident and missing episode frequency;
              (3) Therapeutic bond — key work session quality and frequency;
              (4) Agency — aspiration ownership and outcome target progress;
              (5) Daily stability — recording frequency and significant event rate.
              Trajectory is compared between the last 30 days and the prior 30 days. This is a pattern indicator, not a definitive assessment — the manager supplements it with direct knowledge of each child.
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
