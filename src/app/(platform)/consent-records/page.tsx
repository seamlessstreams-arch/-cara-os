"use client";

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { toast } from "sonner";
import {
  useConsentRecords,
  useCreateConsentRecord,
  useUpdateConsentRecord,
} from "@/hooks/use-consent-records";
import type {
  ConsentRecord,
  ConsentCategory,
  ConsentStatus,
  ConsentorType,
} from "@/types/extended";
import { CONSENTOR_TYPE_LABEL } from "@/types/extended";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  FileCheck, AlertTriangle, CheckCircle2, Clock, Calendar,
  Shield, XCircle, RefreshCw
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Local meta (keeps color / icon info that doesn't belong in shared types) ─
const CATEGORY_META: Record<ConsentCategory, { label: string; color: string }> = {
  medical:             { label: "Medical Treatment",      color: "bg-red-100 text-red-800" },
  education:           { label: "Education",              color: "bg-blue-100 text-blue-800" },
  photography:         { label: "Photography",            color: "bg-purple-100 text-purple-800" },
  trips_activities:    { label: "Trips & Activities",     color: "bg-green-100 text-green-800" },
  information_sharing: { label: "Information Sharing",    color: "bg-amber-100 text-amber-800" },
  therapy:             { label: "Therapeutic Support",    color: "bg-pink-100 text-pink-800" },
  social_media:        { label: "Social Media",           color: "bg-indigo-100 text-indigo-800" },
  overnight_stays:     { label: "Overnight Stays",        color: "bg-teal-100 text-teal-800" },
  contact:             { label: "Contact Arrangements",   color: "bg-orange-100 text-orange-800" },
  research:            { label: "Research Participation",  color: "bg-slate-100 text-slate-800" },
};

const STATUS_META: Record<ConsentStatus, { label: string; icon: React.ReactNode; color: string }> = {
  granted:   { label: "Granted",   icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "bg-green-100 text-green-700" },
  refused:   { label: "Refused",   icon: <XCircle className="h-3.5 w-3.5" />,      color: "bg-red-100 text-red-700" },
  pending:   { label: "Pending",   icon: <Clock className="h-3.5 w-3.5" />,        color: "bg-amber-100 text-amber-700" },
  expired:   { label: "Expired",   icon: <RefreshCw className="h-3.5 w-3.5" />,    color: "bg-gray-100 text-gray-700" },
  withdrawn: { label: "Withdrawn", icon: <XCircle className="h-3.5 w-3.5" />,      color: "bg-orange-100 text-orange-700" },
};

// ── Export columns ──────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<ConsentRecord>[] = [
  { header: "ID",             accessor: (r: ConsentRecord) => r.id },
  { header: "Young Person",   accessor: (r: ConsentRecord) => getYPName(r.child_id) },
  { header: "Category",       accessor: (r: ConsentRecord) => CATEGORY_META[r.category].label },
  { header: "Description",    accessor: (r: ConsentRecord) => r.description },
  { header: "Status",         accessor: (r: ConsentRecord) => STATUS_META[r.status].label },
  { header: "Consentor Type", accessor: (r: ConsentRecord) => CONSENTOR_TYPE_LABEL[r.consentor_type] },
  { header: "Consentor Name", accessor: (r: ConsentRecord) => r.consentor_name },
  { header: "Date Requested", accessor: (r: ConsentRecord) => r.date_requested },
  { header: "Date Decided",   accessor: (r: ConsentRecord) => r.date_decided || "—" },
  { header: "Expiry",         accessor: (r: ConsentRecord) => r.expiry_date || "—" },
  { header: "Conditions",     accessor: (r: ConsentRecord) => r.conditions || "—" },
  { header: "Recorded By",    accessor: (r: ConsentRecord) => getStaffName(r.recorded_by) },
  { header: "Notes",          accessor: (r: ConsentRecord) => r.notes },
  { header: "Review Date",    accessor: (r: ConsentRecord) => r.review_date || "—" },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function ConsentRecordsPage() {
  const { data, isLoading } = useConsentRecords();
  const records = data?.data ?? [];
  const createMutation = useCreateConsentRecord();
  const updateMutation = useUpdateConsentRecord();

  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  // ── New-record form state ─────────────────────────────────────────────────
  const [newChildId, setNewChildId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newConsentorName, setNewConsentorName] = useState("");
  const [newConsentorType, setNewConsentorType] = useState("");
  const [newDateRequested, setNewDateRequested] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [newConditions, setNewConditions] = useState("");

  const resetForm = () => {
    setNewChildId("");
    setNewCategory("");
    setNewDescription("");
    setNewConsentorName("");
    setNewConsentorType("");
    setNewDateRequested("");
    setNewExpiryDate("");
    setNewConditions("");
  };

  if (isLoading) return <PageShell title="Consent Records" subtitle="Tracking permissions, approvals, and authorisations for each young person"><div /></PageShell>;

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const children = (() => {
    const ids = [...new Set(records.map((r) => r.child_id))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  })();

  const today = new Date().toISOString().slice(0, 10);
  const in30 = (() => { const dt = new Date(); dt.setDate(dt.getDate() + 30); return dt.toISOString().slice(0, 10); })();

  const filtered = (() => {
    let list = [...records];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((r) => r.description.toLowerCase().includes(s) || r.consentor_name.toLowerCase().includes(s) || r.notes.toLowerCase().includes(s));
    }
    if (childFilter !== "all") list = list.filter((r) => r.child_id === childFilter);
    if (categoryFilter !== "all") list = list.filter((r) => r.category === categoryFilter);
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":     return b.date_requested.localeCompare(a.date_requested);
        case "category": return CATEGORY_META[a.category].label.localeCompare(CATEGORY_META[b.category].label);
        case "status":   return a.status.localeCompare(b.status);
        case "child":    return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "expiry":   return (a.expiry_date || "9999").localeCompare(b.expiry_date || "9999");
        default:         return 0;
      }
    });
    return list;
  })();

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = (() => {
    const total = records.length;
    const granted = records.filter((r) => r.status === "granted").length;
    const pending = records.filter((r) => r.status === "pending").length;
    const expired = records.filter((r) => r.status === "expired" || (r.expiry_date && r.expiry_date < today && r.status === "granted")).length;
    const expiringSoon = records.filter((r) => r.status === "granted" && r.expiry_date && r.expiry_date >= today && r.expiry_date <= in30).length;
    return { total, granted, pending, expired, expiringSoon };
  })();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        child_id: newChildId,
        category: newCategory as ConsentCategory,
        description: newDescription,
        consentor_name: newConsentorName,
        consentor_type: newConsentorType as ConsentorType,
        date_requested: newDateRequested || today,
        expiry_date: newExpiryDate,
        conditions: newConditions,
        status: "pending" as ConsentStatus,
      },
      {
        onSuccess: () => {
          toast.success("Consent record created");
          resetForm();
          setShowNew(false);
        },
      }
    );
  };

  return (
    <PageShell
      title="Consent Records"
      subtitle="Tracking permissions, approvals, and authorisations for each young person"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Consent Records" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="consent-records" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Consent</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── Stats strip ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Records",    value: stats.total,        icon: <FileCheck className="h-4 w-4" />,       color: "text-blue-600" },
            { label: "Granted",           value: stats.granted,      icon: <CheckCircle2 className="h-4 w-4" />,    color: "text-green-600" },
            { label: "Pending",           value: stats.pending,      icon: <Clock className="h-4 w-4" />,           color: "text-amber-600" },
            { label: "Expired",           value: stats.expired,      icon: <RefreshCw className="h-4 w-4" />,       color: "text-gray-600" },
            { label: "Expiring Soon",     value: stats.expiringSoon, icon: <AlertTriangle className="h-4 w-4" />,   color: "text-red-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Pending / expiring alert ─────────────────────────────────────── */}
        {(stats.pending > 0 || stats.expiringSoon > 0) && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3 flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                {stats.pending > 0 && <><strong>{stats.pending}</strong> consent{stats.pending !== 1 && "s"} awaiting decision. </>}
                {stats.expiringSoon > 0 && <><strong>{stats.expiringSoon}</strong> consent{stats.expiringSoon !== 1 && "s"} expiring within 30 days.</>}
              </span>
            </CardContent>
          </Card>
        )}

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search consents…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Child" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="expiry">Expiry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Record list ──────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No consent records match your filters.</p>}
          {filtered.map((r) => {
            const open = !!expanded[r.id];
            const catM = CATEGORY_META[r.category];
            const statusM = STATUS_META[r.status];
            const nearExpiry = r.status === "granted" && r.expiry_date && r.expiry_date >= today && r.expiry_date <= in30;
            return (
              <Card key={r.id} className={cn("border-l-4", r.status === "granted" ? "border-l-green-500" : r.status === "refused" || r.status === "withdrawn" ? "border-l-red-400" : r.status === "pending" ? "border-l-amber-400" : "border-l-gray-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(r.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", catM.color)}>{catM.label}</Badge>
                        <Badge className={cn("text-xs flex items-center gap-1", statusM.color)}>{statusM.icon}{statusM.label}</Badge>
                        {nearExpiry && <Badge variant="destructive" className="text-xs">Expiring soon</Badge>}
                      </div>
                      <p className="font-semibold">{r.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{getYPName(r.child_id)}</span>
                        <span>By: {r.consentor_name} ({CONSENTOR_TYPE_LABEL[r.consentor_type]})</span>
                        <span>Requested: {r.date_requested}</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><p className="text-xs text-muted-foreground">Requested</p><p className="font-medium">{r.date_requested}</p></div>
                        <div><p className="text-xs text-muted-foreground">Decided</p><p className="font-medium">{r.date_decided || "Awaiting"}</p></div>
                        <div><p className="text-xs text-muted-foreground">Expires</p><p className="font-medium">{r.expiry_date || "N/A"}</p></div>
                        <div><p className="text-xs text-muted-foreground">Recorded By</p><p className="font-medium">{getStaffName(r.recorded_by)}</p></div>
                      </div>
                      {r.conditions && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Conditions</p>
                          <p className="bg-amber-50 p-2 rounded text-amber-900 text-xs">{r.conditions}</p>
                        </div>
                      )}
                      {r.notes && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Notes</p>
                          <p className="italic text-muted-foreground">{r.notes}</p>
                        </div>
                      )}
                      {r.review_date && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Review date: {r.review_date}</span>
                        </div>
                      )}
                      <SmartLinkPanel sourceType="consent-record" sourceId={r.id} childId={r.child_id} compact />
                      {r.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            disabled={updateMutation.isPending}
                            onClick={() =>
                              updateMutation.mutate(
                                { id: r.id, status: "granted", date_decided: new Date().toISOString().slice(0, 10) },
                                { onSuccess: () => toast.success("Consent granted") }
                              )
                            }
                          >
                            Grant
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            disabled={updateMutation.isPending}
                            onClick={() =>
                              updateMutation.mutate(
                                { id: r.id, status: "refused", date_decided: new Date().toISOString().slice(0, 10) },
                                { onSuccess: () => toast.success("Consent refused") }
                              )
                            }
                          >
                            Refuse
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Guidance ─────────────────────────────────────────────────────── */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              All consent must be obtained from the appropriate person with parental responsibility or delegated authority. Consents should be reviewed regularly and renewed before expiry. Where a young person is of sufficient age and understanding (Gillick competent), their views must be recorded alongside formal consent. Expired consents must not be relied upon.
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ── New consent dialog ────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={(open) => { setShowNew(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Consent Record</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select value={newChildId} onValueChange={setNewChildId}>
                <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea placeholder="What is being consented to?" rows={3} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Consentor Name</label>
              <Input placeholder="Name of person giving consent" value={newConsentorName} onChange={(e) => setNewConsentorName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Consentor Type</label>
              <Select value={newConsentorType} onValueChange={setNewConsentorType}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{Object.entries(CONSENTOR_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Date Requested</label>
                <Input type="date" value={newDateRequested} onChange={(e) => setNewDateRequested(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Expiry Date</label>
                <Input type="date" value={newExpiryDate} onChange={(e) => setNewExpiryDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Conditions</label>
              <Textarea placeholder="Any conditions or limitations…" rows={2} value={newConditions} onChange={(e) => setNewConditions(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowNew(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Save Record</Button>
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
