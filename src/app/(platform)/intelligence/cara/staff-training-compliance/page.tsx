"use client";

import { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, GraduationCap } from "lucide-react";
import { formatRate, meets } from "@/lib/metrics/rate";
import {
  useStaffTrainingComplianceIntelligence,
  type StaffTrainingProfile,
  type TrainingSignal,
  type CategoryRisk,
} from "@/hooks/use-staff-training-compliance-intelligence";

// ── Signal helpers ─────────────────────────────────────────────────────────────

const SIGNAL_META: Record<TrainingSignal, { label: string; color: string; bg: string }> = {
  non_compliant: { label: "Non-Compliant", color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  expiring:      { label: "Expiring Soon", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  compliant:     { label: "Compliant",     color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  // Neutral, not green: nothing has been checked, so nothing has passed.
  not_recorded:  { label: "Not Recorded",  color: "text-slate-600",  bg: "bg-slate-50 border-slate-200" },
};

function SignalBadge({ signal }: { signal: TrainingSignal }) {
  const m = SIGNAL_META[signal];
  return (
    <Badge variant="outline" className={`text-xs font-medium border ${m.color} ${m.bg}`}>
      {m.label}
    </Badge>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  compliant:     "bg-emerald-50 border-emerald-200 text-emerald-700",
  expiring_soon: "bg-amber-50 border-amber-200 text-amber-700",
  expired:       "bg-red-50 border-red-200 text-red-700",
  not_started:   "bg-red-50 border-red-200 text-red-700",
};

function StatusChip({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status] ?? "bg-muted border-muted"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── Compliance bar ─────────────────────────────────────────────────────────────

function ComplianceBar({ rate }: { rate: number | null }) {
  const color = meets(rate, 100) ? "bg-emerald-500" : meets(rate, 75) ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Mandatory compliance</span>
        <span className="font-medium">{formatRate(rate)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        {rate !== null && (
          <div className={`h-2 rounded-full ${color}`} style={{ width: `${rate}%` }} />
        )}
      </div>
    </div>
  );
}

// ── Category risk card ────────────────────────────────────────────────────────

function CategoryRiskCard({ risks }: { risks: CategoryRisk[] }) {
  if (risks.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Training categories at risk</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {risks.map(({ category, affectedStaff, statuses }) => (
          <div key={category} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm capitalize">{category.replace(/_/g, " ")}</span>
              <div className="flex gap-1">
                {statuses.map((s) => <StatusChip key={s} status={s} />)}
              </div>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{affectedStaff} staff</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Staff card ────────────────────────────────────────────────────────────────

function StaffTrainingCard({ profile }: { profile: StaffTrainingProfile }) {
  const [expanded, setExpanded] = useState(false);
  const meta = SIGNAL_META[profile.signal];

  return (
    <Card className={`border ${profile.signal === "non_compliant" ? "border-red-300" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold">{profile.staffName}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{profile.role.replace(/_/g, " ")}</p>
          </div>
          <SignalBadge signal={profile.signal} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Compliance bar */}
        {profile.mandatoryTotal > 0 && <ComplianceBar rate={profile.complianceRate} />}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{profile.mandatoryTotal}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className={`text-lg font-bold ${profile.mandatoryCompliant === profile.mandatoryTotal ? "text-emerald-600" : "text-foreground"}`}>
              {profile.mandatoryCompliant}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Expiring</p>
            <p className={`text-lg font-bold ${profile.mandatoryExpiringSoon > 0 ? "text-amber-600" : "text-foreground"}`}>
              {profile.mandatoryExpiringSoon}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Lapsed</p>
            <p className={`text-lg font-bold ${(profile.mandatoryExpired + profile.mandatoryNotStarted) > 0 ? "text-red-600" : "text-foreground"}`}>
              {profile.mandatoryExpired + profile.mandatoryNotStarted}
            </p>
          </div>
        </div>

        {/* Issue list */}
        {profile.issues.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Issues requiring action</p>
            {profile.issues.map((issue, i) => (
              <div
                key={i}
                className={`rounded border p-2 text-xs ${
                  issue.status === "expired" || issue.status === "not_started"
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-medium ${issue.status === "expired" || issue.status === "not_started" ? "text-red-700" : "text-amber-700"}`}>
                    {issue.courseName}
                  </p>
                  <StatusChip status={issue.status} />
                </div>
                {issue.expiryDate && (
                  <p className="mt-0.5 text-muted-foreground">Expiry: {issue.expiryDate}</p>
                )}
                {issue.notes && (
                  <p className="mt-0.5 text-muted-foreground italic">{issue.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {profile.mandatoryTotal === 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            No mandatory training records held — nothing evidenced either way
          </div>
        )}

        {profile.mandatoryTotal > 0 && profile.issues.length === 0 && profile.signal === "compliant" && (
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
            All mandatory training records current
          </div>
        )}

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
          <div className={`rounded-lg border p-3 ${meta.bg}`}>
            <p className={`font-medium text-xs mb-1.5 ${meta.color}`}>Supervision prompt</p>
            <p className="text-sm text-foreground leading-relaxed">{profile.supervisionPrompt}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Filter type ───────────────────────────────────────────────────────────────

type Filter = "all" | TrainingSignal;

// ── Page ───────────────────────────────────────────────────────────────────────

export default function StaffTrainingCompliancePage() {
  const { data, isLoading, error } = useStaffTrainingComplianceIntelligence();
  const [filter, setFilter] = useState<Filter>("all");

  if (isLoading) {
    return (
      <PageShell title="Staff Training Compliance Intelligence" description="Tracking mandatory training across the team">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Loading training data...
        </div>
      </PageShell>
    );
  }

  if (error || !data?.data) {
    return (
      <PageShell title="Staff Training Compliance Intelligence" description="Tracking mandatory training across the team">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load training compliance intelligence. Please try again.
        </div>
      </PageShell>
    );
  }

  const { staffProfiles, summary } = data.data;

  const filtered = filter === "all" ? staffProfiles : staffProfiles.filter((p) => p.signal === filter);

  return (
    <PageShell
      title="Staff Training Compliance Intelligence"
      description="Mandatory training compliance across the team — who is current, who is expiring, who needs action"
    >
      <div className="space-y-6">
        {/* Non-compliant alert */}
        {summary.nonCompliantStaff > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {summary.nonCompliantStaff} staff member{summary.nonCompliantStaff > 1 ? "s" : ""} with expired or not-started mandatory training
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Deployment decisions must consider current training status. Ofsted will inspect this.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Overall compliance</p>
            <p className={`text-2xl font-bold mt-1 ${
              summary.overallMandatoryComplianceRate === null ? "text-muted-foreground"
              : meets(summary.overallMandatoryComplianceRate, 100) ? "text-emerald-600"
              : meets(summary.overallMandatoryComplianceRate, 75) ? "text-amber-600"
              : "text-red-600"
            }`}>
              {formatRate(summary.overallMandatoryComplianceRate)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">mandatory records</p>
          </div>
          <button
            onClick={() => setFilter("non_compliant")}
            className="rounded-lg border bg-card p-4 text-left hover:border-primary transition-colors"
          >
            <p className="text-xs text-muted-foreground">Non-compliant</p>
            <p className={`text-2xl font-bold mt-1 ${summary.nonCompliantStaff > 0 ? "text-red-600" : "text-foreground"}`}>
              {summary.nonCompliantStaff}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">staff members</p>
          </button>
          <button
            onClick={() => setFilter("expiring")}
            className="rounded-lg border bg-card p-4 text-left hover:border-primary transition-colors"
          >
            <p className="text-xs text-muted-foreground">Expiring soon</p>
            <p className={`text-2xl font-bold mt-1 ${summary.expiringSoonRecords > 0 ? "text-amber-600" : "text-foreground"}`}>
              {summary.expiringSoonRecords}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">records</p>
          </button>
          <button
            onClick={() => setFilter("compliant")}
            className="rounded-lg border bg-card p-4 text-left hover:border-primary transition-colors"
          >
            <p className="text-xs text-muted-foreground">Fully compliant</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.compliantStaff}</p>
            <p className="text-xs text-muted-foreground mt-0.5">staff members</p>
          </button>
          <button
            onClick={() => setFilter("not_recorded")}
            className="rounded-lg border bg-card p-4 text-left hover:border-primary transition-colors"
          >
            <p className="text-xs text-muted-foreground">No records held</p>
            <p className="text-2xl font-bold text-slate-600 mt-1">{summary.notRecordedStaff}</p>
            <p className="text-xs text-muted-foreground mt-0.5">staff members</p>
          </button>
        </div>

        {/* Categories at risk */}
        <CategoryRiskCard risks={summary.categoriesAtRisk} />

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
              { key: "all",           label: `All (${summary.totalStaff})` },
              { key: "non_compliant", label: `Non-Compliant (${summary.nonCompliantStaff})` },
              { key: "expiring",      label: `Expiring Soon (${summary.expiringStaff})` },
              { key: "compliant",     label: `Compliant (${summary.compliantStaff})` },
              { key: "not_recorded",  label: `Not Recorded (${summary.notRecordedStaff})` },
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
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No staff match this filter.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((profile) => (
              <StaffTrainingCard key={profile.staffId} profile={profile} />
            ))}
          </div>
        )}

        {/* Accountability callout */}
        <blockquote className="border-l-4 border-blue-400 pl-4 py-2 text-sm text-muted-foreground italic">
          "Registered managers must ensure that sufficient numbers of suitably qualified, skilled and experienced persons are employed. They must have regard to the qualifications, competence and experience of those employed."
          <br />
          <span className="text-xs not-italic mt-1 block">Children's Homes (England) Regulations 2015, Regulation 32 & 33</span>
        </blockquote>
      </div>
    </PageShell>
  );
}
