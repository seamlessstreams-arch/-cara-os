"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POSITIVE ACHIEVEMENTS
// Celebrates and records children's positive achievements — awards, milestones,
// certificates, personal bests, and moments of pride. Supports Reg 45 (positive
// outcomes), strengths-based practice, and positive reinforcement approaches.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  Search, ArrowUpDown, X, Star, Trophy, Sparkles,
  ChevronDown, ChevronUp, User, Calendar, Heart,
  GraduationCap, Palette, MessageCircle, Brain,
  Home, Users, Award, TrendingUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type AchievementCategory =
  | "sport"
  | "education"
  | "creative"
  | "communication"
  | "emotional"
  | "independence"
  | "social"
  | "milestone";

interface Achievement {
  id: string;
  youngPersonId: string;
  date: string;
  category: AchievementCategory;
  title: string;
  description: string;
  recordedBy: string;
  sharedWith: string[];
  celebratedHow: string;
  childReaction: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<AchievementCategory, { label: string; colour: string; icon: React.ElementType }> = {
  sport:         { label: "Sport",          colour: "bg-blue-100 text-blue-700",   icon: Trophy },
  education:     { label: "Education",      colour: "bg-purple-100 text-purple-700", icon: GraduationCap },
  creative:      { label: "Creative",       colour: "bg-pink-100 text-pink-700",   icon: Palette },
  communication: { label: "Communication",  colour: "bg-teal-100 text-teal-700",   icon: MessageCircle },
  emotional:     { label: "Emotional",      colour: "bg-amber-100 text-amber-700", icon: Brain },
  independence:  { label: "Independence",   colour: "bg-orange-100 text-orange-700", icon: Home },
  social:        { label: "Social",         colour: "bg-indigo-100 text-indigo-700", icon: Users },
  milestone:     { label: "Milestone",      colour: "bg-emerald-100 text-emerald-700", icon: Award },
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10);
};

const SEED: Achievement[] = [
  {
    id: "ach_001",
    youngPersonId: "yp_alex",
    date: d(-5),
    category: "sport",
    title: "Selected for county football trials",
    description: "Alex was selected from 40 boys for the county trials after impressing at his club. He was over the moon. This is a huge achievement and reflects his dedication to training.",
    recordedBy: "staff_ryan",
    sharedWith: ["Social worker", "School", "Family"],
    celebratedHow: "Announced at house meeting. Staff gave a round of applause. New football boots purchased as reward.",
    childReaction: "Beaming with pride. Told every member of staff individually. Asked to call his mum to tell her.",
  },
  {
    id: "ach_002",
    youngPersonId: "yp_alex",
    date: d(-14),
    category: "education",
    title: "91% school attendance this term",
    description: "Best attendance since entering care. Consistent effort every morning.",
    recordedBy: "staff_ryan",
    sharedWith: ["Social worker", "School", "IRO"],
    celebratedHow: "Certificate presented at PEP meeting. Added to achievements wall in hallway.",
    childReaction: "Quietly pleased. Said 'it's not that hard when you actually go.' Understated but clearly proud.",
  },
  {
    id: "ach_003",
    youngPersonId: "yp_jordan",
    date: d(-10),
    category: "creative",
    title: "Artwork displayed in school reception",
    description: "Jordan's painting of the ocean was selected by the art teacher for permanent display. Jordan was visibly proud — smiled and pointed at it when we visited school.",
    recordedBy: "staff_anna",
    sharedWith: ["Social worker", "Family"],
    celebratedHow: "Photo taken and framed for Jordan's room. Shared at house meeting with applause.",
    childReaction: "Jordan smiled broadly and pointed at the painting when visiting school. Asked staff to take a photo.",
  },
  {
    id: "ach_004",
    youngPersonId: "yp_jordan",
    date: d(-3),
    category: "communication",
    title: "Used verbal request at dinner without prompting",
    description: "Jordan said 'more please' at dinner without any visual prompt. First unprompted verbal request in 2 weeks. Celebrated with positive praise.",
    recordedBy: "staff_anna",
    sharedWith: ["SALT", "Social worker"],
    celebratedHow: "Immediate verbal praise and a big smile from staff. Extra portion given enthusiastically. Noted in communication log for SALT review.",
    childReaction: "Jordan looked pleased and made eye contact. Repeated 'more please' the next evening too.",
  },
  {
    id: "ach_005",
    youngPersonId: "yp_casey",
    date: d(-7),
    category: "education",
    title: "Completed art coursework piece",
    description: "Despite not attending college, Casey completed an outstanding art piece at home. Chervelle supported. College accepted it — potential Distinction level.",
    recordedBy: "staff_chervelle",
    sharedWith: ["Social worker", "College tutor", "Virtual School"],
    celebratedHow: "Photographed for portfolio. Casey chose to display it in the lounge. Staff wrote congratulations card.",
    childReaction: "Casey was surprised the college accepted it. Said 'I didn't think they'd care.' Smiled when told it could be a Distinction.",
  },
  {
    id: "ach_006",
    youngPersonId: "yp_casey",
    date: d(-2),
    category: "emotional",
    title: "Used grounding technique independently",
    description: "Casey was feeling overwhelmed and used the breathing exercise from her toolkit without staff prompting. Told Chervelle 'I did the breathing thing.' Major progress.",
    recordedBy: "staff_chervelle",
    sharedWith: ["Therapist", "Social worker"],
    celebratedHow: "Verbal praise and acknowledgement. Casey's therapist informed — will reinforce in next session.",
    childReaction: "Casey seemed proud of herself. Said 'it actually works sometimes.' Appeared calmer throughout the evening.",
  },
  {
    id: "ach_007",
    youngPersonId: "yp_alex",
    date: d(-8),
    category: "independence",
    title: "Cooked spaghetti bolognese for the house",
    description: "Alex's first full meal cooked independently (with supervision). Everyone ate it and Casey said it was 'actually good.' Alex was proud.",
    recordedBy: "staff_ryan",
    sharedWith: ["Social worker"],
    celebratedHow: "Everyone thanked Alex at dinner. Photo taken for life-story work. Added to independence skills tracker.",
    childReaction: "Alex was proud and kept asking if people liked it. Asked what he could cook next week.",
  },
  {
    id: "ach_008",
    youngPersonId: "yp_jordan",
    date: d(-6),
    category: "independence",
    title: "Completed morning routine independently (3 days in a row)",
    description: "Jordan followed the visual schedule without any prompting for 3 consecutive mornings. Significant progress.",
    recordedBy: "staff_anna",
    sharedWith: ["Social worker", "School"],
    celebratedHow: "3 tokens added to reward chart. Approaching 20-token goal. Praised at house meeting.",
    childReaction: "Jordan appeared confident and ready earlier than usual each morning. Showed staff the completed checklist with a smile.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PositiveAchievementsPage() {
  const [achievements] = useState<Achievement[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const childIds = useMemo(() => [...new Set(achievements.map(a => a.youngPersonId))], [achievements]);

  /* ── filtering ──────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...achievements];
    if (childFilter !== "all") list = list.filter(a => a.youngPersonId === childFilter);
    if (categoryFilter !== "all") list = list.filter(a => a.category === categoryFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        getYPName(a.youngPersonId).toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.date.localeCompare(a.date);
        case "oldest": return a.date.localeCompare(b.date);
        case "child":  return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        case "category": return a.category.localeCompare(b.category);
        default: return 0;
      }
    });
    return list;
  }, [achievements, search, childFilter, categoryFilter, sortBy]);

  /* ── stats ──────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const perChild = new Map<string, number>();
    const perCategory = new Map<AchievementCategory, number>();
    achievements.forEach(a => {
      perChild.set(a.youngPersonId, (perChild.get(a.youngPersonId) || 0) + 1);
      perCategory.set(a.category, (perCategory.get(a.category) || 0) + 1);
    });
    let topCategory: AchievementCategory = "education";
    let topCount = 0;
    perCategory.forEach((count, cat) => {
      if (count > topCount) { topCount = count; topCategory = cat; }
    });
    return {
      total: achievements.length,
      perChild,
      perCategory,
      topCategory,
    };
  }, [achievements]);

  /* ── export columns ─────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<Achievement>[] = [
    { header: "ID", accessor: (r: Achievement) => r.id },
    { header: "Young Person", accessor: (r: Achievement) => getYPName(r.youngPersonId) },
    { header: "Date", accessor: (r: Achievement) => r.date },
    { header: "Category", accessor: (r: Achievement) => CATEGORY_CONFIG[r.category].label },
    { header: "Title", accessor: (r: Achievement) => r.title },
    { header: "Description", accessor: (r: Achievement) => r.description },
    { header: "Recorded By", accessor: (r: Achievement) => getStaffName(r.recordedBy) },
    { header: "Shared With", accessor: (r: Achievement) => r.sharedWith.join(", ") },
    { header: "How Celebrated", accessor: (r: Achievement) => r.celebratedHow },
    { header: "Child Reaction", accessor: (r: Achievement) => r.childReaction },
  ];

  return (
    <PageShell
      title="Positive Achievements"
      subtitle="Celebrating strengths, progress, and moments of pride"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Positive Achievements" subtitle="Oak House — Celebrating Success" />
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
            {(Object.entries(CATEGORY_CONFIG) as [AchievementCategory, { label: string }][]).map(([k, v]) => (
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
                    {getYPName(achievement.youngPersonId)} · {formatDate(achievement.date)} · {getStaffName(achievement.recordedBy)}
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
                      <p className="text-sm">{achievement.celebratedHow}</p>
                    </div>
                    <div className="rounded-lg border border-green-100 p-2.5 bg-white">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500" /> Child&apos;s Reaction
                      </p>
                      <p className="text-sm">{achievement.childReaction}</p>
                    </div>
                  </div>

                  {achievement.sharedWith.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Shared With</p>
                      <div className="flex flex-wrap gap-1">
                        {achievement.sharedWith.map(s => (
                          <Badge key={s} variant="outline" className="text-xs bg-green-50 text-green-700">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-green-100">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{getStaffName(achievement.recordedBy)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(achievement.date)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
