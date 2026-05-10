"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useVolunteerRecords } from "@/hooks/use-volunteer-records";
import type { VolunteerRecord } from "@/types/extended";
import { VOLUNTEER_CATEGORY_LABEL } from "@/types/extended";
import {
  Heart,
  Users,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
  Calendar,
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
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const exportCols: ExportColumn<VolunteerRecord>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Activity", accessor: (r) => r.activity },
  { header: "Category", accessor: (r) => VOLUNTEER_CATEGORY_LABEL[r.category] },
  { header: "Organisation", accessor: (r) => r.organisation ?? "—" },
  { header: "Start", accessor: (r) => r.start_date },
  { header: "Ongoing", accessor: (r) => (r.ongoing ? "Yes" : "No") },
  { header: "Hours This Month", accessor: (r) => `${r.hours_this_month}` },
  { header: "Hours Total", accessor: (r) => `${r.hours_total}` },
  { header: "Child Initiated", accessor: (r) => (r.child_initiated ? "Yes" : "No") },
  { header: "Skills Built", accessor: (r) => r.skills_built.join("; ") },
  { header: "Funds Raised", accessor: (r) => (r.funds_raised ? `£${r.funds_raised.toFixed(2)}` : "—") },
  { header: "Recognition", accessor: (r) => r.recognition_received.join("; ") },
  { header: "Risk Assessed", accessor: (r) => (r.risk_assessment_done ? "Yes" : "No") },
  { header: "Safeguarding Checked", accessor: (r) => (r.safeguarding_checked ? "Yes" : "No") },
  { header: "On CV", accessor: (r) => (r.cv_added_to ? "Yes" : "No") },
  { header: "Child Voice", accessor: (r) => r.child_voice },
  { header: "Review", accessor: (r) => r.review_date },
  { header: "Key Worker", accessor: (r) => getStaffName(r.key_worker) },
];

const categoryColour: Record<string, string> = {
  charity_fundraising: "bg-pink-100 text-pink-800 border-pink-200",
  community_volunteering: "bg-emerald-100 text-emerald-800 border-emerald-200",
  mosque_temple_church: "bg-amber-100 text-amber-800 border-amber-200",
  sport_coaching_refereeing: "bg-blue-100 text-blue-800 border-blue-200",
  animal_welfare: "bg-teal-100 text-teal-800 border-teal-200",
  environmental: "bg-green-100 text-green-800 border-green-200",
  befriending_mentoring: "bg-violet-100 text-violet-800 border-violet-200",
  youth_advocacy: "bg-purple-100 text-purple-800 border-purple-200",
  school_peer_support: "bg-sky-100 text-sky-800 border-sky-200",
  other: "bg-slate-100 text-slate-800 border-slate-200",
};

export default function ChildVolunteeringCharityPage() {
  const { data: res, isLoading } = useVolunteerRecords();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "hours" | "category">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        rec.activity.toLowerCase().includes(search.toLowerCase()) ||
        (rec.organisation ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || rec.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      if (sortBy === "hours") return b.hours_total - a.hours_total;
      if (sortBy === "category") return a.category.localeCompare(b.category);
      return b.recorded_date.localeCompare(a.recorded_date);
    });
    return r;
  }, [records, search, categoryFilter, sortBy]);

  const stats = useMemo(() => {
    const ongoing = records.filter((r) => r.ongoing).length;
    const totalHours = records.reduce((acc, r) => acc + r.hours_total, 0);
    const totalRaised = records.reduce((acc, r) => acc + (r.funds_raised ?? 0), 0);
    const childInitiated = records.filter((r) => r.child_initiated).length;
    return { ongoing, totalHours, totalRaised, childInitiated };
  }, [records]);

  if (isLoading) {
    return (
      <PageShell title="Volunteering & Charity Activity" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Volunteering & Charity Activity"
      subtitle="Per-child volunteering and community contribution — sport coaching, faith community, animal welfare, peer advocacy, charity fundraising. Children in care give as much as they receive — this evidences it. Builds CV, identity, and citizenship."
      ariaContext={{ pageTitle: "Volunteering & Charity Activity", sourceType: "child_record" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-volunteering-charity" />
          <PrintButton title="Volunteering & Charity Activity" />
          <AriaStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Heart className="h-4 w-4" />
            <span>Ongoing roles</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.ongoing}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Total hours</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.totalHours}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Award className="h-4 w-4" />
            <span>Funds raised</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">£{stats.totalRaised.toFixed(0)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Child-initiated</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.childInitiated}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person, activity, organisation..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.entries(VOLUNTEER_CATEGORY_LABEL).map(([k, v]) => (
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
            <SelectItem value="hours">Total hours</SelectItem>
            <SelectItem value="category">Category</SelectItem>
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
                    <span className="text-slate-700">{r.activity}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", categoryColour[r.category] ?? "bg-slate-100 text-slate-800 border-slate-200")}>
                      {VOLUNTEER_CATEGORY_LABEL[r.category]}
                    </span>
                    {r.ongoing ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
                        Ongoing
                      </span>
                    ) : null}
                    {r.funds_raised ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-pink-100 text-pink-800 border-pink-200">
                        £{r.funds_raised.toFixed(0)} raised
                      </span>
                    ) : null}
                    {r.child_initiated ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-purple-100 text-purple-800 border-purple-200">
                        Child-initiated
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    {r.organisation ?? "—"} · {r.hours_total} hours total · {getStaffName(r.key_worker)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-pink-200 bg-pink-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-pink-700 uppercase mb-2">Why I do this</div>
                      <p className="text-sm text-pink-900 italic">&ldquo;{r.motivation_stated}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-slate-700 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-slate-700">{r.staff_observation}</p>
                    </div>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Skills built</div>
                      <ul className="text-sm text-emerald-900 space-y-1">
                        {r.skills_built.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>+</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                      <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Recognition received</div>
                      <ul className="text-sm text-amber-900 space-y-1">
                        {r.recognition_received.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>★</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Context</div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                        <div><span className="text-slate-500">Started:</span> {r.start_date}</div>
                        <div><span className="text-slate-500">Hours this month:</span> {r.hours_this_month}</div>
                        <div><span className="text-slate-500">Hours total:</span> {r.hours_total}</div>
                        <div><span className="text-slate-500">Status:</span> {r.ongoing ? "Ongoing" : `Ended ${r.end_date ?? ""}`}</div>
                        {r.beneficiaries_reached ? (
                          <div className="col-span-2"><span className="text-slate-500">Beneficiaries:</span> {r.beneficiaries_reached}</div>
                        ) : null}
                        <div><span className="text-slate-500">Risk assessed:</span> {r.risk_assessment_done ? "Yes" : "No"}</div>
                        <div><span className="text-slate-500">Safeguarding checked:</span> {r.safeguarding_checked ? "Yes" : "No"}</div>
                        <div><span className="text-slate-500">CV added to:</span> {r.cv_added_to ? "Yes" : "Not yet"}</div>
                        <div><span className="text-slate-500">Review:</span> {r.review_date}</div>
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      <SmartLinkPanel sourceType="volunteer-records" sourceId={r.id} childId={r.child_id} compact />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-pink-200 bg-pink-50 p-4 text-sm text-pink-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Children in care give as much as they receive. Practice is grounded in Quality Standards 5 (Education),
          6 (Enjoyment & Achievement) and 7 (Positive Relationships), the Pathway Plan duty for over-16s,
          UNCRC Articles 12 (voice), 13 (expression), 15 (freedom of association), and 31 (rest, play, leisure).
          Volunteering activities are risk-assessed, the host organisation safeguarding-checked, and the child&rsquo;s
          consent and pace are central. Recognition is logged formally for college / job applications.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Volunteering & Charity Activity — community involvement, Duke of Edinburgh, charity fundraising, food banks, befriending schemes, personal development, citizenship, leaving care preparation"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
