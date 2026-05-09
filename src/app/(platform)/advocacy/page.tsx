"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Megaphone,
  Plus,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAdvocacy, useCreateAdvocacyRecord } from "@/hooks/use-advocacy";
import { YOUNG_PEOPLE, STAFF } from "@/lib/seed-data";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type {
  AdvocacyType,
  AdvocacyStatus,
  AdvocacyVisit,
  AdvocacyRecord,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── constants ─────────────────────────────────────────────────────────── */

const TYPE_LABELS: Record<AdvocacyType, string> = {
  independent: "Independent Advocacy", issue_based: "Issue-Based Advocacy",
  peer: "Peer Advocacy", legal: "Legal Advocacy", complaints: "Complaints Advocacy",
};

const STATUS_META: Record<AdvocacyStatus, { label: string; colour: string }> = {
  active:          { label: "Active",      colour: "bg-green-100 text-green-700" },
  completed:       { label: "Completed",   colour: "bg-gray-100 text-gray-700" },
  pending_referral:{ label: "Pending",     colour: "bg-amber-100 text-amber-700" },
  declined_by_yp:  { label: "Declined",    colour: "bg-red-100 text-red-700" },
};

const VISIT_LABELS: Record<string, string> = {
  face_to_face: "Face to Face", phone: "Phone", virtual: "Virtual",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function AdvocacyPage() {
  const { data: result, isLoading } = useAdvocacy();
  const createAdvocacy = useCreateAdvocacyRecord();
  const data = result?.data ?? [];

  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const [advForm, setAdvForm] = useState({
    child_id: "",
    advocacy_type: "" as AdvocacyType | "",
    provider: "",
    advocate_name: "",
    reason: "",
    review_date: "",
  });
  const setAF = (k: keyof typeof advForm, v: string) => setAdvForm((p) => ({ ...p, [k]: v }));

  const handleCreateAdvocacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advForm.child_id || !advForm.advocacy_type || !advForm.reason.trim()) {
      toast.error("Young person, type and reason are required.");
      return;
    }
    await createAdvocacy.mutateAsync({
      child_id: advForm.child_id,
      advocacy_type: advForm.advocacy_type as AdvocacyType,
      status: "pending" as AdvocacyStatus,
      provider: advForm.provider,
      advocate_name: advForm.advocate_name,
      referral_date: new Date().toISOString().slice(0, 10),
      start_date: null,
      reason: advForm.reason.trim(),
      issues_raised: [],
      visits: [],
      child_view: "",
      home_response: "",
      review_date: advForm.review_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      notes: "",
      created_at: new Date().toISOString(),
    });
    toast.success("Advocacy referral submitted.");
    setAdvForm({ child_id: "", advocacy_type: "", provider: "", advocate_name: "", reason: "", review_date: "" });
    setShowDialog(false);
  };

  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter((r) => r.status === "active").length,
    visits: data.reduce((s, r) => s + r.visits.length, 0),
    issuesRaised: data.reduce((s, r) => s + r.issues_raised.length, 0),
    ypWithAdvocacy: new Set(data.filter((r) => r.status === "active").map((r) => r.child_id)).size,
  }), [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterType !== "all") list = list.filter((r) => r.advocacy_type === filterType);
    if (filterYP !== "all") list = list.filter((r) => r.child_id === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.advocate_name.toLowerCase().includes(q) || r.provider.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "type": return TYPE_LABELS[a.advocacy_type].localeCompare(TYPE_LABELS[b.advocacy_type]);
        case "yp":   return a.child_id.localeCompare(b.child_id);
        default:     return b.referral_date.localeCompare(a.referral_date);
      }
    });
    return list;
  }, [data, filterType, filterYP, search, sortBy]);

  const exportData = useMemo(() => data.map((r) => ({
    youngPerson: getYPName(r.child_id),
    type: TYPE_LABELS[r.advocacy_type],
    status: STATUS_META[r.status].label,
    provider: r.provider,
    advocate: r.advocate_name,
    referralDate: r.referral_date,
    startDate: r.start_date || "Pending",
    reason: r.reason,
    issuesRaised: r.issues_raised.join("; "),
    visits: r.visits.length,
    childView: r.child_view,
    homeResponse: r.home_response,
    reviewDate: r.review_date,
    notes: r.notes,
  })), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",  accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Type",          accessor: (r: typeof exportData[number]) => r.type },
    { header: "Status",        accessor: (r: typeof exportData[number]) => r.status },
    { header: "Provider",      accessor: (r: typeof exportData[number]) => r.provider },
    { header: "Advocate",      accessor: (r: typeof exportData[number]) => r.advocate },
    { header: "Referral Date", accessor: (r: typeof exportData[number]) => r.referralDate },
    { header: "Start Date",    accessor: (r: typeof exportData[number]) => r.startDate },
    { header: "Reason",        accessor: (r: typeof exportData[number]) => r.reason },
    { header: "Issues Raised", accessor: (r: typeof exportData[number]) => r.issuesRaised },
    { header: "Visits",        accessor: (r: typeof exportData[number]) => String(r.visits) },
    { header: "Child View",    accessor: (r: typeof exportData[number]) => r.childView },
    { header: "Home Response", accessor: (r: typeof exportData[number]) => r.homeResponse },
    { header: "Review Date",   accessor: (r: typeof exportData[number]) => r.reviewDate },
    { header: "Notes",         accessor: (r: typeof exportData[number]) => r.notes },
  ];

  const ypIds = [...new Set(data.map((r) => r.child_id))];

  if (isLoading) {
    return (
      <PageShell title="Advocacy Tracker" subtitle="Reg 7 — Independent advocacy, children's rights and representation">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Advocacy Tracker"
      subtitle="Reg 7 — Independent advocacy, children's rights and representation"
      ariaContext={{ pageTitle: "Advocacy Tracker", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="advocacy" />
          <PrintButton title="Advocacy Tracker" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> New Referral
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Referrals", v: stats.total, icon: Megaphone, c: "text-blue-600" },
            { l: "Active",          v: stats.active, icon: CheckCircle2, c: "text-green-600" },
            { l: "YP with Advocacy",v: stats.ypWithAdvocacy, icon: Megaphone, c: "text-purple-600" },
            { l: "Total Visits",    v: stats.visits, icon: Clock, c: "text-amber-600" },
            { l: "Issues Raised",   v: stats.issuesRaised, icon: AlertTriangle, c: "text-red-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search advocacy…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
              <option value="date">Referral Date</option>
              <option value="type">Type</option>
              <option value="yp">Young Person</option>
            </select>
          </div>
        </div>

        {filtered.map((rec) => (
          <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === rec.id ? null : rec.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{getYPName(rec.child_id)}</h3>
                    <span className="text-sm text-muted-foreground">— {TYPE_LABELS[rec.advocacy_type]}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[rec.status].colour)}>{STATUS_META[rec.status].label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.advocate_name} · {rec.provider} · {rec.visits.length} visits</p>
                </div>
              </div>
              {expanded === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === rec.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Referred:</span> {rec.referral_date}</div>
                  <div><span className="text-muted-foreground">Started:</span> {rec.start_date || "Pending"}</div>
                  <div><span className="text-muted-foreground">Review:</span> {rec.review_date}</div>
                  <div><span className="text-muted-foreground">Provider:</span> {rec.provider}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Reason for Advocacy</h4>
                  <p className="text-sm text-muted-foreground">{rec.reason}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-1">Issues Raised</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">{rec.issues_raised.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
                </div>

                {rec.visits.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Visits</h4>
                    <div className="space-y-3">
                      {rec.visits.map((v, i) => (
                        <div key={i} className="rounded border p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{v.date}</span>
                              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{VISIT_LABELS[v.visit_type]}</span>
                              {v.private_session && <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">Private</span>}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{v.summary}</p>
                          {v.actions_raised.length > 0 && (
                            <div className="mt-2 rounded bg-blue-50 p-2">
                              <p className="text-xs font-semibold text-blue-800 mb-1">Actions</p>
                              <ul className="list-disc list-inside text-xs text-blue-900">{v.actions_raised.map((a, j) => <li key={j}>{a}</li>)}</ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                  <h4 className="text-sm font-semibold text-pink-800 mb-1">Child&apos;s View</h4>
                  <p className="text-sm text-pink-900 italic">&ldquo;{rec.child_view}&rdquo;</p>
                </div>

                <div className="rounded-lg bg-green-50 p-3">
                  <h4 className="text-sm font-semibold text-green-800 mb-1">Home Response</h4>
                  <p className="text-sm text-green-900">{rec.home_response}</p>
                </div>

                {rec.notes && (
                  <div className="rounded-lg bg-gray-50 border p-3">
                    <h4 className="text-sm font-semibold mb-1">Notes</h4>
                    <p className="text-sm text-muted-foreground">{rec.notes}</p>
                  </div>
                )}

                <SmartLinkPanel
                  sourceType="advocacy"
                  sourceId={rec.id}
                  childId={rec.child_id}
                  compact
                />
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 7 — Children&apos;s Guide / Advocacy</strong> — Every child must be informed of their right to advocacy and supported to access it. Advocates must be able to visit privately and the home must cooperate fully with advocacy services. Children should feel empowered to raise issues through their advocate.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Advocacy Referral</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateAdvocacy} className="grid gap-3 py-2">
            <Select value={advForm.child_id} onValueChange={(v) => setAF("child_id", v)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Young Person…" /></SelectTrigger>
              <SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.first_name} {y.last_name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={advForm.advocacy_type} onValueChange={(v) => setAF("advocacy_type", v)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Advocacy type…" /></SelectTrigger>
              <SelectContent>{Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <input required placeholder="Provider organisation *" className="rounded border px-3 py-2 text-sm" value={advForm.provider} onChange={(e) => setAF("provider", e.target.value)} />
            <input placeholder="Advocate name" className="rounded border px-3 py-2 text-sm" value={advForm.advocate_name} onChange={(e) => setAF("advocate_name", e.target.value)} />
            <textarea required placeholder="Reason for referral *" rows={3} className="rounded border px-3 py-2 text-sm" value={advForm.reason} onChange={(e) => setAF("reason", e.target.value)} />
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Review Date</label>
              <input type="date" className="rounded border px-3 py-2 text-sm w-full" value={advForm.review_date} onChange={(e) => setAF("review_date", e.target.value)} />
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={createAdvocacy.isPending} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90 disabled:opacity-50">{createAdvocacy.isPending ? "Submitting…" : "Submit Referral"}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
