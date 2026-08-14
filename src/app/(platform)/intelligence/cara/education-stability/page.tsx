"use client";

import { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, AlertTriangle, TrendingUp, Star, School } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
type EducationSignal = "thriving" | "engaged" | "vulnerable" | "crisis";

interface ChildEducationProfile {
  childId: string;
  childName: string;
  currentSchool: string | null;
  schoolChanges: number;
  attendanceRecords: number;
  presentCount: number;
  absentCount: number;
  excludedCount: number;
  attendanceRate: number;
  exclusionCount: number;
  hasPEPInLast6Months: boolean;
  lastPEPDate: string | null;
  achievementCount: number;
  openConcernCount: number;
  monitoringCount: number;
  staffAttendedMeetings: boolean;
  signal: EducationSignal;
  supervisionPrompt: string;
}

interface EducationStabilitySummary {
  totalChildren: number;
  thriving: number;
  engaged: number;
  vulnerable: number;
  crisis: number;
  homeAttendanceRate: number;
  childrenWithCurrentPEP: number;
  childrenWithExclusions: number;
  totalAchievements: number;
  ofstedNote: string;
}

interface EducationStabilityResponse {
  data: {
    childProfiles: ChildEducationProfile[];
    summary: EducationStabilitySummary;
  };
}

function useEducationStabilityIntelligence() {
  return useQuery<EducationStabilityResponse>({
    queryKey: ["education-stability-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/education-stability-intelligence");
      if (!res.ok) throw new Error("Failed to fetch education stability intelligence");
      return res.json();
    },
    staleTime: 120_000,
  });
}

// ── Signal helpers ─────────────────────────────────────────────────────────────

const SIGNAL_META: Record<EducationSignal, { label: string; color: string; bg: string }> = {
  crisis:     { label: "Crisis",     color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  vulnerable: { label: "Vulnerable", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  engaged:    { label: "Engaged",    color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  thriving:   { label: "Thriving",   color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
};

function SignalBadge({ signal }: { signal: EducationSignal }) {
  const m = SIGNAL_META[signal];
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium border ${m.color} ${m.bg}`}
    >
      {m.label}
    </Badge>
  );
}

// ── Attendance bar ─────────────────────────────────────────────────────────────

function AttendanceBar({ rate }: { rate: number }) {
  const color = rate >= 90 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Attendance</span>
        <span className="font-medium">{rate}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}

// ── Child card ─────────────────────────────────────────────────────────────────

function ChildEducationCard({ profile }: { profile: ChildEducationProfile }) {
  const [expanded, setExpanded] = useState(false);
  const meta = SIGNAL_META[profile.signal];

  return (
    <Card className={`border ${profile.signal === "crisis" ? "border-red-300" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold">{profile.childName}</CardTitle>
            {profile.currentSchool && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <School className="h-3 w-3 shrink-0" />
                {profile.currentSchool}
                {profile.schoolChanges > 0 && (
                  <span className="text-amber-600 ml-1">({profile.schoolChanges} school change{profile.schoolChanges > 1 ? "s" : ""})</span>
                )}
              </p>
            )}
          </div>
          <SignalBadge signal={profile.signal} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Attendance */}
        {profile.attendanceRecords > 0 ? (
          <AttendanceBar rate={profile.attendanceRate} />
        ) : (
          <p className="text-xs text-muted-foreground italic">No attendance records</p>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Exclusions</p>
            <p className={`text-lg font-bold ${profile.exclusionCount > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {profile.exclusionCount}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">PEP (6m)</p>
            <p className={`text-lg font-bold ${profile.hasPEPInLast6Months ? "text-emerald-600" : "text-red-600"}`}>
              {profile.hasPEPInLast6Months ? "Yes" : "No"}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Achievements</p>
            <p className="text-lg font-bold text-emerald-600">{profile.achievementCount}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Open Concerns</p>
            <p className={`text-lg font-bold ${profile.openConcernCount > 0 ? "text-amber-600" : "text-foreground"}`}>
              {profile.openConcernCount}
            </p>
          </div>
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-1.5">
          {!profile.hasPEPInLast6Months && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs text-red-700">
              <AlertTriangle className="h-3 w-3" /> No current PEP
            </span>
          )}
          {profile.exclusionCount >= 2 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs text-red-700">
              <AlertTriangle className="h-3 w-3" /> Multiple exclusions
            </span>
          )}
          {profile.schoolChanges >= 2 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700">
              <AlertTriangle className="h-3 w-3" /> {profile.schoolChanges} school placements
            </span>
          )}
          {profile.attendanceRate >= 90 && profile.achievementCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700">
              <Star className="h-3 w-3" /> Strong attendance + achievements
            </span>
          )}
          {profile.staffAttendedMeetings && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs text-blue-700">
              Staff advocating in meetings
            </span>
          )}
        </div>

        {/* Supervision prompt */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground w-full"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Hide" : "Supervision prompt"}
        </Button>
        {expanded && (
          <div className={`rounded-lg border p-3 text-sm ${meta.bg}`}>
            <p className={`font-medium text-xs mb-1.5 ${meta.color}`}>Supervision prompt</p>
            <p className="text-sm text-foreground leading-relaxed">{profile.supervisionPrompt}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Filter types ───────────────────────────────────────────────────────────────

type Filter = "all" | EducationSignal;

// ── Page ───────────────────────────────────────────────────────────────────────

export default function EducationStabilityPage() {
  const { data, isLoading, error } = useEducationStabilityIntelligence();
  const [filter, setFilter] = useState<Filter>("all");

  if (isLoading) {
    return (
      <PageShell title="Education Stability Intelligence" description="Tracking each child's education journey">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Loading education data...
        </div>
      </PageShell>
    );
  }

  if (error || !data?.data) {
    return (
      <PageShell title="Education Stability Intelligence" description="Tracking each child's education journey">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load education intelligence. Please try again.
        </div>
      </PageShell>
    );
  }

  const { childProfiles, summary } = data.data;

  const filtered = filter === "all" ? childProfiles : childProfiles.filter((p) => p.signal === filter);

  return (
    <PageShell
      title="Education Stability Intelligence"
      description="Championing each LAC child's educational journey — attendance, exclusions, PEP compliance, and achievement"
    >
      <div className="space-y-6">
        {/* Crisis / no-PEP banner */}
        {(summary.crisis > 0 || summary.childrenWithCurrentPEP < summary.totalChildren) && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                {summary.crisis > 0 && (
                  <p className="text-sm font-semibold text-red-800">
                    {summary.crisis} child{summary.crisis > 1 ? "ren" : ""} in a crisis educational position
                  </p>
                )}
                {summary.childrenWithCurrentPEP < summary.totalChildren && (
                  <p className="text-sm text-red-700 mt-1">
                    {summary.totalChildren - summary.childrenWithCurrentPEP} child{summary.totalChildren - summary.childrenWithCurrentPEP > 1 ? "ren" : ""} without a current PEP (within 6 months)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={() => setFilter("all")}
            className="rounded-lg border bg-card p-4 text-left hover:border-primary transition-colors"
          >
            <p className="text-xs text-muted-foreground">Home Attendance</p>
            <p className={`text-2xl font-bold mt-1 ${summary.homeAttendanceRate >= 90 ? "text-emerald-600" : summary.homeAttendanceRate >= 75 ? "text-amber-600" : "text-red-600"}`}>
              {summary.homeAttendanceRate}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">across all children</p>
          </button>

          <button
            onClick={() => setFilter("all")}
            className="rounded-lg border bg-card p-4 text-left hover:border-primary transition-colors"
          >
            <p className="text-xs text-muted-foreground">PEP Compliance</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {summary.childrenWithCurrentPEP}/{summary.totalChildren}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">with current PEP</p>
          </button>

          <button
            onClick={() => setFilter("crisis")}
            className="rounded-lg border bg-card p-4 text-left hover:border-primary transition-colors"
          >
            <p className="text-xs text-muted-foreground">With Exclusions</p>
            <p className={`text-2xl font-bold mt-1 ${summary.childrenWithExclusions > 0 ? "text-red-600" : "text-foreground"}`}>
              {summary.childrenWithExclusions}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">children</p>
          </button>

          <button
            onClick={() => setFilter("thriving")}
            className="rounded-lg border bg-card p-4 text-left hover:border-primary transition-colors"
          >
            <p className="text-xs text-muted-foreground">Achievements</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.totalAchievements}</p>
            <p className="text-xs text-muted-foreground mt-0.5">recorded in total</p>
          </button>
        </div>

        {/* Signal summary row */}
        <div className="grid grid-cols-4 gap-2">
          {(["crisis", "vulnerable", "engaged", "thriving"] as const).map((s) => {
            const m = SIGNAL_META[s];
            const count = summary[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-lg border p-3 text-center hover:opacity-90 transition-opacity ${m.bg}`}
              >
                <p className={`text-xl font-bold ${m.color}`}>{count}</p>
                <p className={`text-xs font-medium mt-0.5 ${m.color}`}>{m.label}</p>
              </button>
            );
          })}
        </div>

        {/* Ofsted note */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-2">
            <GraduationCap className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">{summary.ofstedNote}</p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "all",       label: `All (${summary.totalChildren})` },
              { key: "crisis",    label: `Crisis (${summary.crisis})` },
              { key: "vulnerable",label: `Vulnerable (${summary.vulnerable})` },
              { key: "engaged",   label: `Engaged (${summary.engaged})` },
              { key: "thriving",  label: `Thriving (${summary.thriving})` },
            ] as { key: Filter; label: string }[]
          ).map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Child cards */}
        {filtered.length === 0 ? (
          <EmptyState compact title="No children match this filter." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((profile) => (
              <ChildEducationCard key={profile.childId} profile={profile} />
            ))}
          </div>
        )}

        {/* Accountability callout */}
        <blockquote className="border-l-4 border-blue-400 pl-4 py-2 text-sm text-muted-foreground italic">
          "Every looked-after child is the responsibility of the Virtual School Head and their corporate parent.
          The home's role is to be a fierce advocate — attending PEP meetings, supporting attendance, and celebrating every achievement."
          <br />
          <span className="text-xs not-italic mt-1 block">DfE: Promoting the education of looked-after children, 2018</span>
        </blockquote>
      </div>
    </PageShell>
  );
}
