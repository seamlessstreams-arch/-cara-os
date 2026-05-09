"use client";

import { useState, useMemo } from "react";
import {
  Heart,
  Calendar,
  Star,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn, todayStr } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { CareAnniversaryRecord, CareAnniversaryType, CareAnniversaryAttitude } from "@/types/extended";
import { CARE_ANNIVERSARY_TYPE_LABEL, CARE_ANNIVERSARY_ATTITUDE_LABEL } from "@/types/extended";
import { useCareAnniversaryRecords } from "@/hooks/use-care-anniversary-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── colour maps ───────────────────────────────────────────────────────── */

const TYPE_COLOURS: Record<CareAnniversaryType, string> = {
  entering_care: "bg-rose-100 text-rose-800",
  coming_to_this_home: "bg-teal-100 text-teal-800",
  leaving_prior_placement: "bg-amber-100 text-amber-800",
  reuniting_with_sibling_in_care: "bg-emerald-100 text-emerald-800",
  becoming_a_care_leaver_18: "bg-indigo-100 text-indigo-800",
  pathway_end_21_25: "bg-purple-100 text-purple-800",
  other_significant_date: "bg-gray-100 text-gray-700",
};

const ATTITUDE_COLOURS: Record<CareAnniversaryAttitude, string> = {
  wants_celebrated: "bg-emerald-100 text-emerald-800",
  wants_quietly_noted: "bg-teal-100 text-teal-800",
  wants_ignored: "bg-gray-100 text-gray-700",
  wants_reflective_space: "bg-rose-100 text-rose-800",
  mixed_changes_year_by_year: "bg-amber-100 text-amber-800",
  not_yet_old_enough_to_choose: "bg-blue-100 text-blue-800",
};

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  child_id: string;
  anniversary_type: string;
  significant_date: string;
  years_since_event: number;
  child_attitude: string;
  upcoming_plan: string;
  review_date: string;
  key_worker: string;
  child_voice: string;
  staff_observation: string;
}

const exportCols: ExportColumn<FlatRow>[] = [
  { header: "Young Person", accessor: (r: FlatRow) => r.child_id },
  { header: "Anniversary Type", accessor: (r: FlatRow) => r.anniversary_type },
  { header: "Significant Date", accessor: (r: FlatRow) => r.significant_date },
  { header: "Years Since Event", accessor: (r: FlatRow) => r.years_since_event },
  { header: "Child Attitude", accessor: (r: FlatRow) => r.child_attitude },
  { header: "Upcoming Plan", accessor: (r: FlatRow) => r.upcoming_plan },
  { header: "Review Date", accessor: (r: FlatRow) => r.review_date },
  { header: "Key Worker", accessor: (r: FlatRow) => r.key_worker },
  { header: "Child Voice", accessor: (r: FlatRow) => r.child_voice },
  { header: "Staff Observation", accessor: (r: FlatRow) => r.staff_observation },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildCareAnniversaryPage() {
  const { data: resp, isLoading } = useCareAnniversaryRecords();
  const data = resp?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("upcoming");

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const tracked = data.length;
    const celebrated = data.filter((r) => r.child_attitude === "wants_celebrated").length;
    const today = new Date();
    const ninetyOut = new Date();
    ninetyOut.setDate(ninetyOut.getDate() + 90);
    const upcoming90 = data.filter((r) => {
      const dt = new Date(r.significant_date);
      return dt >= today && dt <= ninetyOut;
    }).length;
    const thirtyOut = new Date();
    thirtyOut.setDate(thirtyOut.getDate() + 30);
    const reviewsDue = data.filter((r) => r.review_date <= thirtyOut.toISOString().slice(0, 10)).length;
    return { tracked, celebrated, upcoming90, reviewsDue };
  }, [data]);

  /* ── filter / sort ────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        CARE_ANNIVERSARY_TYPE_LABEL[r.anniversary_type].toLowerCase().includes(q) ||
        CARE_ANNIVERSARY_ATTITUDE_LABEL[r.child_attitude].toLowerCase().includes(q) ||
        r.child_voice.toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") list = list.filter((r) => r.anniversary_type === filterType);
    const out = [...list];
    switch (sortBy) {
      case "upcoming": out.sort((a, b) => a.significant_date.localeCompare(b.significant_date)); break;
      case "child": out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
      case "type": out.sort((a, b) => a.anniversary_type.localeCompare(b.anniversary_type)); break;
      case "review": out.sort((a, b) => a.review_date.localeCompare(b.review_date)); break;
    }
    return out;
  }, [data, search, filterType, sortBy]);

  /* ── export rows ──────────────────────────────────────────────────── */
  const exportRows = useMemo<FlatRow[]>(() =>
    data.map((r) => ({
      child_id: getYPName(r.child_id),
      anniversary_type: CARE_ANNIVERSARY_TYPE_LABEL[r.anniversary_type],
      significant_date: r.significant_date,
      years_since_event: r.years_since_event,
      child_attitude: CARE_ANNIVERSARY_ATTITUDE_LABEL[r.child_attitude],
      upcoming_plan: r.upcoming_plan ?? "",
      review_date: r.review_date,
      key_worker: getStaffName(r.key_worker),
      child_voice: r.child_voice,
      staff_observation: r.staff_observation,
    })), [data]);

  const annTypes = Object.keys(CARE_ANNIVERSARY_TYPE_LABEL) as CareAnniversaryType[];

  if (isLoading) {
    return (
      <PageShell title="Child Care Anniversary" subtitle="Loading...">
        <div className="flex items-center justify-center py-12 text-sm text-gray-500">Loading records...</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Child Care Anniversary"
      subtitle="Per-child, child-led acknowledgement of the dates that shape a young person&apos;s care story"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Care Anniversaries" />
          <ExportButton data={exportRows} columns={exportCols} filename="child-care-anniversary" />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Anniversaries tracked", value: stats.tracked, icon: Calendar, colour: "text-teal-600" },
          { label: "Celebrated each year", value: stats.celebrated, icon: Sparkles, colour: "text-emerald-600" },
          { label: "Upcoming (90 days)", value: stats.upcoming90, icon: Star, colour: stats.upcoming90 > 0 ? "text-rose-600" : "text-gray-400" },
          { label: "Reviews due (30d)", value: stats.reviewsDue, icon: Heart, colour: stats.reviewsDue > 0 ? "text-amber-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── opening note ──────────────────────────────────────────── */}
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 mb-6">
        <div className="flex items-start gap-2">
          <Heart className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Held with care, led by the child.</strong> Care anniversaries — the day a child entered care, came to this home, was separated from a parent, will leave care — can be tender, painful, joyful, or all three at once. We never assume. We ask, we listen, and we follow the child&apos;s lead every single year. A child&apos;s preference can change, and that is part of the work. This is distinct from staff placement anniversaries — this is the child&apos;s own story.
          </div>
        </div>
      </div>

      {/* ── filters ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by child, type, or attitude..."
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[240px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All anniversary types</SelectItem>
            {annTypes.map((t) => <SelectItem key={t} value={t}>{CARE_ANNIVERSARY_TYPE_LABEL[t]}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming first</SelectItem>
              <SelectItem value="child">Child name</SelectItem>
              <SelectItem value="type">Anniversary type</SelectItem>
              <SelectItem value="review">Review date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── records ────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-teal-100 bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-teal-50/40"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Heart className="h-4 w-4 text-rose-400" />
                    <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                    <span className="text-sm text-gray-600">— {CARE_ANNIVERSARY_TYPE_LABEL[r.anniversary_type]}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", TYPE_COLOURS[r.anniversary_type])}>{CARE_ANNIVERSARY_TYPE_LABEL[r.anniversary_type]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", ATTITUDE_COLOURS[r.child_attitude])}>{CARE_ANNIVERSARY_ATTITUDE_LABEL[r.child_attitude]}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 inline-flex items-center gap-1">
                      <Star className="h-3 w-3" /> {r.years_since_event} {r.years_since_event === 1 ? "year" : "years"} since
                    </span>
                    {r.flags_for_review.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 inline-flex items-center gap-1">
                        {r.flags_for_review.length} note{r.flags_for_review.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Date {r.significant_date} · Key worker {getStaffName(r.key_worker)} · Review {r.review_date}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />}
              </button>

              {open && (
                <div className="border-t border-teal-100 px-4 pb-4 space-y-4">
                  {/* date + years + attitude */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Significant date</h4>
                      <p className="text-sm font-medium">{r.significant_date}</p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Years since event</h4>
                      <p className="text-sm font-medium">{r.years_since_event} {r.years_since_event === 1 ? "year" : "years"}</p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Child&apos;s current attitude</h4>
                      <p className="text-sm font-medium">{CARE_ANNIVERSARY_ATTITUDE_LABEL[r.child_attitude]}</p>
                    </div>
                  </div>

                  {/* upcoming plan */}
                  <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                    <h4 className="text-xs font-semibold text-teal-700 mb-1 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> Plan for the upcoming date
                    </h4>
                    {r.upcoming_plan ? (
                      <p className="text-sm text-teal-900">{r.upcoming_plan}</p>
                    ) : (
                      <p className="text-sm italic text-teal-700/70">No active marking — the date is held quietly by the team and not surfaced to the child.</p>
                    )}
                  </div>

                  {/* child voice */}
                  <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                    <h4 className="text-xs font-semibold text-rose-700 mb-1">Child&apos;s voice</h4>
                    <p className="text-sm italic text-rose-900">&ldquo;{r.child_voice}&rdquo;</p>
                  </div>

                  {/* staff observation */}
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-xs font-semibold text-amber-700 mb-1">Staff observation</h4>
                    <p className="text-sm text-amber-900">{r.staff_observation}</p>
                  </div>

                  {/* past approaches */}
                  <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3">
                    <h4 className="text-xs font-semibold text-indigo-700 mb-1">Past approaches used</h4>
                    <ul className="list-disc list-inside text-sm text-indigo-900 space-y-0.5">
                      {r.past_approaches_used.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>

                  {/* what works / what doesn't */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1">What works</h4>
                      <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                        {r.what_works.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                      <h4 className="text-xs font-semibold text-rose-700 mb-1">What doesn&apos;t work</h4>
                      <ul className="list-disc list-inside text-sm text-rose-900 space-y-0.5">
                        {r.what_doesnt_work.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* triggers + support */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Triggers around the date</h4>
                      <ul className="list-disc list-inside text-sm text-purple-900 space-y-0.5">
                        {r.triggers_around_date.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Support in place for the date</h4>
                      <ul className="list-disc list-inside text-sm text-blue-900 space-y-0.5">
                        {r.support_in_place_for_date.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* flags */}
                  {r.flags_for_review.length > 0 && (
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">Notes for review</h4>
                      <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5">
                        {r.flags_for_review.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="care-anniversary-record" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-gray-500">
            No records match these filters.
          </div>
        )}
      </div>

      {/* ── regulatory footer ──────────────────────────────────────── */}
      <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-4 text-sm text-teal-900 mb-6">
        <strong>Regulatory framework.</strong> Recognition of care anniversaries sits within the Children&apos;s Homes (England) Regulations 2015 — Quality Standard 6 (enjoyment &amp; achievement), Quality Standard 7 (positive relationships) and Quality Standard 8 (education). Practice is grounded in trauma-informed care, and in UNCRC Article 8 (right to identity), Article 12 (the right to be heard) and Article 16 (privacy and dignity). NICE NG196 bereavement guidance principles are applied to the grief-of-care experience — these dates are losses as well as milestones, and the child leads on whether, how, and when they are marked. A child&apos;s preference can change every year. We never assume a celebration is wanted.
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
