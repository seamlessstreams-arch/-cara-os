"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Eye,
  Loader2,
} from "lucide-react";
import { PageShell }    from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getStaffName, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useWhistleblowingRecords, useCreateWhistleblowingRecord } from "@/hooks/use-whistleblowing-records";
import type {
  WhistleblowingRecord,
  WhistleblowingCategory,
  WhistleblowingStatus,
  WhistleblowingSeverity,
} from "@/types/extended";
import {
  WHISTLEBLOWING_CATEGORY_LABEL,
  WHISTLEBLOWING_STATUS_LABEL,
  WHISTLEBLOWING_SEVERITY_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local config ─────────────────────────────────────────────────────── */

const STATUS_META: Record<WhistleblowingStatus, { colour: string }> = {
  received:        { colour: "bg-blue-100 text-blue-700" },
  investigating:   { colour: "bg-amber-100 text-amber-700" },
  escalated:       { colour: "bg-red-100 text-red-700" },
  resolved:        { colour: "bg-green-100 text-green-700" },
  closed_no_action:{ colour: "bg-gray-100 text-gray-700" },
};

const SEV_META: Record<WhistleblowingSeverity, { colour: string }> = {
  low:      { colour: "bg-green-100 text-green-700" },
  medium:   { colour: "bg-amber-100 text-amber-700" },
  high:     { colour: "bg-orange-100 text-orange-700" },
  critical: { colour: "bg-red-100 text-red-700" },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function WhistleblowingPage() {
  const { data: records = [], isLoading } = useWhistleblowingRecords();
  const createRecord = useCreateWhistleblowingRecord();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const [wbForm, setWbForm] = useState({
    anonymous: false,
    category: "" as WhistleblowingCategory | "",
    severity: "" as WhistleblowingSeverity | "",
    subject_of_concern: "",
    summary: "",
    detail: "",
    evidence: "",
    assigned_to: "staff_darren",
  });
  const setWF = (k: keyof typeof wbForm, v: string | boolean) => setWbForm((p) => ({ ...p, [k]: v }));

  const handleCreateWB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wbForm.category || !wbForm.severity || !wbForm.subject_of_concern.trim() || !wbForm.summary.trim()) {
      toast.error("Category, severity, subject and summary are required.");
      return;
    }
    const ref = `WB-${new Date().getFullYear()}-${String(records.length + 1).padStart(3, "0")}`;
    await createRecord.mutateAsync({
      reference: ref,
      date_raised: new Date().toISOString().slice(0, 10),
      raised_by: wbForm.anonymous ? "Anonymous" : "staff_darren",
      anonymous: wbForm.anonymous,
      category: wbForm.category as WhistleblowingCategory,
      severity: wbForm.severity as WhistleblowingSeverity,
      status: "received" as WhistleblowingStatus,
      subject_of_concern: wbForm.subject_of_concern.trim(),
      summary: wbForm.summary.trim(),
      detail: wbForm.detail.trim(),
      evidence_provided: wbForm.evidence.split("\n").map((e) => e.trim()).filter(Boolean),
      assigned_to: wbForm.assigned_to,
      external_referral: null,
      outcome: "",
      lessons_learned: "",
      timeline: [{ date: new Date().toISOString().slice(0, 10), action: "Concern raised", by: wbForm.anonymous ? "Anonymous" : getStaffName(wbForm.assigned_to) }],
      protection_measures: [],
    });
    toast.success("Concern submitted.");
    setWbForm({ anonymous: false, category: "", severity: "", subject_of_concern: "", summary: "", detail: "", evidence: "", assigned_to: "staff_darren" });
    setShowDialog(false);
  };

  const stats = useMemo(() => ({
    total: records.length,
    active: records.filter((c) => ["received","investigating","escalated"].includes(c.status)).length,
    escalated: records.filter((c) => c.status === "escalated").length,
    resolved: records.filter((c) => c.status === "resolved" || c.status === "closed_no_action").length,
    anonymous: records.filter((c) => c.anonymous).length,
  }), [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterStatus !== "all") list = list.filter((c) => c.status === filterStatus);
    if (filterCat !== "all") list = list.filter((c) => c.category === filterCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.summary.toLowerCase().includes(q) || c.reference.toLowerCase().includes(q) || c.subject_of_concern.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "severity": return Object.keys(SEV_META).indexOf(b.severity) - Object.keys(SEV_META).indexOf(a.severity);
        case "status":   return Object.keys(STATUS_META).indexOf(a.status) - Object.keys(STATUS_META).indexOf(b.status);
        case "ref":      return a.reference.localeCompare(b.reference);
        default:         return b.date_raised.localeCompare(a.date_raised);
      }
    });
    return list;
  }, [records, filterStatus, filterCat, search, sortBy]);

  const exportData = useMemo(() => records.map((c) => ({
    reference: c.reference,
    dateRaised: c.date_raised,
    raisedBy: c.anonymous ? "Anonymous" : getStaffName(c.raised_by),
    category: WHISTLEBLOWING_CATEGORY_LABEL[c.category],
    severity: WHISTLEBLOWING_SEVERITY_LABEL[c.severity],
    status: WHISTLEBLOWING_STATUS_LABEL[c.status],
    subject: c.subject_of_concern,
    summary: c.summary,
    assignedTo: getStaffName(c.assigned_to),
    externalReferral: c.external_referral || "None",
    outcome: c.outcome || "Pending",
    lessonsLearned: c.lessons_learned || "Pending",
  })), [records]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Reference",        accessor: (r: typeof exportData[number]) => r.reference },
    { header: "Date Raised",      accessor: (r: typeof exportData[number]) => r.dateRaised },
    { header: "Raised By",        accessor: (r: typeof exportData[number]) => r.raisedBy },
    { header: "Category",         accessor: (r: typeof exportData[number]) => r.category },
    { header: "Severity",         accessor: (r: typeof exportData[number]) => r.severity },
    { header: "Status",           accessor: (r: typeof exportData[number]) => r.status },
    { header: "Subject",          accessor: (r: typeof exportData[number]) => r.subject },
    { header: "Summary",          accessor: (r: typeof exportData[number]) => r.summary },
    { header: "Assigned To",      accessor: (r: typeof exportData[number]) => r.assignedTo },
    { header: "External Referral",accessor: (r: typeof exportData[number]) => r.externalReferral },
    { header: "Outcome",          accessor: (r: typeof exportData[number]) => r.outcome },
    { header: "Lessons Learned",  accessor: (r: typeof exportData[number]) => r.lessonsLearned },
  ];

  if (isLoading) {
    return (
      <PageShell title="Whistleblowing & Concerns" subtitle="Confidential concern reporting — staff protection and accountability">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Whistleblowing & Concerns"
      subtitle="Confidential concern reporting — staff protection and accountability"
      ariaContext={{ pageTitle: "Whistleblowing Log", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="whistleblowing" />
          <PrintButton title="Whistleblowing Log" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> Raise Concern
          </button>
          <AriaStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Concerns", v: stats.total, icon: ShieldAlert, c: "text-blue-600" },
            { l: "Active",         v: stats.active, icon: Clock, c: "text-amber-600" },
            { l: "Escalated",      v: stats.escalated, icon: AlertTriangle, c: "text-red-600" },
            { l: "Resolved",       v: stats.resolved, icon: CheckCircle2, c: "text-green-600" },
            { l: "Anonymous",      v: stats.anonymous, icon: Eye, c: "text-purple-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {stats.escalated > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800"><strong>{stats.escalated} concern{stats.escalated > 1 ? "s" : ""}</strong> escalated to external bodies — requires priority management response.</p>
          </div>
        )}

        {/* filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search concerns…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.keys(STATUS_META) as WhistleblowingStatus[]).map((k) => <SelectItem key={k} value={k}>{WHISTLEBLOWING_STATUS_LABEL[k]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(Object.keys(WHISTLEBLOWING_CATEGORY_LABEL) as WhistleblowingCategory[]).map((k) => <SelectItem key={k} value={k}>{WHISTLEBLOWING_CATEGORY_LABEL[k]}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="date">Date Raised</option>
              <option value="severity">Severity</option>
              <option value="status">Status</option>
              <option value="ref">Reference</option>
            </select>
          </div>
        </div>

        {/* cards */}
        {filtered.map((concern) => (
          <div key={concern.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === concern.id ? null : concern.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{concern.reference}</h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[concern.status].colour)}>{WHISTLEBLOWING_STATUS_LABEL[concern.status]}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SEV_META[concern.severity].colour)}>{WHISTLEBLOWING_SEVERITY_LABEL[concern.severity]}</span>
                    {concern.anonymous && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">Anonymous</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{WHISTLEBLOWING_CATEGORY_LABEL[concern.category]} · {concern.date_raised} · {concern.summary.slice(0, 80)}…</p>
                </div>
              </div>
              {expanded === concern.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === concern.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Raised By:</span> {concern.anonymous ? "Anonymous" : getStaffName(concern.raised_by)}</div>
                  <div><span className="text-muted-foreground">Assigned To:</span> {getStaffName(concern.assigned_to)}</div>
                  <div><span className="text-muted-foreground">Subject:</span> {concern.subject_of_concern}</div>
                  {concern.external_referral && <div><span className="text-muted-foreground">External:</span> {concern.external_referral}</div>}
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Detail</h4>
                  <p className="text-sm text-muted-foreground">{concern.detail}</p>
                </div>

                {concern.evidence_provided.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Evidence Provided</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">{concern.evidence_provided.map((e, i) => <li key={i}>{e}</li>)}</ul>
                  </div>
                )}

                {/* timeline */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Investigation Timeline</h4>
                  <div className="space-y-2 border-l-2 border-gray-200 pl-4">
                    {concern.timeline.map((t, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-brand bg-white" />
                        <p className="text-xs text-muted-foreground">{t.date} · {getStaffName(t.by)}</p>
                        <p className="text-sm">{t.action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* protection */}
                <div className="rounded-lg bg-green-50 p-3">
                  <h4 className="text-sm font-semibold text-green-800 mb-1">Whistleblower Protection Measures</h4>
                  <ul className="list-disc list-inside text-sm text-green-900">{concern.protection_measures.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>

                {concern.outcome && (
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">Outcome</h4>
                    <p className="text-sm text-blue-900">{concern.outcome}</p>
                  </div>
                )}

                {concern.lessons_learned && (
                  <div className="rounded-lg bg-amber-50 p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Lessons Learned</h4>
                    <p className="text-sm text-amber-900">{concern.lessons_learned}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Public Interest Disclosure Act 1998 / Reg 34</strong> — Staff must be able to raise concerns without fear of reprisal. The registered person must have procedures for receiving and acting on representations and complaints, including from staff. Whistleblowers are protected by law from detrimental treatment.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Raise a Concern</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateWB} className="grid gap-3 py-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="anonymous" className="rounded border" checked={wbForm.anonymous} onChange={(e) => setWF("anonymous", e.target.checked)} />
              <label htmlFor="anonymous" className="text-sm">Raise anonymously</label>
            </div>
            <Select value={wbForm.category} onValueChange={(v) => setWF("category", v)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Category…" /></SelectTrigger>
              <SelectContent>{(Object.keys(WHISTLEBLOWING_CATEGORY_LABEL) as WhistleblowingCategory[]).map((k) => <SelectItem key={k} value={k}>{WHISTLEBLOWING_CATEGORY_LABEL[k]}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={wbForm.severity} onValueChange={(v) => setWF("severity", v)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Severity…" /></SelectTrigger>
              <SelectContent>{(Object.keys(SEV_META) as WhistleblowingSeverity[]).map((k) => <SelectItem key={k} value={k}>{WHISTLEBLOWING_SEVERITY_LABEL[k]}</SelectItem>)}</SelectContent>
            </Select>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Assigned To</label>
              <Select value={wbForm.assigned_to} onValueChange={(v) => setWF("assigned_to", v)}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => (<SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <input required placeholder="Subject of concern *" className="rounded border px-3 py-2 text-sm" value={wbForm.subject_of_concern} onChange={(e) => setWF("subject_of_concern", e.target.value)} />
            <textarea required placeholder="Summary *" rows={2} className="rounded border px-3 py-2 text-sm" value={wbForm.summary} onChange={(e) => setWF("summary", e.target.value)} />
            <textarea placeholder="Full detail" rows={4} className="rounded border px-3 py-2 text-sm" value={wbForm.detail} onChange={(e) => setWF("detail", e.target.value)} />
            <textarea placeholder="Evidence provided (one per line)" rows={2} className="rounded border px-3 py-2 text-sm" value={wbForm.evidence} onChange={(e) => setWF("evidence", e.target.value)} />
            <DialogFooter>
              <button type="button" onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={createRecord.isPending} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90 disabled:opacity-50">{createRecord.isPending ? "Submitting…" : "Submit Concern"}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Safeguarding"
        category={["safeguarding", "complaint"]}
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Whistleblowing Log — concerns raised, whistleblowing disclosures, safeguarding referrals, culture of transparency, management investigation, Reg 40 notifications, Ofsted evidence"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
