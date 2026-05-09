"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Users,
  Star,
  Calendar,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
  MapPin,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExtracurricularClubRecord } from "@/types/extended";
import { EXTRACURRICULAR_CATEGORY_LABEL, CLUB_SOCIAL_FIT_LABEL } from "@/types/extended";
import type { ExtracurricularCategory, ClubSocialFit } from "@/types/extended";
import { useExtracurricularClubRecords } from "@/hooks/use-extracurricular-club-records";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const categoryColour: Record<ExtracurricularCategory, string> = {
  sport: "bg-sky-100 text-sky-800",
  music: "bg-violet-100 text-violet-800",
  drama_theatre: "bg-violet-100 text-violet-800",
  faith_community: "bg-amber-100 text-amber-800",
  academic_debate: "bg-blue-100 text-blue-800",
  coding_tech: "bg-cyan-100 text-cyan-800",
  art_craft: "bg-pink-100 text-pink-800",
  volunteering: "bg-emerald-100 text-emerald-800",
  youth_advocacy: "bg-rose-100 text-rose-800",
  other: "bg-slate-100 text-slate-800",
};

const socialFitColour: Record<ClubSocialFit, string> = {
  building: "bg-blue-100 text-blue-800",
  settled: "bg-sky-100 text-sky-800",
  strong_friendships: "bg-emerald-100 text-emerald-800",
  mixed: "bg-amber-100 text-amber-800",
  stepping_back: "bg-slate-100 text-slate-800",
};

const exportCols: ExportColumn<ExtracurricularClubRecord>[] = [
  { header: "Young Person", accessor: (r: ExtracurricularClubRecord) => getYPName(r.child_id) },
  { header: "Club", accessor: (r: ExtracurricularClubRecord) => r.club_name },
  { header: "Category", accessor: (r: ExtracurricularClubRecord) => EXTRACURRICULAR_CATEGORY_LABEL[r.category] },
  { header: "Joined", accessor: (r: ExtracurricularClubRecord) => r.joined },
  { header: "Ongoing", accessor: (r: ExtracurricularClubRecord) => (r.ongoing ? "Yes" : "No") },
  { header: "Ended", accessor: (r: ExtracurricularClubRecord) => r.ended ?? "" },
  { header: "Frequency", accessor: (r: ExtracurricularClubRecord) => r.frequency },
  { header: "Venue", accessor: (r: ExtracurricularClubRecord) => r.venue },
  { header: "Transport", accessor: (r: ExtracurricularClubRecord) => r.transport_arrangement },
  { header: "Weekly Cost £", accessor: (r: ExtracurricularClubRecord) => `£${r.weekly_cost.toFixed(2)}` },
  { header: "Funding", accessor: (r: ExtracurricularClubRecord) => r.funding_source },
  { header: "Child Initiated", accessor: (r: ExtracurricularClubRecord) => (r.child_initiated ? "Yes" : "No") },
  { header: "Social Fit", accessor: (r: ExtracurricularClubRecord) => CLUB_SOCIAL_FIT_LABEL[r.social_fit] },
  { header: "Skills Built", accessor: (r: ExtracurricularClubRecord) => r.skills_built.join("; ") },
  { header: "Attendance %", accessor: (r: ExtracurricularClubRecord) => `${r.attendance_rate}%` },
  { header: "Flags / Concerns", accessor: (r: ExtracurricularClubRecord) => r.flags_concerns.join("; ") },
  { header: "Child Voice", accessor: (r: ExtracurricularClubRecord) => r.child_voice },
  { header: "Staff Observation", accessor: (r: ExtracurricularClubRecord) => r.staff_observation },
  { header: "Review Date", accessor: (r: ExtracurricularClubRecord) => r.review_date },
  { header: "Key Worker", accessor: (r: ExtracurricularClubRecord) => getStaffName(r.key_worker) },
];

const parseFreqHours = (frequency: string): number => {
  const match = frequency.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return 1.5;
  const start = parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
  const end = parseInt(match[3], 10) + parseInt(match[4], 10) / 60;
  const span = Math.max(0.5, end - start);
  if (/fortnight/i.test(frequency)) return span / 2;
  return span;
};

export default function ChildExtracurricularClubsPage() {
  const { data: res, isLoading } = useExtracurricularClubRecords();
  const items = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterCategory !== "all") list = list.filter((r) => r.category === filterCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.club_name.toLowerCase().includes(q) ||
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.venue.toLowerCase().includes(q) ||
          r.skills_built.some((s) => s.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "review":
          return new Date(a.review_date).getTime() - new Date(b.review_date).getTime();
        case "attendance":
          return b.attendance_rate - a.attendance_rate;
        case "child":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "joined":
          return new Date(b.joined).getTime() - new Date(a.joined).getTime();
        default:
          return 0;
      }
    });
    return list;
  }, [items, search, filterCategory, sortBy]);

  if (isLoading) {
    return (
      <PageShell
        title="Extracurricular Clubs & Societies"
        subtitle="Per-child clubs, societies and after-school activities — attendance, social fit, skill building, transport and cost"
      >
        <p>Loading...</p>
      </PageShell>
    );
  }

  const today = new Date();
  const in60 = new Date();
  in60.setDate(in60.getDate() + 60);

  const activeClubs = items.filter((r) => r.ongoing).length;
  const weeklyHours = items
    .filter((r) => r.ongoing)
    .reduce((sum, r) => sum + parseFreqHours(r.frequency), 0)
    .toFixed(1);
  const weeklyCost = items
    .filter((r) => r.ongoing)
    .reduce((sum, r) => sum + r.weekly_cost, 0)
    .toFixed(2);
  const reviewsDue = items.filter((r) => {
    const next = new Date(r.review_date);
    next.setDate(next.getDate() + 90);
    return next >= today && next <= in60;
  }).length;

  const categories: ExtracurricularCategory[] = [
    "sport",
    "music",
    "drama_theatre",
    "faith_community",
    "academic_debate",
    "coding_tech",
    "art_craft",
    "volunteering",
    "youth_advocacy",
    "other",
  ];

  return (
    <PageShell
      title="Extracurricular Clubs & Societies"
      subtitle="Per-child clubs, societies and after-school activities — attendance, social fit, skill building, transport and cost"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="extracurricular-clubs" />
          <PrintButton title="Extracurricular Clubs & Societies" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-sky-700">{activeClubs}</p>
          <p className="text-xs text-muted-foreground">Active Clubs</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-violet-700">{weeklyHours}h</p>
          <p className="text-xs text-muted-foreground">Weekly Hours (active)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-sky-700">£{weeklyCost}</p>
          <p className="text-xs text-muted-foreground">Weekly Cost (active)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-violet-700">{reviewsDue}</p>
          <p className="text-xs text-muted-foreground">Reviews Due (60d)</p>
        </div>
      </div>

      <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 mb-6 flex items-start gap-2">
        <Star className="h-4 w-4 text-sky-700 mt-0.5 shrink-0" />
        <p className="text-sm text-sky-900">
          Each child&apos;s clubs and societies are tracked individually — one row per engagement.
          Cross-links to Volunteering & Charity and Aspirations trackers preserve a single source
          of truth for overlapping commitments.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs, child, venue, skills..."
            className="w-full rounded-md border bg-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {EXTRACURRICULAR_CATEGORY_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="review">By Last Review</SelectItem>
              <SelectItem value="attendance">By Attendance %</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
              <SelectItem value="joined">By Date Joined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((c) => {
          const isExpanded = expandedId === c.id;
          return (
            <div key={c.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Users className="h-5 w-5 text-sky-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.club_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getYPName(c.child_id)} &middot; Joined {c.joined}
                      {c.ended ? ` · Ended ${c.ended}` : ""} &middot; {c.frequency}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      categoryColour[c.category]
                    )}
                  >
                    {EXTRACURRICULAR_CATEGORY_LABEL[c.category]}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      c.ongoing
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {c.ongoing ? "Ongoing" : "Ended"}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-violet-100 text-violet-800">
                    {c.attendance_rate}% att.
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium hidden md:inline",
                      socialFitColour[c.social_fit]
                    )}
                  >
                    {CLUB_SOCIAL_FIT_LABEL[c.social_fit]}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-sky-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Venue & Transport
                      </p>
                      <p className="text-sm font-medium">{c.venue}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {c.transport_arrangement}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-violet-800 uppercase tracking-wide mb-1">
                        Cost & Funding
                      </p>
                      <p className="text-sm font-medium">
                        £{c.weekly_cost.toFixed(2)}/week
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {c.funding_source} &middot;{" "}
                        {c.child_initiated ? "Child-initiated" : "Adult-suggested"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Attendance</p>
                      <p className="font-medium">{c.attendance_rate}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Social Fit</p>
                      <p className="font-medium">{CLUB_SOCIAL_FIT_LABEL[c.social_fit]}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Last Review</p>
                      <p className="font-medium">{c.review_date}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Key Worker</p>
                      <p className="font-medium">{getStaffName(c.key_worker)}</p>
                    </div>
                  </div>

                  <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                    <p className="text-xs font-semibold text-violet-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      Skills Built
                    </p>
                    <ul className="space-y-1">
                      {c.skills_built.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Star className="h-3 w-3 text-violet-500 mt-1 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {c.flags_concerns.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        Flags / Concerns
                      </p>
                      <ul className="space-y-1">
                        {c.flags_concerns.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-sky-50 rounded-lg p-3 border border-sky-200">
                    <p className="text-xs font-semibold text-sky-800 uppercase tracking-wide mb-1">
                      Child&apos;s Voice
                    </p>
                    <p className="text-sm italic">&ldquo;{c.child_voice}&rdquo;</p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Staff Observation
                    </p>
                    <p className="text-sm">{c.staff_observation}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {c.frequency}
                    </span>
                    <span>
                      <Users className="h-3 w-3 inline mr-1" />
                      {CLUB_SOCIAL_FIT_LABEL[c.social_fit]}
                    </span>
                    <span>{EXTRACURRICULAR_CATEGORY_LABEL[c.category]}</span>
                  </div>

                  <SmartLinkPanel sourceType="extracurricular-club" sourceId={c.id} childId={c.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Quality Standard 6 (Enjoyment & Achievement)
          places a duty on the home to support each child&apos;s engagement in interests, hobbies
          and clubs. UNCRC Article 31 affirms the right to rest, play, leisure and cultural
          life. Pathway Plan duty (for relevant young people) requires recording activities
          that support identity, skills and post-care transition. This page cross-links to the
          Volunteering & Charity, Child Aspirations and After-School Club Tracker pages — each
          engagement is captured once and surfaced where relevant.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
