"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Users, Moon, CheckCircle } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
/* ── inlined from use-shift-safety-intelligence (single call site) ──────────── */

type StaffShiftSignal = "at_risk" | "monitoring" | "good";

interface StaffShiftProfile {
  staffId: string;
  staffName: string;
  totalShifts: number;
  totalShiftMinutes: number;
  totalOvertimeMinutes: number;
  sleepInCount: number;
  dayShiftCount: number;
  longShiftCount: number;
  lateArrivalCount: number;
  noShowCount: number;
  openShiftCount: number;
  signal: StaffShiftSignal;
  supervisionNote: string;
}

interface OpenShift {
  shiftId: string;
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  notes: string | null;
}

interface ShiftSafetySummary {
  totalShifts: number;
  todayShifts: number;
  openShiftsToday: number;
  openShiftsTotal: number;
  totalOvertimeMinutes: number;
  longShiftsCount: number;
  lateArrivalsCount: number;
  uniqueStaffWorked: number;
  openShifts: OpenShift[];
  ofstedNote: string;
}

interface ShiftSafetyResponse {
  data: {
    staffProfiles: StaffShiftProfile[];
    summary: ShiftSafetySummary;
  };
}

function useShiftSafetyIntelligence() {
  return useQuery<ShiftSafetyResponse>({
    queryKey: ["shift-safety-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/shift-safety-intelligence");
      if (!res.ok) throw new Error("Failed to fetch shift safety intelligence");
      return res.json();
    },
    staleTime: 120_000,
  });
}

// ── Signal helpers ─────────────────────────────────────────────────────────────

const SIGNAL_META: Record<StaffShiftSignal, { label: string; color: string; bg: string }> = {
  at_risk:   { label: "At Risk",    color: "text-red-700",     bg: "bg-red-50 border-red-200" },
  monitoring: { label: "Monitoring", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  good:      { label: "Good",       color: "text-emerald-700",  bg: "bg-emerald-50 border-emerald-200" },
};

function SignalBadge({ signal }: { signal: StaffShiftSignal }) {
  const m = SIGNAL_META[signal];
  return (
    <Badge variant="outline" className={`text-xs font-medium border ${m.color} ${m.bg}`}>
      {m.label}
    </Badge>
  );
}

// ── Minutes to hours string ────────────────────────────────────────────────────

function toHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ── Open shifts card ───────────────────────────────────────────────────────────

function OpenShiftsCard({ shifts }: { shifts: OpenShift[] }) {
  if (shifts.length === 0) return null;
  return (
    <Card className="border border-red-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Open Shifts — No Staff Allocated
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {shifts.map((s) => (
          <div key={s.shiftId} className="flex items-center justify-between rounded border border-red-200 bg-red-50 p-2">
            <div>
              <p className="text-sm font-medium text-red-800">{s.date}</p>
              <p className="text-xs text-red-700 capitalize">
                {s.shiftType.replace(/_/g, " ")} · {s.startTime}–{s.endTime}
              </p>
              {s.notes && <p className="text-xs text-red-600 italic mt-0.5">{s.notes}</p>}
            </div>
            <span className="text-xs text-red-700 font-medium whitespace-nowrap ml-3">UNCOVERED</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Staff card ─────────────────────────────────────────────────────────────────

function StaffShiftCard({ profile }: { profile: StaffShiftProfile }) {
  const [expanded, setExpanded] = useState(false);
  const meta = SIGNAL_META[profile.signal];
  const totalHours = toHours(profile.totalShiftMinutes);
  const overtimeHours = toHours(profile.totalOvertimeMinutes);

  return (
    <Card className={`border ${profile.signal === "at_risk" ? "border-red-300" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold">{profile.staffName}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {profile.totalShifts} shift{profile.totalShifts !== 1 ? "s" : ""} · {totalHours} total
            </p>
          </div>
          <SignalBadge signal={profile.signal} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Day shifts</p>
            <p className="text-lg font-bold">{profile.dayShiftCount}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Moon className="h-3 w-3" /> Sleep-ins
            </p>
            <p className={`text-lg font-bold ${profile.sleepInCount >= 3 ? "text-amber-600" : "text-foreground"}`}>
              {profile.sleepInCount}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Long shifts</p>
            <p className={`text-lg font-bold ${profile.longShiftCount >= 2 ? "text-amber-600" : "text-foreground"}`}>
              {profile.longShiftCount}
            </p>
          </div>
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-1.5">
          {profile.noShowCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs text-red-700">
              <AlertTriangle className="h-3 w-3" /> {profile.noShowCount} no-show{profile.noShowCount > 1 ? "s" : ""}
            </span>
          )}
          {profile.totalOvertimeMinutes > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700">
              <Clock className="h-3 w-3" /> {overtimeHours} overtime
            </span>
          )}
          {profile.lateArrivalCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700">
              Late {profile.lateArrivalCount}×
            </span>
          )}
          {profile.longShiftCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted border px-2 py-0.5 text-xs text-foreground">
              {profile.longShiftCount} shift{profile.longShiftCount > 1 ? "s" : ""} 10h+
            </span>
          )}
          {profile.signal === "good" && profile.noShowCount === 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700">
              <CheckCircle className="h-3 w-3" /> No concerns
            </span>
          )}
        </div>

        {/* Supervision note */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground w-full"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Hide" : "Supervision note"}
        </Button>
        {expanded && (
          <div className={`rounded-lg border p-3 ${meta.bg}`}>
            <p className={`font-medium text-xs mb-1.5 ${meta.color}`}>Supervision note</p>
            <p className="text-sm text-foreground leading-relaxed">{profile.supervisionNote}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Filter type ───────────────────────────────────────────────────────────────

type Filter = "all" | StaffShiftSignal;

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ShiftSafetyPage() {
  const { data, isLoading, error } = useShiftSafetyIntelligence();
  const [filter, setFilter] = useState<Filter>("all");

  if (isLoading) {
    return (
      <PageShell title="Shift Safety & Continuity Intelligence" description="Staffing coverage, fatigue risk, and continuity of care">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Loading shift data...
        </div>
      </PageShell>
    );
  }

  if (error || !data?.data) {
    return (
      <PageShell title="Shift Safety & Continuity Intelligence" description="Staffing coverage, fatigue risk, and continuity of care">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load shift safety intelligence. Please try again.
        </div>
      </PageShell>
    );
  }

  const { staffProfiles, summary } = data.data;

  const filtered = filter === "all" ? staffProfiles : staffProfiles.filter((p) => p.signal === filter);
  const atRiskCount = staffProfiles.filter((p) => p.signal === "at_risk").length;
  const monitoringCount = staffProfiles.filter((p) => p.signal === "monitoring").length;
  const goodCount = staffProfiles.filter((p) => p.signal === "good").length;

  return (
    <PageShell
      title="Shift Safety & Continuity Intelligence"
      description="Open shifts, fatigue risk, overtime, and late arrivals — real shift data for safer staffing decisions"
    >
      <div className="space-y-6">
        {/* Open shifts today banner */}
        {summary.openShiftsToday > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {summary.openShiftsToday} open shift{summary.openShiftsToday > 1 ? "s" : ""} today with no staff allocated
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Minimum staffing ratios must be maintained at all times. This requires immediate action.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Today&apos;s shifts</p>
            <p className="text-2xl font-bold mt-1">{summary.todayShifts}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.openShiftsToday > 0 ? `${summary.openShiftsToday} open` : "all covered"}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Open shifts</p>
            <p className={`text-2xl font-bold mt-1 ${summary.openShiftsTotal > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {summary.openShiftsTotal}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">in rota period</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Long shifts</p>
            <p className={`text-2xl font-bold mt-1 ${summary.longShiftsCount >= 3 ? "text-amber-600" : "text-foreground"}`}>
              {summary.longShiftsCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">10h+ shifts</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total overtime</p>
            <p className={`text-2xl font-bold mt-1 ${summary.totalOvertimeMinutes > 120 ? "text-amber-600" : "text-foreground"}`}>
              {toHours(summary.totalOvertimeMinutes)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">across all staff</p>
          </div>
        </div>

        {/* Open shifts list */}
        <OpenShiftsCard shifts={summary.openShifts} />

        {/* Staff signal summary */}
        <div className="grid grid-cols-3 gap-2">
          {(["at_risk", "monitoring", "good"] as const).map((s) => {
            const m = SIGNAL_META[s];
            const count = staffProfiles.filter((p) => p.signal === s).length;
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
            <Users className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">{summary.ofstedNote}</p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "all",        label: `All (${staffProfiles.length})` },
              { key: "at_risk",    label: `At Risk (${atRiskCount})` },
              { key: "monitoring", label: `Monitoring (${monitoringCount})` },
              { key: "good",       label: `Good (${goodCount})` },
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

        {/* Staff cards */}
        {filtered.length === 0 ? (
          <EmptyState compact title="No staff match this filter." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((profile) => (
              <StaffShiftCard key={profile.staffId} profile={profile} />
            ))}
          </div>
        )}

        {/* Accountability callout */}
        <blockquote className="border-l-4 border-blue-400 pl-4 py-2 text-sm text-muted-foreground italic">
          &quot;The registered person must ensure that sufficient numbers of suitably qualified, skilled and experienced persons are employed at the home. This includes ensuring that the home is not chronically short-staffed and that staff are not routinely working excessive hours.&quot;
          <br />
          <span className="text-xs not-italic mt-1 block">Children&apos;s Homes (England) Regulations 2015, Regulation 32</span>
        </blockquote>
      </div>
    </PageShell>
  );
}
