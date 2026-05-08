"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Sun,
  MapPin,
  Heart,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Camera,
  Star,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHolidayRecords } from "@/hooks/use-holiday-records";
import type { HolidayRecord, HolidayPeriod } from "@/types/extended";
import { HOLIDAY_PERIOD_LABEL } from "@/types/extended";

const periodColour: Record<HolidayPeriod, string> = {
  summer: "bg-amber-100 text-amber-800 border-amber-200",
  easter: "bg-pink-100 text-pink-800 border-pink-200",
  christmas: "bg-red-100 text-red-800 border-red-200",
  october_half_term: "bg-orange-100 text-orange-800 border-orange-200",
  february_half_term: "bg-sky-100 text-sky-800 border-sky-200",
  may_half_term: "bg-emerald-100 text-emerald-800 border-emerald-200",
  bank_holiday: "bg-slate-100 text-slate-800 border-slate-200",
  other: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function ChildSummerHolidayRecordPage() {
  const { data: res, isLoading } = useHolidayRecords();
  const data: HolidayRecord[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "duration" | "child">("recent");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = data.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        rec.destinations.some((d) => d.toLowerCase().includes(search.toLowerCase())) ||
        rec.child_memory_headline.toLowerCase().includes(search.toLowerCase());
      const matchesPeriod = periodFilter === "all" || rec.holiday_period === periodFilter;
      return matchesSearch && matchesPeriod;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "duration") return b.duration_days - a.duration_days;
      if (sortBy === "child") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      return b.review_date.localeCompare(a.review_date);
    });
    return r;
  }, [data, search, periodFilter, sortBy]);

  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear().toString();
    const ytd = data.filter((r) => r.year === currentYear).length;
    const photosKept = data.filter((r) => r.photos_taken).length;
    const childChose = data.filter((r) => r.child_chose_destination).length;
    const totalSpent = data.reduce((acc, r) => acc + r.cost_spent, 0);
    return { ytd, photosKept, childChose, totalSpent };
  }, [data]);

  const exportCols: ExportColumn<HolidayRecord>[] = [
    { header: "Young Person", accessor: (r: HolidayRecord) => getYPName(r.child_id) },
    { header: "Period", accessor: (r: HolidayRecord) => HOLIDAY_PERIOD_LABEL[r.holiday_period] },
    { header: "Year", accessor: (r: HolidayRecord) => r.year },
    { header: "Duration (days)", accessor: (r: HolidayRecord) => r.duration_days.toString() },
    { header: "Destinations", accessor: (r: HolidayRecord) => r.destinations.join("; ") },
    { header: "With Whom", accessor: (r: HolidayRecord) => r.with_whom.join("; ") },
    { header: "Cost Spent", accessor: (r: HolidayRecord) => `£${r.cost_spent.toFixed(2)}` },
    { header: "Funding", accessor: (r: HolidayRecord) => r.funding_source },
    { header: "Child Chose", accessor: (r: HolidayRecord) => (r.child_chose_destination ? "Yes" : "No") },
    { header: "Highlights", accessor: (r: HolidayRecord) => r.highlights.join("; ") },
    { header: "Challenges", accessor: (r: HolidayRecord) => r.challenges_noted.join("; ") },
    { header: "Photos Kept", accessor: (r: HolidayRecord) => (r.photos_taken ? "Yes" : "No") },
    { header: "Photos Location", accessor: (r: HolidayRecord) => r.photos_location ?? "—" },
    { header: "Child Memory Headline", accessor: (r: HolidayRecord) => r.child_memory_headline },
    { header: "Child Voice", accessor: (r: HolidayRecord) => r.child_voice },
    { header: "Staff Observation", accessor: (r: HolidayRecord) => r.staff_observation },
    { header: "Review Date", accessor: (r: HolidayRecord) => r.review_date },
    { header: "Recorded By", accessor: (r: HolidayRecord) => getStaffName(r.recorded_by) },
  ];

  if (isLoading) return <PageShell title="Child Summer / Holiday Record" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Child Summer / Holiday Record"
      subtitle="The annual narrative — trips, places, friends, photos, what worked and what didn't. Child-led memory keeping, distinct from operational holiday planning."
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-summer-holiday-record" />
          <PrintButton title="Holiday Records" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800 text-sm mb-1">
            <Sun className="h-4 w-4" />
            <span>Holidays YTD</span>
          </div>
          <div className="text-2xl font-semibold text-amber-900">{stats.ytd}</div>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center gap-2 text-sky-800 text-sm mb-1">
            <Camera className="h-4 w-4" />
            <span>Photos kept</span>
          </div>
          <div className="text-2xl font-semibold text-sky-900">{stats.photosKept}</div>
        </div>
        <div className="rounded-lg border border-pink-200 bg-pink-50 p-4">
          <div className="flex items-center gap-2 text-pink-800 text-sm mb-1">
            <Heart className="h-4 w-4" />
            <span>Child-chose destination</span>
          </div>
          <div className="text-2xl font-semibold text-pink-900">{stats.childChose}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Star className="h-4 w-4" />
            <span>Total spent</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">£{stats.totalSpent.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search child, destination or memory..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All periods</SelectItem>
            {(Object.entries(HOLIDAY_PERIOD_LABEL) as [string, string][]).map(([k, v]) => (
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
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="duration">Longest first</SelectItem>
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
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-amber-50/40 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-900">{getYPName(r.child_id)}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", periodColour[r.holiday_period])}>
                      {HOLIDAY_PERIOD_LABEL[r.holiday_period]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                      {r.year}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-sky-100 text-sky-800 border-sky-200">
                      {r.duration_days} day{r.duration_days === 1 ? "" : "s"}
                    </span>
                    {r.child_chose_destination ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-pink-100 text-pink-800 border-pink-200">
                        Child chose
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-700 italic">&ldquo;{r.child_memory_headline}&rdquo;</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {r.destinations[0]}
                    {r.destinations.length > 1 ? ` +${r.destinations.length - 1} more` : ""}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-amber-50/30">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-amber-800 uppercase mb-2 flex items-center gap-1">
                        <Star className="h-3 w-3" /> Child memory headline
                      </div>
                      <p className="text-base text-amber-900 font-medium">&ldquo;{r.child_memory_headline}&rdquo;</p>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Destinations</div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.destinations.map((d, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-full border bg-sky-50 text-sky-800 border-sky-200"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">With whom</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.with_whom.map((t, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-pink-500">·</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Highlights</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.highlights.map((t, i) => (
                          <li key={i} className="flex gap-2">
                            <Heart className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Cost & funding</div>
                      <div className="text-sm text-slate-700">
                        <div>
                          <span className="font-semibold">£{r.cost_spent.toFixed(2)}</span> spent
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{r.funding_source}</div>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <Camera className="h-3 w-3" /> Photos
                      </div>
                      {r.photos_taken ? (
                        <div className="text-sm text-slate-700">
                          <div className="font-medium text-emerald-700">Kept</div>
                          {r.photos_location ? (
                            <div className="text-xs text-slate-500 mt-1">{r.photos_location}</div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">No photos kept for this record</div>
                      )}
                    </div>

                    {r.challenges_noted.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">
                          What was harder / what we learned
                        </div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.challenges_noted.map((t, i) => (
                            <li key={i} className="flex gap-2">
                              <span>→</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="rounded-md border border-pink-200 bg-pink-50 p-3">
                      <div className="text-xs font-semibold text-pink-800 uppercase mb-2">Child voice</div>
                      <p className="text-sm text-pink-900 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff observation</div>
                      <p className="text-sm text-slate-700">{r.staff_observation}</p>
                      <div className="text-xs text-slate-500 mt-2">
                        Recorded by {getStaffName(r.recorded_by)} · reviewed {r.review_date}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <SmartLinkPanel sourceType="holiday-records" sourceId={r.id} childId={r.child_id} compact />
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
          Holiday memories are part of a child&rsquo;s life-story and identity. Practice is grounded in Quality
          Standard 6 (Enjoyment & Achievement) and Quality Standard 7 (Health & Wellbeing), the home&rsquo;s
          Statement of Purpose, and Working Together to Safeguard Children 2023. Children&rsquo;s right to leisure,
          play and cultural participation (UNCRC Article 31) and to be heard in matters affecting them (UNCRC
          Article 12) shape every entry — destinations are child-chosen wherever possible, photos are kept with
          consent, and the child&rsquo;s own headline of the memory is recorded in their words.
        </p>
      </div>
    </PageShell>
  );
}
