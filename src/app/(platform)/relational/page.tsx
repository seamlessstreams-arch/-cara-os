"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — RELATIONAL PRACTICE
// Captures trust moments, rupture-repair events, preferred adults,
// regulation strategies, and attachment indicators for each young person.
// Builds the "what works" knowledge base that underpins trauma-informed care.
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
import { cn, formatDate } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import {
  useRelationalRecords, useCreateRelationalRecord,
} from "@/hooks/use-intelligence";
import type { RelationalRecord, RelationalRecordType } from "@/types/extended";
import {
  Heart, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Plus, Star, CheckCircle2, AlertTriangle, User, Calendar,
  Sparkles, Loader2, ThumbsUp, ThumbsDown, Shield, Brain,
  Eye, Zap, Ban, Hand, Mic, Users,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<RelationalRecordType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  trust_moment:         { label: "Trust Moment",         icon: Heart,         color: "text-emerald-600",  bg: "bg-emerald-50",  border: "border-emerald-200" },
  rupture_repair:       { label: "Rupture & Repair",     icon: Zap,           color: "text-amber-600",    bg: "bg-amber-50",    border: "border-amber-200"   },
  de_escalation:        { label: "De-escalation",        icon: Shield,        color: "text-blue-600",     bg: "bg-blue-50",     border: "border-blue-200"    },
  regulation_strategy:  { label: "Regulation Strategy",  icon: Brain,         color: "text-teal-600",     bg: "bg-teal-50",     border: "border-teal-200"    },
  preferred_adult:      { label: "Preferred Adult",      icon: Star,          color: "text-[var(--cs-cara-gold)]",   bg: "bg-[var(--cs-cara-gold-bg)]",   border: "border-[var(--cs-cara-gold-soft)]"  },
  what_helps:           { label: "What Helps",           icon: ThumbsUp,      color: "text-emerald-600",  bg: "bg-emerald-50",  border: "border-emerald-200" },
  what_to_avoid:        { label: "What to Avoid",        icon: Ban,           color: "text-red-600",      bg: "bg-red-50",      border: "border-red-200"     },
  attachment_indicator: { label: "Attachment Indicator",  icon: Hand,          color: "text-pink-600",     bg: "bg-pink-50",     border: "border-pink-200"    },
  sensory_need:         { label: "Sensory Need",         icon: Eye,           color: "text-indigo-600",   bg: "bg-indigo-50",   border: "border-indigo-200"  },
  voice_indicator:      { label: "Voice Indicator",      icon: Mic,           color: "text-orange-600",   bg: "bg-orange-50",   border: "border-orange-200"  },
};

const CONFIDENCE_CONFIG: Record<string, { label: string; cls: string }> = {
  low:    { label: "Low confidence",    cls: "bg-slate-50 text-[var(--cs-text-muted)] border-[var(--cs-border)]"     },
  medium: { label: "Developing",        cls: "bg-[--cs-warning-bg] text-[--cs-warning] border-[--cs-warning-soft]"    },
  high:   { label: "Well-evidenced",    cls: "bg-[--cs-success-bg] text-[--cs-success] border-[--cs-success-soft]" },
};

const RELATIONAL_EXPORT_COLS: ExportColumn<RelationalRecord>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Type", accessor: (r) => TYPE_CONFIG[r.record_type]?.label ?? r.record_type },
  { header: "Title", accessor: (r) => r.title },
  { header: "Description", accessor: (r) => r.description },
  { header: "Positive", accessor: (r) => r.is_positive ? "Yes" : "No" },
  { header: "Confidence", accessor: (r) => CONFIDENCE_CONFIG[r.confidence]?.label ?? r.confidence },
  { header: "Staff", accessor: (r) => r.staff_id ? getStaffName(r.staff_id) : "" },
  { header: "Recorded By", accessor: (r) => getStaffName(r.created_by) },
  { header: "Date", accessor: (r) => r.created_at.slice(0, 10) },
];

// ── Record Card ──────────────────────────────────────────────────────────────

function RecordCard({ record }: { record: RelationalRecord }) {
  const [expanded, setExpanded] = useState(false);
  const typeCfg = TYPE_CONFIG[record.record_type];
  const TypeIcon = typeCfg?.icon ?? Heart;
  const confCfg = CONFIDENCE_CONFIG[record.confidence];

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden transition-all",
      record.is_positive ? "border-[--cs-success-soft]" : "border-[--cs-risk-soft]",
    )}>
      <div className="flex items-start gap-3 p-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", typeCfg?.bg ?? "bg-slate-50")}>
          <TypeIcon className={cn("h-4 w-4", typeCfg?.color ?? "text-[var(--cs-text-muted)]")} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-[var(--cs-navy)]">{record.title}</span>
            {record.is_positive ? (
              <ThumbsUp className="h-3.5 w-3.5 text-[--cs-success]" />
            ) : (
              <ThumbsDown className="h-3.5 w-3.5 text-[--cs-risk]" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", typeCfg?.border, typeCfg?.bg, typeCfg?.color)}>
              {typeCfg?.label ?? record.record_type}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", confCfg?.cls)}>
              {confCfg?.label ?? record.confidence}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--cs-text-muted)] flex-wrap">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />{getYPName(record.child_id)}
            </span>
            {record.staff_id && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />Staff: {getStaffName(record.staff_id)}
                </span>
              </>
            )}
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />{formatDate(record.created_at)}
            </span>
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)} className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[var(--cs-border-subtle)] px-4 pb-4 pt-3 space-y-3">
          <div className={cn(
            "rounded-xl border p-3",
            record.is_positive ? "border-[--cs-success-soft] bg-[--cs-success-bg]" : "border-[--cs-risk-soft] bg-[--cs-risk-bg]",
          )}>
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{record.description}</p>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-[var(--cs-text-muted)] flex-wrap">
            <span>Recorded by {getStaffName(record.created_by)}</span>
            {record.source_ref_type && (
              <span>Source: {record.source_ref_type.replace(/_/g, " ")}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── New Record Dialog ────────────────────────────────────────────────────────

function NewRecordDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<RelationalRecord>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    child_id: "yp_alex",
    record_type: "trust_moment" as RelationalRecordType,
    title: "",
    description: "",
    staff_id: "",
    is_positive: true,
    confidence: "medium" as RelationalRecord["confidence"],
  });

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      await onSave({
        home_id: "home_oak",
        child_id: form.child_id,
        record_type: form.record_type,
        title: form.title,
        description: form.description,
        staff_id: form.staff_id || null,
        is_positive: form.is_positive,
        confidence: form.confidence,
        source_ref_type: null,
        source_ref_id: null,
        created_by: "staff_darren",
      });
      onClose();
      setForm((p) => ({ ...p, title: "", description: "", staff_id: "" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-emerald-600" />
            Record Relational Observation
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Young person</label>
              <Select value={form.child_id} onValueChange={(v) => setForm((p) => ({ ...p, child_id: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["yp_alex", "yp_jordan", "yp_casey"].map((id) => (
                    <SelectItem key={id} value={id} className="text-xs">{getYPName(id)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Type</label>
              <Select value={form.record_type} onValueChange={(v) => setForm((p) => ({ ...p, record_type: v as RelationalRecordType }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_CONFIG) as [RelationalRecordType, typeof TYPE_CONFIG[RelationalRecordType]][]).map(([k, cfg]) => (
                    <SelectItem key={k} value={k} className="text-xs">{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Title <span className="text-red-500">*</span></label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Casey initiated conversation about school" className="h-8 text-xs" />
          </div>

          <div>
            <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Description <span className="text-red-500">*</span></label>
            <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Describe what you observed and why it matters…" rows={4} className="text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Related staff member</label>
              <Select value={form.staff_id} onValueChange={(v) => setForm((p) => ({ ...p, staff_id: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {["staff_darren", "staff_ryan", "staff_anna", "staff_chervelle", "staff_diane", "staff_edward", "staff_lackson", "staff_mirela"].map((id) => (
                    <SelectItem key={id} value={id} className="text-xs">{getStaffName(id)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Confidence</label>
              <Select value={form.confidence} onValueChange={(v) => setForm((p) => ({ ...p, confidence: v as RelationalRecord["confidence"] }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CONFIDENCE_CONFIG).map(([k, cfg]) => (
                    <SelectItem key={k} value={k} className="text-xs">{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_positive} onChange={(e) => setForm((p) => ({ ...p, is_positive: e.target.checked }))} className="rounded" />
            <span className="text-xs text-[var(--cs-text-secondary)]">This is a positive / protective observation</span>
          </label>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !form.title.trim() || !form.description.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? "Saving…" : "Record Observation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

const CHILD_IDS = ["yp_alex", "yp_jordan", "yp_casey"];

export default function RelationalPracticePage() {
  const q1 = useRelationalRecords(CHILD_IDS[0]);
  const q2 = useRelationalRecords(CHILD_IDS[1]);
  const q3 = useRelationalRecords(CHILD_IDS[2]);
  const createRecord = useCreateRelationalRecord();

  const isLoading = q1.isPending || q2.isPending || q3.isPending;

  const allRecords: RelationalRecord[] = useMemo(() => {
    return [
      ...(q1.data?.data ?? []),
      ...(q2.data?.data ?? []),
      ...(q3.data?.data ?? []),
    ].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [q1.data, q2.data, q3.data]);

  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "child" | "type">("date");
  const [childFilter, setChildFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [polarityFilter, setPolarityFilter] = useState<"all" | "positive" | "caution">("all");

  // Stats
  const positiveCount = useMemo(() => allRecords.filter((r) => r.is_positive).length, [allRecords]);
  const cautionCount = useMemo(() => allRecords.filter((r) => !r.is_positive).length, [allRecords]);
  const highConfidenceCount = useMemo(() => allRecords.filter((r) => r.confidence === "high").length, [allRecords]);

  const childCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of allRecords) counts[r.child_id] = (counts[r.child_id] || 0) + 1;
    return counts;
  }, [allRecords]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of allRecords) counts[r.record_type] = (counts[r.record_type] || 0) + 1;
    return counts;
  }, [allRecords]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = allRecords;

    if (childFilter !== "all") list = list.filter((r) => r.child_id === childFilter);
    if (typeFilter !== "all") list = list.filter((r) => r.record_type === typeFilter);
    if (polarityFilter === "positive") list = list.filter((r) => r.is_positive);
    if (polarityFilter === "caution") list = list.filter((r) => !r.is_positive);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        getYPName(r.child_id).toLowerCase().includes(q) ||
        (TYPE_CONFIG[r.record_type]?.label.toLowerCase().includes(q) ?? false)
      );
    }

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "child": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "type": return (TYPE_CONFIG[a.record_type]?.label ?? "").localeCompare(TYPE_CONFIG[b.record_type]?.label ?? "");
        default: return b.created_at.localeCompare(a.created_at);
      }
    });

    return list;
  }, [allRecords, childFilter, typeFilter, polarityFilter, search, sortBy]);

  const handleCreate = async (data: Partial<RelationalRecord>) => {
    await createRecord.mutateAsync(data);
  };

  return (
    <PageShell
      title="Relational Practice"
      subtitle="Trust moments, regulation strategies, preferred adults, and what works for each young person"
      caraContext={{ pageTitle: "Relational Practice", sourceType: "care_plan" }}
      quickCreateContext={{ module: "young-people", defaultTaskCategory: "young_person_plans" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={RELATIONAL_EXPORT_COLS} filename="relational-practice" />
          <PrintButton title="Relational Practice" subtitle="Chamberlain House — Relational Records" targetId="relational-content" />
          <SmartUploadButton variant="inline" label="Upload" uploadContext="Relational Practice — observation or evidence upload" />
          <Button size="sm" onClick={() => setShowNew(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />Record Observation
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="relational-content" className="space-y-5 animate-fade-in">

        {/* ── Summary stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total Records", value: allRecords.length, icon: Heart, colour: "text-[var(--cs-text-secondary)]", bg: "bg-slate-50 border-[var(--cs-border-subtle)]" },
            { label: "Positive", value: positiveCount, icon: ThumbsUp, colour: "text-[--cs-success]", bg: "bg-[--cs-success-bg] border-[--cs-success-soft]" },
            { label: "Caution", value: cautionCount, icon: AlertTriangle, colour: cautionCount > 0 ? "text-[--cs-risk]" : "text-[var(--cs-text-muted)]", bg: cautionCount > 0 ? "bg-[--cs-risk-bg] border-[--cs-risk-soft]" : "bg-slate-50 border-[var(--cs-border-subtle)]" },
            { label: "Well-Evidenced", value: highConfidenceCount, icon: CheckCircle2, colour: "text-[--cs-info]", bg: "bg-[--cs-info-bg] border-[--cs-info-soft]" },
            { label: "Record Types", value: Object.keys(typeCounts).length, icon: Sparkles, colour: "text-[var(--cs-cara-gold)]", bg: "bg-[var(--cs-cara-gold-bg)] border-[var(--cs-cara-gold-soft)]" },
          ].map(({ label, value, icon: Icon, colour, bg }) => (
            <div key={label} className={cn("rounded-2xl border p-4 text-center", bg)}>
              <Icon className={cn("h-4 w-4 mx-auto mb-1", colour)} />
              <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Per-child breakdown ───────────────────────────────────────────── */}
        <div className="flex gap-3">
          {CHILD_IDS.map((id) => {
            const count = childCounts[id] ?? 0;
            const pos = allRecords.filter((r) => r.child_id === id && r.is_positive).length;
            return (
              <button
                key={id}
                onClick={() => setChildFilter(childFilter === id ? "all" : id)}
                className={cn(
                  "flex-1 rounded-xl border p-3 text-center transition-all",
                  childFilter === id
                    ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200"
                    : "bg-white border-[var(--cs-border)] hover:border-emerald-200",
                )}
              >
                <p className="text-sm font-semibold text-[var(--cs-navy)]">{getYPName(id)}</p>
                <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">
                  {count} record{count !== 1 ? "s" : ""} · {pos} positive
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Type chips ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(TYPE_CONFIG) as [RelationalRecordType, typeof TYPE_CONFIG[RelationalRecordType]][])
            .filter(([key]) => (typeCounts[key] ?? 0) > 0)
            .map(([key, cfg]) => {
              const TIcon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setTypeFilter(typeFilter === key ? "all" : key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    typeFilter === key
                      ? cn(cfg.bg, cfg.border, cfg.color, "ring-1 ring-offset-1", cfg.border.replace("border-", "ring-"))
                      : cn(cfg.bg, cfg.border, cfg.color, "opacity-80 hover:opacity-100"),
                  )}
                >
                  <TIcon className="h-3 w-3" />
                  {cfg.label}
                  <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[9px] font-bold">
                    {typeCounts[key] ?? 0}
                  </span>
                </button>
              );
            })}
        </div>

        {/* ── Search + filters ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records, strategies…" className="pl-9 h-8 text-xs" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
              <select
                value={polarityFilter}
                onChange={(e) => setPolarityFilter(e.target.value as typeof polarityFilter)}
                className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-[11px] text-[var(--cs-text-secondary)] focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 outline-none"
              >
                <option value="all">All records</option>
                <option value="positive">Positive only</option>
                <option value="caution">Cautions only</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-[11px] text-[var(--cs-text-secondary)] focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 outline-none"
              >
                <option value="date">Date (newest)</option>
                <option value="child">Young person</option>
                <option value="type">Record type</option>
              </select>
            </div>
          </div>
        </div>

        {(search || childFilter !== "all" || typeFilter !== "all" || polarityFilter !== "all") && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-[var(--cs-text-muted)]">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
            <button
              onClick={() => { setSearch(""); setChildFilter("all"); setTypeFilter("all"); setPolarityFilter("all"); }}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
            <span className="ml-2 text-sm text-[var(--cs-text-muted)]">Loading relational records…</span>
          </div>
        )}

        {/* ── Records list ─────────────────────────────────────────────────── */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-[var(--cs-text-muted)]">
            <Heart className="h-10 w-10 text-[var(--cs-text-gentle)] mx-auto mb-3" />
            <p className="text-sm font-medium">
              {search ? `No records match "${search}"` : "No relational records yet"}
            </p>
            <p className="text-xs text-[var(--cs-text-muted)] mt-1">
              Capture what works, what to avoid, and trust moments for each young person.
            </p>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))}
          </div>
        )}

        {/* ── Regulatory note ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-4 py-3 text-xs text-[var(--cs-text-muted)]">
          <span className="font-semibold text-[var(--cs-text-secondary)]">Regulatory Basis — </span>
          Children&apos;s Homes Quality Standards 2015, Standard 11 (Positive Relationships): staff must
          build relationships founded on trust, consistency, and predictability. Standard 2 (Quality of Care):
          care must be tailored to the individual needs of each child. Ofsted ILACS inspections assess
          whether staff demonstrate a clear understanding of each child&apos;s relational needs, preferred
          adults, regulation strategies, and what works. The practice bank approach ensures that hard-won
          knowledge about each child is documented, shared across the team, and survives staff changes.
        </div>
      </div>

      <NewRecordDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onSave={handleCreate}
      />
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Relational Practice — staff-child relationships, key working, observations, therapeutic relationships, attachment-informed practice, relational records, Reg 45 outcomes evidence"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
