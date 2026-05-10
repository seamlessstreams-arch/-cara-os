"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle, CheckCircle2,
  Clock, Search, Lock, Shield, Scale, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, YOUNG_PEOPLE, STAFF } from "@/lib/seed-data";
import {
  DoLRecord, DoLRestrictionType, DoLLegalBasis, DoLReviewStatus,
  DoLReviewHistoryEntry,
  DOL_RESTRICTION_TYPE_LABEL, DOL_LEGAL_BASIS_LABEL, DOL_REVIEW_STATUS_LABEL,
} from "@/types/extended";
import { useDoLRecords, useCreateDoLRecord } from "@/hooks/use-dol-records";
import { toast } from "sonner";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const STATUS_CLR: Record<DoLReviewStatus, string> = { current: "bg-amber-100 text-amber-800", under_review: "bg-blue-100 text-blue-800", removed: "bg-green-100 text-green-800", expired: "bg-slate-100 text-slate-700", court_pending: "bg-purple-100 text-purple-800" };
const STATUS_BORDER: Record<DoLReviewStatus, string> = { current: "border-l-amber-400", under_review: "border-l-blue-400", removed: "border-l-green-400", expired: "border-l-slate-300", court_pending: "border-l-purple-400" };

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function DeprivationOfLibertyPage() {
  const { data: raw, isLoading } = useDoLRecords();
  const createRestriction = useCreateDoLRecord();
  const records = raw?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const [dolForm, setDolForm] = useState({
    child_id: "",
    restriction_type: "" as DoLRestrictionType | "",
    description: "",
    necessary_justification: "",
    child_views: "",
    legal_basis: "care_plan" as DoLLegalBasis,
    authorised_by_id: "staff_darren",
    date_imposed: new Date().toISOString().slice(0, 10),
    review_date: "",
  });
  const setDF = (k: keyof typeof dolForm, v: string) => setDolForm((p) => ({ ...p, [k]: v }));

  const handleCreateRestriction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dolForm.child_id || !dolForm.restriction_type || !dolForm.description.trim()) {
      toast.error("Young person, restriction type and description are required.");
      return;
    }
    await createRestriction.mutateAsync({
      child_id: dolForm.child_id,
      restriction_type: dolForm.restriction_type as DoLRestrictionType,
      description: dolForm.description.trim(),
      legal_basis: dolForm.legal_basis,
      authorised_by_id: dolForm.authorised_by_id,
      date_imposed: dolForm.date_imposed,
      review_date: dolForm.review_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: "current" as DoLReviewStatus,
      proportionate: true,
      necessary_justification: dolForm.necessary_justification,
      child_consulted: false,
      child_views: dolForm.child_views,
      sw_consulted: false,
      sw_views: "",
      ilo_consulted: false,
      court_authorised: false,
      court_ref: "",
      alternatives_considered: [],
      impact_on_child: "",
      review_history: [],
      notes: "",
    });
    toast.success("Restriction logged.");
    setDolForm({ child_id: "", restriction_type: "", description: "", necessary_justification: "", child_views: "", legal_basis: "care_plan", authorised_by_id: "staff_darren", date_imposed: new Date().toISOString().slice(0, 10), review_date: "" });
    setShowNew(false);
  };

  const filtered = useMemo(() => {
    let rows = [...records];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        DOL_RESTRICTION_TYPE_LABEL[r.restriction_type].toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) => sortBy === "newest" ? b.date_imposed.localeCompare(a.date_imposed) : a.date_imposed.localeCompare(b.date_imposed));
    return rows;
  }, [records, search, filterStatus, sortBy]);

  const total = records.length;
  const current = records.filter((r) => r.status === "current" || r.status === "under_review").length;
  const courtOrdered = records.filter((r) => r.court_authorised).length;
  const dueReview = records.filter((r) => {
    if (r.status === "removed" || r.status === "expired") return false;
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return r.review_date <= sevenDaysFromNow.toISOString().slice(0, 10);
  }).length;

  const exportCols: ExportColumn<DoLRecord>[] = [
    { header: "Young Person", accessor: (r: DoLRecord) => getYPName(r.child_id) },
    { header: "Restriction", accessor: (r: DoLRecord) => DOL_RESTRICTION_TYPE_LABEL[r.restriction_type] },
    { header: "Legal Basis", accessor: (r: DoLRecord) => DOL_LEGAL_BASIS_LABEL[r.legal_basis] },
    { header: "Imposed", accessor: (r: DoLRecord) => r.date_imposed },
    { header: "Review Due", accessor: (r: DoLRecord) => r.review_date },
    { header: "Status", accessor: (r: DoLRecord) => DOL_REVIEW_STATUS_LABEL[r.status] },
    { header: "Court Authorised", accessor: (r: DoLRecord) => r.court_authorised ? "Yes" : "No" },
    { header: "Child Consulted", accessor: (r: DoLRecord) => r.child_consulted ? "Yes" : "No" },
    { header: "Proportionate", accessor: (r: DoLRecord) => r.proportionate ? "Yes" : "No" },
  ];

  if (isLoading) {
    return (
      <PageShell title="Restrictions & Deprivation of Liberty" subtitle="Reg 20 · Restraints & Restrictions · Proportionality · Child's Voice">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Restrictions & Deprivation of Liberty"
      subtitle="Reg 20 · Restraints & Restrictions · Proportionality · Child's Voice"
      ariaContext={{ pageTitle: "Restrictions & DoL Register", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Restrictions & DoL Register" />
          <ExportButton data={records} columns={exportCols} filename="deprivation-of-liberty" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Log Restriction</Button>
          <AriaStudioQuickActionButton context={{ record_type: "risk_assessment", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Restrictions", value: total, icon: Lock, clr: "text-blue-600" },
            { label: "Current / Active", value: current, icon: Shield, clr: "text-amber-600" },
            { label: "Court Ordered", value: courtOrdered, icon: Scale, clr: "text-purple-600" },
            { label: "Review Due (7d)", value: dueReview, icon: Clock, clr: "text-red-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search restrictions..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {(Object.entries(DOL_REVIEW_STATUS_LABEL) as [DoLReviewStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}>
            <ArrowUpDown className="h-4 w-4 mr-1" />{sortBy === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>

        {dueReview > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{dueReview} restriction(s) due for review within 7 days</p>
              <p className="text-amber-700">All restrictions on children&apos;s liberty must be regularly reviewed for proportionality and necessity (Reg 20). The child&apos;s views must be sought at every review. Restrictions that are no longer proportionate must be removed immediately.</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", STATUS_BORDER[r.status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)} — {DOL_RESTRICTION_TYPE_LABEL[r.restriction_type]}
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{DOL_REVIEW_STATUS_LABEL[r.status]}</Badge>
                        {r.court_authorised && <Badge variant="outline" className="bg-purple-100 text-purple-800">Court Order</Badge>}
                        {!r.child_consulted && <Badge variant="outline" className="bg-red-100 text-red-800">Child Not Consulted</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {DOL_LEGAL_BASIS_LABEL[r.legal_basis]} · Imposed: {r.date_imposed} · Review: {r.review_date} · Auth: {getStaffName(r.authorised_by_id)}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div><p className="font-medium mb-1">Description</p><p className="text-muted-foreground text-xs">{r.description}</p></div>

                    <div className="bg-amber-50 border border-amber-200 rounded p-2">
                      <p className="font-medium text-xs text-amber-800 mb-1">Justification (Necessity & Proportionality)</p>
                      <p className="text-xs text-amber-700">{r.necessary_justification}</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Child&apos;s Views</p>
                      <p className="text-xs text-blue-700">{r.child_views}</p>
                    </div>

                    {r.sw_views && (
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="font-medium text-xs text-green-800 mb-1">Social Worker&apos;s Views</p>
                        <p className="text-xs text-green-700">{r.sw_views}</p>
                      </div>
                    )}

                    {r.alternatives_considered.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Alternatives Considered</p>
                        <ul className="space-y-1">
                          {r.alternatives_considered.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs"><AlertTriangle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" /><span>{a}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="font-medium text-xs text-purple-800 mb-1">Impact on Child</p>
                      <p className="text-xs text-purple-700">{r.impact_on_child}</p>
                    </div>

                    {r.review_history.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Review History</p>
                        {r.review_history.map((rev, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 mb-1 text-xs">
                            <span className="font-medium">{rev.date}:</span> {rev.outcome}
                          </div>
                        ))}
                      </div>
                    )}

                    {r.court_ref && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Court Ref</p><p className="text-xs font-bold">{r.court_ref}</p></div>
                        <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Court Authorised</p><p className="text-xs font-bold">{r.court_authorised ? "Yes" : "No"}</p></div>
                      </div>
                    )}

                    <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground text-xs">{r.notes}</p></div>

                    <SmartLinkPanel sourceType="dol_record" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 20 — restrictions on liberty. Any measure that restricts a child&apos;s liberty must be: necessary, proportionate, the least restrictive option, regularly reviewed, and documented. The child must be consulted and their views recorded. Restrictions that amount to a deprivation of liberty may require court authorisation. All restrictions must be reported to Ofsted, the placing authority, and the IRO. The Responsible Individual must be satisfied that all restrictions are proportionate and necessary. Restrictions are subject to Reg 44 independent scrutiny and Ofsted inspection.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Restriction</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateRestriction} className="space-y-3">
            <div>
              <Label>Young Person *</Label>
              <Select value={dolForm.child_id} onValueChange={(v) => setDF("child_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select YP" /></SelectTrigger>
                <SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.first_name} {y.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Restriction Type *</Label>
              <Select value={dolForm.restriction_type} onValueChange={(v) => setDF("restriction_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(DOL_RESTRICTION_TYPE_LABEL) as [DoLRestrictionType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Legal Basis</Label>
              <Select value={dolForm.legal_basis} onValueChange={(v) => setDF("legal_basis", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.entries(DOL_LEGAL_BASIS_LABEL) as [DoLLegalBasis, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Authorised By</Label>
              <Select value={dolForm.authorised_by_id} onValueChange={(v) => setDF("authorised_by_id", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Date Imposed</Label><Input type="date" value={dolForm.date_imposed} onChange={(e) => setDF("date_imposed", e.target.value)} /></div>
              <div><Label>Review Date</Label><Input type="date" value={dolForm.review_date} onChange={(e) => setDF("review_date", e.target.value)} /></div>
            </div>
            <div><Label>Description *</Label><Textarea placeholder="Describe the restriction in detail..." value={dolForm.description} onChange={(e) => setDF("description", e.target.value)} /></div>
            <div><Label>Justification</Label><Textarea placeholder="Why is this necessary and proportionate?" value={dolForm.necessary_justification} onChange={(e) => setDF("necessary_justification", e.target.value)} /></div>
            <div><Label>Child&apos;s Views</Label><Textarea placeholder="What does the child think about this restriction?" value={dolForm.child_views} onChange={(e) => setDF("child_views", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createRestriction.isPending}>{createRestriction.isPending ? "Logging…" : "Log Restriction"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Restrictions & DoL Register — deprivation of liberty, Secure Accommodation Order, s25, restrictions, DOLS, Court order, monitoring, rights, proportionality, Reg 40, legal framework"
        recordType="risk_assessment"
        className="mt-6"
      />
    </PageShell>
  );
}
