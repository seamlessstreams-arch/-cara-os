"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName, YOUNG_PEOPLE } from "@/lib/seed-data";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { FlatList, FlatListRow, FlatListRowDetail, type RowSeverity } from "@/components/ui/list-row";
import { useRestrictionsLogRecords, useCreateRestrictionsLogRecord } from "@/hooks/use-restrictions-log-records";
import type {
  RestrictionsLogRecord,
  RestrictionsLogType,
  RestrictionsLogStatus,
  RestrictionsLogAuthorisedBy,
} from "@/types/extended";
import {
  RESTRICTIONS_LOG_TYPE_LABEL,
  RESTRICTIONS_LOG_STATUS_LABEL,
  RESTRICTIONS_LOG_AUTHORISED_BY_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── local colour maps ────────────────────────────────────────────── */

const STATUS_META: Record<RestrictionsLogStatus, { colour: string }> = {
  active:       { colour: "bg-[--cs-risk-bg] text-[--cs-risk]" },
  under_review: { colour: "bg-[--cs-warning-bg] text-[--cs-warning]" },
  ended:        { colour: "bg-[--cs-success-bg] text-[--cs-success]" },
  appealed:     { colour: "bg-purple-100 text-purple-700" },
};

const STATUS_ROW: Record<RestrictionsLogStatus, RowSeverity> = {
  active: "risk", under_review: "warning", ended: "success", appealed: "neutral",
};
const STATUS_TEXT: Record<RestrictionsLogStatus, string> = {
  active: "text-[--cs-risk]", under_review: "text-[--cs-warning]", ended: "text-[--cs-success]", appealed: "text-purple-700",
};

/* ── page ──────────────────────────────────────────────────────────── */

export default function RestrictionsLogPage() {
  const { data: records = [], isLoading } = useRestrictionsLogRecords();
  const createRestriction = useCreateRestrictionsLogRecord();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const [rlForm, setRlForm] = useState({
    child_id: "",
    type: "" as RestrictionsLogType | "",
    description: "",
    reason: "",
    authorised_by: "" as RestrictionsLogAuthorisedBy | "",
    authoriser_name: "",
    proportionality: "",
    child_view: "",
    start_date: new Date().toISOString().slice(0, 10),
  });
  const setRF = (k: keyof typeof rlForm, v: string) => setRlForm((p) => ({ ...p, [k]: v }));

  const handleCreateRestriction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rlForm.child_id || !rlForm.type || !rlForm.reason.trim()) {
      toast.error("Young person, type and reason are required.");
      return;
    }
    await createRestriction.mutateAsync({
      child_id: rlForm.child_id,
      type: rlForm.type as RestrictionsLogType,
      description: rlForm.description,
      reason: rlForm.reason.trim(),
      status: "active" as RestrictionsLogStatus,
      authorised_by: rlForm.authorised_by as RestrictionsLogAuthorisedBy || "manager",
      authoriser_name: rlForm.authoriser_name,
      start_date: rlForm.start_date,
      end_date: null,
      review_frequency: "monthly",
      reviews: [],
      child_view: rlForm.child_view,
      proportionality: rlForm.proportionality,
      least_restrictive: "",
      impact_assessment: "",
      notified_parties: [],
    });
    toast.success("Restriction logged.");
    setRlForm({ child_id: "", type: "", description: "", reason: "", authorised_by: "", authoriser_name: "", proportionality: "", child_view: "", start_date: new Date().toISOString().slice(0, 10) });
    setShowDialog(false);
  };

  const stats = useMemo(() => ({
    total: records.length,
    active: records.filter((r) => r.status === "active").length,
    underReview: records.filter((r) => r.status === "under_review").length,
    ended: records.filter((r) => r.status === "ended").length,
    courtOrdered: records.filter((r) => r.authorised_by === "court_order").length,
  }), [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterType !== "all") list = list.filter((r) => r.type === filterType);
    if (filterYP !== "all") list = list.filter((r) => r.child_id === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.description.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "type":   return RESTRICTIONS_LOG_TYPE_LABEL[a.type].localeCompare(RESTRICTIONS_LOG_TYPE_LABEL[b.type]);
        case "status": return (Object.keys(STATUS_META) as RestrictionsLogStatus[]).indexOf(a.status) - (Object.keys(STATUS_META) as RestrictionsLogStatus[]).indexOf(b.status);
        default:       return b.start_date.localeCompare(a.start_date);
      }
    });
    return list;
  }, [records, filterType, filterYP, search, sortBy]);

  const ypIds = useMemo(() => [...new Set(records.map((r) => r.child_id))], [records]);

  const exportCols: ExportColumn<RestrictionsLogRecord>[] = [
    { header: "Young Person",     accessor: (r) => getYPName(r.child_id) },
    { header: "Type",             accessor: (r) => RESTRICTIONS_LOG_TYPE_LABEL[r.type] },
    { header: "Description",      accessor: (r) => r.description },
    { header: "Reason",           accessor: (r) => r.reason },
    { header: "Status",           accessor: (r) => RESTRICTIONS_LOG_STATUS_LABEL[r.status] },
    { header: "Authorised By",    accessor: (r) => RESTRICTIONS_LOG_AUTHORISED_BY_LABEL[r.authorised_by] },
    { header: "Authoriser",       accessor: (r) => r.authoriser_name },
    { header: "Start Date",       accessor: (r) => r.start_date },
    { header: "End Date",         accessor: (r) => r.end_date || "Ongoing" },
    { header: "Review Frequency", accessor: (r) => r.review_frequency },
    { header: "Child View",       accessor: (r) => r.child_view },
    { header: "Proportionality",  accessor: (r) => r.proportionality },
    { header: "Least Restrictive", accessor: (r) => r.least_restrictive },
    { header: "Notified Parties", accessor: (r) => r.notified_parties.join("; ") },
  ];

  if (isLoading) {
    return (
      <PageShell title="Restrictions Log" subtitle="Reg 20 — restrictions on liberty, movement, contact and access with proportionality review">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Restrictions Log"
      subtitle="Reg 20 — restrictions on liberty, movement, contact and access with proportionality review"
      caraContext={{ pageTitle: "Restrictions Log", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="restrictions-log" />
          <PrintButton title="Restrictions Log" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> Log Restriction
          </button>
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total",        v: stats.total, icon: Lock, c: "text-blue-600" },
            { l: "Active",       v: stats.active, icon: ShieldAlert, c: "text-[--cs-risk]" },
            { l: "Under Review", v: stats.underReview, icon: Clock, c: "text-[--cs-warning]" },
            { l: "Ended",        v: stats.ended, icon: CheckCircle2, c: "text-[--cs-success]" },
            { l: "Court Ordered", v: stats.courtOrdered, icon: Lock, c: "text-purple-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {stats.active > 0 && (
          <div className="rounded-lg border-l-4 border-[--cs-risk] bg-[--cs-risk-bg] p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[--cs-risk] flex-shrink-0" />
            <p className="text-sm text-[--cs-risk]"><strong>{stats.active} active restriction{stats.active > 1 ? "s" : ""}</strong> — each must be regularly reviewed for proportionality and necessity.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search restrictions…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.keys(RESTRICTIONS_LOG_TYPE_LABEL) as RestrictionsLogType[]).map((k) => (
                <SelectItem key={k} value={k}>{RESTRICTIONS_LOG_TYPE_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {ypIds.map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="date">Start Date</option>
              <option value="type">Type</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <FlatList>
        {filtered.map((restriction) => (
          <div key={restriction.id}>
            <FlatListRow severity={STATUS_ROW[restriction.status]} onClick={() => setExpanded(expanded === restriction.id ? null : restriction.id)} aria-expanded={expanded === restriction.id}>
              <div className="flex items-center justify-between flex-1 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{getYPName(restriction.child_id)}</h3>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{RESTRICTIONS_LOG_TYPE_LABEL[restriction.type]}</span>
                      <span className={cn("text-[11px] font-semibold uppercase tracking-wide", STATUS_TEXT[restriction.status])}>{RESTRICTIONS_LOG_STATUS_LABEL[restriction.status]}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{restriction.description} · Since {restriction.start_date}</p>
                  </div>
                </div>
                {expanded === restriction.id ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />}
              </div>
            </FlatListRow>

            {expanded === restriction.id && (
              <FlatListRowDetail>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Authorised By:</span> {RESTRICTIONS_LOG_AUTHORISED_BY_LABEL[restriction.authorised_by]}</div>
                  <div><span className="text-muted-foreground">Authoriser:</span> {restriction.authoriser_name}</div>
                  <div><span className="text-muted-foreground">Review Frequency:</span> {restriction.review_frequency}</div>
                  <div><span className="text-muted-foreground">End Date:</span> {restriction.end_date || "Ongoing"}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Reason for Restriction</h4>
                  <p className="text-sm text-muted-foreground">{restriction.reason}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">Proportionality Assessment</h4>
                    <p className="text-sm text-blue-900">{restriction.proportionality}</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3">
                    <h4 className="text-sm font-semibold text-green-800 mb-1">Least Restrictive Option</h4>
                    <p className="text-sm text-green-900">{restriction.least_restrictive}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 p-3">
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">Impact Assessment</h4>
                  <p className="text-sm text-amber-900">{restriction.impact_assessment}</p>
                </div>

                <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                  <h4 className="text-sm font-semibold text-pink-800 mb-1">Child&apos;s View</h4>
                  <p className="text-sm text-pink-900">{restriction.child_view}</p>
                </div>

                {restriction.reviews.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Reviews</h4>
                    <div className="space-y-2">
                      {restriction.reviews.map((rv, i) => (
                        <div key={i} className="rounded border p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{rv.date} — {getStaffName(rv.reviewer)}</span>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", rv.continued ? "bg-[--cs-risk-bg] text-[--cs-risk]" : "bg-[--cs-success-bg] text-[--cs-success]")}>{rv.continued ? "Continued" : "Ended"}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{rv.outcome}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Notified Parties</h4>
                  <div className="flex flex-wrap gap-1">{restriction.notified_parties.map((p, i) => <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-xs">{p}</span>)}</div>
                </div>

                <SmartLinkPanel sourceType="restrictions-log-record" sourceId={restriction.id} childId={restriction.child_id} compact />
              </FlatListRowDetail>
            )}
          </div>
        ))}
        </FlatList>

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 20 — Restraint and deprivation of liberty</strong> — Any restriction on a child&apos;s liberty must be necessary, proportionate, and the least restrictive option. Restrictions must be regularly reviewed, the child&apos;s views sought, and appropriate parties notified. All restrictions must be recorded and justified.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Restriction</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateRestriction} className="grid gap-3 py-2">
            <Select value={rlForm.child_id} onValueChange={(v) => setRF("child_id", v)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Young Person…" /></SelectTrigger>
              <SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.first_name} {y.last_name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={rlForm.type} onValueChange={(v) => setRF("type", v)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Restriction type…" /></SelectTrigger>
              <SelectContent>{(Object.keys(RESTRICTIONS_LOG_TYPE_LABEL) as RestrictionsLogType[]).map((k) => <SelectItem key={k} value={k}>{RESTRICTIONS_LOG_TYPE_LABEL[k]}</SelectItem>)}</SelectContent>
            </Select>
            <input required placeholder="Description *" className="rounded border px-3 py-2 text-sm" value={rlForm.description} onChange={(e) => setRF("description", e.target.value)} />
            <textarea required placeholder="Reason for restriction *" rows={3} className="rounded border px-3 py-2 text-sm" value={rlForm.reason} onChange={(e) => setRF("reason", e.target.value)} />
            <Select value={rlForm.authorised_by} onValueChange={(v) => setRF("authorised_by", v)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Authorised by…" /></SelectTrigger>
              <SelectContent>{(Object.keys(RESTRICTIONS_LOG_AUTHORISED_BY_LABEL) as RestrictionsLogAuthorisedBy[]).map((k) => <SelectItem key={k} value={k}>{RESTRICTIONS_LOG_AUTHORISED_BY_LABEL[k]}</SelectItem>)}</SelectContent>
            </Select>
            <input placeholder="Authoriser name" className="rounded border px-3 py-2 text-sm" value={rlForm.authoriser_name} onChange={(e) => setRF("authoriser_name", e.target.value)} />
            <textarea placeholder="Proportionality assessment" rows={2} className="rounded border px-3 py-2 text-sm" value={rlForm.proportionality} onChange={(e) => setRF("proportionality", e.target.value)} />
            <textarea placeholder="Child's view" rows={2} className="rounded border px-3 py-2 text-sm" value={rlForm.child_view} onChange={(e) => setRF("child_view", e.target.value)} />
            <DialogFooter>
              <button type="button" onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={createRestriction.isPending} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90 disabled:opacity-50">{createRestriction.isPending ? "Logging…" : "Log Restriction"}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Safeguarding & Behaviour"
        category={["safeguarding", "behaviour", "physical_intervention"]}
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Restrictions Log — restrictions on children's liberty, lawful restrictions, care plan restrictions, proportionality assessments, review of restrictions, Reg 40 notifications, Reg 45 evidence"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
