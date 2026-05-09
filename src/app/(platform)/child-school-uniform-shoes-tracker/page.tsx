"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useUniformRecords } from "@/hooks/use-uniform-records";
import type { UniformRecord, UniformCategory, UniformItemCondition } from "@/types/extended";
import {
  UNIFORM_CATEGORY_LABEL,
  UNIFORM_ITEM_CONDITION_LABEL,
  UNIFORM_FUNDING_SOURCE_LABEL,
} from "@/types/extended";
import {
  Shirt,
  Footprints,
  ShoppingBag,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Calendar,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const exportCols: ExportColumn<UniformRecord>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Date", accessor: (r) => r.recorded_date },
  { header: "Category", accessor: (r) => UNIFORM_CATEGORY_LABEL[r.category] },
  { header: "Items", accessor: (r) => r.item_details.map((i) => `${i.item} (${i.size}, ${UNIFORM_ITEM_CONDITION_LABEL[i.condition]})`).join("; ") },
  { header: "Total Cost", accessor: (r) => `£${r.total_cost_this_record.toFixed(2)}` },
  { header: "Funding Source", accessor: (r) => UNIFORM_FUNDING_SOURCE_LABEL[r.funding_source] },
  { header: "Child Chose Style", accessor: (r) => r.child_chose_style ? "Yes" : "No" },
  { header: "Child Chose Shop", accessor: (r) => r.child_chose_shop ? "Yes" : "No" },
  { header: "Shopping Trip", accessor: (r) => r.shopping_trip ?? "—" },
  { header: "Sensory Considerations", accessor: (r) => r.sensory_considerations.join("; ") },
  { header: "Shoe Size", accessor: (r) => r.shoe_size ?? "—" },
  { header: "Growth", accessor: (r) => r.growth_note_cm ?? "—" },
  { header: "Next Anticipated", accessor: (r) => r.next_size_anticipated },
  { header: "Review Date", accessor: (r) => r.next_review_date },
  { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
];

const conditionColour: Record<UniformItemCondition, string> = {
  new: "bg-emerald-100 text-emerald-800 border-emerald-200",
  good: "bg-blue-100 text-blue-800 border-blue-200",
  worn_fits: "bg-sky-100 text-sky-800 border-sky-200",
  worn_getting_tight: "bg-amber-100 text-amber-800 border-amber-200",
  outgrown: "bg-orange-100 text-orange-800 border-orange-200",
  damaged: "bg-red-100 text-red-800 border-red-200",
};

const categoryColour: Record<UniformCategory, string> = {
  school_uniform: "bg-blue-100 text-blue-800 border-blue-200",
  pe_kit: "bg-emerald-100 text-emerald-800 border-emerald-200",
  school_shoes: "bg-amber-100 text-amber-800 border-amber-200",
  trainers: "bg-violet-100 text-violet-800 border-violet-200",
  coat_outerwear: "bg-sky-100 text-sky-800 border-sky-200",
  casual_clothing_audit: "bg-rose-100 text-rose-800 border-rose-200",
  bag_equipment: "bg-slate-100 text-slate-800 border-slate-200",
};

const dFromNow = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

export default function ChildSchoolUniformShoesTrackerPage() {
  const { data: res, isLoading } = useUniformRecords();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "category" | "review">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        UNIFORM_CATEGORY_LABEL[rec.category].toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || rec.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      if (sortBy === "category") return a.category.localeCompare(b.category);
      if (sortBy === "review") return a.next_review_date.localeCompare(b.next_review_date);
      return b.recorded_date.localeCompare(a.recorded_date);
    });
    return r;
  }, [records, search, categoryFilter, sortBy]);

  const stats = useMemo(() => {
    const totalSpent = records.reduce((acc, r) => acc + r.total_cost_this_record, 0);
    const flagsRaised = records.reduce((acc, r) => acc + r.flags_concerns.length, 0);
    const childChoseAll = records.filter((r) => r.child_chose_style && r.child_chose_shop).length;
    const reviewsDue = records.filter((r) => r.next_review_date <= dFromNow(60)).length;
    return { totalSpent, flagsRaised, childChoseAll, reviewsDue };
  }, [records]);

  if (isLoading) {
    return (
      <PageShell title="School Uniform & Shoes Tracker" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="School Uniform & Shoes Tracker"
      subtitle="Per-child school clothing — uniform, PE kit, shoes, trainers, outerwear. Sensory considerations, child-chosen styles, growth tracking, sustainable funding (Pupil Premium Plus, Virtual School grant, leaving care fund, school uniform exchange)."
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-school-uniform-shoes-tracker" />
          <PrintButton title="School Uniform & Shoes Tracker" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <ShoppingBag className="h-4 w-4" />
            <span>Spent (recorded)</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">£{stats.totalSpent.toFixed(0)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Shirt className="h-4 w-4" />
            <span>Child-chose all</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.childChoseAll}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Flags / replacements</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.flagsRaised}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Reviews due (60d)</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.reviewsDue}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person or category..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.entries(UNIFORM_CATEGORY_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="name">Young person A→Z</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="review">Review date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-slate-50 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-900">{getYPName(r.child_id)}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", categoryColour[r.category])}>{UNIFORM_CATEGORY_LABEL[r.category]}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">£{r.total_cost_this_record.toFixed(2)} this record</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-violet-100 text-violet-800 border-violet-200">{UNIFORM_FUNDING_SOURCE_LABEL[r.funding_source]}</span>
                    {r.child_chose_style && r.child_chose_shop ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-pink-100 text-pink-800 border-pink-200">Child-led</span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    Recorded {r.recorded_date} · Review {r.next_review_date} · {getStaffName(r.recorded_by)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <Footprints className="h-3.5 w-3.5" /> Items
                      </div>
                      <div className="space-y-1.5">
                        {r.item_details.map((it, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="flex-1 text-slate-800">{it.item}</span>
                            <span className="text-xs text-slate-500">{it.size}</span>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full border", conditionColour[it.condition])}>{UNIFORM_ITEM_CONDITION_LABEL[it.condition]}</span>
                            {it.cost !== undefined ? <span className="text-xs text-slate-500">£{it.cost.toFixed(2)}</span> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                    {r.sensory_considerations.length ? (
                      <div className="rounded-md border border-violet-200 bg-violet-50 p-3">
                        <div className="text-xs font-semibold text-violet-700 uppercase mb-2">Sensory considerations</div>
                        <ul className="text-sm text-violet-900 space-y-1">
                          {r.sensory_considerations.map((s, i) => (
                            <li key={i} className="flex gap-2"><span>·</span><span>{s}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.child_comfort_notes ? (
                      <div className="rounded-md border border-pink-200 bg-pink-50 p-3">
                        <div className="text-xs font-semibold text-pink-700 uppercase mb-2">Child comfort notes</div>
                        <p className="text-sm text-pink-900">{r.child_comfort_notes}</p>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Growth & next review</div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                        {r.shoe_size ? <div><span className="text-slate-500">Shoe size:</span> {r.shoe_size}</div> : null}
                        {r.growth_note_cm ? <div><span className="text-slate-500">Growth note:</span> {r.growth_note_cm}</div> : null}
                        <div><span className="text-slate-500">Next anticipated:</span> {r.next_size_anticipated}</div>
                        <div><span className="text-slate-500">School uniform policy met:</span> {r.school_uniform_policy_met ? "Yes" : "No"}</div>
                        {r.shopping_trip ? <div className="col-span-2"><span className="text-slate-500">Shopping trip:</span> {r.shopping_trip}</div> : null}
                      </div>
                    </div>
                    {r.flags_concerns.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Flags / replacements due</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.flags_concerns.map((f, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="lg:col-span-2">
                      <SmartLinkPanel sourceType="uniform-records" sourceId={r.id} childId={r.child_id} compact />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Looked-after children must never wear ill-fitting, mismatched, or visibly outgrown school clothing.
          Practice is grounded in Quality Standard 6 (Enjoyment & Achievement) and 7 (Positive Relationships),
          Pupil Premium Plus (DfE), the Virtual School Head duty (s.20 Children and Young Persons Act 2008), the
          Education (School Day and School Year) Regulations 1999 (uniform fairness), and gender-affirming uniform
          provision under the Equality Act 2010. Sustainable choices (school uniform exchange, second-hand) are
          considered alongside dignity. UNCRC Articles 12 (voice) + 28 (education).
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
