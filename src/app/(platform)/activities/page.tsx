"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ACTIVITIES & ENRICHMENT TRACKER
// Captures the meaningful activities, hobbies, and enrichment opportunities
// provided to young people. Evidences QS Standard 2 (Quality of Care)
// and supports Ofsted's assessment of whether children enjoy fulfilling lives.
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
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useActivities, useCreateActivity } from "@/hooks/use-activities";
import { toast } from "sonner";
import type { Activity, ActivityCategory, ActivityEngagement } from "@/types/extended";
import {
  Palette, Search, Filter, ArrowUpDown, Star, ChevronDown, ChevronUp,
  Plus, Heart, Dumbbell, Music, BookOpen, MapPin, Users, Gamepad2,
  Mountain, Bike, Camera, UtensilsCrossed, Trophy, Target, Calendar,
  User, CheckCircle2, Clock, Loader2, Sparkles,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ActivityCategory, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  sport:        { label: "Sport & Fitness",   icon: Dumbbell,          color: "text-emerald-600",  bg: "bg-emerald-50",  border: "border-emerald-200" },
  creative:     { label: "Creative & Art",    icon: Palette,           color: "text-violet-600",   bg: "bg-violet-50",   border: "border-violet-200"  },
  outdoor:      { label: "Outdoor Adventure", icon: Mountain,          color: "text-teal-600",     bg: "bg-teal-50",     border: "border-teal-200"    },
  educational:  { label: "Education",         icon: BookOpen,          color: "text-blue-600",     bg: "bg-blue-50",     border: "border-blue-200"    },
  social:       { label: "Social",            icon: Users,             color: "text-amber-600",    bg: "bg-amber-50",    border: "border-amber-200"   },
  life_skills:  { label: "Life Skills",       icon: UtensilsCrossed,   color: "text-orange-600",   bg: "bg-orange-50",   border: "border-orange-200"  },
  cultural:     { label: "Cultural",          icon: Music,             color: "text-pink-600",     bg: "bg-pink-50",     border: "border-pink-200"    },
  therapeutic:  { label: "Therapeutic",        icon: Heart,             color: "text-red-600",      bg: "bg-red-50",      border: "border-red-200"     },
  community:    { label: "Community",         icon: MapPin,            color: "text-indigo-600",   bg: "bg-indigo-50",   border: "border-indigo-200"  },
  digital:      { label: "Digital & Gaming",  icon: Gamepad2,          color: "text-slate-600",    bg: "bg-slate-50",    border: "border-slate-200"   },
};

const ENGAGEMENT_CONFIG: Record<ActivityEngagement, { label: string; cls: string }> = {
  enthusiastic:    { label: "Enthusiastic",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  willing:         { label: "Willing",          cls: "bg-blue-50 text-blue-700 border-blue-200"          },
  reluctant:       { label: "Reluctant",        cls: "bg-amber-50 text-amber-700 border-amber-200"      },
  refused:         { label: "Declined",         cls: "bg-slate-50 text-slate-500 border-slate-200"       },
  suggested_by_yp: { label: "YP Suggested",     cls: "bg-violet-50 text-violet-700 border-violet-200"   },
};

const ACTIVITY_EXPORT_COLS: ExportColumn<Activity>[] = [
  { header: "Date", accessor: (a) => a.date },
  { header: "Young Person", accessor: (a) => getYPName(a.child_id) },
  { header: "Activity", accessor: (a) => a.title },
  { header: "Category", accessor: (a) => CATEGORY_CONFIG[a.category].label },
  { header: "Location", accessor: (a) => a.location },
  { header: "Duration (mins)", accessor: (a) => a.duration_minutes },
  { header: "Staff", accessor: (a) => getStaffName(a.staff_id) },
  { header: "Engagement", accessor: (a) => ENGAGEMENT_CONFIG[a.engagement].label },
  { header: "YP Feedback", accessor: (a) => a.yp_feedback ?? "" },
  { header: "New Experience", accessor: (a) => a.is_new_experience ? "Yes" : "No" },
  { header: "Outcome Notes", accessor: (a) => a.outcome_notes ?? "" },
];

// ── Activity Card ────────────────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: Activity }) {
  const [expanded, setExpanded] = useState(false);
  const catCfg = CATEGORY_CONFIG[activity.category];
  const CatIcon = catCfg.icon;
  const engCfg = ENGAGEMENT_CONFIG[activity.engagement];

  return (
    <div className="rounded-2xl border bg-white overflow-hidden border-slate-200 transition-all hover:shadow-sm">
      <div className="flex items-start gap-3 p-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", catCfg.bg)}>
          <CatIcon className={cn("h-4 w-4", catCfg.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-slate-800">{activity.title}</span>
            {activity.is_new_experience && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-violet-50 text-violet-700 border-violet-200">
                <Star className="h-2.5 w-2.5 mr-0.5 inline" />New Experience
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {getYPName(activity.child_id)}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(activity.date)}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {activity.duration_minutes}min
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {activity.location}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", catCfg.border, catCfg.bg, catCfg.color)}>
              {catCfg.label}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", engCfg.cls)}>
              {engCfg.label}
            </Badge>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-600 shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">What Happened</p>
            <p className="text-xs text-slate-700 leading-relaxed">{activity.description}</p>
          </div>

          {activity.yp_feedback && (
            <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3 w-3 text-teal-600" />
                <p className="text-[10px] font-semibold text-teal-700 uppercase tracking-widest">Voice of the Child</p>
              </div>
              <p className="text-xs text-slate-700 italic leading-relaxed">&ldquo;{activity.yp_feedback}&rdquo;</p>
            </div>
          )}

          {activity.outcome_notes && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="h-3 w-3 text-indigo-600" />
                <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-widest">Impact & Outcome</p>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{activity.outcome_notes}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
            <span>Staff: {getStaffName(activity.staff_id)}</span>
            {activity.photos_taken && <span className="flex items-center gap-1"><Camera className="h-3 w-3" />Photos taken</span>}
            {activity.linked_outcome_domain && (
              <span>Linked domain: {activity.linked_outcome_domain.replace(/_/g, " ")}</span>
            )}
          </div>

          <SmartLinkPanel
            sourceType="activity"
            sourceId={activity.id}
            childId={activity.child_id}
            compact
          />
        </div>
      )}
    </div>
  );
}

// ── New Activity Dialog ──────────────────────────────────────────────────────

function NewActivityDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Activity>) => void;
}) {
  const [form, setForm] = useState({
    child_id: "yp_alex",
    category: "sport" as ActivityCategory,
    title: "",
    description: "",
    location: "",
    duration_minutes: 60,
    staff_id: "staff_darren",
    engagement: "willing" as ActivityEngagement,
    yp_feedback: "",
    outcome_notes: "",
    is_new_experience: false,
    date: todayStr(),
  });

  const handleSave = () => {
    if (!form.title.trim() || !form.description.trim()) return;
    onSave({
      ...form,
      yp_feedback: form.yp_feedback || null,
      outcome_notes: form.outcome_notes || null,
      photos_taken: false,
      linked_outcome_domain: null,
    });
    onClose();
    setForm((p) => ({ ...p, title: "", description: "", location: "", yp_feedback: "", outcome_notes: "" }));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-violet-600" />
            Log Activity
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
              <label className="text-xs text-slate-500 font-medium mb-1 block">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as ActivityCategory }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_CONFIG) as [ActivityCategory, typeof CATEGORY_CONFIG[ActivityCategory]][]).map(([k, cfg]) => (
                    <SelectItem key={k} value={k} className="text-xs">{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Date</label>
              <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Duration (mins)</label>
              <Input type="number" value={form.duration_minutes} onChange={(e) => setForm((p) => ({ ...p, duration_minutes: parseInt(e.target.value) || 0 }))} className="h-8 text-xs" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Activity title <span className="text-red-500">*</span></label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Swimming at Moorways" className="h-8 text-xs" />
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Location</label>
            <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="e.g. Derby Arena" className="h-8 text-xs" />
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Description <span className="text-red-500">*</span></label>
            <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What happened during the activity…" rows={3} className="text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Engagement</label>
              <Select value={form.engagement} onValueChange={(v) => setForm((p) => ({ ...p, engagement: v as ActivityEngagement }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(ENGAGEMENT_CONFIG) as [ActivityEngagement, typeof ENGAGEMENT_CONFIG[ActivityEngagement]][]).map(([k, cfg]) => (
                    <SelectItem key={k} value={k} className="text-xs">{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Staff member</label>
              <Select value={form.staff_id} onValueChange={(v) => setForm((p) => ({ ...p, staff_id: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["staff_darren", "staff_ryan", "staff_anna", "staff_chervelle", "staff_diane", "staff_edward", "staff_lackson", "staff_mirela"].map((id) => (
                    <SelectItem key={id} value={id} className="text-xs">{getStaffName(id)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Young person&apos;s voice</label>
            <Textarea value={form.yp_feedback} onChange={(e) => setForm((p) => ({ ...p, yp_feedback: e.target.value }))} placeholder="In the young person's own words…" rows={2} className="text-xs" />
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Outcome notes</label>
            <Textarea value={form.outcome_notes} onChange={(e) => setForm((p) => ({ ...p, outcome_notes: e.target.value }))} placeholder="What was the impact? What did you observe?" rows={2} className="text-xs" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_new_experience} onChange={(e) => setForm((p) => ({ ...p, is_new_experience: e.target.checked }))} className="rounded" />
            <span className="text-xs text-slate-600">This was a new experience for the young person</span>
          </label>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!form.title.trim() || !form.description.trim()} className="bg-violet-600 hover:bg-violet-700 text-white">
            Log Activity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ActivitiesPage() {
  const { data: result, isLoading } = useActivities();
  const createActivity = useCreateActivity();

  const activities: Activity[] = useMemo(() => result?.data ?? [], [result]);

  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "child" | "category" | "duration">("date");
  const [childFilter, setChildFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Stats
  const totalThisWeek = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return activities.filter((a) => new Date(a.date) >= weekAgo).length;
  }, [activities]);

  const totalHoursThisWeek = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return Math.round(activities.filter((a) => new Date(a.date) >= weekAgo).reduce((acc, a) => acc + a.duration_minutes, 0) / 60);
  }, [activities]);

  const newExperienceCount = useMemo(() => activities.filter((a) => a.is_new_experience).length, [activities]);

  const ypVoiceCount = useMemo(() => activities.filter((a) => a.yp_feedback).length, [activities]);

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of activities) counts[a.category] = (counts[a.category] || 0) + 1;
    return counts;
  }, [activities]);

  const childIds = useMemo(() => {
    const ids = new Set(activities.map((a) => a.child_id));
    return Array.from(ids).sort();
  }, [activities]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = activities;

    if (childFilter !== "all") list = list.filter((a) => a.child_id === childFilter);
    if (categoryFilter !== "all") list = list.filter((a) => a.category === categoryFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        getYPName(a.child_id).toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        (a.yp_feedback?.toLowerCase().includes(q) ?? false)
      );
    }

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "child": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "category": return CATEGORY_CONFIG[a.category].label.localeCompare(CATEGORY_CONFIG[b.category].label);
        case "duration": return b.duration_minutes - a.duration_minutes;
        default: return b.date.localeCompare(a.date);
      }
    });

    return list;
  }, [activities, childFilter, categoryFilter, search, sortBy]);

  const handleAddActivity = (data: Partial<Activity>) => {
    createActivity.mutate(data, {
      onSuccess: () => {
        toast.success("Activity recorded");
        setShowNew(false);
      },
    });
  };

  if (isLoading) {
    return (
      <PageShell
        title="Activities & Enrichment"
        subtitle="Meaningful activities, hobbies, and new experiences for young people"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Activities & Enrichment"
      subtitle="Meaningful activities, hobbies, and new experiences for young people"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      quickCreateContext={{ module: "young-people", defaultTaskCategory: "young_person_plans" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={ACTIVITY_EXPORT_COLS} filename="activities" />
          <PrintButton title="Activities & Enrichment" subtitle="Oak House — Activity Log" targetId="activities-content" />
          <SmartUploadButton variant="inline" label="Upload" uploadContext="Activities — activity photos or evidence upload" />
          <Button size="sm" onClick={() => setShowNew(true)} className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />Log Activity
          </Button>
        </div>
      }
    >
      <div id="activities-content" className="space-y-5 animate-fade-in">

        {/* ── Summary stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "This Week", value: totalThisWeek, icon: Calendar, colour: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
            { label: "Hours This Week", value: `${totalHoursThisWeek}h`, icon: Clock, colour: "text-teal-600", bg: "bg-teal-50 border-teal-100" },
            { label: "Total Logged", value: activities.length, icon: Palette, colour: "text-slate-700", bg: "bg-slate-50 border-slate-100" },
            { label: "New Experiences", value: newExperienceCount, icon: Star, colour: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
            { label: "YP Voice Captured", value: ypVoiceCount, icon: Sparkles, colour: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
          ].map(({ label, value, icon: Icon, colour, bg }) => (
            <div key={label} className={cn("rounded-2xl border p-4 text-center", bg)}>
              <Icon className={cn("h-4 w-4 mx-auto mb-1", colour)} />
              <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Category breakdown ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(CATEGORY_CONFIG) as [ActivityCategory, typeof CATEGORY_CONFIG[ActivityCategory]][])
            .filter(([key]) => (categoryBreakdown[key] ?? 0) > 0)
            .map(([key, cfg]) => {
              const CIcon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(categoryFilter === key ? "all" : key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    categoryFilter === key
                      ? cn(cfg.bg, cfg.border, cfg.color, "ring-1 ring-offset-1", cfg.border.replace("border-", "ring-"))
                      : cn(cfg.bg, cfg.border, cfg.color, "opacity-80 hover:opacity-100"),
                  )}
                >
                  <CIcon className="h-3 w-3" />
                  {cfg.label}
                  <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[9px] font-bold">
                    {categoryBreakdown[key] ?? 0}
                  </span>
                </button>
              );
            })}
        </div>

        {/* ── Search + filters ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activities, locations, YP voice…" className="pl-9 h-8 text-xs" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={childFilter}
                onChange={(e) => setChildFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-violet-300 focus:ring-1 focus:ring-violet-200 outline-none"
              >
                <option value="all">All young people</option>
                {childIds.map((id) => (
                  <option key={id} value={id}>{getYPName(id)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-violet-300 focus:ring-1 focus:ring-violet-200 outline-none"
              >
                <option value="date">Date (newest)</option>
                <option value="child">Young person</option>
                <option value="category">Category</option>
                <option value="duration">Duration (longest)</option>
              </select>
            </div>
          </div>
        </div>

        {(search || childFilter !== "all" || categoryFilter !== "all") && (
          <p className="text-xs text-slate-400">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {search && <span> matching &ldquo;{search}&rdquo;</span>}
          </p>
        )}

        {/* ── Activities list ──────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Palette className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium">
              {search ? `No activities match "${search}"` : "No activities logged yet"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Log an activity to start building your enrichment evidence.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}

        {/* ── Regulatory note ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Regulatory Basis — </span>
          Children&apos;s Homes Quality Standards 2015, Standard 2 (Quality of Care): children must be
          enabled to take part in and benefit from a range of activities and experiences that promote
          their development. Standard 1 (The Overall Experiences and Progress of Children): Ofsted
          assesses whether children enjoy their lives, have opportunities for enrichment, develop new
          skills, and experience things they would not otherwise have access to. Capturing the voice
          of the child in relation to activities is essential evidence of child-centred practice.
        </div>
      </div>

      <NewActivityDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onSave={handleAddActivity}
      />
      <CareEventsPanel
        title="Related Care Events"
        category="activity"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
