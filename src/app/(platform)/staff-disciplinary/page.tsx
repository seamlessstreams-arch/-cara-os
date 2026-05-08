"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Gavel,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Loader2,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStaffDisciplinaryRecords } from "@/hooks/use-staff-disciplinary-records";
import type { StaffDisciplinaryRecord } from "@/types/extended";
import {
  STAFF_DISCIPLINARY_CATEGORY_LABEL,
  STAFF_DISCIPLINARY_STAGE_LABEL,
  STAFF_DISCIPLINARY_SEVERITY_LABEL,
} from "@/types/extended";

/* ── local colour maps ────────────────────────────────────────────────── */

const STAGE_COLOURS: Record<string, string> = {
  informal_warning: "bg-blue-100 text-blue-800", investigation: "bg-purple-100 text-purple-800",
  first_written: "bg-amber-100 text-amber-800", final_written: "bg-orange-100 text-orange-800",
  dismissal_hearing: "bg-red-100 text-red-800", dismissed: "bg-red-200 text-red-900",
  resigned: "bg-gray-100 text-gray-700", no_case: "bg-green-100 text-green-800", appeal: "bg-indigo-100 text-indigo-800",
};

const SEV_COLOURS: Record<string, string> = {
  minor: "bg-amber-100 text-amber-800", serious: "bg-orange-100 text-orange-800", gross: "bg-red-100 text-red-800",
};

/* ── flat row for export ──────────────────────────────────────────────── */

interface FlatRow {
  staffMember: string; dateRaised: string; category: string; severity: string;
  stage: string; allegation: string; investigator: string; outcome: string;
  suspended: string; sanctionExpiry: string; appeal: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Staff Member",    accessor: (r: FlatRow) => r.staffMember },
  { header: "Date Raised",     accessor: (r: FlatRow) => r.dateRaised },
  { header: "Category",        accessor: (r: FlatRow) => r.category },
  { header: "Severity",        accessor: (r: FlatRow) => r.severity },
  { header: "Stage",           accessor: (r: FlatRow) => r.stage },
  { header: "Allegation",      accessor: (r: FlatRow) => r.allegation },
  { header: "Investigator",    accessor: (r: FlatRow) => r.investigator },
  { header: "Outcome",         accessor: (r: FlatRow) => r.outcome },
  { header: "Suspended",       accessor: (r: FlatRow) => r.suspended },
  { header: "Sanction Expiry", accessor: (r: FlatRow) => r.sanctionExpiry },
  { header: "Appeal",          accessor: (r: FlatRow) => r.appeal },
  { header: "Notes",           accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function StaffDisciplinaryPage() {
  const { data: records = [], isLoading } = useStaffDisciplinaryRecords();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const stats = useMemo(() => {
    const active = records.filter((r) => !["no_case", "dismissed", "resigned"].includes(r.stage)).length;
    const resolved = records.filter((r) => ["no_case", "dismissed", "resigned"].includes(r.stage)).length;
    const suspended = records.filter((r) => r.suspended).length;
    const underInvestigation = records.filter((r) => r.stage === "investigation").length;
    return { active, resolved, suspended, underInvestigation };
  }, [records]);

  const filtered = useMemo(() => {
    let list: StaffDisciplinaryRecord[] = records;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => getStaffName(r.staff_member).toLowerCase().includes(q) || r.allegation.toLowerCase().includes(q));
    }
    if (filterStage !== "all") list = list.filter((r) => r.stage === filterStage);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.date_raised.localeCompare(a.date_raised)); break;
      case "severity": { const o: Record<string, number> = { gross: 0, serious: 1, minor: 2 }; out.sort((a, b) => o[a.severity] - o[b.severity]); break; }
      case "stage": out.sort((a, b) => a.stage.localeCompare(b.stage)); break;
    }
    return out;
  }, [records, search, filterStage, sortBy]);

  const exportData = useMemo<FlatRow[]>(() =>
    records.map((r) => ({
      staffMember: getStaffName(r.staff_member), dateRaised: r.date_raised,
      category: STAFF_DISCIPLINARY_CATEGORY_LABEL[r.category], severity: STAFF_DISCIPLINARY_SEVERITY_LABEL[r.severity],
      stage: STAFF_DISCIPLINARY_STAGE_LABEL[r.stage], allegation: r.allegation,
      investigator: r.investigator ? getStaffName(r.investigator) : "—",
      outcome: r.outcome || "Pending", suspended: r.suspended ? "Yes" : "No",
      sanctionExpiry: r.sanction_expiry_date ?? "—",
      appeal: r.appeal_lodged ? `Yes — ${r.appeal_outcome || "Pending"}` : "No",
      notes: r.notes,
    })), [records]);

  if (isLoading) {
    return (
      <PageShell title="Staff Disciplinary" subtitle="Confidential disciplinary procedure — investigation, hearing and outcomes">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Disciplinary"
      subtitle="Confidential disciplinary procedure — investigation, hearing and outcomes"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Disciplinary" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="staff-disciplinary" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Case
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Cases", value: stats.active, icon: Gavel, colour: "text-blue-600" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2, colour: "text-green-600" },
          { label: "Suspended", value: stats.suspended, icon: Shield, colour: stats.suspended > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Under Investigation", value: stats.underInvestigation, icon: Clock, colour: stats.underInvestigation > 0 ? "text-purple-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      {stats.underInvestigation > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-purple-300 bg-purple-50 p-4">
          <AlertTriangle className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="font-semibold text-purple-800">Active Investigation(s)</p>
            <p className="text-sm text-purple-700">{stats.underInvestigation} case(s) currently under investigation. Ensure timescales are being met and staff are being supported.</p>
          </div>
        </div>
      )}

      <div id="disciplinary-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff or allegations…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(STAFF_DISCIPLINARY_STAGE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="stage">Stage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expanded[r.id] ?? false;
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(r.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Gavel className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{getStaffName(r.staff_member)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STAGE_COLOURS[r.stage])}>{STAFF_DISCIPLINARY_STAGE_LABEL[r.stage]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SEV_COLOURS[r.severity])}>{STAFF_DISCIPLINARY_SEVERITY_LABEL[r.severity]}</span>
                    {r.confidentiality_level !== "standard" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-white flex items-center gap-1"><Shield className="h-3 w-3" />{r.confidentiality_level.replace("_"," ")}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{r.date_raised} · {STAFF_DISCIPLINARY_CATEGORY_LABEL[r.category]}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Allegation</h4>
                    <p className="text-sm">{r.allegation}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Investigator:</span> <span className="font-medium">{r.investigator ? getStaffName(r.investigator) : "Pending"}</span></div>
                    {r.hearing_date && <div><span className="text-gray-500">Hearing:</span> <span className="font-medium">{r.hearing_date}</span></div>}
                    {r.sanction_expiry_date && <div><span className="text-gray-500">Sanction Expires:</span> <span className="font-medium">{r.sanction_expiry_date}</span></div>}
                    {r.trade_union_rep && <div><span className="text-gray-500">TU Rep:</span> <span className="font-medium">{r.trade_union_rep}</span></div>}
                  </div>

                  {r.suspended && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1">Suspension Active</h4>
                      <p className="text-sm text-red-800">Suspended since {r.suspension_date}. Reviews: {r.suspension_review_dates.join(", ") || "None yet"}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {r.lado_notified && <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">LADO Notified</span>}
                    {r.dbs_referral && <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">DBS Referral Made</span>}
                    {r.ofsted_notified && <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">Ofsted Notified</span>}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Timeline</h4>
                    <div className="space-y-2 ml-3 border-l-2 border-gray-200 pl-4">
                      {r.timeline.map((t, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-blue-500" />
                          <p className="text-sm font-medium">{t.action}</p>
                          <p className="text-xs text-gray-500">{t.date} — {getStaffName(t.by)}</p>
                          {t.notes && <p className="text-xs text-gray-600 italic">{t.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {r.outcome && (
                    <div className="rounded-md bg-green-50 border border-green-200 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Outcome</h4>
                      <p className="text-sm text-green-800">{r.outcome}</p>
                    </div>
                  )}

                  {r.support_offered.length > 0 && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Support Offered</h4>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                        {r.support_offered.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {r.lessons_learned && (
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Lessons Learned</h4>
                      <p className="text-sm text-purple-800">{r.lessons_learned}</p>
                    </div>
                  )}

                  {r.notes && <div><h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4><p className="text-sm text-gray-700">{r.notes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Disciplinary Procedure:</strong> All disciplinary matters must follow ACAS code of practice. Staff have the right to be accompanied by a trade union representative or colleague. Allegations involving children must be reported to the LADO and may require Ofsted notification. Suspensions must be reviewed at least every 2 weeks. All outcomes must be proportionate, documented, and subject to right of appeal. DBS referral is required when a staff member is dismissed or resigns during investigation for harm or risk to children.
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Disciplinary Case</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Staff Member</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{["staff_darren","staff_ryan","staff_edward","staff_anna","staff_chervelle","staff_diane","staff_lackson","staff_mirela"].map((id) => <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(STAFF_DISCIPLINARY_CATEGORY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(STAFF_DISCIPLINARY_SEVERITY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Allegation</label>
              <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Details of the allegation…" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Create Case</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
