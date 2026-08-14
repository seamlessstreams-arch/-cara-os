"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Pill, CheckCircle, Clock } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
// ── Types ─────────────────────────────────────────────────────────────────────

type ErrorSignal = "alert" | "attention" | "monitoring" | "safe";

interface PendingAction {
  action: string;
  owner: string;
  dueDate: string;
  overdue: boolean;
}

interface ChildErrorProfile {
  childId: string;
  childName: string;
  totalErrors: number;
  last30dErrors: number;
  severityBreakdown: Record<string, number>;
  mostCommonErrorType: string | null;
  openDoC: boolean;
  docCompletionDate: string | null;
  pendingActions: PendingAction[];
  openOrActiveErrors: number;
  recentMedications: string[];
  signal: ErrorSignal;
  supervisionPrompt: string;
}

interface HomePattern {
  factorLabel: string;
  count: number;
}

interface MedicationErrorSummary {
  totalErrors: number;
  last30dErrors: number;
  openErrors: number;
  moderateOrSevereCount: number;
  openDoCCount: number;
  overdueActionsCount: number;
  topContributingFactors: HomePattern[];
  recurringErrorTypes: HomePattern[];
  eveningRoundRisk: boolean;
  ofstedNote: string;
}

interface MedicationErrorPatternResponse {
  data: {
    childProfiles: ChildErrorProfile[];
    summary: MedicationErrorSummary;
  };
}

// ── Signal helpers ─────────────────────────────────────────────────────────────

const SIGNAL_META: Record<ErrorSignal, { label: string; color: string; bg: string }> = {
  alert:      { label: "Alert",      color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  attention:  { label: "Attention",  color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  monitoring: { label: "Monitoring", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  safe:       { label: "Safe",       color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
};

function SignalBadge({ signal }: { signal: ErrorSignal }) {
  const m = SIGNAL_META[signal];
  return (
    <Badge variant="outline" className={`text-xs font-medium border ${m.color} ${m.bg}`}>
      {m.label}
    </Badge>
  );
}

// ── Severity dot ──────────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
  no_harm:  "bg-emerald-400",
  low:      "bg-amber-400",
  moderate: "bg-orange-500",
  severe:   "bg-red-600",
  death:    "bg-red-900",
};

function SeverityDots({ breakdown }: { breakdown: Record<string, number> }) {
  return (
    <div className="flex items-center gap-1">
      {Object.entries(breakdown).map(([sev, count]) => (
        <div key={sev} className="flex items-center gap-0.5">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              title={`${sev.replace(/_/g, " ")}`}
              className={`h-3 w-3 rounded-full ${SEVERITY_COLOR[sev] ?? "bg-muted"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Pattern bar ───────────────────────────────────────────────────────────────

function PatternBar({ patterns, label }: { patterns: HomePattern[]; label: string }) {
  if (patterns.length === 0) return null;
  const max = patterns[0].count;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {patterns.map(({ factorLabel, count }) => (
        <div key={factorLabel} className="space-y-0.5">
          <div className="flex justify-between text-xs text-foreground">
            <span className="capitalize">{factorLabel.replace(/_/g, " ")}</span>
            <span className="font-medium text-muted-foreground">{count}×</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-amber-400"
              style={{ width: `${Math.round((count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Child card ─────────────────────────────────────────────────────────────────

function ChildErrorCard({ profile }: { profile: ChildErrorProfile }) {
  const [expanded, setExpanded] = useState(false);
  const meta = SIGNAL_META[profile.signal];

  return (
    <Card className={`border ${profile.signal === "alert" ? "border-red-300" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold">{profile.childName}</CardTitle>
            {profile.recentMedications.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {profile.recentMedications.join(" · ")}
              </p>
            )}
          </div>
          <SignalBadge signal={profile.signal} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error counts */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className={`text-xl font-bold ${profile.totalErrors > 0 ? "text-amber-600" : "text-foreground"}`}>
              {profile.totalErrors}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Last 30d</p>
            <p className={`text-xl font-bold ${profile.last30dErrors > 0 ? "text-red-600" : "text-foreground"}`}>
              {profile.last30dErrors}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Open</p>
            <p className={`text-xl font-bold ${profile.openOrActiveErrors > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {profile.openOrActiveErrors}
            </p>
          </div>
        </div>

        {/* Severity dots */}
        {profile.totalErrors > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Severity profile</p>
            <SeverityDots breakdown={profile.severityBreakdown} />
            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
              {[
                { key: "no_harm", label: "No harm" },
                { key: "low", label: "Low" },
                { key: "moderate", label: "Moderate" },
                { key: "severe", label: "Severe" },
              ].filter(({ key }) => profile.severityBreakdown[key]).map(({ key, label }) => (
                <div key={key} className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${SEVERITY_COLOR[key]}`} />
                  <span>{label} ({profile.severityBreakdown[key]})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flags */}
        <div className="flex flex-wrap gap-1.5">
          {profile.openDoC && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs text-red-700">
              <AlertTriangle className="h-3 w-3" /> Duty of candour outstanding
            </span>
          )}
          {profile.pendingActions.filter((a) => a.overdue).length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700">
              <Clock className="h-3 w-3" />
              {profile.pendingActions.filter((a) => a.overdue).length} overdue action{profile.pendingActions.filter((a) => a.overdue).length > 1 ? "s" : ""}
            </span>
          )}
          {profile.pendingActions.filter((a) => !a.overdue).length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs text-blue-700">
              <Clock className="h-3 w-3" />
              {profile.pendingActions.filter((a) => !a.overdue).length} pending action{profile.pendingActions.filter((a) => !a.overdue).length > 1 ? "s" : ""}
            </span>
          )}
          {profile.mostCommonErrorType && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted border px-2 py-0.5 text-xs text-foreground">
              Most common: {profile.mostCommonErrorType.replace(/_/g, " ")}
            </span>
          )}
          {profile.totalErrors === 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700">
              <CheckCircle className="h-3 w-3" /> No errors recorded
            </span>
          )}
        </div>

        {/* Pending actions list */}
        {profile.pendingActions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Remedial actions</p>
            {profile.pendingActions.map((action, i) => (
              <div
                key={i}
                className={`rounded border p-2 text-xs ${action.overdue ? "border-red-200 bg-red-50" : "border-muted bg-muted/30"}`}
              >
                <p className={action.overdue ? "text-red-700 font-medium" : "text-foreground"}>
                  {action.action}
                </p>
                <p className={`mt-0.5 ${action.overdue ? "text-red-600" : "text-muted-foreground"}`}>
                  Owner: {action.owner} · Due: {action.dueDate}{action.overdue ? " (OVERDUE)" : ""}
                </p>
              </div>
            ))}
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

type Filter = "all" | ErrorSignal;

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MedicationErrorPatternsPage() {
  const { data, isLoading, error } = useQuery<MedicationErrorPatternResponse>({
    queryKey: ["medication-error-pattern-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/medication-error-pattern-intelligence");
      if (!res.ok) throw new Error("Failed to fetch medication error pattern intelligence");
      return res.json();
    },
    staleTime: 120_000,
  });
  const [filter, setFilter] = useState<Filter>("all");

  if (isLoading) {
    return (
      <PageShell title="Medication Error Pattern Intelligence" description="Analysing the home's medication safety record">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Loading medication error data...
        </div>
      </PageShell>
    );
  }

  if (error || !data?.data) {
    return (
      <PageShell title="Medication Error Pattern Intelligence" description="Analysing the home's medication safety record">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load medication error intelligence. Please try again.
        </div>
      </PageShell>
    );
  }

  const { childProfiles, summary } = data.data;

  const filtered = filter === "all" ? childProfiles : childProfiles.filter((p) => p.signal === filter);

  const alertCount = childProfiles.filter((p) => p.signal === "alert").length;
  const attentionCount = childProfiles.filter((p) => p.signal === "attention").length;
  const monitoringCount = childProfiles.filter((p) => p.signal === "monitoring").length;
  const safeCount = childProfiles.filter((p) => p.signal === "safe").length;

  return (
    <PageShell
      title="Medication Error Pattern Intelligence"
      description="Learning from every medication error — patterns, duty of candour, and remedial actions"
    >
      <div className="space-y-6">
        {/* High severity banner */}
        {(summary.openDoCCount > 0 || summary.moderateOrSevereCount > 0) && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                {summary.openDoCCount > 0 && (
                  <p className="text-sm font-semibold text-red-800">
                    {summary.openDoCCount} duty of candour obligation{summary.openDoCCount > 1 ? "s" : ""} outstanding — child and family must be informed
                  </p>
                )}
                {summary.moderateOrSevereCount > 0 && (
                  <p className="text-sm text-red-700">
                    {summary.moderateOrSevereCount} moderate or severe error{summary.moderateOrSevereCount > 1 ? "s" : ""} on record
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Evening round risk banner */}
        {summary.eveningRoundRisk && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-700 shrink-0" />
              <p className="text-sm text-amber-800">
                Multiple medication errors occurring during the evening round — this is a systemic risk pattern requiring management attention.
              </p>
            </div>
          </div>
        )}

        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total errors</p>
            <p className="text-2xl font-bold mt-1">{summary.totalErrors}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{summary.last30dErrors} in last 30d</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Open / under review</p>
            <p className={`text-2xl font-bold mt-1 ${summary.openErrors > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {summary.openErrors}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">not yet closed</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Duty of candour</p>
            <p className={`text-2xl font-bold mt-1 ${summary.openDoCCount > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {summary.openDoCCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">outstanding</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Overdue actions</p>
            <p className={`text-2xl font-bold mt-1 ${summary.overdueActionsCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {summary.overdueActionsCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">remedial actions</p>
          </div>
        </div>

        {/* Home patterns */}
        {(summary.topContributingFactors.length > 0 || summary.recurringErrorTypes.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Contributing factors</CardTitle>
              </CardHeader>
              <CardContent>
                <PatternBar patterns={summary.topContributingFactors} label="Frequency across all errors" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Error types</CardTitle>
              </CardHeader>
              <CardContent>
                <PatternBar patterns={summary.recurringErrorTypes} label="Error type distribution" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ofsted note */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-2">
            <Pill className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">{summary.ofstedNote}</p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "all",       label: `All (${childProfiles.length})` },
              { key: "alert",     label: `Alert (${alertCount})` },
              { key: "attention", label: `Attention (${attentionCount})` },
              { key: "monitoring",label: `Monitoring (${monitoringCount})` },
              { key: "safe",      label: `Safe (${safeCount})` },
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
              <ChildErrorCard key={profile.childId} profile={profile} />
            ))}
          </div>
        )}

        {/* Accountability callout */}
        <blockquote className="border-l-4 border-blue-400 pl-4 py-2 text-sm text-muted-foreground italic">
          "Where a medication error occurs, the home must identify what happened, inform those affected through duty of candour, implement remedial actions, and demonstrate that learning was shared across the team. The absence of errors does not prove good practice — it may reflect under-reporting."
          <br />
          <span className="text-xs not-italic mt-1 block">NICE / CQC Medicines Management guidance; Regulation 20 Duty of Candour</span>
        </blockquote>
      </div>
    </PageShell>
  );
}
