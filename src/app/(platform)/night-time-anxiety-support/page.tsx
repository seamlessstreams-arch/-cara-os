"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Moon,
  Star,
  Heart,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
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
import { useNightAnxietySupport } from "@/hooks/use-night-anxiety-support";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { NightAnxietySupportRecord, AnxietyLevel, NightmareFrequency } from "@/types/extended";
import { ANXIETY_LEVEL_LABEL, NIGHTMARE_FREQUENCY_LABEL } from "@/types/extended";

// ── helpers ─────────────────────────────────────────────────────────────────
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const anxietyOrder: Record<AnxietyLevel, number> = {
  crisis: 5,
  severe: 4,
  moderate: 3,
  mild: 2,
  settled: 1,
};

const anxietyChip = (lvl: AnxietyLevel) => {
  switch (lvl) {
    case "crisis":
      return "bg-red-100 text-red-800 border-red-300";
    case "severe":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "moderate":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "mild":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "settled":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
  }
};

const nightmareChip = (f: NightmareFrequency) => {
  switch (f) {
    case "most_nights":
      return "bg-red-100 text-red-800 border-red-300";
    case "multiple_per_week":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "weekly":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "occasional":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "none":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
  }
};

// ── page ────────────────────────────────────────────────────────────────────
export default function NightTimeAnxietySupportPage() {
  const { data: res, isLoading } = useNightAnxietySupport();
  const records: NightAnxietySupportRecord[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"level" | "name" | "review">("level");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = records.filter((r) => {
      if (levelFilter !== "all" && r.anxiety_level !== levelFilter) return false;
      if (!q) return true;
      const hay = [
        getYPName(r.child_id),
        ANXIETY_LEVEL_LABEL[r.anxiety_level],
        r.child_voice,
        r.staff_observation,
        r.primary_triggers.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "level")
        return anxietyOrder[b.anxiety_level] - anxietyOrder[a.anxiety_level];
      if (sortBy === "name")
        return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      return a.review_date.localeCompare(b.review_date);
    });
    return list;
  }, [search, levelFilter, sortBy, records]);

  // ── loading ──────────────────────────────────────────────────────────────
  if (isLoading) return <PageShell title="Night-time Anxiety Support" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  // ── stats ─────────────────────────────────────────────────────────────────
  const stats = {
    plans: records.length,
    severe: records.filter(
      (r) =>
        r.anxiety_level === "severe" ||
        r.anxiety_level === "crisis"
    ).length,
    reviewsDue: records.filter((r) => r.review_date <= d(14)).length,
    referrals: records.filter((r) => !!r.external_referral_active).length,
  };

  // ── export ────────────────────────────────────────────────────────────────
  const exportColumns: ExportColumn<NightAnxietySupportRecord>[] = [
    { header: "Young person", accessor: (r) => getYPName(r.child_id) },
    { header: "Record date", accessor: (r) => r.record_date },
    { header: "Anxiety level", accessor: (r) => ANXIETY_LEVEL_LABEL[r.anxiety_level] },
    { header: "Nightmare frequency", accessor: (r) => NIGHTMARE_FREQUENCY_LABEL[r.nightmare_frequency] },
    {
      header: "Avg sleep (hrs)",
      accessor: (r) =>
        r.average_sleep_hours !== null ? r.average_sleep_hours : "",
    },
    {
      header: "Primary triggers",
      accessor: (r) => r.primary_triggers.join("; "),
    },
    {
      header: "DO strategies",
      accessor: (r) => r.do_strategies.join("; "),
    },
    {
      header: "DO NOT strategies",
      accessor: (r) => r.do_not_strategies.join("; "),
    },
    {
      header: "External referral",
      accessor: (r) => r.external_referral_active ?? "",
    },
    { header: "Child voice", accessor: (r) => r.child_voice },
    {
      header: "Staff observation",
      accessor: (r) => r.staff_observation,
    },
    { header: "Review date", accessor: (r) => r.review_date },
    {
      header: "Key worker",
      accessor: (r) => getStaffName(r.key_worker),
    },
  ];

  return (
    <PageShell
      title="Night-time Anxiety Support"
      subtitle="Per-child plans for bedtime fears, separation anxiety, trauma-related sleep difficulty, nightmares and hypervigilance. Captures triggers, soothing strategies, what works, what to avoid, and the child's own voice on what helps."
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={filtered}
            columns={exportColumns}
            filename="night-time-anxiety-support"
          />
          <PrintButton title="Night-time Anxiety Support" />
        </div>
      }
    >
      {/* ── stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-indigo-700">
              Active plans
            </span>
            <Moon className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-indigo-900">
            {stats.plans}
          </div>
          <div className="text-xs text-indigo-700/70">children with bedtime support plans</div>
        </div>

        <div className="rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-orange-700">
              Severe / crisis
            </span>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-orange-900">
            {stats.severe}
          </div>
          <div className="text-xs text-orange-700/70">requiring escalated overnight support</div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-amber-700">
              Reviews due
            </span>
            <Star className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-amber-900">
            {stats.reviewsDue}
          </div>
          <div className="text-xs text-amber-700/70">within next 14 days</div>
        </div>

        <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-purple-700">
              External referrals
            </span>
            <Heart className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-purple-900">
            {stats.referrals}
          </div>
          <div className="text-xs text-purple-700/70">
            CAMHS / specialist sleep support active
          </div>
        </div>
      </div>

      {/* ── filters ───────────────────────────────────────────────────────── */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by child, trigger, or note…"
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All anxiety levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All anxiety levels</SelectItem>
            {(Object.keys(ANXIETY_LEVEL_LABEL) as AnxietyLevel[]).map((key) => (
              <SelectItem key={key} value={key}>
                {ANXIETY_LEVEL_LABEL[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as "level" | "name" | "review")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <ArrowUpDown className="mr-1 h-4 w-4 text-slate-500" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="level">Sort: anxiety level</SelectItem>
            <SelectItem value="name">Sort: child name</SelectItem>
            <SelectItem value="review">Sort: review date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── cards ─────────────────────────────────────────────────────────── */}
      <div className="mt-4 space-y-3">
        {filtered.map((r) => {
          const open = expandedId === r.id;
          return (
            <div
              key={r.id}
              className="rounded-lg border border-indigo-200 bg-white shadow-sm transition hover:border-indigo-300"
            >
              <button
                onClick={() => setExpandedId(open ? null : r.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-100">
                    <Moon className="h-5 w-5 text-indigo-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-slate-900">
                        {getYPName(r.child_id)}
                      </span>
                      <span className="text-xs text-slate-500">
                        · key worker {getStaffName(r.key_worker)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          anxietyChip(r.anxiety_level)
                        )}
                      >
                        {ANXIETY_LEVEL_LABEL[r.anxiety_level]}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          nightmareChip(r.nightmare_frequency)
                        )}
                      >
                        Nightmares: {NIGHTMARE_FREQUENCY_LABEL[r.nightmare_frequency]}
                      </span>
                      {r.average_sleep_hours !== null && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                          {r.average_sleep_hours}h avg sleep
                        </span>
                      )}
                      {r.external_referral_active && (
                        <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
                          Referral active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                  <span>Review {r.review_date}</span>
                  {open ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {open && (
                <div className="border-t border-indigo-100 bg-indigo-50/30 px-4 py-4 space-y-4">
                  {/* Child voice */}
                  <div className="rounded-md border border-indigo-200 bg-white p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                      Child voice
                    </div>
                    <p className="mt-1 text-sm italic text-slate-800">
                      &ldquo;{r.child_voice}&rdquo;
                    </p>
                  </div>

                  {/* Staff observation */}
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Staff observation
                    </div>
                    <p className="mt-1 text-sm text-slate-800">{r.staff_observation}</p>
                  </div>

                  {/* Two-col grid */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* Triggers */}
                    <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                        Primary triggers
                      </div>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-800">
                        {r.primary_triggers.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Bedtime routine */}
                    <div className="rounded-md border border-indigo-200 bg-white p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                        Bedtime routine
                      </div>
                      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-800">
                        {r.bedtime_routine.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Comfort items */}
                    <div className="rounded-md border border-purple-200 bg-purple-50/40 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-purple-800">
                        Comfort items
                      </div>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-800">
                        {r.comfort_items.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Child preferences */}
                    <div className="rounded-md border border-blue-200 bg-blue-50/40 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                        Child preferences
                      </div>
                      <p className="mt-1 text-sm text-slate-800">
                        {r.child_preferences}
                      </p>
                    </div>

                    {/* DO strategies */}
                    <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                        DO — what helps
                      </div>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-emerald-900">
                        {r.do_strategies.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    {/* DO NOT strategies */}
                    <div className="rounded-md border border-red-200 bg-red-50/60 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-red-800">
                        DO NOT — avoid
                      </div>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-red-900">
                        {r.do_not_strategies.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Hypervigilance */}
                  {r.hypervigilance_notes && (
                    <div className="rounded-md border border-orange-200 bg-orange-50/50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-orange-800">
                        Hypervigilance notes
                      </div>
                      <p className="mt-1 text-sm text-slate-800">
                        {r.hypervigilance_notes}
                      </p>
                    </div>
                  )}

                  {/* External referral */}
                  {r.external_referral_active && (
                    <div className="rounded-md border border-purple-200 bg-white p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                        Active external referral
                      </div>
                      <p className="mt-1 text-sm text-slate-800">
                        {r.external_referral_active}
                      </p>
                    </div>
                  )}

                  {/* Staff actions last week */}
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Staff actions — last 7 days
                    </div>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-800">
                      {r.staff_actions_last_week.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Smart link panel */}
                  <SmartLinkPanel sourceType="night-time-anxiety-support" sourceId={r.id} childId={r.child_id} compact />

                  {/* Footer meta */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Plan recorded {r.record_date}</span>
                    <span>·</span>
                    <span>Next review {r.review_date}</span>
                    <span>·</span>
                    <span>Key worker: {getStaffName(r.key_worker)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No plans match the current filters.
          </div>
        )}
      </div>

      {/* ── regulatory footer ─────────────────────────────────────────────── */}
      <div className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50/40 p-4 text-xs text-indigo-900/80">
        <div className="font-semibold text-indigo-900">Regulatory framework</div>
        <p className="mt-1">
          This record supports the Children&apos;s Homes (England) Regulations 2015 Quality
          Standard 7 (positive relationships — children feel safe and supported overnight by
          consistent, attuned staff) and Quality Standard 8 (health and well-being — sleep,
          rest, and emotional health are actively promoted). Plans are written from a
          trauma-informed perspective, recognising that night-time anxiety is often a symptom
          of earlier experiences of fear, loss, or unpredictability. The child&apos;s own voice
          is recorded and weighted alongside staff observation, in line with UNCRC Article 31
          (the right to rest and leisure) and Article 12 (the right to be heard in matters
          affecting them).
        </p>
      </div>
    </PageShell>
  );
}
