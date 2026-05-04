"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  FileCheck, AlertTriangle, CheckCircle2, Clock, Calendar,
  Shield, XCircle, RefreshCw
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type ConsentCategory = "medical" | "education" | "photography" | "trips_activities" | "information_sharing" | "therapy" | "social_media" | "overnight_stays" | "contact" | "research";
type ConsentStatus = "granted" | "refused" | "pending" | "expired" | "withdrawn";
type ConsentorType = "social_worker" | "parent" | "young_person" | "local_authority" | "guardian";

interface ConsentRecord {
  id: string;
  youngPersonId: string;
  category: ConsentCategory;
  description: string;
  status: ConsentStatus;
  consentorType: ConsentorType;
  consentorName: string;
  dateRequested: string;
  dateDecided: string;
  expiryDate: string;
  conditions: string;
  recordedBy: string;
  notes: string;
  reviewDate: string;
  createdAt: string;
}

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

const CONSENTOR_META: Record<ConsentorType, string> = {
  social_worker:   "Social Worker",
  parent:          "Parent/Carer",
  young_person:    "Young Person",
  local_authority: "Local Authority",
  guardian:        "Guardian",
};

// ── Seed data ────────────────────────────────────────────────────────────────
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: ConsentRecord[] = [
  {
    id: "cr_001", youngPersonId: "yp_alex", category: "medical",
    description: "Consent for routine dental treatment including fillings and check-ups",
    status: "granted", consentorType: "social_worker", consentorName: "Sarah Mitchell",
    dateRequested: d(-90), dateDecided: d(-88), expiryDate: d(275),
    conditions: "Excludes general anaesthetic — separate consent required", recordedBy: "staff_darren",
    notes: "Annual dental consent renewed.", reviewDate: d(275), createdAt: d(-90),
  },
  {
    id: "cr_002", youngPersonId: "yp_alex", category: "photography",
    description: "Consent for photographs to be used in life story work and internal records only",
    status: "granted", consentorType: "social_worker", consentorName: "Sarah Mitchell",
    dateRequested: d(-60), dateDecided: d(-58), expiryDate: d(305),
    conditions: "No social media or external publication. Internal use only.", recordedBy: "staff_anna",
    notes: "Alex also personally agreed to photographs.", reviewDate: d(120), createdAt: d(-60),
  },
  {
    id: "cr_003", youngPersonId: "yp_alex", category: "trips_activities",
    description: "Blanket consent for local day trips within 30 miles of the home",
    status: "granted", consentorType: "social_worker", consentorName: "Sarah Mitchell",
    dateRequested: d(-45), dateDecided: d(-43), expiryDate: d(320),
    conditions: "Local trips only. Separate consent needed for overnight or >30 miles.", recordedBy: "staff_darren",
    notes: "Covers bowling, cinema, swimming, parks etc.", reviewDate: d(120), createdAt: d(-45),
  },
  {
    id: "cr_004", youngPersonId: "yp_jordan", category: "therapy",
    description: "Consent for CAMHS therapeutic sessions including CBT",
    status: "granted", consentorType: "social_worker", consentorName: "David Clarke",
    dateRequested: d(-30), dateDecided: d(-28), expiryDate: d(335),
    conditions: "Sessions to be reviewed after 12 weeks.", recordedBy: "staff_anna",
    notes: "Jordan also consented personally. Sessions started.", reviewDate: d(56), createdAt: d(-30),
  },
  {
    id: "cr_005", youngPersonId: "yp_jordan", category: "overnight_stays",
    description: "Consent for overnight stays at approved friend's house (Tyler's family)",
    status: "granted", consentorType: "social_worker", consentorName: "David Clarke",
    dateRequested: d(-20), dateDecided: d(-17), expiryDate: d(160),
    conditions: "Maximum one night. Parents to be DBS-checked. Advance notice required.", recordedBy: "staff_ryan",
    notes: "Tyler's parents have been vetted.", reviewDate: d(60), createdAt: d(-20),
  },
  {
    id: "cr_006", youngPersonId: "yp_jordan", category: "social_media",
    description: "Consent for Jordan to have supervised social media accounts",
    status: "refused", consentorType: "social_worker", consentorName: "David Clarke",
    dateRequested: d(-25), dateDecided: d(-22), expiryDate: "",
    conditions: "", recordedBy: "staff_ryan",
    notes: "Refused due to ongoing safeguarding concerns. To be reviewed in 3 months.", reviewDate: d(65), createdAt: d(-25),
  },
  {
    id: "cr_007", youngPersonId: "yp_casey", category: "medical",
    description: "Consent for immunisations and routine medical treatment",
    status: "granted", consentorType: "local_authority", consentorName: "Derby City Council — CLA Team",
    dateRequested: d(-14), dateDecided: d(-12), expiryDate: d(351),
    conditions: "Standard medical treatment only. Surgery requires separate consent.", recordedBy: "staff_darren",
    notes: "LA holds parental responsibility.", reviewDate: d(180), createdAt: d(-14),
  },
  {
    id: "cr_008", youngPersonId: "yp_casey", category: "information_sharing",
    description: "Consent to share placement information with school for PEP",
    status: "granted", consentorType: "social_worker", consentorName: "Emma Watson",
    dateRequested: d(-10), dateDecided: d(-8), expiryDate: d(355),
    conditions: "Limited to educational needs and pastoral support. No sharing of placement address.", recordedBy: "staff_chervelle",
    notes: "Essential for PEP meeting next month.", reviewDate: d(90), createdAt: d(-10),
  },
  {
    id: "cr_009", youngPersonId: "yp_casey", category: "contact",
    description: "Consent for supervised telephone contact with father",
    status: "pending", consentorType: "social_worker", consentorName: "Emma Watson",
    dateRequested: d(-5), dateDecided: "", expiryDate: "",
    conditions: "", recordedBy: "staff_darren",
    notes: "Awaiting SW decision. Casey has expressed wish for contact.", reviewDate: d(7), createdAt: d(-5),
  },
  {
    id: "cr_010", youngPersonId: "yp_alex", category: "education",
    description: "Consent for college enrolment at Derby College — Catering NVQ Level 2",
    status: "pending", consentorType: "social_worker", consentorName: "Sarah Mitchell",
    dateRequested: d(-3), dateDecided: "", expiryDate: "",
    conditions: "", recordedBy: "staff_darren",
    notes: "Linked to transition planning. Need decision before application deadline.", reviewDate: d(5), createdAt: d(-3),
  },
  {
    id: "cr_011", youngPersonId: "yp_alex", category: "trips_activities",
    description: "Consent for Alton Towers residential day trip",
    status: "expired", consentorType: "social_worker", consentorName: "Sarah Mitchell",
    dateRequested: d(-100), dateDecided: d(-98), expiryDate: d(-10),
    conditions: "One-off trip consent. Staff ratio 1:2.", recordedBy: "staff_ryan",
    notes: "Trip completed successfully. Consent now expired.", reviewDate: "", createdAt: d(-100),
  },
];

// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<ConsentRecord>[] = [
  { header: "ID",             accessor: (r: ConsentRecord) => r.id },
  { header: "Young Person",   accessor: (r: ConsentRecord) => getYPName(r.youngPersonId) },
  { header: "Category",       accessor: (r: ConsentRecord) => CATEGORY_META[r.category].label },
  { header: "Description",    accessor: (r: ConsentRecord) => r.description },
  { header: "Status",         accessor: (r: ConsentRecord) => STATUS_META[r.status].label },
  { header: "Consentor Type", accessor: (r: ConsentRecord) => CONSENTOR_META[r.consentorType] },
  { header: "Consentor Name", accessor: (r: ConsentRecord) => r.consentorName },
  { header: "Date Requested", accessor: (r: ConsentRecord) => r.dateRequested },
  { header: "Date Decided",   accessor: (r: ConsentRecord) => r.dateDecided || "—" },
  { header: "Expiry",         accessor: (r: ConsentRecord) => r.expiryDate || "—" },
  { header: "Conditions",     accessor: (r: ConsentRecord) => r.conditions || "—" },
  { header: "Recorded By",    accessor: (r: ConsentRecord) => getStaffName(r.recordedBy) },
  { header: "Notes",          accessor: (r: ConsentRecord) => r.notes },
  { header: "Review Date",    accessor: (r: ConsentRecord) => r.reviewDate || "—" },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function ConsentRecordsPage() {
  const [records, setRecords] = useState<ConsentRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const children = useMemo(() => {
    const ids = [...new Set(records.map((r) => r.youngPersonId))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((r) => r.description.toLowerCase().includes(s) || r.consentorName.toLowerCase().includes(s) || r.notes.toLowerCase().includes(s));
    }
    if (childFilter !== "all") list = list.filter((r) => r.youngPersonId === childFilter);
    if (categoryFilter !== "all") list = list.filter((r) => r.category === categoryFilter);
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":     return b.dateRequested.localeCompare(a.dateRequested);
        case "category": return CATEGORY_META[a.category].label.localeCompare(CATEGORY_META[b.category].label);
        case "status":   return a.status.localeCompare(b.status);
        case "child":    return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        case "expiry":   return (a.expiryDate || "9999").localeCompare(b.expiryDate || "9999");
        default:         return 0;
      }
    });
    return list;
  }, [records, search, childFilter, categoryFilter, statusFilter, sortBy]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = records.length;
    const granted = records.filter((r) => r.status === "granted").length;
    const pending = records.filter((r) => r.status === "pending").length;
    const expired = records.filter((r) => r.status === "expired" || (r.expiryDate && r.expiryDate < d(0) && r.status === "granted")).length;
    const expiringSoon = records.filter((r) => r.status === "granted" && r.expiryDate && r.expiryDate >= d(0) && r.expiryDate <= d(30)).length;
    return { total, granted, pending, expired, expiringSoon };
  }, [records]);

  return (
    <PageShell
      title="Consent Records"
      subtitle="Tracking permissions, approvals, and authorisations for each young person"
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
            const nearExpiry = r.status === "granted" && r.expiryDate && r.expiryDate >= d(0) && r.expiryDate <= d(30);
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
                        <span>{getYPName(r.youngPersonId)}</span>
                        <span>By: {r.consentorName} ({CONSENTOR_META[r.consentorType]})</span>
                        <span>Requested: {r.dateRequested}</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><p className="text-xs text-muted-foreground">Requested</p><p className="font-medium">{r.dateRequested}</p></div>
                        <div><p className="text-xs text-muted-foreground">Decided</p><p className="font-medium">{r.dateDecided || "Awaiting"}</p></div>
                        <div><p className="text-xs text-muted-foreground">Expires</p><p className="font-medium">{r.expiryDate || "N/A"}</p></div>
                        <div><p className="text-xs text-muted-foreground">Recorded By</p><p className="font-medium">{getStaffName(r.recordedBy)}</p></div>
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
                      {r.reviewDate && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Review date: {r.reviewDate}</span>
                        </div>
                      )}
                      {r.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => setRecords((prev) => prev.map((x) => x.id === r.id ? { ...x, status: "granted", dateDecided: d(0) } : x))}>Grant</Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => setRecords((prev) => prev.map((x) => x.id === r.id ? { ...x, status: "refused", dateDecided: d(0) } : x))}>Refuse</Button>
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
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Consent Record</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setShowNew(false); }} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea placeholder="What is being consented to?" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Consentor Name</label>
              <Input placeholder="Name of person giving consent" />
            </div>
            <div>
              <label className="text-sm font-medium">Consentor Type</label>
              <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{Object.entries(CONSENTOR_META).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Date Requested</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Expiry Date</label>
                <Input type="date" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Conditions</label>
              <Textarea placeholder="Any conditions or limitations…" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Save Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
