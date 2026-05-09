"use client";

import { useState, useMemo } from "react";
import {
  Shield,
  AlertTriangle,
  FileText,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Phone,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn, formatDate } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PoliceContactRecord } from "@/types/extended";
import {
  POLICE_CONTACT_TYPE_LABEL,
  POLICE_CONTACT_REPORTED_BY_LABEL,
  POLICE_CONTACT_OUTCOME_LABEL,
} from "@/types/extended";
import { usePoliceContactRecords } from "@/hooks/use-police-contact-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── constants ─────────────────────────────────────────────────────────── */

const TYPE_COLOURS: Record<string, string> = {
  missing_from_care_report: "bg-sky-100 text-sky-800",
  voluntary_attendance_interview: "bg-blue-100 text-blue-800",
  arrest: "bg-amber-100 text-amber-800",
  victim_of_crime: "bg-rose-100 text-rose-800",
  witness_voluntary: "bg-blue-100 text-blue-800",
  stop_and_search: "bg-amber-100 text-amber-800",
  restorative_resolution: "bg-emerald-100 text-emerald-800",
  welfare_check_by_police: "bg-sky-100 text-sky-800",
  information_sharing_only: "bg-slate-100 text-slate-800",
  other: "bg-slate-100 text-slate-800",
};

const OUTCOME_COLOURS: Record<string, string> = {
  no_further_action: "bg-emerald-100 text-emerald-800",
  voluntary_interview_only: "bg-sky-100 text-sky-800",
  restorative_justice: "bg-emerald-100 text-emerald-800",
  caution: "bg-amber-100 text-amber-800",
  charged: "bg-rose-100 text-rose-800",
  bail: "bg-amber-100 text-amber-800",
  released_no_charge: "bg-emerald-100 text-emerald-800",
  returned_to_home: "bg-sky-100 text-sky-800",
  other: "bg-slate-100 text-slate-800",
};

/* ── helpers ───────────────────────────────────────────────────────────── */

function isThisYTD(iso: string): boolean {
  const dt = new Date(iso);
  const now = new Date();
  return dt.getFullYear() === now.getFullYear() && dt <= now;
}

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildPoliceContactRecordsPage() {
  const { data: res, isLoading } = usePoliceContactRecords();
  const items = res?.data ?? [];

  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "yp" | "type">("date");

  const stats = useMemo(() => {
    const ytd = items.filter((r) => isThisYTD(r.contact_date)).length;
    const restorative = items.filter(
      (r) =>
        r.restorative_opportunity ||
        r.contact_type === "restorative_resolution" ||
        r.outcome === "restorative_justice",
    ).length;
    const missing = items.filter((r) => r.contact_type === "missing_from_care_report").length;
    const flags = items.reduce((s, r) => s + (r.flags_concerns ? 1 : 0), 0);
    return { ytd, restorative, missing, flags };
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterType !== "all") list = list.filter((r) => r.contact_type === filterType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.reason_context.toLowerCase().includes(q) ||
          r.outcome.toLowerCase().includes(q) ||
          (r.officers_involved ?? "").toLowerCase().includes(q) ||
          (r.police_ref_number ?? "").toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "yp":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "type":
          return a.contact_type.localeCompare(b.contact_type);
        default:
          return b.contact_date.localeCompare(a.contact_date);
      }
    });
    return list;
  }, [items, filterType, search, sortBy]);

  const exportCols: ExportColumn<PoliceContactRecord>[] = [
    { header: "Young Person", accessor: (r: PoliceContactRecord) => getYPName(r.child_id) },
    { header: "Contact Date", accessor: (r: PoliceContactRecord) => r.contact_date },
    { header: "Contact Type", accessor: (r: PoliceContactRecord) => POLICE_CONTACT_TYPE_LABEL[r.contact_type] },
    { header: "Reported By", accessor: (r: PoliceContactRecord) => POLICE_CONTACT_REPORTED_BY_LABEL[r.reported_by] },
    { header: "Officers", accessor: (r: PoliceContactRecord) => r.officers_involved ?? "" },
    { header: "Police Ref", accessor: (r: PoliceContactRecord) => r.police_ref_number ?? "" },
    { header: "Reason / Context", accessor: (r: PoliceContactRecord) => r.reason_context },
    { header: "Home Protocol Followed", accessor: (r: PoliceContactRecord) => (r.home_protocol_followed ? "Yes" : "No") },
    { header: "Concordat Principles Applied", accessor: (r: PoliceContactRecord) => (r.concordat_principles_applied ? "Yes" : "No") },
    { header: "Appropriate Adult", accessor: (r: PoliceContactRecord) => (r.appropriate_adult_present ? "Yes" : "No") },
    { header: "Legal Rep", accessor: (r: PoliceContactRecord) => (r.legal_rep_present ? "Yes" : "No") },
    { header: "Outcome", accessor: (r: PoliceContactRecord) => POLICE_CONTACT_OUTCOME_LABEL[r.outcome] },
    { header: "Restorative Opportunity", accessor: (r: PoliceContactRecord) => (r.restorative_opportunity ? "Yes" : "No") },
    { header: "Restorative Outcome", accessor: (r: PoliceContactRecord) => r.restorative_outcome ?? "" },
    { header: "Child Voice", accessor: (r: PoliceContactRecord) => r.child_voice },
    { header: "Staff Observation", accessor: (r: PoliceContactRecord) => r.staff_observation },
    { header: "Follow-Up Required", accessor: (r: PoliceContactRecord) => (r.follow_up_required ? "Yes" : "No") },
    { header: "Follow-Up Action", accessor: (r: PoliceContactRecord) => r.follow_up_action ?? "" },
    { header: "Flags / Concerns", accessor: (r: PoliceContactRecord) => r.flags_concerns ?? "" },
    { header: "Review Date", accessor: (r: PoliceContactRecord) => r.review_date },
    { header: "Recorded By", accessor: (r: PoliceContactRecord) => getStaffName(r.recorded_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Child Police Contact Records" subtitle="Loading…">
        <div />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Child Police Contact Records"
      subtitle="Concordat on Children in Care — proportionate response, advocacy, restorative practice"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="police-contact-records" />
          <PrintButton title="Police Contact Records" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Contacts YTD", v: stats.ytd, icon: Phone, c: "text-sky-600" },
            { l: "Restorative Resolutions", v: stats.restorative, icon: Shield, c: "text-emerald-600" },
            { l: "Missing-Related", v: stats.missing, icon: FileText, c: "text-blue-600" },
            { l: "Flags / Concerns", v: stats.flags, icon: AlertTriangle, c: "text-amber-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search child, context, outcome, ref…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[230px]">
              <SelectValue placeholder="Contact Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contact Types</SelectItem>
              {Object.entries(POLICE_CONTACT_TYPE_LABEL).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "yp" | "type")}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="date">Contact Date</option>
              <option value="yp">Young Person</option>
              <option value="type">Contact Type</option>
            </select>
          </div>
        </div>

        {/* records */}
        {filtered.map((rec) => {
          const isOpen = expanded === rec.id;
          return (
            <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : rec.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-sky-50/50 text-left"
              >
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-sky-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{getYPName(rec.child_id)}</h3>
                      <span className="text-xs text-muted-foreground">{formatDate(rec.contact_date)}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", TYPE_COLOURS[rec.contact_type])}>
                        {POLICE_CONTACT_TYPE_LABEL[rec.contact_type]}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", OUTCOME_COLOURS[rec.outcome])}>
                        {POLICE_CONTACT_OUTCOME_LABEL[rec.outcome]}
                      </span>
                      {rec.concordat_principles_applied && (
                        <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium border border-blue-200">
                          Concordat principles applied
                        </span>
                      )}
                      {rec.flags_concerns && (
                        <span className="rounded-full bg-amber-50 text-amber-800 px-2 py-0.5 text-xs font-medium border border-amber-200 inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          1 flag
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reported by {POLICE_CONTACT_REPORTED_BY_LABEL[rec.reported_by]} · Recorded by {getStaffName(rec.recorded_by)}
                      {rec.police_ref_number ? ` · Ref ${rec.police_ref_number}` : ""}
                    </p>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 shrink-0" /> : <ChevronDown className="h-5 w-5 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t p-4 space-y-4 bg-sky-50/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Contact date:</span> {formatDate(rec.contact_date)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reported by:</span> {POLICE_CONTACT_REPORTED_BY_LABEL[rec.reported_by]}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Police ref:</span> {rec.police_ref_number ?? "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Review:</span> {formatDate(rec.review_date)}
                    </div>
                  </div>

                  {rec.officers_involved && (
                    <div className="rounded-lg bg-white border p-3">
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <Phone className="h-4 w-4 text-sky-600" /> Officers Involved
                      </h4>
                      <p className="text-sm text-muted-foreground">{rec.officers_involved}</p>
                    </div>
                  )}

                  <div className="rounded-lg bg-white border p-3">
                    <h4 className="text-sm font-semibold mb-1">Reason / Context</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{rec.reason_context}</p>
                  </div>

                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1">
                      <Shield className="h-4 w-4" /> Concordat Principles Applied
                    </h4>
                    <p className="text-sm text-blue-900">
                      {rec.concordat_principles_applied ? "Yes" : "No"}
                    </p>
                    <p className="text-xs text-blue-800/80 mt-2">
                      Home protocol followed: {rec.home_protocol_followed ? "Yes" : "No"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white border p-3">
                      <h4 className="text-sm font-semibold mb-1">Appropriate Adult</h4>
                      <p className="text-sm text-muted-foreground">
                        {rec.appropriate_adult_present ? "Yes" : "Not applicable / not present"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white border p-3">
                      <h4 className="text-sm font-semibold mb-1">Legal Representation</h4>
                      <p className="text-sm text-muted-foreground">{rec.legal_rep_present ? "Yes" : "Not applicable"}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white border p-3">
                    <h4 className="text-sm font-semibold mb-1">Outcome</h4>
                    <p className="text-sm text-muted-foreground">{POLICE_CONTACT_OUTCOME_LABEL[rec.outcome]}</p>
                  </div>

                  {rec.restorative_opportunity && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                      <h4 className="text-sm font-semibold text-emerald-900 mb-1">Restorative Opportunity</h4>
                      {rec.restorative_outcome ? (
                        <p className="text-sm text-emerald-900">{rec.restorative_outcome}</p>
                      ) : (
                        <p className="text-sm text-emerald-900/70 italic">Identified — outcome to be recorded.</p>
                      )}
                    </div>
                  )}

                  <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                    <h4 className="text-sm font-semibold text-pink-800 mb-1">Child&apos;s Voice</h4>
                    <p className="text-sm text-pink-900 italic">&ldquo;{rec.child_voice}&rdquo;</p>
                  </div>

                  <div className="rounded-lg bg-slate-50 border p-3">
                    <h4 className="text-sm font-semibold mb-1">Staff Observation</h4>
                    <p className="text-sm text-muted-foreground">{rec.staff_observation}</p>
                  </div>

                  {rec.follow_up_required && (
                    <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                      <h4 className="text-sm font-semibold text-sky-900 mb-1">Follow-Up</h4>
                      <p className="text-sm text-sky-900">{rec.follow_up_action ?? "Required — action to be agreed."}</p>
                    </div>
                  )}

                  {rec.flags_concerns && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-sm font-semibold text-amber-900 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Flags / Concerns
                      </h4>
                      <p className="text-sm text-amber-900">{rec.flags_concerns}</p>
                    </div>
                  )}

                  <SmartLinkPanel sourceType="police-contact-records" sourceId={rec.id} childId={rec.child_id} compact />
                </div>
              )}
            </div>
          );
        })}

        {/* regulatory footer */}
        <div className="rounded-lg border-l-4 border-sky-400 bg-sky-50 p-4 text-sm text-sky-900">
          <strong>Concordat on Children in Care (NPCC + ADCS, 2018)</strong> — Children in care must not be criminalised
          for behaviour that would not result in police involvement in a family home. The home applies the Concordat,
          PACE Codes of Practice (Codes C and G), Children Act 1989, Restorative Justice Council standards, Child First
          principles, Children&apos;s Homes Regs Quality Standard 9 (Protection of Children) and UNCRC Articles 12, 37 and 40.
          Every police contact is logged to evidence proportionate response, appropriate adult support, advocacy and
          restorative practice.
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
