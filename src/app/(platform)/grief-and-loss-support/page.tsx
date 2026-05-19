"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Calendar,
  Users,
  Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { GriefRecord, LossType } from "@/types/extended";
import { LOSS_TYPE_LABEL } from "@/types/extended";
import { useGriefRecords } from "@/hooks/use-grief-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── constants ────────────────────────────────────────────────────────── */

const LOSS_TYPE_COLOURS: Record<LossType, string> = {
  bereavement: "bg-slate-100 text-[var(--cs-navy)]",
  family_separation: "bg-blue-100 text-blue-800",
  placement_move: "bg-amber-100 text-amber-800",
  pet_loss: "bg-emerald-100 text-emerald-800",
  friendship_loss: "bg-pink-100 text-pink-800",
  identity_loss: "bg-purple-100 text-purple-800",
  loss_of_routine: "bg-yellow-100 text-yellow-800",
  other: "bg-rose-100 text-rose-800",
};

/* ── export columns ────────────────────────────────────────────────────── */

const EXPORT_COLS: ExportColumn<GriefRecord>[] = [
  { header: "Young Person",         accessor: (r: GriefRecord) => getYPName(r.child_id) },
  { header: "Loss Type",            accessor: (r: GriefRecord) => LOSS_TYPE_LABEL[r.loss_type] },
  { header: "Loss Description",     accessor: (r: GriefRecord) => r.loss_description },
  { header: "Date of Loss",         accessor: (r: GriefRecord) => r.date_of_loss },
  { header: "Time Since Loss",      accessor: (r: GriefRecord) => r.time_since_loss },
  { header: "Relationship",         accessor: (r: GriefRecord) => r.child_relationship_to_loss },
  { header: "Grief Observation",    accessor: (r: GriefRecord) => r.grief_stage_observation },
  { header: "External Support",     accessor: (r: GriefRecord) => r.external_support_in_place.join("; ") },
  { header: "Home-based Support",   accessor: (r: GriefRecord) => r.home_based_support.join("; ") },
  { header: "Key Worker",           accessor: (r: GriefRecord) => r.key_worker_involvement },
  { header: "Traditions & Rituals", accessor: (r: GriefRecord) => r.traditions_and_rituals.join("; ") },
  { header: "Anniversary",          accessor: (r: GriefRecord) => r.anniversary_acknowledgement },
  { header: "Creative Outlets",     accessor: (r: GriefRecord) => r.creative_outlets.join("; ") },
  { header: "Commemoration",        accessor: (r: GriefRecord) => r.commemoration_activities.join("; ") },
  { header: "Coping Strategies",    accessor: (r: GriefRecord) => r.child_coping_strategies.join("; ") },
  { header: "Watch For",            accessor: (r: GriefRecord) => r.behaviours_to_watch_for.join("; ") },
  { header: "Review Schedule",      accessor: (r: GriefRecord) => r.review_schedule },
  { header: "Last Review",          accessor: (r: GriefRecord) => r.last_review_date },
  { header: "Reviewed By",          accessor: (r: GriefRecord) => getStaffName(r.reviewed_by) },
  { header: "Next Review",          accessor: (r: GriefRecord) => r.next_review_date },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function GriefAndLossSupportPage() {
  const { data: res, isLoading } = useGriefRecords();
  const data = res?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("review");

  const toggle = (id: string) => setExpandedId((curr) => (curr === id ? null : id));

  /* ── loading ─────────────────────────────────────────────────────── */
  if (isLoading) return <PageShell title="Grief & Loss Support" subtitle="Bereavement, separation, placement loss, pet loss and identity loss — supporting each child individually"><div className="p-8 text-center text-muted-foreground">Loading grief records…</div></PageShell>;

  /* ── stats ────────────────────────────────────────────────────────── */
  const today = new Date().toISOString().slice(0, 10);
  const d14 = new Date(); d14.setDate(d14.getDate() + 14); const d14Str = d14.toISOString().slice(0, 10);

  const stats = {
    active: data.length,
    types: new Set(data.map((r) => r.loss_type)).size,
    anniversaryActive: data.filter((r) => r.anniversary_acknowledgement && r.anniversary_acknowledgement.length > 0).length,
    reviewsDue: data.filter((r) => r.next_review_date <= d14Str).length,
  };

  /* ── filter / sort ────────────────────────────────────────────────── */
  let list = data;
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((r) =>
      getYPName(r.child_id).toLowerCase().includes(q) ||
      LOSS_TYPE_LABEL[r.loss_type].toLowerCase().includes(q) ||
      r.loss_description.toLowerCase().includes(q)
    );
  }
  if (filterType !== "all") list = list.filter((r) => r.loss_type === filterType);
  const filtered = [...list];
  switch (sortBy) {
    case "name":   filtered.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
    case "type":   filtered.sort((a, b) => a.loss_type.localeCompare(b.loss_type)); break;
    case "review": filtered.sort((a, b) => a.next_review_date.localeCompare(b.next_review_date)); break;
    case "recent": filtered.sort((a, b) => b.date_of_loss.localeCompare(a.date_of_loss)); break;
  }

  return (
    <PageShell
      title="Grief & Loss Support"
      subtitle="Bereavement, separation, placement loss, pet loss and identity loss — supporting each child individually"
      ariaContext={{ pageTitle: "Grief & Loss Support", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Grief & Loss Support" />
          <ExportButton data={data} columns={EXPORT_COLS} filename="grief-and-loss-support" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Grief Support", value: stats.active, icon: Heart, colour: "text-rose-600" },
          { label: "Loss Types Supported", value: stats.types, icon: Users, colour: "text-purple-600" },
          { label: "Anniversaries Active", value: stats.anniversaryActive, icon: Calendar, colour: "text-amber-600" },
          { label: "Reviews Due (14 d)",   value: stats.reviewsDue, icon: AlertTriangle, colour: stats.reviewsDue > 0 ? "text-amber-600" : "text-gray-400" },
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

      {/* ── tender banner ──────────────────────────────────────────── */}
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 mb-6 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-rose-900">
          <p className="font-semibold mb-1">Grief is individual, non-linear and ongoing.</p>
          <p>
            Children and young people grieve in their own way and at their own pace. There is no timetable, no
            &ldquo;right&rdquo; way to feel, and no expectation of &ldquo;moving on&rdquo;. Loss can be a death, a
            separation, a placement ending, a pet, a friendship, or a connection to identity and culture. Our role is
            to listen, to remember alongside the young person, to honour what mattered, and to be reliably present —
            on the loud days, the quiet days, and the anniversaries others may forget.
          </p>
        </div>
      </div>

      {/* ── filters / sort ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person, loss type or description…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[230px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Loss Types</SelectItem>
            {(Object.keys(LOSS_TYPE_COLOURS) as LossType[]).map((k) => <SelectItem key={k} value={k}>{LOSS_TYPE_LABEL[k]}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="review">Next Review</SelectItem>
              <SelectItem value="name">Young Person</SelectItem>
              <SelectItem value="type">Loss Type</SelectItem>
              <SelectItem value="recent">Most Recent Loss</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expandedId === r.id;
          const reviewOverdue = r.next_review_date <= today;
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Heart className="h-4 w-4 text-rose-400" />
                    <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", LOSS_TYPE_COLOURS[r.loss_type])}>
                      {LOSS_TYPE_LABEL[r.loss_type]}
                    </span>
                    {reviewOverdue && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Review overdue
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{r.time_since_loss}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* meta row */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Date of loss:</span> <span className="font-medium">{r.date_of_loss}</span></div>
                    <div><span className="text-gray-500">Last review:</span> <span className="font-medium">{r.last_review_date}</span></div>
                    <div><span className="text-gray-500">Reviewed by:</span> <span className="font-medium">{getStaffName(r.reviewed_by)}</span></div>
                    <div><span className="text-gray-500">Next review:</span> <span className={cn("font-medium", reviewOverdue ? "text-red-600" : "")}>{r.next_review_date}</span></div>
                  </div>

                  {/* loss description */}
                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Loss Description (sensitive)</h4>
                    <p className="text-sm">{r.loss_description}</p>
                  </div>

                  {/* relationship */}
                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Child&apos;s Relationship to the Loss</h4>
                    <p className="text-sm">{r.child_relationship_to_loss}</p>
                  </div>

                  {/* grief observation */}
                  <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                    <h4 className="text-xs font-semibold text-purple-700 mb-1">Grief Observation (Kübler-Ross informed, child-respectful)</h4>
                    <p className="text-sm text-purple-900">{r.grief_stage_observation}</p>
                  </div>

                  {/* support arrays — two columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">External Support in Place</h4>
                      <ul className="list-disc list-inside text-sm text-blue-900 space-y-0.5">
                        {r.external_support_in_place.map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-green-50 border border-green-200 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Home-Based Support</h4>
                      <ul className="list-disc list-inside text-sm text-green-900 space-y-0.5">
                        {r.home_based_support.map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* key worker */}
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-xs font-semibold text-amber-700 mb-1">Key Worker Involvement</h4>
                    <p className="text-sm text-amber-900">{r.key_worker_involvement}</p>
                  </div>

                  {/* traditions / anniversary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                      <h4 className="text-xs font-semibold text-rose-700 mb-1">Traditions &amp; Rituals</h4>
                      <ul className="list-disc list-inside text-sm text-rose-900 space-y-0.5">
                        {r.traditions_and_rituals.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
                      <h4 className="text-xs font-semibold text-yellow-700 mb-1">Anniversary Acknowledgement</h4>
                      <p className="text-sm text-yellow-900">{r.anniversary_acknowledgement}</p>
                    </div>
                  </div>

                  {/* creative + commemoration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Creative Outlets</h4>
                      <ul className="list-disc list-inside text-sm text-pink-900 space-y-0.5">
                        {r.creative_outlets.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1">Commemoration Activities</h4>
                      <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                        {r.commemoration_activities.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* coping + watch for */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-slate-50 border border-[var(--cs-border)] p-3">
                      <h4 className="text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Child&apos;s Coping Strategies</h4>
                      <ul className="list-disc list-inside text-sm text-[var(--cs-navy)] space-y-0.5">
                        {r.child_coping_strategies.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1">Behaviours to Watch For</h4>
                      <ul className="list-disc list-inside text-sm text-red-900 space-y-0.5">
                        {r.behaviours_to_watch_for.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* review schedule */}
                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Review Schedule</h4>
                    <p className="text-sm">{r.review_schedule}</p>
                  </div>

                  {/* smart links */}
                  <SmartLinkPanel sourceType="grief-and-loss-support" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Quality Standard 7 &amp; trauma-informed practice:</strong> The Children&apos;s Homes Regulations 2015
        require homes to help children deal with significant events in their lives, including bereavement and loss
        (Quality Standard 7 — the &ldquo;health and wellbeing&rdquo; standard). This record supports trauma-informed
        practice by recognising loss in its widest sense: deaths, separations, placement endings, family ruptures,
        pet bereavement, friendship loss and identity loss. Records are kept sensitively, reviewed regularly with the
        young person, and shared only with those who need to know in order to provide attuned care.
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Grief & Loss Support — bereavement, loss of family contact, placement loss, pet loss, therapeutic support, CAMHS referral, loss and attachment, life story, memorial activities"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
