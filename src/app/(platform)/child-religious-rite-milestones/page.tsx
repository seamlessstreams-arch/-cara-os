"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useRiteRecords } from "@/hooks/use-rite-records";
import type { RiteRecord, RiteFaithTradition, RiteStatus, RiteChildChoice } from "@/types/extended";
import {
  RITE_FAITH_TRADITION_LABEL,
  RITE_STATUS_LABEL,
  RITE_CHILD_CHOICE_LABEL,
} from "@/types/extended";
import {
  Sparkles,
  Star,
  Heart,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Calendar,
  Award,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const exportCols: ExportColumn<RiteRecord>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Recorded Date", accessor: (r) => r.recorded_date },
  { header: "Rite", accessor: (r) => r.rite_name },
  { header: "Faith Tradition", accessor: (r) => RITE_FAITH_TRADITION_LABEL[r.faith_tradition] },
  { header: "Age at Rite", accessor: (r) => r.child_age_at_rite !== undefined ? String(r.child_age_at_rite) : "—" },
  { header: "Status", accessor: (r) => RITE_STATUS_LABEL[r.status] },
  { header: "Child Choice", accessor: (r) => RITE_CHILD_CHOICE_LABEL[r.child_choice] },
  { header: "Significance", accessor: (r) => r.significance },
  { header: "Officiant", accessor: (r) => r.who_officiates ?? "—" },
  { header: "Venue", accessor: (r) => r.venue ?? "—" },
  { header: "Guests", accessor: (r) => r.guests_involved.join("; ") },
  { header: "Home Support", accessor: (r) => r.home_support_provided.join("; ") },
  { header: "Cost / Funding", accessor: (r) => r.cost_funding ? `£${r.cost_funding.amount.toFixed(2)} (${r.cost_funding.source})` : "—" },
  { header: "Birth Family Involvement", accessor: (r) => r.birth_family_involvement ?? "—" },
  { header: "Record Kept", accessor: (r) => r.record_kept.join("; ") },
  { header: "Child Voice", accessor: (r) => r.child_voice },
  { header: "Staff Observation", accessor: (r) => r.staff_observation },
  { header: "Flags for Review", accessor: (r) => r.flags_for_review.join("; ") },
  { header: "Review Date", accessor: (r) => r.review_date },
  { header: "Key Worker", accessor: (r) => getStaffName(r.key_worker) },
];

const faithColour: Record<RiteFaithTradition, string> = {
  islam: "bg-emerald-100 text-emerald-800 border-emerald-200",
  christianity: "bg-rose-100 text-rose-800 border-rose-200",
  judaism: "bg-blue-100 text-blue-800 border-blue-200",
  hinduism: "bg-amber-100 text-amber-800 border-amber-200",
  sikhism: "bg-orange-100 text-orange-800 border-orange-200",
  buddhism: "bg-yellow-100 text-yellow-800 border-yellow-200",
  rastafari: "bg-green-100 text-green-800 border-green-200",
  multi_faith_family_choice: "bg-purple-100 text-purple-800 border-purple-200",
  other: "bg-slate-100 text-slate-800 border-slate-200",
};

const statusColour: Record<RiteStatus, string> = {
  already_done_pre_care: "bg-teal-100 text-teal-800 border-teal-200",
  planned_with_home_support: "bg-amber-100 text-amber-800 border-amber-200",
  considering_child_led: "bg-sky-100 text-sky-800 border-sky-200",
  declined_by_child: "bg-slate-100 text-slate-700 border-slate-200",
  postponed: "bg-stone-100 text-stone-800 border-stone-200",
  not_applicable: "bg-slate-100 text-slate-600 border-slate-200",
  done_in_care: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const choiceColour: Record<RiteChildChoice, string> = {
  strongly_chose: "bg-rose-100 text-rose-800 border-rose-200",
  family_influenced_choice: "bg-amber-100 text-amber-800 border-amber-200",
  choosing_between_options: "bg-sky-100 text-sky-800 border-sky-200",
  not_yet_old_enough_to_choose: "bg-slate-100 text-slate-700 border-slate-200",
};

const dFromNow = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

export default function ChildReligiousRiteMilestonesPage() {
  const { data: res, isLoading } = useRiteRecords();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [search, setSearch] = useState("");
  const [faithFilter, setFaithFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "rite" | "faith" | "child">("recent");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        rec.rite_name.toLowerCase().includes(search.toLowerCase()) ||
        rec.significance.toLowerCase().includes(search.toLowerCase()) ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase());
      const matchesFaith = faithFilter === "all" || rec.faith_tradition === faithFilter;
      return matchesSearch && matchesFaith;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "rite") return a.rite_name.localeCompare(b.rite_name);
      if (sortBy === "faith") return a.faith_tradition.localeCompare(b.faith_tradition);
      if (sortBy === "child") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      return b.recorded_date.localeCompare(a.recorded_date);
    });
    return r;
  }, [records, search, faithFilter, sortBy]);

  const stats = useMemo(() => {
    const total = records.length;
    const planned = records.filter((r) => r.status === "planned_with_home_support" || r.status === "done_in_care").length;
    const childChose = records.filter((r) => r.child_choice === "strongly_chose").length;
    const reviewSoon = records.filter((r) => r.review_date <= dFromNow(90) && r.review_date >= dFromNow(0)).length;
    return { total, planned, childChose, reviewSoon };
  }, [records]);

  if (isLoading) {
    return (
      <PageShell title="Religious Rites & Milestones" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Religious Rites & Milestones"
      subtitle="Per-child rite-of-passage record — honouring faith milestones in care, including those that pre-date the placement"
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-religious-rite-milestones" />
          <PrintButton title="Religious Rites & Milestones" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800 text-sm mb-1">
            <Award className="h-4 w-4" />
            <span>Rites recorded</span>
          </div>
          <div className="text-2xl font-semibold text-amber-900">{stats.total}</div>
        </div>
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center gap-2 text-teal-800 text-sm mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Planned / done in care</span>
          </div>
          <div className="text-2xl font-semibold text-teal-900">{stats.planned}</div>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-rose-800 text-sm mb-1">
            <Heart className="h-4 w-4" />
            <span>Child strongly chose</span>
          </div>
          <div className="text-2xl font-semibold text-rose-900">{stats.childChose}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Reviews due (90d)</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.reviewSoon}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rite, child or significance..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={faithFilter} onValueChange={setFaithFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Faith tradition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All faith traditions</SelectItem>
            {Object.entries(RITE_FAITH_TRADITION_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-52">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recently recorded</SelectItem>
            <SelectItem value="rite">Rite name A→Z</SelectItem>
            <SelectItem value="faith">Faith A→Z</SelectItem>
            <SelectItem value="child">Child A→Z</SelectItem>
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
                    <Star className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="font-semibold text-slate-900">{r.rite_name}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", faithColour[r.faith_tradition])}>{RITE_FAITH_TRADITION_LABEL[r.faith_tradition]}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", statusColour[r.status])}>{RITE_STATUS_LABEL[r.status]}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", choiceColour[r.child_choice])}>{RITE_CHILD_CHOICE_LABEL[r.child_choice]}</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    {getYPName(r.child_id)}
                    {r.child_age_at_rite !== undefined ? ` · age ${r.child_age_at_rite} at rite` : ""}
                    {" · recorded "}
                    {r.recorded_date} · review {r.review_date}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Rite & significance</div>
                      <div className="text-sm font-semibold text-amber-900 mb-1">{r.rite_name}</div>
                      <p className="text-sm text-amber-900">{r.significance}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Preparation</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.preparation.map((t, i) => (
                          <li key={i} className="flex gap-2"><span className="text-slate-400">·</span><span>{t}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Officiant & venue</div>
                      <div className="text-sm text-slate-700 space-y-1">
                        <div><span className="text-slate-500">Officiant: </span><span>{r.who_officiates ?? "—"}</span></div>
                        <div><span className="text-slate-500">Venue: </span><span>{r.venue ?? "—"}</span></div>
                      </div>
                    </div>
                    {r.guests_involved.length ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Guests involved</div>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {r.guests_involved.map((t, i) => (
                            <li key={i} className="flex gap-2"><span className="text-slate-400">·</span><span>{t}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-teal-200 bg-teal-50 p-3">
                      <div className="text-xs font-semibold text-teal-800 uppercase mb-2">Home support provided</div>
                      <ul className="text-sm text-teal-900 space-y-1">
                        {r.home_support_provided.map((t, i) => (
                          <li key={i} className="flex gap-2"><span className="text-teal-500">·</span><span>{t}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Cost / funding</div>
                      <p className="text-sm text-slate-700">{r.cost_funding ? `£${r.cost_funding.amount.toFixed(2)} — ${r.cost_funding.source}` : "No cost / not applicable"}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Child choice</div>
                      <p className="text-sm text-slate-700">{RITE_CHILD_CHOICE_LABEL[r.child_choice]}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Birth family involvement</div>
                      <p className="text-sm text-slate-700">{r.birth_family_involvement ?? "—"}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Record kept (where stored)</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.record_kept.map((t, i) => (
                          <li key={i} className="flex gap-2"><span className="text-amber-500">·</span><span>{t}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                      <div className="text-xs font-semibold text-rose-800 uppercase mb-2">Child voice</div>
                      <p className="text-sm text-rose-900 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff observation</div>
                      <p className="text-sm text-slate-700">{r.staff_observation}</p>
                    </div>
                    {r.flags_for_review.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Flags for review</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.flags_for_review.map((t, i) => (
                            <li key={i} className="flex gap-2"><span>→</span><span>{t}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Recorded: {r.recorded_date}</span>
                      <span>Review: {r.review_date}</span>
                      <span>Key worker: {getStaffName(r.key_worker)}</span>
                    </div>
                    <div className="lg:col-span-2">
                      <SmartLinkPanel sourceType="rite-records" sourceId={r.id} childId={r.child_id} compact />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Religious rites and rite-of-passage milestones are recorded with dignity, including those completed before the
          child entered care. Practice is grounded in the Children&rsquo;s Homes (England) Regulations 2015 Quality
          Standards 6 (Enjoyment &amp; Achievement) and 7 (Health &amp; Wellbeing), the Equality Act 2010 (religion or
          belief), and the home&rsquo;s Statement of Purpose. UNCRC Articles 8 (preservation of identity), 14 (freedom
          of thought, conscience and religion) and 30 (cultural and religious identity), together with Working Together
          to Safeguard Children 2023, frame the duty to honour each child&rsquo;s faith heritage. Rites are recorded —
          never imposed — and the child&rsquo;s own voice and pace lead the work. This page is distinct from the
          Religious Festival Celebrations record (annual events) and the Religious Observance Log (daily prayer and
          practice).
        </p>
      </div>
    </PageShell>
  );
}
