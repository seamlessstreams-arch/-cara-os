"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { meets, formatRate } from "@/lib/metrics/rate";
import {
  useRepairCycleIntelligence,
  type IncidentRepairProfile,
  type CycleStatus,
} from "@/hooks/use-repair-cycle-intelligence";

const STATUS_CONFIG: Record<CycleStatus, { label: string; bg: string; border: string; text: string }> = {
  complete: { label: "Complete",  bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  partial:  { label: "Partial",   bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700"   },
  missing:  { label: "Missing",   bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700"     },
};

function IncidentCard({ profile }: { profile: IncidentRepairProfile }) {
  const cfg = STATUS_CONFIG[profile.cycleStatus];
  return (
    <div className={`rounded-lg border p-4 space-y-2 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{profile.incidentType}</p>
          <p className="text-xs text-muted-foreground">{profile.incidentDate} · by {profile.reportedBy}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.border} border ${cfg.text}`}>
          {cfg.label}
        </span>
      </div>
      <div className="text-xs space-y-0.5">
        <p>Debrief: {profile.hasDebrief ? <span className="text-emerald-700">✓</span> : <span className="text-red-600">✗</span>}{profile.debriefTurnaroundDays !== null ? ` (${profile.debriefTurnaroundDays}d)` : ""}</p>
        <p>Child perspective: {profile.childPerspectiveCaptured ? <span className="text-emerald-700">✓</span> : <span className="text-amber-600">○</span>}</p>
        <p>Lessons learned: {profile.lessonsLearnedDocumented ? <span className="text-emerald-700">✓</span> : <span className="text-amber-600">○</span>}</p>
        <p>Staff support offered: {profile.staffSupportOffered ? <span className="text-emerald-700">✓</span> : <span className="text-amber-600">○</span>}</p>
      </div>
      <div className="text-xs text-muted-foreground border-t pt-1.5">
        Repair steps: {profile.stepsComplete}/{profile.totalSteps} complete
      </div>
      {profile.supervisionPrompt && (
        <p className="text-xs italic text-muted-foreground">{profile.supervisionPrompt}</p>
      )}
    </div>
  );
}

export default function RepairCycleIntelligencePage() {
  const { data, isLoading, error } = useRepairCycleIntelligence();

  if (isLoading) {
    return (
      <PageShell title="Repair Cycle Intelligence" description="Loading repair cycle data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !data?.data) {
    return (
      <PageShell title="Repair Cycle Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load repair cycle data.</div>
      </PageShell>
    );
  }

  const { incidentProfiles, childSummaries, summary } = data.data;
  const missing = incidentProfiles.filter(p => p.cycleStatus === "missing");
  const partial = incidentProfiles.filter(p => p.cycleStatus === "partial");
  const complete = incidentProfiles.filter(p => p.cycleStatus === "complete");

  return (
    <PageShell
      title="Repair Cycle Intelligence"
      description="DDP-grounded rupture-repair cycle tracking — PI debrief, child perspective capture, lessons learned, staff support, and restorative practice. Every relational incident requires a repair cycle (CHR 2015 Reg 28, Reg 36; Working Together 2023; Secure Care Standards 2022)."
    >
      <div className="space-y-6">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total incidents tracked", value: summary.totalIncidents, color: "text-blue-600" },
            { label: "Complete repair cycles", value: summary.incidentsWithCompleteRepair, color: "text-emerald-600" },
            { label: "With debrief recorded", value: summary.incidentsWithDebrief, color: "text-blue-600" },
            { label: "With child perspective", value: summary.incidentsWithChildPerspective, color: "text-purple-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium">Overall repair cycle completion rate</p>
            <p className="text-xs text-muted-foreground">{summary.mostCommonMissingStep ? `Most common gap: ${summary.mostCommonMissingStep}` : "No recurring gaps"}</p>
          </div>
          <p className={`text-3xl font-bold ${meets(summary.overallCompletionRate, 80) ? "text-emerald-600" : meets(summary.overallCompletionRate, 50) ? "text-amber-600" : summary.overallCompletionRate === null ? "text-muted-foreground" : "text-red-600"}`}>
            {formatRate(summary.overallCompletionRate)}
          </p>
        </div>

        {summary.ofstedNote && (
          <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
            <strong>Ofsted note:</strong> {summary.ofstedNote}
          </div>
        )}

        {missing.length > 0 && (
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Missing repair cycles ({missing.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              {missing.map(p => <IncidentCard key={p.incidentId} profile={p} />)}
            </CardContent>
          </Card>
        )}

        {partial.length > 0 && (
          <Card className="border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Partial repair cycles ({partial.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              {partial.map(p => <IncidentCard key={p.incidentId} profile={p} />)}
            </CardContent>
          </Card>
        )}

        {complete.length > 0 && (
          <Card className="border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Complete repair cycles ({complete.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              {complete.map(p => <IncidentCard key={p.incidentId} profile={p} />)}
            </CardContent>
          </Card>
        )}

        {childSummaries.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Per-child repair summary</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {childSummaries.map(cs => (
                <div key={cs.childId} className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{cs.childName}</p>
                    <p className="text-xs text-muted-foreground">
                      {cs.totalIncidents} incidents · complete {cs.incidentsWithCompleteRepair} · partial {cs.incidentsWithPartialRepair} · none {cs.incidentsWithNoRepair}
                    </p>
                    {cs.mostCommonMissingStep && (
                      <p className="text-xs text-amber-600 mt-0.5">Gap: {cs.mostCommonMissingStep}</p>
                    )}
                  </div>
                  <p className={`text-xl font-bold ml-4 ${meets(cs.cycleCompletionRate, 80) ? "text-emerald-600" : meets(cs.cycleCompletionRate, 50) ? "text-amber-600" : cs.cycleCompletionRate === null ? "text-muted-foreground" : "text-red-600"}`}>
                    {formatRate(cs.cycleCompletionRate)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          The repair cycle is the DDP-informed response to every relational incident. It is not optional: an incident without debrief, without child perspective, without lessons learned, and without restorative conversation is an incomplete safeguarding response. The registered manager's oversight function includes ensuring that every incident on this list has a complete repair cycle closed within regulatory timescales.
        </p>
      </div>
    </PageShell>
  );
}
