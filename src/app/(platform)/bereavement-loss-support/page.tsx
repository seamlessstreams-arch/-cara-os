"use client";

import { useState, useMemo } from "react";
import {
  Heart,
  Flower,
  Calendar,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Users,
  BookOpen,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { BereavementLossType, GriefStage, BereavementRecord } from "@/types/extended";
import { useBereavementRecords } from "@/hooks/use-bereavement-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── label maps ──────────────────────────────────────────────────────── */

const LOSS_TYPE_LABEL: Record<BereavementLossType, string> = {
  death_of_parent: "Death of parent",
  death_of_grandparent: "Death of grandparent",
  death_of_sibling: "Death of sibling",
  death_of_friend: "Death of friend",
  death_of_pet: "Death of pet",
  loss_of_foster_carer: "Loss of foster carer",
  loss_of_birth_family_contact: "Loss of birth family contact",
  loss_of_country_community: "Loss of country/community",
  loss_of_identity: "Loss of identity",
  other_significant_loss: "Other significant loss",
};

const GRIEF_STAGE_LABEL: Record<GriefStage, string> = {
  acute: "Acute (0-3m)",
  adjusting: "Adjusting (3-12m)",
  integrated: "Integrated (12m+)",
  complicated: "Complicated grief",
};

/* ── colour maps ───────────────────────────────────────────────────── */

const LOSS_COLOURS: Record<BereavementLossType, string> = {
  death_of_parent: "bg-rose-100 text-rose-800",
  death_of_grandparent: "bg-rose-100 text-rose-800",
  death_of_sibling: "bg-rose-100 text-rose-800",
  death_of_friend: "bg-rose-100 text-rose-800",
  death_of_pet: "bg-amber-100 text-amber-800",
  loss_of_foster_carer: "bg-amber-100 text-amber-800",
  loss_of_birth_family_contact: "bg-purple-100 text-purple-800",
  loss_of_country_community: "bg-indigo-100 text-indigo-800",
  loss_of_identity: "bg-purple-100 text-purple-800",
  other_significant_loss: "bg-gray-100 text-gray-700",
};

const STAGE_COLOURS: Record<GriefStage, string> = {
  acute: "bg-rose-100 text-rose-800",
  adjusting: "bg-amber-100 text-amber-800",
  integrated: "bg-emerald-100 text-emerald-800",
  complicated: "bg-red-100 text-red-800",
};

/* ── flat row for export ───────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string;
  recordDate: string;
  lossType: string;
  personOrThing: string;
  dateOfLoss: string;
  griefStage: string;
  externalSupport: string;
  anniversaryMarked: string;
  anniversaryDate: string;
  reviewDate: string;
  keyWorker: string;
  childVoice: string;
  staffObservation: string;
}

const exportCols: ExportColumn<FlatRow>[] = [
  { header: "Young Person", accessor: (r: FlatRow) => r.youngPerson },
  { header: "Record Date", accessor: (r: FlatRow) => r.recordDate },
  { header: "Loss Type", accessor: (r: FlatRow) => r.lossType },
  { header: "Person/Thing Lost", accessor: (r: FlatRow) => r.personOrThing },
  { header: "Date of Loss", accessor: (r: FlatRow) => r.dateOfLoss },
  { header: "Grief Stage", accessor: (r: FlatRow) => r.griefStage },
  { header: "External Support", accessor: (r: FlatRow) => r.externalSupport },
  { header: "Anniversary Marked", accessor: (r: FlatRow) => r.anniversaryMarked },
  { header: "Anniversary Date", accessor: (r: FlatRow) => r.anniversaryDate },
  { header: "Review Date", accessor: (r: FlatRow) => r.reviewDate },
  { header: "Key Worker", accessor: (r: FlatRow) => r.keyWorker },
  { header: "Child Voice", accessor: (r: FlatRow) => r.childVoice },
  { header: "Staff Observation", accessor: (r: FlatRow) => r.staffObservation },
];

/* ── component ───────────────────────────────────────────────────────── */

export default function BereavementLossSupportPage() {
  const { data: brData, isLoading } = useBereavementRecords();
  const data = brData?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterLoss, setFilterLoss] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const activeGrief = data.filter((r) => r.grief_stage === "acute" || r.grief_stage === "adjusting" || r.grief_stage === "complicated").length;
    const today = new Date();
    const monthFromNow = new Date();
    monthFromNow.setDate(monthFromNow.getDate() + 30);
    const anniversariesThisMonth = data.filter((r) => {
      if (!r.anniversary_marked || !r.anniversary_date) return false;
      const ann = new Date(r.anniversary_date);
      return ann >= today && ann <= monthFromNow;
    }).length;
    const externalEngaged = data.filter((r) => r.external_support && r.external_support.length > 0).length;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const reviewsDue = data.filter((r) => r.review_date <= thirtyDaysFromNow.toISOString().slice(0, 10)).length;
    return { activeGrief, anniversariesThisMonth, externalEngaged, reviewsDue };
  }, [data]);

  /* ── filter / sort ────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        r.person_or_thing.toLowerCase().includes(q) ||
        LOSS_TYPE_LABEL[r.loss_type].toLowerCase().includes(q) ||
        r.relationship.toLowerCase().includes(q)
      );
    }
    if (filterLoss !== "all") list = list.filter((r) => r.loss_type === filterLoss);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.record_date.localeCompare(a.record_date)); break;
      case "child": out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
      case "stage": out.sort((a, b) => a.grief_stage.localeCompare(b.grief_stage)); break;
      case "review": out.sort((a, b) => a.review_date.localeCompare(b.review_date)); break;
    }
    return out;
  }, [data, search, filterLoss, sortBy]);

  /* ── export rows ──────────────────────────────────────────────────── */
  const exportRows = useMemo<FlatRow[]>(() =>
    data.map((r) => ({
      youngPerson: getYPName(r.child_id),
      recordDate: r.record_date,
      lossType: LOSS_TYPE_LABEL[r.loss_type],
      personOrThing: r.person_or_thing,
      dateOfLoss: r.date_of_loss ?? "",
      griefStage: GRIEF_STAGE_LABEL[r.grief_stage],
      externalSupport: r.external_support ?? "",
      anniversaryMarked: r.anniversary_marked ? "Yes" : "No",
      anniversaryDate: r.anniversary_date ?? "",
      reviewDate: r.review_date,
      keyWorker: getStaffName(r.key_worker),
      childVoice: r.child_voice,
      staffObservation: r.staff_observation,
    })), [data]);

  const lossTypes: BereavementLossType[] = [
    "death_of_parent", "death_of_grandparent", "death_of_sibling", "death_of_friend",
    "death_of_pet", "loss_of_foster_carer", "loss_of_birth_family_contact",
    "loss_of_country_community", "loss_of_identity", "other_significant_loss",
  ];

  if (isLoading) {
    return (
      <PageShell title="Bereavement &amp; Loss Support" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Bereavement &amp; Loss Support"
      subtitle="Holding space for grief — child-led, trauma-informed support across every kind of loss"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Bereavement & Loss Support" />
          <ExportButton data={exportRows} columns={exportCols} filename="bereavement-loss-support" />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active grief work", value: stats.activeGrief, icon: Heart, colour: "text-rose-600" },
          { label: "Anniversaries this month", value: stats.anniversariesThisMonth, icon: Calendar, colour: stats.anniversariesThisMonth > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "External support engaged", value: stats.externalEngaged, icon: Users, colour: "text-purple-600" },
          { label: "Reviews due (30d)", value: stats.reviewsDue, icon: AlertTriangle, colour: stats.reviewsDue > 0 ? "text-amber-600" : "text-gray-400" },
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
          <Flower className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Holding grief together.</strong> Children in our care carry losses that often go unnamed — birth family, foster carers, pets, identity, country, community. This page records how we walk alongside them. Every entry is led by the child&apos;s voice, paced by their needs, and held with dignity.
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
            placeholder="Search by child, loss, or relationship…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterLoss} onValueChange={setFilterLoss}>
          <SelectTrigger className="w-[230px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All loss types</SelectItem>
            {lossTypes.map((lt) => <SelectItem key={lt} value={lt}>{LOSS_TYPE_LABEL[lt]}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most recent</SelectItem>
              <SelectItem value="child">Child name</SelectItem>
              <SelectItem value="stage">Grief stage</SelectItem>
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
            <div key={r.id} className="rounded-lg border border-rose-100 bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-rose-50/40"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Heart className="h-4 w-4 text-rose-400" />
                    <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                    <span className="text-sm text-gray-600">— {r.person_or_thing}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", LOSS_COLOURS[r.loss_type])}>{LOSS_TYPE_LABEL[r.loss_type]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STAGE_COLOURS[r.grief_stage])}>{GRIEF_STAGE_LABEL[r.grief_stage]}</span>
                    {r.anniversary_marked && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Anniversary {r.anniversary_date ?? "—"}
                      </span>
                    )}
                    {r.flags_for_review.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {r.flags_for_review.length} flag{r.flags_for_review.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Recorded {r.record_date} · Key worker {getStaffName(r.key_worker)} · Review {r.review_date}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />}
              </button>

              {open && (
                <div className="border-t border-rose-100 px-4 pb-4 space-y-4">
                  {/* relationship */}
                  <div className="rounded-md bg-gray-50 p-3 mt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Relationship &amp; context</h4>
                    <p className="text-sm">{r.relationship}</p>
                    {r.date_of_loss && (
                      <p className="text-xs text-gray-500 mt-1">Date of loss: {r.date_of_loss}</p>
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

                  {/* responses + support */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-blue-50 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">How the child has responded</h4>
                      <ul className="list-disc list-inside text-sm text-blue-900 space-y-0.5">
                        {r.child_response.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-emerald-50 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1">Support provided</h4>
                      <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                        {r.support_provided.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* memory work */}
                  <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                    <h4 className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
                      <Flower className="h-3.5 w-3.5" /> Memory work
                    </h4>
                    <ul className="list-disc list-inside text-sm text-purple-900 space-y-0.5">
                      {r.memory_work.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>

                  {/* external + anniversary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3">
                      <h4 className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" /> External support
                      </h4>
                      <p className="text-sm text-indigo-900">
                        {r.external_support ?? <span className="italic text-indigo-700/70">No external support engaged at this time.</span>}
                      </p>
                    </div>
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Anniversary
                      </h4>
                      {r.anniversary_marked && r.anniversary_date ? (
                        <p className="text-sm text-amber-900">Marked annually — next: <span className="font-medium">{r.anniversary_date}</span></p>
                      ) : (
                        <p className="text-sm italic text-amber-700/70">Not currently marked. Will revisit with the child as part of review.</p>
                      )}
                    </div>
                  </div>

                  {/* flags */}
                  {r.flags_for_review.length > 0 && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Flags for review
                      </h4>
                      <ul className="list-disc list-inside text-sm text-red-900 space-y-0.5">
                        {r.flags_for_review.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* smart links */}
                  <SmartLinkPanel sourceType="bereavement_record" sourceId={r.id} childId={r.child_id} compact />
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
      <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-900 mb-6">
        <strong>Regulatory framework.</strong> Bereavement and loss support is held within the Children&apos;s Homes (England) Regulations 2015 — particularly Quality Standard 6 (enjoyment &amp; achievement) and Quality Standard 7 (positive relationships). Practice draws on Working Together to Safeguard Children 2023, UNCRC Article 12 (the right to be heard) and Article 16 (privacy and dignity), and NICE guidance on bereavement (NG196). All grief work is child-led, paced by the young person, and recognises the breadth of loss experienced by children in care — including disenfranchised grief that the wider world may not see.
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
