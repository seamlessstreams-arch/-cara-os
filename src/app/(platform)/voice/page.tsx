"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — VOICE OF THE CHILD
// Centralised record of young people's wishes, feelings, and views.
// Tracks whether their voice was heard, acted upon, and the outcome.
// This is the single most important evidence base for Ofsted ILACS.
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
import { cn, formatDate, todayStr } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import {
  useVoiceRecords, useCreateVoiceRecord,
} from "@/hooks/use-intelligence";
import type { VoiceRecord, VoiceTheme } from "@/types/extended";
import {
  MessageSquare, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Plus, Heart, Star, CheckCircle2, Clock, AlertTriangle,
  User, Calendar, Quote, Sparkles, Loader2, Eye, Mic,
  BookOpen, Shield, Target, Lightbulb, Puzzle, Brain,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── Constants ──────────────────────────────────────────────────────────────────

const THEME_CONFIG: Record<VoiceTheme, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  wishes:        { label: "Wishes",        icon: Star,         color: "text-amber-600",    bg: "bg-amber-50",    border: "border-amber-200"   },
  feelings:      { label: "Feelings",      icon: Heart,        color: "text-pink-600",     bg: "bg-pink-50",     border: "border-pink-200"    },
  concerns:      { label: "Concerns",      icon: AlertTriangle,color: "text-red-600",      bg: "bg-red-50",      border: "border-red-200"     },
  complaints:    { label: "Complaints",    icon: MessageSquare,color: "text-rose-600",     bg: "bg-rose-50",     border: "border-rose-200"    },
  compliments:   { label: "Compliments",   icon: Sparkles,     color: "text-emerald-600",  bg: "bg-emerald-50",  border: "border-emerald-200" },
  needs:         { label: "Needs",         icon: Target,       color: "text-indigo-600",   bg: "bg-indigo-50",   border: "border-indigo-200"  },
  relationships: { label: "Relationships", icon: Heart,        color: "text-violet-600",   bg: "bg-violet-50",   border: "border-violet-200"  },
  plans:         { label: "Plans",         icon: BookOpen,     color: "text-blue-600",     bg: "bg-blue-50",     border: "border-blue-200"    },
  activities:    { label: "Activities",    icon: Puzzle,       color: "text-teal-600",     bg: "bg-teal-50",     border: "border-teal-200"    },
  education:     { label: "Education",     icon: BookOpen,     color: "text-sky-600",      bg: "bg-sky-50",      border: "border-sky-200"     },
  health:        { label: "Health",        icon: Shield,       color: "text-emerald-600",  bg: "bg-emerald-50",  border: "border-emerald-200" },
  identity:      { label: "Identity",      icon: Brain,        color: "text-purple-600",   bg: "bg-purple-50",   border: "border-purple-200"  },
  culture:       { label: "Culture",       icon: Lightbulb,    color: "text-orange-600",   bg: "bg-orange-50",   border: "border-orange-200"  },
  future:        { label: "Future",        icon: Star,         color: "text-cyan-600",     bg: "bg-cyan-50",     border: "border-cyan-200"    },
};

const CAPTURE_METHOD_LABELS: Record<string, string> = {
  direct:      "Direct quote",
  observed:    "Observed behaviour",
  interpreted: "Interpreted",
  written:     "Written by YP",
  advocate:    "Via advocate",
};

const VOICE_EXPORT_COLS: ExportColumn<VoiceRecord>[] = [
  { header: "Date", accessor: (r) => r.recorded_at.slice(0, 10) },
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Theme", accessor: (r) => THEME_CONFIG[r.theme]?.label ?? r.theme },
  { header: "Direct Quote", accessor: (r) => r.direct_quote ?? "" },
  { header: "Paraphrase", accessor: (r) => r.paraphrase ?? "" },
  { header: "Capture Method", accessor: (r) => CAPTURE_METHOD_LABELS[r.capture_method] ?? r.capture_method },
  { header: "Action Taken", accessor: (r) => r.action_taken ?? "" },
  { header: "Action Owner", accessor: (r) => r.action_owner ? getStaffName(r.action_owner) : "" },
  { header: "Action Outcome", accessor: (r) => r.action_outcome ?? "" },
  { header: "Voice Heeded", accessor: (r) => r.voice_heeded === true ? "Yes" : r.voice_heeded === false ? "No" : "Pending" },
  { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
];

// ── Voice Card ───────────────────────────────────────────────────────────────

function VoiceCard({ record }: { record: VoiceRecord }) {
  const [expanded, setExpanded] = useState(true);
  const themeCfg = THEME_CONFIG[record.theme];
  const ThemeIcon = themeCfg?.icon ?? MessageSquare;
  const heeded = record.voice_heeded;

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden transition-all",
      heeded === true ? "border-emerald-200" :
      heeded === false ? "border-red-200" :
      "border-slate-200",
    )}>
      <div className="flex items-start gap-3 p-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", themeCfg?.bg ?? "bg-slate-50")}>
          <ThemeIcon className={cn("h-4 w-4", themeCfg?.color ?? "text-slate-500")} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Direct quote — prominent */}
          {record.direct_quote && (
            <div className="mb-2">
              <p className="text-sm text-slate-800 italic leading-relaxed">
                &ldquo;{record.direct_quote}&rdquo;
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", themeCfg?.border, themeCfg?.bg, themeCfg?.color)}>
              {themeCfg?.label ?? record.theme}
            </Badge>
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-slate-50 text-slate-500 border-slate-200">
              {CAPTURE_METHOD_LABELS[record.capture_method] ?? record.capture_method}
            </span>
            {heeded === true && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5 inline" />Voice Heeded
              </Badge>
            )}
            {heeded === false && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5 inline" />Not Actioned
              </Badge>
            )}
            {heeded === null && record.action_taken && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                <Clock className="h-2.5 w-2.5 mr-0.5 inline" />In Progress
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />{getYPName(record.child_id)}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />{formatDate(record.recorded_at)}
            </span>
            <span>·</span>
            <span>Recorded by {getStaffName(record.recorded_by)}</span>
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-600 shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
          {/* Paraphrase / professional interpretation */}
          {record.paraphrase && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Professional Interpretation</p>
              <p className="text-xs text-slate-700 leading-relaxed">{record.paraphrase}</p>
            </div>
          )}

          {/* Action taken */}
          {record.action_taken && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="h-3 w-3 text-indigo-600" />
                <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-widest">What We Did</p>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{record.action_taken}</p>
              {record.action_owner && (
                <p className="text-[10px] text-slate-400 mt-1">Owner: {getStaffName(record.action_owner)}</p>
              )}
            </div>
          )}

          {/* Outcome */}
          {record.action_outcome && (
            <div className={cn(
              "rounded-xl border p-3",
              heeded ? "border-emerald-100 bg-emerald-50/40" : "border-slate-200 bg-white",
            )}>
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className={cn("h-3 w-3", heeded ? "text-emerald-600" : "text-slate-500")} />
                <p className={cn("text-[10px] font-semibold uppercase tracking-widest", heeded ? "text-emerald-700" : "text-slate-500")}>Outcome</p>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{record.action_outcome}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── New Voice Record Dialog ──────────────────────────────────────────────────

function NewVoiceDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<VoiceRecord>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    child_id: "yp_alex",
    theme: "wishes" as VoiceTheme,
    capture_method: "direct" as VoiceRecord["capture_method"],
    direct_quote: "",
    paraphrase: "",
    action_taken: "",
    action_owner: "",
  });

  const handleSave = async () => {
    if (!form.direct_quote.trim() && !form.paraphrase.trim()) return;
    setSaving(true);
    try {
      await onSave({
        home_id: "home_oak",
        child_id: form.child_id,
        recorded_at: new Date().toISOString(),
        theme: form.theme,
        direct_quote: form.direct_quote || null,
        paraphrase: form.paraphrase || null,
        capture_method: form.capture_method,
        action_taken: form.action_taken || null,
        action_owner: form.action_owner || null,
        action_outcome: null,
        voice_heeded: null,
        source_ref_type: null,
        source_ref_id: null,
        recorded_by: "staff_darren",
      });
      onClose();
      setForm((p) => ({ ...p, direct_quote: "", paraphrase: "", action_taken: "", action_owner: "" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Mic className="h-4 w-4 text-teal-600" />
            Capture Voice of the Child
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Young person</label>
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
              <label className="text-xs text-slate-500 font-medium mb-1 block">Theme</label>
              <Select value={form.theme} onValueChange={(v) => setForm((p) => ({ ...p, theme: v as VoiceTheme }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(THEME_CONFIG) as [VoiceTheme, typeof THEME_CONFIG[VoiceTheme]][]).map(([k, cfg]) => (
                    <SelectItem key={k} value={k} className="text-xs">{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Capture method</label>
            <Select value={form.capture_method} onValueChange={(v) => setForm((p) => ({ ...p, capture_method: v as VoiceRecord["capture_method"] }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CAPTURE_METHOD_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">
              Direct quote <span className="text-slate-400 font-normal">(in the young person&apos;s own words)</span>
            </label>
            <Textarea
              value={form.direct_quote}
              onChange={(e) => setForm((p) => ({ ...p, direct_quote: e.target.value }))}
              placeholder="What did the young person say, exactly as they said it…"
              rows={3}
              className="text-xs italic"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Professional interpretation</label>
            <Textarea
              value={form.paraphrase}
              onChange={(e) => setForm((p) => ({ ...p, paraphrase: e.target.value }))}
              placeholder="What do you understand this to mean in the context of their care…"
              rows={3}
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Action taken</label>
            <Textarea
              value={form.action_taken}
              onChange={(e) => setForm((p) => ({ ...p, action_taken: e.target.value }))}
              placeholder="What was done in response to this…"
              rows={2}
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Action owner</label>
            <Select value={form.action_owner} onValueChange={(v) => setForm((p) => ({ ...p, action_owner: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select staff member" /></SelectTrigger>
              <SelectContent>
                {["staff_darren", "staff_ryan", "staff_anna", "staff_chervelle", "staff_diane", "staff_edward", "staff_lackson", "staff_mirela"].map((id) => (
                  <SelectItem key={id} value={id} className="text-xs">{getStaffName(id)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-[10px] text-slate-400">
            Ofsted explicitly assess whether children&apos;s voices are captured, heard, and acted upon.
            Record direct quotes wherever possible — this is the strongest form of evidence.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || (!form.direct_quote.trim() && !form.paraphrase.trim())}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {saving ? "Saving…" : "Record Voice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

const CHILD_IDS = ["yp_alex", "yp_jordan", "yp_casey"];

export default function VoiceOfTheChildPage() {
  // Fetch voice records for each child
  const q1 = useVoiceRecords(CHILD_IDS[0]);
  const q2 = useVoiceRecords(CHILD_IDS[1]);
  const q3 = useVoiceRecords(CHILD_IDS[2]);
  const createVoice = useCreateVoiceRecord();

  const isLoading = q1.isPending || q2.isPending || q3.isPending;

  const allRecords: VoiceRecord[] = useMemo(() => {
    const combined = [
      ...(q1.data?.data ?? []),
      ...(q2.data?.data ?? []),
      ...(q3.data?.data ?? []),
    ];
    return combined.sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  }, [q1.data, q2.data, q3.data]);

  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "child" | "theme">("date");
  const [childFilter, setChildFilter] = useState<string>("all");
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [heededFilter, setHeededFilter] = useState<"all" | "heeded" | "pending" | "not_heeded">("all");

  // Stats
  const heededCount = useMemo(() => allRecords.filter((r) => r.voice_heeded === true).length, [allRecords]);
  const pendingCount = useMemo(() => allRecords.filter((r) => r.voice_heeded === null && r.action_taken).length, [allRecords]);
  const directQuoteCount = useMemo(() => allRecords.filter((r) => r.direct_quote).length, [allRecords]);

  // Per-child counts
  const childCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of allRecords) counts[r.child_id] = (counts[r.child_id] || 0) + 1;
    return counts;
  }, [allRecords]);

  // Theme counts
  const themeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of allRecords) counts[r.theme] = (counts[r.theme] || 0) + 1;
    return counts;
  }, [allRecords]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = allRecords;

    if (childFilter !== "all") list = list.filter((r) => r.child_id === childFilter);
    if (themeFilter !== "all") list = list.filter((r) => r.theme === themeFilter);

    switch (heededFilter) {
      case "heeded": list = list.filter((r) => r.voice_heeded === true); break;
      case "pending": list = list.filter((r) => r.voice_heeded === null); break;
      case "not_heeded": list = list.filter((r) => r.voice_heeded === false); break;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        (r.direct_quote?.toLowerCase().includes(q) ?? false) ||
        (r.paraphrase?.toLowerCase().includes(q) ?? false) ||
        (r.action_taken?.toLowerCase().includes(q) ?? false) ||
        getYPName(r.child_id).toLowerCase().includes(q) ||
        (THEME_CONFIG[r.theme]?.label.toLowerCase().includes(q) ?? false)
      );
    }

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "child": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "theme": return (THEME_CONFIG[a.theme]?.label ?? "").localeCompare(THEME_CONFIG[b.theme]?.label ?? "");
        default: return b.recorded_at.localeCompare(a.recorded_at);
      }
    });

    return list;
  }, [allRecords, childFilter, themeFilter, heededFilter, search, sortBy]);

  const handleCreate = async (data: Partial<VoiceRecord>) => {
    await createVoice.mutateAsync(data);
  };

  return (
    <PageShell
      title="Voice of the Child"
      subtitle="What our young people are saying — their wishes, feelings, concerns, and views"
      ariaContext={{ pageTitle: "Voice of the Child", sourceType: "child_record" }}
      quickCreateContext={{ module: "young-people", defaultTaskCategory: "young_person_plans" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={VOICE_EXPORT_COLS} filename="voice-of-the-child" />
          <PrintButton title="Voice of the Child" subtitle="Oak House — Voice Records" targetId="voice-content" />
          <SmartUploadButton variant="inline" label="Upload" uploadContext="Voice of the Child — young person's written view or drawing" />
          <Button size="sm" onClick={() => setShowNew(true)} className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />Capture Voice
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="voice-content" className="space-y-5 animate-fade-in">

        {/* ── Summary stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total Captured", value: allRecords.length, icon: MessageSquare, colour: "text-teal-600", bg: "bg-teal-50 border-teal-100" },
            { label: "Direct Quotes", value: directQuoteCount, icon: Quote, colour: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
            { label: "Voice Heeded", value: heededCount, icon: CheckCircle2, colour: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
            { label: "Action Pending", value: pendingCount, icon: Clock, colour: pendingCount > 0 ? "text-amber-600" : "text-emerald-600", bg: pendingCount > 0 ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100" },
            { label: "Heeded Rate", value: allRecords.length > 0 ? `${Math.round((heededCount / allRecords.length) * 100)}%` : "—", icon: Target, colour: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
          ].map(({ label, value, icon: Icon, colour, bg }) => (
            <div key={label} className={cn("rounded-2xl border p-4 text-center", bg)}>
              <Icon className={cn("h-4 w-4 mx-auto mb-1", colour)} />
              <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Per-child voice breakdown ─────────────────────────────────────── */}
        <div className="flex gap-3">
          {CHILD_IDS.map((id) => {
            const count = childCounts[id] ?? 0;
            const heeded = allRecords.filter((r) => r.child_id === id && r.voice_heeded === true).length;
            return (
              <button
                key={id}
                onClick={() => setChildFilter(childFilter === id ? "all" : id)}
                className={cn(
                  "flex-1 rounded-xl border p-3 text-center transition-all",
                  childFilter === id
                    ? "bg-teal-50 border-teal-300 ring-1 ring-teal-200"
                    : "bg-white border-slate-200 hover:border-teal-200",
                )}
              >
                <p className="text-sm font-semibold text-slate-800">{getYPName(id)}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {count} record{count !== 1 ? "s" : ""} · {heeded} heeded
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Theme chips ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(THEME_CONFIG) as [VoiceTheme, typeof THEME_CONFIG[VoiceTheme]][])
            .filter(([key]) => (themeCounts[key] ?? 0) > 0)
            .map(([key, cfg]) => {
              const TIcon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setThemeFilter(themeFilter === key ? "all" : key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    themeFilter === key
                      ? cn(cfg.bg, cfg.border, cfg.color, "ring-1 ring-offset-1", cfg.border.replace("border-", "ring-"))
                      : cn(cfg.bg, cfg.border, cfg.color, "opacity-80 hover:opacity-100"),
                  )}
                >
                  <TIcon className="h-3 w-3" />
                  {cfg.label}
                  <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[9px] font-bold">
                    {themeCounts[key] ?? 0}
                  </span>
                </button>
              );
            })}
        </div>

        {/* ── Search + filters ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quotes, themes, actions…" className="pl-9 h-8 text-xs" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={heededFilter}
                onChange={(e) => setHeededFilter(e.target.value as typeof heededFilter)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-teal-300 focus:ring-1 focus:ring-teal-200 outline-none"
              >
                <option value="all">All records</option>
                <option value="heeded">Voice heeded</option>
                <option value="pending">Action pending</option>
                <option value="not_heeded">Not actioned</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-teal-300 focus:ring-1 focus:ring-teal-200 outline-none"
              >
                <option value="date">Date (newest)</option>
                <option value="child">Young person</option>
                <option value="theme">Theme</option>
              </select>
            </div>
          </div>
        </div>

        {(search || childFilter !== "all" || themeFilter !== "all" || heededFilter !== "all") && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-400">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {search && <span> matching &ldquo;{search}&rdquo;</span>}
            </p>
            <button
              onClick={() => { setSearch(""); setChildFilter("all"); setThemeFilter("all"); setHeededFilter("all"); }}
              className="text-xs text-teal-600 hover:text-teal-800 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-sm text-slate-400">Loading voice records…</span>
          </div>
        )}

        {/* ── Voice records list ───────────────────────────────────────────── */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Mic className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium">
              {search ? `No voice records match "${search}"` : "No voice records captured yet"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Capture what your young people are saying — in their own words where possible.
            </p>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((record) => (
              <VoiceCard key={record.id} record={record} />
            ))}
          </div>
        )}

        {/* ── Regulatory note ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Regulatory Basis — </span>
          Children&apos;s Homes Quality Standards 2015, Standard 1 (Overall Experiences and Progress):
          children must be listened to and their views taken seriously. Standard 3 (Rights and Responsibilities):
          children must know how to express their wishes and feelings. UNCRC Article 12: the right of the child
          to be heard. Ofsted ILACS specifically assess whether the voice of the child is captured consistently,
          evidenced across all areas of care, and demonstrably influences planning and decision-making. Direct
          quotes are the strongest form of evidence that a child&apos;s actual words have been recorded.
        </div>
      </div>

      <NewVoiceDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onSave={handleCreate}
      />
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Voice of the Child — young person's views, wishes, feelings, likes, dislikes, key words, quotes, drawings, participation, LAC review preparation, IRO, Reg 45 evidence"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
