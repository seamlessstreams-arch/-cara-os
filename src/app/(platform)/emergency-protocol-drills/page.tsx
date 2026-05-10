"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EMERGENCY PROTOCOL DRILLS
// Records emergency protocol drills beyond fire drills — testing responses to
// scenarios like missing child, medical emergency, power failure, intruder,
// flood/leak, restraint scenario, medication errors.
// Required under Quality Standard 25 (Protection of children) & Regulation 22.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { getStaffName } from "@/lib/seed-data";
import { cn, todayStr } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  Search,
  XCircle,
  Users,
  Activity,
  Zap,
  Loader2,
} from "lucide-react";
import type {
  ProtocolDrill,
  DrillScenarioType,
  DrillOutcome,
} from "@/types/extended";
import {
  DRILL_SCENARIO_TYPE_LABEL,
  DRILL_OUTCOME_LABEL,
} from "@/types/extended";
import { useProtocolDrills } from "@/hooks/use-protocol-drills";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── Helpers ───────────────────────────────────────────────────────────────────

const OUTCOME_STYLES: Record<DrillOutcome, { bg: string; text: string }> = {
  satisfactory: { bg: "bg-green-100", text: "text-green-700" },
  needs_improvement: { bg: "bg-amber-100", text: "text-amber-700" },
  failed: { bg: "bg-red-100", text: "text-red-700" },
};

const SCENARIO_COLOURS: Record<DrillScenarioType, string> = {
  missing_child: "bg-red-100 text-red-700",
  medical_emergency: "bg-pink-100 text-pink-700",
  power_failure: "bg-slate-100 text-slate-700",
  intruder_alert: "bg-purple-100 text-purple-700",
  flooding: "bg-blue-100 text-blue-700",
  evacuation: "bg-orange-100 text-orange-700",
  medication_error_response: "bg-teal-100 text-teal-700",
};

// ── Page Component ────────────────────────────────────────────────────────────

export default function EmergencyProtocolDrillsPage() {
  const { data: queryData, isLoading } = useProtocolDrills();
  const records = queryData?.data ?? [];

  const [search, setSearch] = useState("");
  const [scenarioFilter, setScenarioFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Loading State ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageShell
        title="Emergency Protocol Drills"
        subtitle="Testing emergency responses beyond fire drills — QS25 & Regulation 22"
      >
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  const today = todayStr();
  const yearStart = new Date().getFullYear() + "-01-01";
  const thisYear = records.filter((r) => r.date >= yearStart);
  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  const monthStart = now.toISOString().slice(0, 8) + "01";
  const dueThisMonth = records.filter(
    (r) => r.next_drill_due >= monthStart && r.next_drill_due <= monthEnd
  );
  const passRate =
    thisYear.length > 0
      ? Math.round(
          (thisYear.filter((r) => r.outcome === "satisfactory").length /
            thisYear.length) *
            100
        )
      : 0;
  const scenarios = new Set(records.map((r) => r.scenario_type));
  const stats = {
    totalThisYear: thisYear.length,
    dueThisMonth: dueThisMonth.length,
    passRate,
    scenariosCovered: scenarios.size,
  };

  // ── Overdue check ───────────────────────────────────────────────────────────

  const overdueDrills = records.filter((r) => r.next_drill_due < today);

  // ── Filtering & Sorting ─────────────────────────────────────────────────────

  let filtered = [...records];

  if (scenarioFilter !== "all") {
    filtered = filtered.filter((r) => r.scenario_type === scenarioFilter);
  }
  if (outcomeFilter !== "all") {
    filtered = filtered.filter((r) => r.outcome === outcomeFilter);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        DRILL_SCENARIO_TYPE_LABEL[r.scenario_type].toLowerCase().includes(q) ||
        r.scenario_description.toLowerCase().includes(q) ||
        r.deviations.toLowerCase().includes(q) ||
        r.linked_protocol.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.date.localeCompare(a.date);
      case "oldest":
        return a.date.localeCompare(b.date);
      case "response_time":
        return a.response_time_minutes - b.response_time_minutes;
      case "outcome": {
        const order: Record<DrillOutcome, number> = {
          failed: 0,
          needs_improvement: 1,
          satisfactory: 2,
        };
        return order[a.outcome] - order[b.outcome];
      }
      default:
        return 0;
    }
  });

  // ── Export columns ──────────────────────────────────────────────────────────

  const exportColumns: ExportColumn<ProtocolDrill>[] = [
    { header: "Date", accessor: (r: ProtocolDrill) => r.date },
    { header: "Scenario", accessor: (r: ProtocolDrill) => DRILL_SCENARIO_TYPE_LABEL[r.scenario_type] },
    { header: "Description", accessor: (r: ProtocolDrill) => r.scenario_description },
    { header: "Lead By", accessor: (r: ProtocolDrill) => getStaffName(r.lead_by) },
    {
      header: "Participants",
      accessor: (r: ProtocolDrill) => r.participants.map(getStaffName).join(", "),
    },
    {
      header: "Response Time (min)",
      accessor: (r: ProtocolDrill) => r.response_time_minutes.toString(),
    },
    {
      header: "Protocol Followed",
      accessor: (r: ProtocolDrill) => (r.protocol_followed ? "Yes" : "No"),
    },
    { header: "Deviations", accessor: (r: ProtocolDrill) => r.deviations },
    {
      header: "Learning Points",
      accessor: (r: ProtocolDrill) => r.learning_points.join("; "),
    },
    {
      header: "Actions Required",
      accessor: (r: ProtocolDrill) => r.actions_required.join("; "),
    },
    { header: "Outcome", accessor: (r: ProtocolDrill) => DRILL_OUTCOME_LABEL[r.outcome] },
    { header: "Next Drill Due", accessor: (r: ProtocolDrill) => r.next_drill_due },
    { header: "Linked Protocol", accessor: (r: ProtocolDrill) => r.linked_protocol },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Emergency Protocol Drills"
      subtitle="Testing emergency responses beyond fire drills — QS25 & Regulation 22"
      ariaContext={{ pageTitle: "Emergency Protocol Drills", sourceType: "home_check" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Emergency Protocol Drills" />
          <ExportButton<ProtocolDrill>
            data={filtered}
            columns={exportColumns}
            filename="emergency-protocol-drills"
          />
          <AriaStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Drills This Year",
            value: stats.totalThisYear,
            icon: Shield,
            colour: "text-blue-600",
          },
          {
            label: "Due This Month",
            value: stats.dueThisMonth,
            icon: Clock,
            colour: "text-indigo-600",
          },
          {
            label: "Pass Rate",
            value: `${stats.passRate}%`,
            icon: CheckCircle2,
            colour: "text-green-600",
          },
          {
            label: "Scenarios Covered",
            value: `${stats.scenariosCovered}/7`,
            icon: Activity,
            colour: "text-purple-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border bg-card p-3 flex items-center gap-3"
          >
            <s.icon className={cn("h-5 w-5", s.colour)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Overdue Alert ──────────────────────────────────────────────────── */}
      {overdueDrills.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800">
              {overdueDrills.length} drill{overdueDrills.length > 1 ? "s" : ""} overdue
            </p>
            <ul className="mt-1 text-sm text-red-700 space-y-1">
              {overdueDrills.map((drill) => (
                <li key={drill.id}>
                  <span className="font-medium">{DRILL_SCENARIO_TYPE_LABEL[drill.scenario_type]}</span> — due{" "}
                  {drill.next_drill_due} (linked: {drill.linked_protocol})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Filters & Sort ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search drills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
          />
        </div>

        <select
          value={scenarioFilter}
          onChange={(e) => setScenarioFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Scenarios</option>
          <option value="missing_child">Missing Child</option>
          <option value="medical_emergency">Medical Emergency</option>
          <option value="power_failure">Power Failure</option>
          <option value="intruder_alert">Intruder Alert</option>
          <option value="flooding">Flooding</option>
          <option value="evacuation">Evacuation</option>
          <option value="medication_error_response">Medication Error Response</option>
        </select>

        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Outcomes</option>
          <option value="satisfactory">Satisfactory</option>
          <option value="needs_improvement">Needs Improvement</option>
          <option value="failed">Failed</option>
        </select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="response_time">Response Time</option>
            <option value="outcome">Outcome (worst first)</option>
          </select>
        </div>
      </div>

      {/* ── Drill Cards ────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No drills match your filters.
          </p>
        )}

        {filtered.map((drill) => {
          const expanded = expandedId === drill.id;
          const outcomeStyle = OUTCOME_STYLES[drill.outcome];
          const scenarioColour = SCENARIO_COLOURS[drill.scenario_type];

          return (
            <div
              key={drill.id}
              className="rounded-lg border bg-card overflow-hidden"
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedId(expanded ? null : drill.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Zap className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          scenarioColour
                        )}
                      >
                        {DRILL_SCENARIO_TYPE_LABEL[drill.scenario_type]}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          outcomeStyle.bg,
                          outcomeStyle.text
                        )}
                      >
                        {DRILL_OUTCOME_LABEL[drill.outcome]}
                      </span>
                      {!drill.protocol_followed && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600">
                          <XCircle className="h-3 w-3 mr-1" />
                          Protocol Deviated
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {drill.date} — Led by {getStaffName(drill.lead_by)} — Response:{" "}
                      {drill.response_time_minutes} min
                    </p>
                  </div>
                </div>
                {expanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Expanded Content */}
              {expanded && (
                <div className="border-t px-4 py-4 space-y-4">
                  {/* Scenario Description */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      Scenario Description
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {drill.scenario_description}
                    </p>
                  </div>

                  {/* Participants */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                      <Users className="h-4 w-4" /> Participants
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {drill.participants.map(getStaffName).join(", ")}
                    </p>
                  </div>

                  {/* Deviations */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Deviations</h4>
                    <p className="text-sm text-muted-foreground">
                      {drill.deviations}
                    </p>
                  </div>

                  {/* Learning Points */}
                  {drill.learning_points.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Learning Points
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {drill.learning_points.map((lp, i) => (
                          <li key={i}>{lp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions Required */}
                  {drill.actions_required.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Actions Required
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {drill.actions_required.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      <strong>Linked Protocol:</strong> {drill.linked_protocol}
                    </span>
                    <span>
                      <strong>Next Drill Due:</strong> {drill.next_drill_due}
                    </span>
                    <span>
                      <strong>Protocol Followed:</strong>{" "}
                      {drill.protocol_followed ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Regulatory Context</p>
        <p>
          Emergency protocol drills are required under Quality Standard 25
          (Protection of children) and Regulation 22 of The Children&apos;s Homes
          (England) Regulations 2015. Homes must ensure staff can respond
          effectively to a range of emergency scenarios beyond fire, including
          missing children, medical emergencies, utility failures, and security
          threats. Evidence of regular testing, learning, and improvement must be
          maintained and available for inspection.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Emergency Protocol Drills — fire drill, lockdown drill, missing from care drill, medical emergency, flood protocol, evacuation, drill records, frequency, Ofsted, Annex A evidence"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
