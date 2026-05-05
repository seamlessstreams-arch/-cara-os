"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — VISITOR LOG
// Records all visitors to the home: professionals, family, tradespeople,
// inspectors, and others. Required under Children's Homes Regulations 2015
// (Reg 37, Schedule 3) — a record of all persons visiting the home.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, todayStr, daysFromNow } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName } from "@/lib/seed-data";
import {
  Users, Search, Filter, ArrowUpDown, X, Plus,
  UserCheck, Clock, LogIn, LogOut,
  Shield, Briefcase, Wrench, Heart, Eye,
  ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useVisitors, useCreateVisitor } from "@/hooks/use-visitors";
import type { VisitorCategory, VisitStatus, VisitorEntry } from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";


// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<VisitorCategory, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  professional: { label: "Professional", icon: Briefcase, color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"    },
  family:       { label: "Family",       icon: Heart,     color: "text-pink-700",    bg: "bg-pink-50",    border: "border-pink-200"    },
  tradesperson: { label: "Tradesperson", icon: Wrench,    color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  inspector:    { label: "Inspector",    icon: Eye,       color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200"  },
  volunteer:    { label: "Volunteer",    icon: UserCheck,  color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  other:        { label: "Other",        icon: Users,     color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200"   },
};

const STATUS_CONFIG: Record<VisitStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  signed_in:  { label: "On Site",    icon: LogIn,  color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  signed_out: { label: "Departed",   icon: LogOut, color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200"   },
  expected:   { label: "Expected",   icon: Clock,  color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
};

// ── Export Columns ────────────────────────────────────────────────────────────

const VISITOR_EXPORT_COLS: ExportColumn<VisitorEntry>[] = [
  { header: "Date",         accessor: (r) => r.date },
  { header: "Visitor",      accessor: (r) => r.visitor_name },
  { header: "Organisation", accessor: (r) => r.organisation ?? "" },
  { header: "Category",     accessor: (r) => CATEGORY_CONFIG[r.category]?.label ?? r.category },
  { header: "Purpose",      accessor: (r) => r.purpose },
  { header: "DBS Checked",  accessor: (r) => r.dbs_checked ? "Yes" : "No" },
  { header: "ID Verified",  accessor: (r) => r.id_verified ? "Yes" : "No" },
  { header: "Sign In",      accessor: (r) => r.sign_in_time },
  { header: "Sign Out",     accessor: (r) => r.sign_out_time ?? "On site" },
  { header: "Status",       accessor: (r) => STATUS_CONFIG[r.status]?.label ?? r.status },
  { header: "Host",         accessor: (r) => getStaffName(r.host_staff_id) },
  { header: "Notes",        accessor: (r) => r.notes ?? "" },
];

// ── Visitor Row ──────────────────────────────────────────────────────────────

function VisitorRow({ entry }: { entry: VisitorEntry }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_CONFIG[entry.category];
  const st = STATUS_CONFIG[entry.status];
  const CatIcon = cat.icon;
  const StIcon = st.icon;

  return (
    <div className={cn(
      "rounded-lg border bg-white transition-all",
      entry.status === "signed_in" && "border-emerald-200 bg-emerald-50/20",
    )}>
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className={cn("rounded-md p-1.5 border flex-shrink-0", cat.bg, cat.border)}>
          <CatIcon className={cn("h-3.5 w-3.5", cat.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-slate-900">{entry.visitor_name}</span>
            {entry.organisation && (
              <span className="text-[10px] text-slate-500">— {entry.organisation}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>{formatDate(entry.date)}</span>
            <span>·</span>
            <span>{entry.sign_in_time}{entry.sign_out_time ? ` – ${entry.sign_out_time}` : ""}</span>
            <span>·</span>
            <Badge className={cn("text-[9px] px-1.5 py-0 border", cat.bg, cat.color, cat.border)}>
              {cat.label}
            </Badge>
            {entry.dbs_checked && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0">
                <Shield className="h-2.5 w-2.5 mr-0.5" /> DBS
              </Badge>
            )}
          </div>
        </div>

        <Badge className={cn("text-[9px] px-2 py-0.5 border flex-shrink-0", st.bg, st.color, st.border)}>
          <StIcon className="h-3 w-3 mr-1" />
          {st.label}
        </Badge>

        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </div>

      {expanded && (
        <div className="border-t px-3 pb-3 pt-2 space-y-2">
          <p className="text-xs text-slate-700"><span className="font-medium">Purpose:</span> {entry.purpose}</p>
          {entry.notes && <p className="text-xs text-slate-600 italic">{entry.notes}</p>}
          <div className="flex items-center gap-4 text-[10px] text-slate-400">
            <span>Host: {getStaffName(entry.host_staff_id)}</span>
            <span>ID verified: {entry.id_verified ? "Yes" : "No"}</span>
            <span>DBS: {entry.dbs_checked ? "Checked" : "N/A"}</span>
            {entry.children_seen.length > 0 && (
              <span>YP seen: {entry.children_seen.length}</span>
            )}
          </div>
          {entry.children_seen.length > 0 && (
            <SmartLinkPanel sourceType="visitor" sourceId={entry.id} childId={entry.children_seen[0]} compact />
          )}
        </div>
      )}
    </div>
  );
}

// ── New Visitor Dialog ───────────────────────────────────────────────────────

function NewVisitorDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (entry: Partial<VisitorEntry>) => void;
}) {
  const { currentUser } = useAuthContext();
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [category, setCategory] = useState<VisitorCategory>("professional");
  const [purpose, setPurpose] = useState("");
  const [dbsChecked, setDbsChecked] = useState(false);
  const [idVerified, setIdVerified] = useState(true);
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    if (!name.trim() || !purpose.trim()) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const entry: Partial<VisitorEntry> = {
      date: todayStr(),
      visitor_name: name.trim(),
      organisation: org.trim() || null,
      category,
      purpose: purpose.trim(),
      dbs_checked: dbsChecked,
      id_verified: idVerified,
      sign_in_time: time,
      sign_out_time: null,
      status: "signed_in",
      host_staff_id: currentUser?.id ?? "staff_darren",
      children_seen: [],
      notes: notes.trim() || null,
      created_at: now.toISOString(),
    };
    onSubmit(entry);
    setName(""); setOrg(""); setPurpose(""); setNotes(""); setDbsChecked(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <LogIn className="h-4 w-4 text-emerald-600" />
            Sign In Visitor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Visitor Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Organisation</label>
              <Input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Organisation" className="h-8 text-xs" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as VisitorCategory)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_CONFIG) as VisitorCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_CONFIG[c].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Purpose of Visit *</label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Reason for visiting" className="h-8 text-xs" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="dbs-check" checked={dbsChecked} onChange={(e) => setDbsChecked(e.target.checked)} className="rounded border-slate-300" />
              <label htmlFor="dbs-check" className="text-xs text-slate-700">DBS checked</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="id-check" checked={idVerified} onChange={(e) => setIdVerified(e.target.checked)} className="rounded border-slate-300" />
              <label htmlFor="id-check" className="text-xs text-slate-700">ID verified</label>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes…" className="text-xs min-h-[50px]" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="text-xs" onClick={handleSubmit} disabled={!name.trim() || !purpose.trim()}>
            Sign In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function VisitorLogPage() {
  const { data: visData, isLoading } = useVisitors();
  const createVisitor = useCreateVisitor();
  const visitors = visData?.data ?? [];
  const [showNew, setShowNew] = useState(false);

  const [dateFilter, setDateFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<VisitorCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<VisitStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = [...visitors];

    if (dateFilter === "today") list = list.filter((v) => v.date === todayStr());
    else if (dateFilter === "week") list = list.filter((v) => v.date >= daysFromNow(-7));

    if (categoryFilter !== "all") list = list.filter((v) => v.category === categoryFilter);
    if (statusFilter !== "all") list = list.filter((v) => v.status === statusFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.visitor_name.toLowerCase().includes(q) ||
        (v.organisation ?? "").toLowerCase().includes(q) ||
        v.purpose.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case "name": list.sort((a, b) => a.visitor_name.localeCompare(b.visitor_name)); break;
      case "category": list.sort((a, b) => a.category.localeCompare(b.category)); break;
      default: list.sort((a, b) => b.date.localeCompare(a.date) || b.sign_in_time.localeCompare(a.sign_in_time));
    }

    return list;
  }, [visitors, dateFilter, categoryFilter, statusFilter, search, sortBy]);

  // Stats
  const stats = useMemo(() => ({
    total: visitors.length,
    onSite: visitors.filter((v) => v.status === "signed_in").length,
    today: visitors.filter((v) => v.date === todayStr()).length,
    professionals: visitors.filter((v) => v.category === "professional").length,
    dbsChecked: visitors.filter((v) => v.dbs_checked).length,
  }), [visitors]);

  const hasFilters = search || dateFilter !== "all" || categoryFilter !== "all" || statusFilter !== "all";

  return (
    <PageShell
      title="Visitor Log"
      subtitle="Record of all visitors to the home"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={VISITOR_EXPORT_COLS} filename="visitor-log" />
          <PrintButton title="Visitor Log" subtitle="Oak House — Visitor Records" />
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5" />
            Sign In Visitor
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* ── Summary stats ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: "Total Visitors", value: stats.total,         color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200"   },
              { label: "On Site Now",    value: stats.onSite,        color: stats.onSite > 0 ? "text-emerald-600" : "text-slate-500", bg: stats.onSite > 0 ? "bg-emerald-50" : "bg-slate-50", border: stats.onSite > 0 ? "border-emerald-200" : "border-slate-200" },
              { label: "Today",          value: stats.today,         color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200"    },
              { label: "Professionals",  value: stats.professionals, color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-200"  },
              { label: "DBS Verified",   value: stats.dbsChecked,    color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
            ].map((s) => (
              <div key={s.label} className={cn("rounded-lg border p-3 text-center", s.bg, s.border)}>
                <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* On-site alert */}
          {stats.onSite > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 mb-6 flex items-start gap-3">
              <LogIn className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {stats.onSite} visitor{stats.onSite !== 1 ? "s" : ""} currently on site
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Ensure all visitors are signed out before leaving the premises.
                </p>
              </div>
            </div>
          )}

          {/* ── Filters ───────────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input placeholder="Search visitors…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
            </div>
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as VisitorCategory | "all")}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {(Object.keys(CATEGORY_CONFIG) as VisitorCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_CONFIG[c].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as VisitStatus | "all")}>
              <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {(Object.keys(STATUS_CONFIG) as VisitStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500" onClick={() => { setSearch(""); setDateFilter("all"); setCategoryFilter("all"); setStatusFilter("all"); }}>
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            )}
          </div>

          {/* ── Visitor List ──────────────────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No visitors found</p>
              <p className="text-xs mt-1">{hasFilters ? "Try adjusting your filters" : "No visitors recorded yet"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((entry) => (
                <VisitorRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}

          <div className="text-center text-[10px] text-slate-400 mt-6">
            Showing {filtered.length} of {visitors.length} visitor{visitors.length !== 1 ? "s" : ""}
          </div>

          {/* ── Regulatory Note ───────────────────────────────────────────────── */}
          <div className="mt-8 rounded-lg bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-1">Regulatory Context</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The Children&apos;s Homes Regulations 2015 (Reg 37, Schedule 3) require a record of all persons
                  visiting the home, including their name, purpose of visit, and arrival/departure times. Professional
                  visitors should have their DBS status and ID verified. This log is inspectable by Ofsted and the
                  Regulation 44 visitor. Maintaining an accurate visitor log is a safeguarding requirement — it ensures
                  the home can account for who was on site at any time.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <NewVisitorDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onSubmit={(entry) => createVisitor.mutate(entry as Partial<VisitorEntry>, {
          onSuccess: () => { toast.success("Visitor signed in"); setShowNew(false); },
          onError: () => toast.error("Failed to sign in visitor"),
        })}
      />
    </PageShell>
  );
}
