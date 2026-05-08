"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { usePositiveAchievements } from "@/hooks/use-positive-achievements";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { PositiveAchievement, PositiveAchievementCategory } from "@/types/extended";
import { POSITIVE_ACHIEVEMENT_CATEGORY_LABEL } from "@/types/extended";
import {
  Search, ArrowUpDown, X, Star, Trophy, Sparkles,
  ChevronDown, ChevronUp, User, Calendar, Heart,
  GraduationCap, Palette, MessageCircle, Brain,
  Home, Users, Award, TrendingUp, Loader2,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<PositiveAchievementCategory, { label: string; colour: string; icon: React.ElementType }> = {
  sport:         { label: "Sport",          colour: "bg-blue-100 text-blue-700",   icon: Trophy },
  education:     { label: "Education",      colour: "bg-purple-100 text-purple-700", icon: GraduationCap },
  creative:      { label: "Creative",       colour: "bg-pink-100 text-pink-700",   icon: Palette },
  communication: { label: "Communication",  colour: "bg-teal-100 text-teal-700",   icon: MessageCircle },
  emotional:     { label: "Emotional",      colour: "bg-amber-100 text-amber-700", icon: Brain },
  independence:  { label: "Independence",   colour: "bg-orange-100 text-orange-700", icon: Home },
  social:        { label: "Social",         colour: "bg-indigo-100 text-indigo-700", icon: Users },
  milestone:     { label: "Milestone",      colour: "bg-emerald-100 text-emerald-700", icon: Award },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PositiveAchievementsPage() {
  const { data: records = [], isLoading } = usePositiveAchievements();
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const childIds = useMemo(() => [...new Set(records.map(a => a.child_id))], [records]);

  /* ── filtering ──────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (childFilter !== "all") list = list.filter(a => a.child_id === childFilter);
    if (categoryFilter !== "all") list = list.filter(a => a.category === categoryFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        getYPName(a.child_id).toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.date.localeCompare(a.date);
        case "oldest": return a.date.localeCompare(b.date);
        case "child":  return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "category": return a.category.localeCompare(b.category);
        default: return 0;
      }
    });
    return list;
  }, [records, search, childFilter, categoryFilter, sortBy]);

  /* ── stats ──────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const perChild = new Map<string, number>();
    const perCategory = new Map<PositiveAchievementCategory, number>();
    records.forEach(a => {
      perChild.set(a.child_id, (perChild.get(a.child_id) || 0) + 1);
      perCategory.set(a.category, (perCategory.get(a.category) || 0) + 1);
    });
    let topCategory: PositiveAchievementCategory = "education";
    let topCount = 0;
    perCategory.forEach((count, cat) => {
      if (count > topCount) { topCount = count; topCategory = cat; }
    });
    return {
      total: records.length,
      perChild,
      perCategory,
      topCategory,
    };
  }, [records]);

  /* ── export columns ─────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<PositiveAchievement>[] = [
    { header: "ID", accessor: (r) => r.id },
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Date", accessor: (r) => r.date },
    { header: "Category", accessor: (r) => CATEGORY_CONFIG[r.category].label },
    { header: "Title", accessor: (r) => r.title },
    { header: "Description", accessor: (r) => r.description },
    { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
    { header: "Shared With", accessor: (r) => r.shared_with.join(", ") },
    { header: "How Celebrated", accessor: (r) => r.celebrated_how },
    { header: "Child Reaction", accessor: (r) => r.child_reaction },
  ];

  if (isLoading) {
    return (
      <PageShell title="Positive Achievements" subtitle="Celebrating strengths, progress, and moments of pride">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Positive Achievements"
      subtitle="Celebrating strengths, progress, and moments of pride"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Positive Achievements" />
          <ExportButton data={filtered} columns={exportCols} filename="positive-achievements" />
        </div>
      }
    >
      {/* ── Regulatory Note ──────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 mb-6">
        <div className="flex items-start gap-2">
          <Star className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          <div className="text-xs text-green-800">
            <p className="font-semibold mb-0.5">Strengths-Based Practice — Reg 45 Positive Outcomes</p>
            <p>Recording achievements supports positive reinforcement, builds self-esteem, and demonstrates progress to reviewing officers, social workers, and families. Every child deserves to have their successes celebrated and documented.</p>
          </div>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Achievements This Month", value: stats.total, icon: Trophy, c: "text-green-600" },
          { label: "Most Common", value: CATEGORY_CONFIG[stats.topCategory].label, icon: TrendingUp, c: "text-purple-600" },
          ...childIds.map(cid => ({
            label: getYPName(cid),
            value: stats.perChild.get(cid) || 0,
            icon: Star,
            c: "text-amber-500",
          })),
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-green-100 bg-gradient-to-br from-green-50/40 to-white p-3 flex items-center gap-3">
            <s.icon className={cn("h-5 w-5", s.c)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search achievements..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5"><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
        <Select value={childFilter} onValueChange={setChildFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Child" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(Object.entries(CATEGORY_CONFIG) as [PositiveAchievementCategory, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} achievement{filtered.length !== 1 ? "s" : ""}
        {(search || childFilter !== "all" || categoryFilter !== "all") && " (filtered)"}
      </p>

      {/* ── Achievement Cards ─────────────────────────────────────────────────── */}
      <div className="space-y-3" id="achievements-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No achievements found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}

        {filtered.map(achievement => {
          const isOpen = expandedId === achievement.id;
          const catConfig = CATEGORY_CONFIG[achievement.category];
          const CatIcon = catConfig.icon;

          return (
            <div key={achievement.id} className="rounded-lg border border-green-100 bg-card overflow-hidden border-l-4 border-l-green-400">
              <button
                onClick={() => setExpandedId(isOpen ? null : achievement.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-green-50/50 transition-colors"
              >
                <div className="rounded-full p-1.5 shrink-0 bg-green-100 text-green-700">
                  <CatIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{achievement.title}</span>
                    <Badge variant="outline" className={cn("text-xs", catConfig.colour)}>
                      {catConfig.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getYPName(achievement.child_id)} · {formatDate(achievement.date)} · {getStaffName(achievement.recorded_by)}
                  </p>
                </div>
                <Star className="h-4 w-4 text-amber-400 shrink-0" />
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t border-green-100 px-4 py-3 space-y-3 bg-green-50/20">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">What Happened</p>
                    <p className="text-sm">{achievement.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-green-100 p-2.5 bg-white">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                        <Heart className="h-3 w-3 text-green-600" /> How We Celebrated
                      </p>
                      <p className="text-sm">{achievement.celebrated_how}</p>
                    </div>
                    <div className="rounded-lg border border-green-100 p-2.5 bg-white">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500" /> Child&apos;s Reaction
                      </p>
                      <p className="text-sm">{achievement.child_reaction}</p>
                    </div>
                  </div>

                  {achievement.shared_with.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Shared With</p>
                      <div className="flex flex-wrap gap-1">
                        {achievement.shared_with.map(s => (
                          <Badge key={s} variant="outline" className="text-xs bg-green-50 text-green-700">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-green-100">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{getStaffName(achievement.recorded_by)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(achievement.date)}</span>
                  </div>

                  <SmartLinkPanel sourceType="positive_achievement" sourceId={achievement.id} childId={achievement.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
