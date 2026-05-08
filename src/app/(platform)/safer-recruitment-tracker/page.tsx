"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  UserCheck,
  FileCheck,
  FileWarning,
  Users,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSaferRecruitmentRecords } from "@/hooks/use-safer-recruitment-records";
import type { SaferRecruitmentRecord, SaferRecruitmentStatus, SaferRecruitmentReferenceStatus, SaferRecruitmentDbsResult } from "@/types/extended";
import { SAFER_RECRUITMENT_STATUS_LABEL, SAFER_RECRUITMENT_REFERENCE_STATUS_LABEL, SAFER_RECRUITMENT_DBS_RESULT_LABEL } from "@/types/extended";

/* ── local config ─────────────────────────────────────────────────────── */

const STATUS_META: Record<SaferRecruitmentStatus, { colour: string; icon: typeof CheckCircle2 }> = {
  applying:              { colour: "bg-gray-100 text-gray-700",     icon: Circle },
  interviewing:          { colour: "bg-blue-100 text-blue-700",     icon: Users },
  references:            { colour: "bg-indigo-100 text-indigo-700", icon: FileCheck },
  dbs_pending:           { colour: "bg-amber-100 text-amber-700",   icon: Clock },
  pre_employment_checks: { colour: "bg-purple-100 text-purple-700", icon: ShieldCheck },
  onboarding:            { colour: "bg-teal-100 text-teal-700",     icon: UserCheck },
  employed:              { colour: "bg-green-100 text-green-700",   icon: CheckCircle2 },
  withdrawn:             { colour: "bg-red-100 text-red-700",       icon: AlertTriangle },
};

const REFERENCE_META: Record<SaferRecruitmentReferenceStatus, string> = {
  pending:          "bg-amber-100 text-amber-700",
  received:         "bg-green-100 text-green-700",
  concerns_raised:  "bg-red-100 text-red-700",
};

const DBS_META: Record<SaferRecruitmentDbsResult, string> = {
  clear:                 "bg-green-100 text-green-700",
  disclosure_reviewed:   "bg-amber-100 text-amber-700",
  pending:               "bg-gray-100 text-gray-700",
};

const STANDARD_CHECKLIST = [
  "Application form received",
  "Identity verification (passport/photo ID)",
  "Right to work confirmed",
  "Address history (5 years) verified",
  "Employment history gaps explained",
  "Two references received",
  "Enhanced DBS with barred list",
  "Overseas police check (if applicable)",
  "Qualifications verified",
  "Health declaration completed",
  "Disqualification declaration signed",
  "Safer recruitment interview completed",
  "Contract issued and signed",
  "Statement of particulars provided",
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function SaferRecruitmentTrackerPage() {
  const { data: records = [], isLoading } = useSaferRecruitmentRecords();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("applicationDate");

  const stats = useMemo(() => {
    const active = records.filter((r) => r.status !== "employed" && r.status !== "withdrawn");
    return {
      activeApplications: active.length,
      awaitingDbs: records.filter((r) => r.dbs_result === "pending" && r.status !== "withdrawn" && r.status !== "applying").length,
      awaitingRefs: records.filter((r) => r.references.some((ref) => ref.status === "pending") && r.status !== "withdrawn").length,
      readyToStart: records.filter((r) => r.status === "onboarding").length,
    };
  }, [records]);

  const flaggedRecords = useMemo(
    () => records.filter((r) => r.red_flags_raised.length > 0 || r.references.some((ref) => ref.status === "concerns_raised")),
    [records],
  );

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.candidate_name.toLowerCase().includes(q) ||
          r.role_applied_for.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":          return a.candidate_name.localeCompare(b.candidate_name);
        case "status":        return a.status.localeCompare(b.status);
        case "proposedStart": return (a.proposed_start_date || "9999").localeCompare(b.proposed_start_date || "9999");
        default:              return b.application_date.localeCompare(a.application_date);
      }
    });
    return list;
  }, [records, filterStatus, search, sortBy]);

  const exportCols: ExportColumn<SaferRecruitmentRecord>[] = [
    { header: "Candidate",          accessor: (r) => r.candidate_name },
    { header: "Role",               accessor: (r) => r.role_applied_for },
    { header: "Application Date",   accessor: (r) => r.application_date },
    { header: "Status",             accessor: (r) => SAFER_RECRUITMENT_STATUS_LABEL[r.status] },
    { header: "Checklist Complete", accessor: (r) => `${r.checklist_items.filter((c) => c.completed).length}/${r.checklist_items.length}` },
    { header: "References",         accessor: (r) => r.references.map((ref) => `${ref.referee} (${SAFER_RECRUITMENT_REFERENCE_STATUS_LABEL[ref.status]})`).join("; ") },
    { header: "DBS Applied",        accessor: (r) => r.dbs_application_date },
    { header: "DBS Result Date",    accessor: (r) => r.dbs_result_date },
    { header: "DBS Result",         accessor: (r) => SAFER_RECRUITMENT_DBS_RESULT_LABEL[r.dbs_result] },
    { header: "Interviewers",       accessor: (r) => r.interviewers.map(getStaffName).join(", ") },
    { header: "Red Flags",          accessor: (r) => r.red_flags_raised.join(" | ") },
    { header: "Proposed Start",     accessor: (r) => r.proposed_start_date },
    { header: "Recruited By",       accessor: (r) => getStaffName(r.recruited_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Safer Recruitment Tracker" subtitle="Schedule 2 & Reg 32 — end-to-end vetting and onboarding compliance for new staff">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Safer Recruitment Tracker"
      subtitle="Schedule 2 & Reg 32 — end-to-end vetting and onboarding compliance for new staff"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="safer-recruitment-tracker" />
          <PrintButton title="Safer Recruitment Tracker" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "Active Applications", v: stats.activeApplications, icon: Users,        c: "text-blue-600" },
            { l: "Awaiting DBS",        v: stats.awaitingDbs,        icon: Clock,        c: stats.awaitingDbs > 0 ? "text-amber-600" : "text-gray-400" },
            { l: "Awaiting References", v: stats.awaitingRefs,       icon: FileWarning,  c: stats.awaitingRefs > 0 ? "text-amber-600" : "text-gray-400" },
            { l: "Ready to Start",      v: stats.readyToStart,       icon: CheckCircle2, c: "text-green-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* alerts */}
        {flaggedRecords.length > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900">Red flags requiring registered manager review</h3>
                <ul className="mt-2 space-y-1 text-sm text-red-900">
                  {flaggedRecords.map((r) => (
                    <li key={r.id}>
                      <strong>{r.candidate_name}</strong> ({r.role_applied_for}) —{" "}
                      {[
                        ...r.red_flags_raised,
                        ...r.references
                          .filter((ref) => ref.status === "concerns_raised")
                          .map((ref) => `Reference concerns from ${ref.referee} (${ref.organisation})`),
                      ].join("; ")}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* filters / sort */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate or role…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(SAFER_RECRUITMENT_STATUS_LABEL) as SaferRecruitmentStatus[]).map((k) => (
                <SelectItem key={k} value={k}>{SAFER_RECRUITMENT_STATUS_LABEL[k]}</SelectItem>
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
              <option value="applicationDate">Application Date</option>
              <option value="name">Candidate Name</option>
              <option value="status">Status</option>
              <option value="proposedStart">Proposed Start</option>
            </select>
          </div>
        </div>

        {/* card list */}
        {filtered.map((rec) => {
          const total = rec.checklist_items.length;
          const done = rec.checklist_items.filter((c) => c.completed).length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const StatusIcon = STATUS_META[rec.status].icon;
          const hasFlags = rec.red_flags_raised.length > 0 || rec.references.some((ref) => ref.status === "concerns_raised");

          return (
            <div
              key={rec.id}
              className={cn(
                "rounded-lg border bg-white overflow-hidden",
                hasFlags && "border-red-300",
              )}
            >
              <button
                onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon className="h-5 w-5 text-brand" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{rec.candidate_name}</h3>
                      <span className="text-xs text-muted-foreground">{rec.role_applied_for}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[rec.status].colour)}>
                        {SAFER_RECRUITMENT_STATUS_LABEL[rec.status]}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", DBS_META[rec.dbs_result])}>
                        DBS: {SAFER_RECRUITMENT_DBS_RESULT_LABEL[rec.dbs_result]}
                      </span>
                      {hasFlags && (
                        <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Review required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Applied {rec.application_date} · {done}/{total} checks ({pct}%)
                      {rec.proposed_start_date && ` · Proposed start ${rec.proposed_start_date}`}
                      {" "}· Recruited by {getStaffName(rec.recruited_by)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        pct === 100 ? "bg-green-400" : pct >= 50 ? "bg-blue-400" : "bg-amber-400",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {expandedId === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {expandedId === rec.id && (
                <div className="border-t p-4 space-y-4">
                  {/* red flags */}
                  {rec.red_flags_raised.length > 0 && (
                    <div className="rounded border border-red-200 bg-red-50 p-3">
                      <h4 className="text-sm font-semibold text-red-900 mb-1 inline-flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Red flags raised
                      </h4>
                      <ul className="list-disc pl-5 text-sm text-red-900 space-y-1">
                        {rec.red_flags_raised.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* DBS panel */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded border bg-gray-50 p-3">
                      <h4 className="text-sm font-semibold mb-2 inline-flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4 text-brand" /> DBS check
                      </h4>
                      <dl className="text-xs space-y-1">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Applied</dt><dd>{rec.dbs_application_date || "—"}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Result date</dt><dd>{rec.dbs_result_date || "—"}</dd></div>
                        <div className="flex justify-between items-center">
                          <dt className="text-muted-foreground">Outcome</dt>
                          <dd>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", DBS_META[rec.dbs_result])}>
                              {SAFER_RECRUITMENT_DBS_RESULT_LABEL[rec.dbs_result]}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* interview panel */}
                    <div className="rounded border bg-gray-50 p-3">
                      <h4 className="text-sm font-semibold mb-2 inline-flex items-center gap-1">
                        <Users className="h-4 w-4 text-brand" /> Interview panel
                      </h4>
                      {rec.interviewers.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Not yet scheduled</p>
                      ) : (
                        <ul className="text-xs space-y-1">
                          {rec.interviewers.map((id) => (
                            <li key={id}>{getStaffName(id)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* references */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 inline-flex items-center gap-1">
                      <FileCheck className="h-4 w-4 text-brand" /> References
                    </h4>
                    {rec.references.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No references requested yet</p>
                    ) : (
                      <div className="space-y-2">
                        {rec.references.map((ref, i) => (
                          <div
                            key={i}
                            className={cn(
                              "rounded border p-3 flex items-start justify-between gap-2",
                              ref.status === "concerns_raised" && "border-red-200 bg-red-50",
                            )}
                          >
                            <div>
                              <p className="text-sm font-medium">{ref.referee}</p>
                              <p className="text-xs text-muted-foreground">{ref.organisation}</p>
                              {ref.date_received && <p className="text-xs text-muted-foreground">Received {ref.date_received}</p>}
                            </div>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0", REFERENCE_META[ref.status])}>
                              {SAFER_RECRUITMENT_REFERENCE_STATUS_LABEL[ref.status]}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* checklist */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 inline-flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-brand" /> Pre-employment checklist
                    </h4>
                    <div className="space-y-2">
                      {rec.checklist_items.map((item, i) => {
                        const Icon = item.completed ? CheckCircle2 : Circle;
                        return (
                          <div
                            key={i}
                            className={cn(
                              "rounded border p-3 flex items-start justify-between gap-2",
                              item.completed ? "" : "bg-gray-50",
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", item.completed ? "text-green-600" : "text-gray-400")} />
                              <div>
                                <p className="text-sm font-medium">{item.name}</p>
                                {item.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{item.notes}</p>}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                item.completed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700",
                              )}>
                                {item.completed ? "Done" : "Outstanding"}
                              </span>
                              {item.date && <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* regulatory note */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900 space-y-2">
          <div>
            <strong>Schedule 2 — Information about persons working at the home</strong> — A children&apos;s home must hold the prescribed information for every staff member before they begin work, including identity, right to work, qualifications, full employment history, two written references, an enhanced DBS with barred-list check, and a written disqualification declaration.
          </div>
          <div>
            <strong>Regulation 32 — Fitness of workers</strong> — The registered person must only employ individuals who have the qualifications, skills and experience necessary for the work, are of integrity and good character, and are physically and mentally fit for the role. Any disclosures or concerns must be risk-assessed and recorded.
          </div>
          <div>
            <strong>KCSIE 2024</strong> — Safer recruitment principles apply: at least one panel member trained in safer recruitment, scenario-based interviewing on safeguarding, and a documented rationale for any decision to proceed where information has been disclosed.
          </div>
        </div>

        {/* standard checklist reference (printed footer aid) */}
        <p className="text-xs text-muted-foreground">
          Standard pre-employment checklist applied to all candidates: {STANDARD_CHECKLIST.join(" · ")}.
        </p>
      </div>
    </PageShell>
  );
}
