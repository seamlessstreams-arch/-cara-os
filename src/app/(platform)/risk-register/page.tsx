"use client";

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
import { cn, formatDate, todayStr } from "@/lib/utils";
import { AriaPanel } from "@/components/aria/aria-panel";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { getStaffName, getYPName, YOUNG_PEOPLE, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useRiskRegisterEntries, useCreateRiskRegisterEntry } from "@/hooks/use-risk-register-entries";
import type { RiskRegisterEntry, RiskRegisterCategory, RiskRegisterStatus, RiskRegisterLevel } from "@/types/extended";
import { RISK_REGISTER_CATEGORY_LABEL, RISK_REGISTER_STATUS_LABEL, RISK_REGISTER_LEVEL_LABEL } from "@/types/extended";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Plus, X, AlertTriangle, AlertOctagon, Shield, ShieldCheck,
  CheckCircle2, Clock, User, Calendar, Target, Activity,
  Loader2, TrendingUp, TrendingDown, Eye, Zap,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config ────────────────────────────────────────────────────── */

function computeLevel(score: number): RiskRegisterLevel {
  if (score >= 20) return "critical";
  if (score >= 12) return "high";
  if (score >= 6) return "medium";
  return "low";
}

const CATEGORY_CONFIG: Record<RiskRegisterCategory, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  safeguarding:        { label: "Safeguarding",        icon: Shield,        color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"     },
  behaviour:           { label: "Behaviour",           icon: Zap,           color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200"  },
  health:              { label: "Health",               icon: Activity,      color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  placement_stability: { label: "Placement Stability", icon: Target,        color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"    },
  staffing:            { label: "Staffing",             icon: User,          color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200"  },
  environmental:       { label: "Environmental",       icon: ShieldCheck,   color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200"    },
  regulatory:          { label: "Regulatory",           icon: CheckCircle2,  color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200"  },
  emotional_wellbeing: { label: "Emotional Wellbeing", icon: TrendingDown,  color: "text-pink-700",    bg: "bg-pink-50",    border: "border-pink-200"    },
  exploitation:        { label: "Exploitation",         icon: AlertOctagon,  color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"    },
  missing:             { label: "Missing",              icon: AlertTriangle, color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
};

const STATUS_CONFIG: Record<RiskRegisterStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  active:    { label: "Active",     icon: Zap,          color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"     },
  escalated: { label: "Escalated",  icon: AlertOctagon, color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"    },
  monitoring:{ label: "Monitoring", icon: Eye,          color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  mitigated: { label: "Mitigated",  icon: Shield,       color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"    },
  closed:    { label: "Closed",     icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
};

const LEVEL_CONFIG: Record<RiskRegisterLevel, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", color: "text-red-700",    bg: "bg-red-100",    border: "border-red-300"    },
  high:     { label: "High",     color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-300" },
  medium:   { label: "Medium",   color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200"  },
  low:      { label: "Low",      color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200"   },
};

/* ── sub-components ──────────────────────────────────────────────────── */

function RiskScoreBadge({ score, level }: { score: number; level: RiskRegisterLevel }) {
  const lc = LEVEL_CONFIG[level];
  return (
    <div className={cn("flex items-center gap-1 rounded-md px-2 py-0.5 border text-xs font-bold", lc.bg, lc.color, lc.border)}>
      {score}
      <span className="font-normal text-[10px] opacity-70">({lc.label})</span>
    </div>
  );
}

function RiskCard({ risk }: { risk: RiskRegisterEntry }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_CONFIG[risk.category];
  const st = STATUS_CONFIG[risk.status];
  const CatIcon = cat.icon;
  const StIcon = st.icon;

  const isOverdue = risk.review_date < todayStr() && risk.status !== "closed";

  return (
    <div className={cn(
      "rounded-lg border bg-white transition-all",
      risk.risk_level === "critical" && risk.status !== "closed" && "ring-2 ring-red-400 border-red-300",
      isOverdue && "border-amber-300",
    )}>
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn("mt-0.5 rounded-md p-1.5 border", cat.bg, cat.border)}>
          <CatIcon className={cn("h-4 w-4", cat.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-slate-900">{risk.title}</h3>
            {isOverdue && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">
                Review overdue
              </Badge>
            )}
            {risk.escalated_to && (
              <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] px-1.5 py-0">
                Escalated
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <CatIcon className="h-3 w-3" />
              {cat.label}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {risk.child_id ? getYPName(risk.child_id) : "Home-wide"}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Review: {formatDate(risk.review_date)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <RiskScoreBadge score={risk.risk_score} level={risk.risk_level} />
          <Badge className={cn("text-[10px] px-2 py-0.5 border", st.bg, st.color, st.border)}>
            <StIcon className="h-3 w-3 mr-1" />
            {st.label}
          </Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4">
          <div>
            <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">Risk Description</h4>
            <p className="text-xs text-slate-700 leading-relaxed">{risk.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-center">
              <div className="text-lg font-bold text-slate-700">{risk.likelihood}</div>
              <div className="text-[10px] text-slate-500">Likelihood (1-5)</div>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-center">
              <div className="text-lg font-bold text-slate-700">{risk.impact}</div>
              <div className="text-[10px] text-slate-500">Impact (1-5)</div>
            </div>
            <div className={cn("rounded-lg border p-2.5 text-center", LEVEL_CONFIG[risk.risk_level].bg, LEVEL_CONFIG[risk.risk_level].border)}>
              <div className={cn("text-lg font-bold", LEVEL_CONFIG[risk.risk_level].color)}>{risk.risk_score}</div>
              <div className="text-[10px] text-slate-500">Risk Score</div>
            </div>
          </div>

          {risk.mitigations.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                Mitigations ({risk.mitigations.length})
              </h4>
              <ul className="space-y-1.5">
                {risk.mitigations.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            <span>Owner: {getStaffName(risk.owner_id)}</span>
            {risk.last_reviewed && <span>Last reviewed: {formatDate(risk.last_reviewed)}</span>}
            {risk.escalated_to && <span>Escalated to: {getStaffName(risk.escalated_to)}</span>}
          </div>

          {risk.notes && (
            <p className="text-[11px] text-slate-500 italic">{risk.notes}</p>
          )}

          {risk.child_id && (
            <SmartLinkPanel sourceType="risk-register" sourceId={risk.id} childId={risk.child_id} compact />
          )}
        </div>
      )}
    </div>
  );
}

/* ── main page ───────────────────────────────────────────────────────── */

export default function RiskRegisterPage() {
  const { data: risks = [], isLoading } = useRiskRegisterEntries();
  const createRisk = useCreateRiskRegisterEntry();
  const [showNew, setShowNew] = useState(false);

  const [newForm, setNewForm] = useState({
    title: "",
    category: "" as RiskRegisterCategory | "",
    child_id: "none",
    likelihood: "3",
    impact: "3",
    description: "",
    mitigations: "",
    owner_id: "staff_darren",
    review_date: "",
  });
  const setNF = (k: keyof typeof newForm, v: string) => setNewForm((p) => ({ ...p, [k]: v }));

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.category || !newForm.title.trim() || !newForm.description.trim()) {
      toast.error("Title, category and description are required.");
      return;
    }
    const likelihood = parseInt(newForm.likelihood) || 3;
    const impact = parseInt(newForm.impact) || 3;
    const score = likelihood * impact;
    await createRisk.mutateAsync({
      title: newForm.title.trim(),
      category: newForm.category as RiskRegisterCategory,
      child_id: newForm.child_id === "none" ? null : newForm.child_id,
      likelihood,
      impact,
      risk_score: score,
      risk_level: computeLevel(score),
      status: "active",
      description: newForm.description.trim(),
      mitigations: newForm.mitigations.split("\n").map((m) => m.trim()).filter(Boolean),
      owner_id: newForm.owner_id,
      review_date: newForm.review_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      last_reviewed: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      escalated_to: null,
      notes: null,
    });
    toast.success("Risk added to register.");
    setNewForm({ title: "", category: "", child_id: "none", likelihood: "3", impact: "3", description: "", mitigations: "", owner_id: "staff_darren", review_date: "" });
    setShowNew(false);
  };

  const [tab, setTab] = useState<RiskRegisterStatus | "all" | "overdue">("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<RiskRegisterCategory | "all">("all");
  const [levelFilter, setLevelFilter] = useState<RiskRegisterLevel | "all">("all");
  const [sortBy, setSortBy] = useState("score");

  const today = todayStr();

  const filtered = useMemo(() => {
    let list = [...risks];

    if (tab === "overdue") {
      list = list.filter((r) => r.review_date < today && r.status !== "closed");
    } else if (tab !== "all") {
      list = list.filter((r) => r.status === tab);
    }

    if (categoryFilter !== "all") {
      list = list.filter((r) => r.category === categoryFilter);
    }

    if (levelFilter !== "all") {
      list = list.filter((r) => r.risk_level === levelFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.child_id && getYPName(r.child_id).toLowerCase().includes(q)) ||
          getStaffName(r.owner_id).toLowerCase().includes(q)
      );
    }

    const LEVEL_ORDER: Record<RiskRegisterLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    switch (sortBy) {
      case "score":
        list.sort((a, b) => b.risk_score - a.risk_score);
        break;
      case "review":
        list.sort((a, b) => a.review_date.localeCompare(b.review_date));
        break;
      case "level":
        list.sort((a, b) => LEVEL_ORDER[a.risk_level] - LEVEL_ORDER[b.risk_level]);
        break;
      case "category":
        list.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case "child":
        list.sort((a, b) => {
          const na = a.child_id ? getYPName(a.child_id) : "ZZZ";
          const nb = b.child_id ? getYPName(b.child_id) : "ZZZ";
          return na.localeCompare(nb);
        });
        break;
    }

    return list;
  }, [risks, tab, categoryFilter, levelFilter, search, sortBy, today]);

  const stats = useMemo(() => {
    const active = risks.filter((r) => r.status === "active").length;
    const critical = risks.filter((r) => r.risk_level === "critical" && r.status !== "closed").length;
    const high = risks.filter((r) => r.risk_level === "high" && r.status !== "closed").length;
    const overdue = risks.filter((r) => r.review_date < today && r.status !== "closed").length;
    const mitigated = risks.filter((r) => r.status === "mitigated").length;
    const closed = risks.filter((r) => r.status === "closed").length;
    return { total: risks.length, active, critical, high, overdue, mitigated, closed };
  }, [risks, today]);

  const hasFilters = search || categoryFilter !== "all" || levelFilter !== "all";

  const RISK_EXPORT_COLS: ExportColumn<RiskRegisterEntry>[] = [
    { header: "Title",         accessor: (r) => r.title },
    { header: "Category",      accessor: (r) => CATEGORY_CONFIG[r.category]?.label ?? r.category },
    { header: "Young Person",  accessor: (r) => r.child_id ? getYPName(r.child_id) : "Home-wide" },
    { header: "Likelihood",    accessor: (r) => r.likelihood },
    { header: "Impact",        accessor: (r) => r.impact },
    { header: "Risk Score",    accessor: (r) => r.risk_score },
    { header: "Risk Level",    accessor: (r) => LEVEL_CONFIG[r.risk_level]?.label ?? r.risk_level },
    { header: "Status",        accessor: (r) => STATUS_CONFIG[r.status]?.label ?? r.status },
    { header: "Owner",         accessor: (r) => getStaffName(r.owner_id) },
    { header: "Mitigations",   accessor: (r) => r.mitigations.join("; ") },
    { header: "Review Date",   accessor: (r) => r.review_date },
    { header: "Last Reviewed", accessor: (r) => r.last_reviewed ?? "" },
    { header: "Escalated To",  accessor: (r) => r.escalated_to ? getStaffName(r.escalated_to) : "" },
    { header: "Notes",         accessor: (r) => r.notes ?? "" },
    { header: "Created",       accessor: (r) => r.created_at.slice(0, 10) },
  ];

  const TABS: { key: typeof tab; label: string; count: number }[] = [
    { key: "all",       label: "All",        count: stats.total     },
    { key: "active",    label: "Active",     count: stats.active    },
    { key: "overdue",   label: "Overdue",    count: stats.overdue   },
    { key: "mitigated", label: "Mitigated",  count: stats.mitigated },
    { key: "closed",    label: "Closed",     count: stats.closed    },
  ];

  if (isLoading) {
    return (
      <PageShell title="Risk Register" subtitle="Live risk tracking — young people, staff, and environment">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Risk Register"
      subtitle="Live risk tracking — young people, staff, and environment"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={RISK_EXPORT_COLS} filename="risk-register" />
          <PrintButton title="Risk Register" />
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Risk
          </Button>
        </div>
      }
    >
      <AriaPanel mode="oversee" pageContext="Risk Register — live risk tracking for young people, staff, and environment, risk levels, review dates, control measures" recordType="risk_register" userRole="registered_manager" className="mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Risks",   value: stats.total,     color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200"   },
          { label: "Active",        value: stats.active,    color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200"     },
          { label: "Critical",      value: stats.critical,  color: "text-red-700",     bg: "bg-red-100",    border: "border-red-300"     },
          { label: "High",          value: stats.high,      color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200"  },
          { label: "Overdue Review",value: stats.overdue,   color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200"   },
          { label: "Closed",        value: stats.closed,    color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-lg border p-3 text-center", s.bg, s.border)}>
            <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {(stats.critical > 0 || stats.overdue > 0) && (
        <div className={cn(
          "rounded-lg border p-3 mb-6 flex items-start gap-3",
          stats.critical > 0 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
        )}>
          <AlertTriangle className={cn("h-5 w-5 mt-0.5 flex-shrink-0", stats.critical > 0 ? "text-red-600" : "text-amber-600")} />
          <div>
            <p className={cn("text-sm font-semibold", stats.critical > 0 ? "text-red-800" : "text-amber-800")}>
              {stats.critical > 0 && `${stats.critical} critical risk${stats.critical !== 1 ? "s" : ""}`}
              {stats.critical > 0 && stats.overdue > 0 && " · "}
              {stats.overdue > 0 && `${stats.overdue} overdue review${stats.overdue !== 1 ? "s" : ""}`}
            </p>
            <p className={cn("text-xs mt-0.5", stats.critical > 0 ? "text-red-700" : "text-amber-700")}>
              Ensure all risks are actively managed and reviews are completed on time.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 border-b mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              tab === t.key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {t.label}
            <span className="ml-1.5 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input placeholder="Search risks…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>

        <Filter className="h-3.5 w-3.5 text-slate-400" />

        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as RiskRegisterCategory | "all")}>
          <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(Object.keys(CATEGORY_CONFIG) as RiskRegisterCategory[]).map((c) => (
              <SelectItem key={c} value={c}>{CATEGORY_CONFIG[c].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as RiskRegisterLevel | "all")}>
          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Risk level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {(["critical", "high", "medium", "low"] as RiskRegisterLevel[]).map((l) => (
              <SelectItem key={l} value={l}>{LEVEL_CONFIG[l].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Risk score</SelectItem>
              <SelectItem value="level">Level</SelectItem>
              <SelectItem value="review">Review date</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="child">Young person</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500" onClick={() => { setSearch(""); setCategoryFilter("all"); setLevelFilter("all"); }}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No risks found</p>
          <p className="text-xs mt-1">{hasFilters ? "Try adjusting your filters" : "No risks in this category"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((risk) => (
            <RiskCard key={risk.id} risk={risk} />
          ))}
        </div>
      )}

      <div className="text-center text-[10px] text-slate-400 mt-6">
        Showing {filtered.length} of {stats.total} risk{stats.total !== 1 ? "s" : ""}
      </div>

      <div className="mt-8 rounded-lg bg-slate-50 border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-1">About the Risk Register</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The risk register is a live record of all identified risks affecting young people, staff, and the
              home environment. Each risk is scored using a likelihood × impact matrix, assigned an owner,
              and tracked through a mitigation and review cycle. This register supports Regulation 12
              (Protection of Children) and Regulation 13 (Quality of Care) of the Children&apos;s Homes
              Regulations 2015, and provides direct evidence of proactive risk management for Ofsted
              inspection under the Social Care Common Inspection Framework (SCCIF).
            </p>
          </div>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-red-600" />
              New Risk Entry
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRisk} className="space-y-3 py-2">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Risk Title *</label>
              <Input
                placeholder="Brief title for this risk"
                className="h-8 text-xs"
                value={newForm.title}
                onChange={(e) => setNF("title", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Category *</label>
                <Select value={newForm.category} onValueChange={(v) => setNF("category", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_CONFIG) as RiskRegisterCategory[]).map((c) => (
                      <SelectItem key={c} value={c}>{CATEGORY_CONFIG[c].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Young Person</label>
                <Select value={newForm.child_id} onValueChange={(v) => setNF("child_id", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Home-wide</SelectItem>
                    {YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => (
                      <SelectItem key={y.id} value={y.id}>{y.first_name} {y.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Likelihood (1–5)</label>
                <Select value={newForm.likelihood} onValueChange={(v) => setNF("likelihood", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{["1","2","3","4","5"].map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Impact (1–5)</label>
                <Select value={newForm.impact} onValueChange={(v) => setNF("impact", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{["1","2","3","4","5"].map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col justify-end">
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Risk Score</label>
                <div className={cn("h-8 rounded-md border px-2 flex items-center text-xs font-bold",
                  computeLevel(parseInt(newForm.likelihood) * parseInt(newForm.impact)) === "critical" ? "bg-red-50 text-red-700 border-red-300" :
                  computeLevel(parseInt(newForm.likelihood) * parseInt(newForm.impact)) === "high" ? "bg-orange-50 text-orange-700 border-orange-300" :
                  computeLevel(parseInt(newForm.likelihood) * parseInt(newForm.impact)) === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-blue-50 text-blue-700 border-blue-200"
                )}>
                  {parseInt(newForm.likelihood) * parseInt(newForm.impact)} — {LEVEL_CONFIG[computeLevel(parseInt(newForm.likelihood) * parseInt(newForm.impact))].label}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Owner</label>
              <Select value={newForm.owner_id} onValueChange={(v) => setNF("owner_id", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => (<SelectItem key={s.id} value={s.id} className="text-xs">{s.full_name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Review Date</label>
              <Input type="date" className="h-8 text-xs" value={newForm.review_date} onChange={(e) => setNF("review_date", e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Description *</label>
              <Textarea
                placeholder="Describe the risk, context, and potential impact…"
                className="text-xs min-h-[80px]"
                value={newForm.description}
                onChange={(e) => setNF("description", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Mitigations (one per line)</label>
              <Textarea
                placeholder="Enter each mitigation on a new line…"
                className="text-xs min-h-[60px]"
                value={newForm.mitigations}
                onChange={(e) => setNF("mitigations", e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="text-xs" disabled={createRisk.isPending}>
                {createRisk.isPending ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Adding…</> : "Add Risk"}
              </Button>
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
