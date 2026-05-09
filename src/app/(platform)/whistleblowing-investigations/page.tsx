"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Gavel,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Users,
  FileSearch,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useWBInvestigationRecords } from "@/hooks/use-wb-investigation-records";
import type {
  WBInvestigationRecord,
  WBInvestigationConcernType,
  WBInvestigationOutcome,
  WBInvestigationStatus,
} from "@/types/extended";
import {
  WB_INVESTIGATION_CONCERN_TYPE_LABEL,
  WB_INVESTIGATION_REPORTER_CATEGORY_LABEL,
  WB_INVESTIGATION_OUTCOME_LABEL,
  WB_INVESTIGATION_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config ─────────────────────────────────────────────────────── */

const OUTCOME_META: Record<WBInvestigationOutcome, { colour: string }> = {
  substantiated:            { colour: "bg-red-100 text-red-700" },
  partially_substantiated:  { colour: "bg-orange-100 text-orange-700" },
  unsubstantiated:          { colour: "bg-green-100 text-green-700" },
  inconclusive:             { colour: "bg-gray-100 text-gray-700" },
  ongoing:                  { colour: "bg-amber-100 text-amber-700" },
};

const STATUS_CLR: Record<WBInvestigationStatus, { colour: string }> = {
  active: { colour: "bg-amber-100 text-amber-700" },
  closed: { colour: "bg-green-100 text-green-700" },
};

const CONCERN_TYPES: WBInvestigationConcernType[] = [
  "practice_concerns", "safeguarding", "financial", "health_safety",
  "behaviour", "discrimination", "bullying",
];

/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function WhistleblowingInvestigationsPage() {
  const { data: records = [], isLoading } = useWBInvestigationRecords();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState("date");

  const stats = useMemo(() => {
    const cutoff = d(-365);
    const closedInWindow = records.filter(
      (r) => r.status === "closed" && r.closed_date && r.closed_date >= cutoff
    );
    const decided = records.filter((r) => r.outcome !== "ongoing");
    const substantiated = decided.filter(
      (r) => r.outcome === "substantiated" || r.outcome === "partially_substantiated"
    );
    const externalLed = records.filter((r) => r.independent);

    return {
      active: records.filter((r) => r.status === "active").length,
      closedYear: closedInWindow.length,
      substantiatedRate:
        decided.length === 0
          ? 0
          : Math.round((substantiated.length / decided.length) * 100),
      externalPct:
        records.length === 0
          ? 0
          : Math.round((externalLed.length / records.length) * 100),
    };
  }, [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (filterType !== "all") list = list.filter((r) => r.concern_type === filterType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.summary_of_concern.toLowerCase().includes(q) ||
          WB_INVESTIGATION_CONCERN_TYPE_LABEL[r.concern_type].toLowerCase().includes(q) ||
          r.findings.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "type":
          return a.concern_type.localeCompare(b.concern_type);
        case "outcome":
          return a.outcome.localeCompare(b.outcome);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return b.date_raised.localeCompare(a.date_raised);
      }
    });
    return list;
  }, [records, filterStatus, filterType, search, sortBy]);

  const exportCols: ExportColumn<WBInvestigationRecord>[] = [
    { header: "Date Raised",        accessor: (r: WBInvestigationRecord) => r.date_raised },
    { header: "Concern Type",       accessor: (r: WBInvestigationRecord) => WB_INVESTIGATION_CONCERN_TYPE_LABEL[r.concern_type] },
    { header: "Summary",            accessor: (r: WBInvestigationRecord) => r.summary_of_concern },
    { header: "Reporter Category",  accessor: (r: WBInvestigationRecord) => WB_INVESTIGATION_REPORTER_CATEGORY_LABEL[r.reporter_category] },
    { header: "Anonymous",          accessor: (r: WBInvestigationRecord) => (r.reporter_anonymous ? "Yes" : "No") },
    { header: "Investigation Lead", accessor: (r: WBInvestigationRecord) => (r.independent ? r.external_investigator : getStaffName(r.investigation_lead)) },
    { header: "Independent",        accessor: (r: WBInvestigationRecord) => (r.independent ? "Yes" : "No") },
    { header: "People Interviewed", accessor: (r: WBInvestigationRecord) => r.people_interviewed },
    { header: "Outcome",            accessor: (r: WBInvestigationRecord) => WB_INVESTIGATION_OUTCOME_LABEL[r.outcome] },
    { header: "Findings",           accessor: (r: WBInvestigationRecord) => r.findings },
    { header: "Referrals",          accessor: (r: WBInvestigationRecord) => r.referrals_made.join("; ") || "None" },
    { header: "Reporter Fed Back",  accessor: (r: WBInvestigationRecord) => (r.reporter_fed_back ? r.feedback_date : "No") },
    { header: "Status",             accessor: (r: WBInvestigationRecord) => WB_INVESTIGATION_STATUS_LABEL[r.status] },
    { header: "Closed Date",        accessor: (r: WBInvestigationRecord) => r.closed_date || "—" },
    { header: "Data Protection",    accessor: (r: WBInvestigationRecord) => (r.data_protection_maintained ? "Maintained" : "Breach") },
  ];

  if (isLoading) {
    return (
      <PageShell title="Whistleblowing Investigations" subtitle="Investigations arising from whistleblowing concerns — distinct from the concerns register">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Whistleblowing Investigations"
      subtitle="Investigations arising from whistleblowing concerns — distinct from the concerns register"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="whistleblowing-investigations" />
          <PrintButton title="Whistleblowing Investigations" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* confidentiality banner */}
        <div className="rounded-lg border-l-4 border-purple-400 bg-purple-50 p-3 flex items-start gap-2">
          <Lock className="h-5 w-5 text-purple-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-900">
            <strong>Confidential record.</strong> Names of reporters, subjects and young people are anonymised on this register.
            Full identifiable case files are held securely and accessible only to the RM, RI and the named investigator. Reporter identity is protected under the Public Interest Disclosure Act 1998.
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Active Investigations",   v: stats.active,                       icon: FileSearch,    c: "text-amber-600" },
            { l: "Closed (12 months)",      v: stats.closedYear,                   icon: CheckCircle2,  c: "text-green-600" },
            { l: "Substantiated Rate",      v: `${stats.substantiatedRate}%`,      icon: AlertTriangle, c: "text-orange-600" },
            { l: "External-led %",          v: `${stats.externalPct}%`,            icon: ShieldCheck,   c: "text-blue-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {stats.active > 0 && (
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-900">
              <strong>{stats.active} active investigation{stats.active > 1 ? "s" : ""}</strong> in progress —
              ensure protective measures, reporter feedback and weekly RI oversight are maintained.
            </p>
          </div>
        )}

        {/* filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search investigations…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Concern type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Concern Types</SelectItem>
              {CONCERN_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{WB_INVESTIGATION_CONCERN_TYPE_LABEL[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="date">Date Raised</option>
              <option value="type">Concern Type</option>
              <option value="outcome">Outcome</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* cards */}
        {filtered.map((inv) => {
          const isOpen = expandedId === inv.id;
          const stagesDone = inv.stages_completed.filter((s) => s.completed).length;
          const stagesTotal = inv.stages_completed.length;
          return (
            <div key={inv.id} className="rounded-lg border bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : inv.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Gavel className="h-5 w-5 text-brand" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{WB_INVESTIGATION_CONCERN_TYPE_LABEL[inv.concern_type]}</h3>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_CLR[inv.status].colour)}>
                        {WB_INVESTIGATION_STATUS_LABEL[inv.status]}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", OUTCOME_META[inv.outcome].colour)}>
                        Outcome: {WB_INVESTIGATION_OUTCOME_LABEL[inv.outcome]}
                      </span>
                      {inv.independent && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          External-led
                        </span>
                      )}
                      {inv.reporter_anonymous && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                          Anonymous reporter
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Raised {inv.date_raised} · Stages {stagesDone}/{stagesTotal} · {inv.summary_of_concern.slice(0, 90)}…
                    </p>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {isOpen && (
                <div className="border-t p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Reporter:</span> {inv.reporter_anonymous ? "Anonymous" : WB_INVESTIGATION_REPORTER_CATEGORY_LABEL[inv.reporter_category]}</div>
                    <div><span className="text-muted-foreground">Lead:</span> {inv.independent ? inv.external_investigator : getStaffName(inv.investigation_lead)}</div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Interviewed:</span> {inv.people_interviewed}
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Data protection:</span>{" "}
                      {inv.data_protection_maintained ? "Maintained" : "Breach noted"}
                    </div>
                  </div>

                  {/* concern */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="text-sm font-semibold mb-1">Anonymised summary of concern</h4>
                    <p className="text-sm text-muted-foreground">{inv.summary_of_concern}</p>
                  </div>

                  {/* stages */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Investigation stages</h4>
                    <div className="space-y-2 border-l-2 border-gray-200 pl-4">
                      {inv.stages_completed.map((s, i) => (
                        <div key={i} className="relative">
                          <div
                            className={cn(
                              "absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 bg-white",
                              s.completed ? "border-green-500" : "border-gray-300"
                            )}
                          />
                          <div className="flex items-center gap-2">
                            <p className={cn("text-sm font-medium", !s.completed && "text-muted-foreground")}>
                              {s.stage}
                            </p>
                            {s.completed && (
                              <span className="text-xs text-green-700">✓ {s.completion_date}</span>
                            )}
                          </div>
                          {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* evidence */}
                  {inv.evidence_gathered.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Evidence gathered</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {inv.evidence_gathered.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* outcome / findings */}
                  <div className={cn("rounded-lg p-3", OUTCOME_META[inv.outcome].colour)}>
                    <h4 className="text-sm font-semibold mb-1">Outcome: {WB_INVESTIGATION_OUTCOME_LABEL[inv.outcome]}</h4>
                    <p className="text-sm">{inv.findings}</p>
                  </div>

                  {/* actions */}
                  {inv.actions_implemented.length > 0 && (
                    <div className="rounded-lg bg-blue-50 p-3">
                      <h4 className="text-sm font-semibold text-blue-800 mb-1">Actions implemented</h4>
                      <ul className="list-disc list-inside text-sm text-blue-900">
                        {inv.actions_implemented.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* policy review */}
                  {inv.policy_review_arising && (
                    <div className="rounded-lg bg-amber-50 p-3">
                      <h4 className="text-sm font-semibold text-amber-800 mb-1">Policy review arising</h4>
                      <p className="text-sm text-amber-900">{inv.policy_review_arising}</p>
                    </div>
                  )}

                  {/* referrals */}
                  {inv.referrals_made.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" /> External referrals
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {inv.referrals_made.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* feedback to reporter */}
                  <div className="rounded-lg bg-green-50 p-3">
                    <h4 className="text-sm font-semibold text-green-800 mb-1">Reporter feedback</h4>
                    <p className="text-sm text-green-900">
                      {inv.reporter_fed_back
                        ? `Reporter fed back on ${inv.feedback_date} — outcome and learning shared in line with confidentiality.`
                        : "Reporter feedback not yet completed — must be closed within 5 working days of outcome."}
                    </p>
                  </div>

                  {/* learning */}
                  {inv.learning_points.length > 0 && (
                    <div className="rounded-lg bg-indigo-50 p-3">
                      <h4 className="text-sm font-semibold text-indigo-800 mb-1">Learning points</h4>
                      <ul className="list-disc list-inside text-sm text-indigo-900">
                        {inv.learning_points.map((l, i) => <li key={i}>{l}</li>)}
                      </ul>
                    </div>
                  )}

                  {inv.status === "closed" && inv.closed_date && (
                    <p className="text-xs text-muted-foreground">
                      File closed {inv.closed_date}. Retained securely for the period required by the home's records-retention schedule.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* regulatory note */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Regulatory framework</strong> — Investigations triggered by whistleblowing must be conducted promptly, fairly
          and confidentially. The <em>Public Interest Disclosure Act 1998</em> protects qualifying disclosures from detrimental
          treatment. <em>Children's Homes Regulations 2015 (Quality Standard 5 — Protection of Children)</em> requires the
          registered person to investigate concerns about staff and practice, take appropriate action and learn from outcomes.
          <em> Working Together to Safeguard Children 2023</em> requires inter-agency cooperation, including LADO consultation,
          where allegations relate to a person who works with children.
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
