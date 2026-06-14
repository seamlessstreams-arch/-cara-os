"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
  PoundSterling,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  TutoringRecord,
  TutoringFormat,
  TutoringFundingSource,
  TutoringMotivation,
} from "@/types/extended";
import {
  TUTORING_FORMAT_LABEL,
  TUTORING_FUNDING_SOURCE_LABEL,
  TUTORING_MOTIVATION_LABEL,
} from "@/types/extended";
import { useTutoringRecords } from "@/hooks/use-tutoring-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const motivationColour: Record<TutoringMotivation, string> = {
  high: "bg-emerald-100 text-emerald-800",
  building: "bg-sky-100 text-sky-800",
  mixed: "bg-amber-100 text-amber-800",
  low: "bg-rose-100 text-rose-800",
};

const fundingColour: Record<TutoringFundingSource, string> = {
  pupil_premium_plus: "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)]",
  virtual_school_grant: "bg-indigo-100 text-indigo-800",
  leaving_care_fund: "bg-purple-100 text-purple-800",
  home_budget: "bg-slate-100 text-[var(--cs-navy)]",
  family_contribution: "bg-blue-100 text-blue-800",
  mixed: "bg-fuchsia-100 text-fuchsia-800",
  free_charity: "bg-emerald-100 text-emerald-800",
};

const exportCols: ExportColumn<TutoringRecord>[] = [
  { header: "Young Person", accessor: (r: TutoringRecord) => getYPName(r.child_id) },
  { header: "Subject", accessor: (r: TutoringRecord) => r.subject },
  { header: "Exam Focus", accessor: (r: TutoringRecord) => r.exam_focus ?? "" },
  { header: "Tutor", accessor: (r: TutoringRecord) => r.tutor_name },
  { header: "Qualifications", accessor: (r: TutoringRecord) => r.tutor_qualifications },
  { header: "DBS Checked", accessor: (r: TutoringRecord) => r.dbs_checked_date },
  { header: "Agency", accessor: (r: TutoringRecord) => r.agency ?? "Direct" },
  { header: "Format", accessor: (r: TutoringRecord) => TUTORING_FORMAT_LABEL[r.format] },
  { header: "Hours/Week", accessor: (r: TutoringRecord) => `${r.hours_per_week}` },
  { header: "Hourly Rate £", accessor: (r: TutoringRecord) => `£${r.hourly_rate}` },
  { header: "Cost To Date £", accessor: (r: TutoringRecord) => `£${r.cost_to_date}` },
  { header: "Funding", accessor: (r: TutoringRecord) => TUTORING_FUNDING_SOURCE_LABEL[r.funding_source] },
  { header: "Baseline", accessor: (r: TutoringRecord) => r.baseline_grade ?? "" },
  { header: "Current", accessor: (r: TutoringRecord) => r.current_grade ?? "" },
  { header: "Target", accessor: (r: TutoringRecord) => r.target_grade ?? "" },
  { header: "Motivation", accessor: (r: TutoringRecord) => TUTORING_MOTIVATION_LABEL[r.child_motivation] },
  { header: "Parent/SW Aware", accessor: (r: TutoringRecord) => (r.parent_sw_aware ? "Yes" : "No") },
  { header: "Review Date", accessor: (r: TutoringRecord) => r.review_date },
  { header: "Key Worker", accessor: (r: TutoringRecord) => getStaffName(r.key_worker) },
];

export default function ChildTutoringPrivateTuitionPage() {
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [sortBy, setSortBy] = useState("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: res, isLoading } = useTutoringRecords();
  const items = res?.data ?? [];

  const subjects = useMemo(
    () => Array.from(new Set(items.map((r) => r.subject))).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterSubject !== "all") list = list.filter((r) => r.subject === filterSubject);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.subject.toLowerCase().includes(q) ||
          r.tutor_name.toLowerCase().includes(q) ||
          getYPName(r.child_id).toLowerCase().includes(q) ||
          (r.exam_focus ?? "").toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "review":
          return a.review_date.localeCompare(b.review_date);
        case "cost":
          return b.cost_to_date - a.cost_to_date;
        case "hours":
          return b.hours_per_week - a.hours_per_week;
        case "subject":
          return a.subject.localeCompare(b.subject);
        default:
          return 0;
      }
    });
    return list;
  }, [items, filterSubject, search, sortBy]);

  if (isLoading) return <PageShell title="Tutoring & Private Tuition" subtitle="Per-child academic support — closing the attainment gap with intentional, funded, monitored tuition"><div /></PageShell>;

  const activeTutoring = items.filter((r) => r.ongoing).length;
  const totalHoursPerWeek = items
    .filter((r) => r.ongoing)
    .reduce((s, r) => s + r.hours_per_week, 0);
  const costYTD = items.reduce((s, r) => s + r.cost_to_date, 0);
  const today = new Date();
  const reviewsDue90 = items.filter((r) => {
    const rd = new Date(r.review_date);
    const diff = (rd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 90;
  }).length;

  return (
    <PageShell
      title="Tutoring & Private Tuition"
      subtitle="Per-child academic support — closing the attainment gap with intentional, funded, monitored tuition"
      caraContext={{ pageTitle: "Tutoring & Private Tuition", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="child-tutoring" />
          <PrintButton title="Tutoring & Private Tuition" />
          <CaraStudioQuickActionButton context={{ record_type: "education", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-sky-600">{activeTutoring}</p>
          <p className="text-xs text-muted-foreground">Active Tutoring Arrangements</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[var(--cs-cara-gold)]">{totalHoursPerWeek}</p>
          <p className="text-xs text-muted-foreground">Total Hours / Week</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">£{costYTD.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Cost to Date (YTD)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{reviewsDue90}</p>
          <p className="text-xs text-muted-foreground">Reviews Due (90d)</p>
        </div>
      </div>

      <div className="rounded-lg bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] p-3 mb-6 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)] mt-0.5 shrink-0" />
        <p className="text-sm text-[var(--cs-navy)]">
          Looked-after children and care leavers face a documented attainment gap. Tutoring is a
          high-leverage entitlement — funded via Pupil Premium Plus, Virtual School grants and
          Leaving Care personal budgets. We track each tutor&apos;s qualifications, DBS, and the
          child&apos;s progress and voice.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search subject, tutor, child..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 border rounded-md text-sm w-[260px]"
          />
        </div>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
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
              <SelectItem value="review">By Review Date</SelectItem>
              <SelectItem value="cost">By Cost</SelectItem>
              <SelectItem value="hours">By Hours/Week</SelectItem>
              <SelectItem value="subject">By Subject</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <BookOpen className="h-5 w-5 text-sky-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {r.subject} &middot; {getYPName(r.child_id)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      Tutor: {r.tutor_name} &middot; started {r.start_date}
                      {r.ongoing ? " · ongoing" : r.end_date ? ` · ended ${r.end_date}` : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-medium">
                        {r.subject}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-[var(--cs-text-secondary)] font-medium">
                        {TUTORING_FORMAT_LABEL[r.format]}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                        {r.hours_per_week} hr/wk
                      </span>
                      <span
                        className={cn(
                          "text-[11px] px-2 py-0.5 rounded-full font-medium",
                          fundingColour[r.funding_source],
                        )}
                      >
                        {TUTORING_FUNDING_SOURCE_LABEL[r.funding_source]}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] px-2 py-0.5 rounded-full font-medium",
                          motivationColour[r.child_motivation],
                        )}
                      >
                        {TUTORING_MOTIVATION_LABEL[r.child_motivation]} motivation
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm font-semibold text-indigo-600">
                    £{r.cost_to_date.toLocaleString()}
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
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <GraduationCap className="h-3 w-3 inline mr-1" />
                      Tutor
                    </p>
                    <p className="text-sm font-medium">{r.tutor_name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {r.tutor_qualifications}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      DBS checked {r.dbs_checked_date}
                      {r.agency ? ` · via ${r.agency}` : " · direct"}
                    </p>
                  </div>

                  {r.exam_focus && (
                    <div className="bg-[var(--cs-cara-gold-bg)] rounded-lg p-3 border border-[var(--cs-cara-gold-soft)]">
                      <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">
                        <Award className="h-3 w-3 inline mr-1" />
                        Exam Focus
                      </p>
                      <p className="text-sm">{r.exam_focus}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Format</p>
                      <p className="font-medium">{TUTORING_FORMAT_LABEL[r.format]}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Hours/wk</p>
                      <p className="font-medium">{r.hours_per_week}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Hourly rate</p>
                      <p className="font-medium">
                        <PoundSterling className="h-3 w-3 inline" />
                        {r.hourly_rate}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Cost to date</p>
                      <p className="font-medium">£{r.cost_to_date.toLocaleString()}</p>
                    </div>
                  </div>

                  {(r.baseline_grade || r.current_grade || r.target_grade) && (
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Progress
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 text-center">
                          <p className="text-xs text-muted-foreground">Baseline</p>
                          <p className="text-lg font-bold text-[var(--cs-text-secondary)]">
                            {r.baseline_grade ?? "—"}
                          </p>
                        </div>
                        <div className="flex-1 h-1 bg-gradient-to-r from-slate-300 via-sky-400 to-[var(--cs-cara-gold)] rounded-full" />
                        <div className="flex-1 text-center">
                          <p className="text-xs text-muted-foreground">Current</p>
                          <p className="text-lg font-bold text-sky-600">
                            {r.current_grade ?? "—"}
                          </p>
                        </div>
                        <div className="flex-1 h-1 bg-gradient-to-r from-sky-400 to-[var(--cs-cara-gold)] rounded-full" />
                        <div className="flex-1 text-center">
                          <p className="text-xs text-muted-foreground">Target</p>
                          <p className="text-lg font-bold text-[var(--cs-cara-gold)]">
                            {r.target_grade ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {r.resources_provided.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Resources Provided
                      </p>
                      <ul className="space-y-1">
                        {r.resources_provided.map((res, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <BookOpen className="h-3 w-3 text-sky-500 mt-1 shrink-0" />
                            <span>{res}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        r.parent_sw_aware
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800",
                      )}
                    >
                      Parent / Social Worker {r.parent_sw_aware ? "aware" : "NOT aware"}
                    </span>
                    {r.next_session && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                        Next session: {r.next_session}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                      Review: {r.review_date}
                    </span>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      Child&apos;s Voice
                    </p>
                    <p className="text-sm italic">&ldquo;{r.child_voice}&rdquo;</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      Staff Observation
                    </p>
                    <p className="text-sm">{r.staff_observation}</p>
                  </div>

                  <SmartLinkPanel sourceType="tutoring-record" sourceId={r.id} childId={r.child_id} compact />

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Key worker: {getStaffName(r.key_worker)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Pupil Premium Plus (DfE allocation for
          looked-after children, deployed via the Virtual School Head); Virtual School Head
          statutory duty under s.20 Children and Young Persons Act 2008; LSCP / Personal
          Education Plan (PEP) statutory guidance — tutoring entries should mirror PEP
          actions; Care Leavers (England) Regulations 2010 — Leaving Care personal budget
          eligible from 16+; DBS Enhanced + Children&apos;s Barred List check required for
          any tutor working alone with a child; Keeping Children Safe in Education (KCSIE)
          2024 — safer recruitment principles apply; UNCRC Articles 28 (right to education)
          and 29 (development of personality and talents). Cross-links: Education page,
          PEP records, Outcomes, Leaving Care plan, Funding tracker, DBS register.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Education"
        category="education"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Tutoring & Private Tuition — catch-up support, maths/English tutoring, exam preparation, SEND support, LAC education entitlement, PEP targets, virtual school head, attainment"
        recordType="education"
        className="mt-6"
      />
    </PageShell>
  );
}
