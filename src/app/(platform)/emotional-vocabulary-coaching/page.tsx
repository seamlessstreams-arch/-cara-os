"use client";

import { useState } from "react";
import {
  MessageCircle,
  Heart,
  Brain,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Star,
  Smile,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  EmotionalVocabRecord,
  EmotionalFramework,
} from "@/types/extended";
import { EMOTIONAL_FRAMEWORK_LABEL } from "@/types/extended";
import { useEmotionalVocabRecords } from "@/hooks/use-emotional-vocab-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────── */

const FRAMEWORK_COLOURS: Record<EmotionalFramework, string> = {
  zones_of_regulation: "bg-sky-100 text-sky-800",
  feelings_wheel_plutchik: "bg-violet-100 text-violet-800",
  ruler: "bg-teal-100 text-teal-800",
  how_are_you_feeling_today: "bg-amber-100 text-amber-800",
  bespoke: "bg-pink-100 text-pink-800",
  mixed: "bg-indigo-100 text-indigo-800",
};

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  child_id: string;
  framework: string;
  recorded_date: string;
  review_date: string;
  key_worker: string;
  feelings_recognised: string;
  feelings_learning_now: string;
  confusions_common: string;
  tools_in_use: string;
  modalities: string;
  staff_phrasing_tips: string;
  breakthroughCount: number;
  child_voice: string;
  staff_observation: string;
  next_step: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",          accessor: (r: FlatRow) => r.child_id },
  { header: "Framework",             accessor: (r: FlatRow) => r.framework },
  { header: "Recorded Date",         accessor: (r: FlatRow) => r.recorded_date },
  { header: "Review Date",           accessor: (r: FlatRow) => r.review_date },
  { header: "Key Worker",            accessor: (r: FlatRow) => r.key_worker },
  { header: "Feelings Recognised",   accessor: (r: FlatRow) => r.feelings_recognised },
  { header: "Feelings Learning",     accessor: (r: FlatRow) => r.feelings_learning_now },
  { header: "Common Confusions",     accessor: (r: FlatRow) => r.confusions_common },
  { header: "Tools In Use",          accessor: (r: FlatRow) => r.tools_in_use },
  { header: "Modalities",            accessor: (r: FlatRow) => r.modalities },
  { header: "Staff Phrasing Tips",   accessor: (r: FlatRow) => r.staff_phrasing_tips },
  { header: "Breakthroughs (count)", accessor: (r: FlatRow) => r.breakthroughCount },
  { header: "Child Voice",           accessor: (r: FlatRow) => r.child_voice },
  { header: "Staff Observation",     accessor: (r: FlatRow) => r.staff_observation },
  { header: "Next Step",             accessor: (r: FlatRow) => r.next_step },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function EmotionalVocabularyCoachingPage() {
  const { data: queryData, isLoading } = useEmotionalVocabRecords();
  const records = queryData?.data ?? [];

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterFramework, setFilterFramework] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const toggle = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const modalitiesFor = (r: EmotionalVocabRecord) => {
    const out: string[] = [];
    if (r.prefers_spoken) out.push("Spoken");
    if (r.prefers_written) out.push("Written");
    if (r.prefers_visual) out.push("Visual");
    if (r.prefers_body_mapping) out.push("Body mapping");
    return out;
  };

  /* ── loading ──────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <PageShell
        title="Emotional Vocabulary Coaching"
        subtitle="Per-child language work — what feelings each young person can name, what they confuse, the tools and frameworks in use, and the breakthroughs that change everything"
      >
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  /* ── stats ───────────────────────────────────────────────────── */
  const inCoaching = records.length;
  const totalRecognised = records.reduce(
    (s, r) => s + r.feelings_recognised.length,
    0,
  );
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().slice(0, 10);
  const breakthroughsQuarter = records.reduce(
    (s, r) =>
      s + r.breakthroughs.filter((b) => b.date >= ninetyDaysAgoStr).length,
    0,
  );
  const fourteenDaysFromNow = new Date();
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
  const fourteenDaysStr = fourteenDaysFromNow.toISOString().slice(0, 10);
  const reviewsDue = records.filter((r) => r.review_date <= fourteenDaysStr).length;

  const stats = { inCoaching, totalRecognised, breakthroughsQuarter, reviewsDue };

  /* ── filtered / sorted ───────────────────────────────────────── */
  let filtered = records;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        EMOTIONAL_FRAMEWORK_LABEL[r.framework].toLowerCase().includes(q) ||
        r.feelings_recognised.some((f) => f.toLowerCase().includes(q)) ||
        r.feelings_learning_now.some((f) => f.toLowerCase().includes(q)),
    );
  }
  if (filterFramework !== "all")
    filtered = filtered.filter((r) => r.framework === filterFramework);
  const sorted = [...filtered];
  switch (sortBy) {
    case "name":
      sorted.sort((a, b) =>
        getYPName(a.child_id).localeCompare(getYPName(b.child_id)),
      );
      break;
    case "review":
      sorted.sort((a, b) => a.review_date.localeCompare(b.review_date));
      break;
    case "vocabulary":
      sorted.sort(
        (a, b) =>
          b.feelings_recognised.length - a.feelings_recognised.length,
      );
      break;
    case "breakthroughs":
      sorted.sort((a, b) => b.breakthroughs.length - a.breakthroughs.length);
      break;
  }

  /* ── export ──────────────────────────────────────────────────── */
  const exportData: FlatRow[] = records.map((r) => ({
    child_id: getYPName(r.child_id),
    framework: EMOTIONAL_FRAMEWORK_LABEL[r.framework],
    recorded_date: r.recorded_date,
    review_date: r.review_date,
    key_worker: getStaffName(r.key_worker),
    feelings_recognised: r.feelings_recognised.join("; "),
    feelings_learning_now: r.feelings_learning_now.join("; "),
    confusions_common: r.confusions_common.join("; "),
    tools_in_use: r.tools_in_use.join("; "),
    modalities: modalitiesFor(r).join("; "),
    staff_phrasing_tips: r.staff_phrasing_tips.join("; "),
    breakthroughCount: r.breakthroughs.length,
    child_voice: r.child_voice,
    staff_observation: r.staff_observation,
    next_step: r.next_step,
  }));

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <PageShell
      title="Emotional Vocabulary Coaching"
      subtitle="Per-child language work — what feelings each young person can name, what they confuse, the tools and frameworks in use, and the breakthroughs that change everything"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Emotional Vocabulary Coaching" />
          <ExportButton
            data={exportData}
            columns={EXPORT_COLS}
            filename="emotional-vocabulary-coaching"
          />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Children in Coaching",
            value: stats.inCoaching,
            icon: MessageCircle,
            colour: "text-violet-600",
          },
          {
            label: "Feelings Recognised (total)",
            value: stats.totalRecognised,
            icon: Smile,
            colour: "text-teal-600",
          },
          {
            label: "Breakthroughs (90 days)",
            value: stats.breakthroughsQuarter,
            icon: Star,
            colour:
              stats.breakthroughsQuarter > 0
                ? "text-amber-600"
                : "text-gray-400",
          },
          {
            label: "Reviews Due (14 d)",
            value: stats.reviewsDue,
            icon: Brain,
            colour: stats.reviewsDue > 0 ? "text-rose-600" : "text-gray-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border bg-white p-4 flex items-center gap-3"
          >
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── filters ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search children, frameworks or feeling words…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterFramework} onValueChange={setFilterFramework}>
          <SelectTrigger className="w-[200px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frameworks</SelectItem>
            {(Object.keys(FRAMEWORK_COLOURS) as EmotionalFramework[]).map((f) => (
              <SelectItem key={f} value={f}>
                {EMOTIONAL_FRAMEWORK_LABEL[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="review">Review Due</SelectItem>
              <SelectItem value="vocabulary">Vocabulary Size</SelectItem>
              <SelectItem value="breakthroughs">Breakthroughs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {sorted.map((r) => {
          const open = expanded[r.id] ?? false;
          const modalities = modalitiesFor(r);
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Heart className="h-4 w-4 text-violet-400" />
                    <h3 className="font-semibold">
                      {getYPName(r.child_id)}
                    </h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        FRAMEWORK_COLOURS[r.framework],
                      )}
                    >
                      {EMOTIONAL_FRAMEWORK_LABEL[r.framework]}
                    </span>
                    {modalities.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {r.feelings_recognised.length} feelings recognised ·{" "}
                    {r.feelings_learning_now.length} in progress ·{" "}
                    {r.breakthroughs.length} breakthroughs · key worker{" "}
                    {getStaffName(r.key_worker)}
                  </p>
                </div>
                {open ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* meta */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Recorded:</span>{" "}
                      <span className="font-medium">{r.recorded_date}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Review:</span>{" "}
                      <span
                        className={cn(
                          "font-medium",
                          r.review_date <= todayStr ? "text-rose-600" : "",
                        )}
                      >
                        {r.review_date}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Key worker:</span>{" "}
                      <span className="font-medium">
                        {getStaffName(r.key_worker)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Framework:</span>{" "}
                      <span className="font-medium">{EMOTIONAL_FRAMEWORK_LABEL[r.framework]}</span>
                    </div>
                  </div>

                  {/* starting position */}
                  <div className="rounded-md bg-violet-50 border border-violet-200 p-3">
                    <h4 className="text-xs font-semibold text-violet-700 mb-1">
                      Starting Position
                    </h4>
                    <p className="text-sm text-violet-900">
                      {r.starting_position}
                    </p>
                  </div>

                  {/* feelings recognised + learning */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                      <h4 className="text-xs font-semibold text-teal-700 mb-2">
                        Feelings Recognised ({r.feelings_recognised.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {r.feelings_recognised.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-white text-teal-800 border border-teal-200"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-2">
                        Learning Now ({r.feelings_learning_now.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {r.feelings_learning_now.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-white text-amber-800 border border-amber-200"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* common confusions */}
                  <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                    <h4 className="text-xs font-semibold text-rose-700 mb-1">
                      Common Confusions
                    </h4>
                    <ul className="list-disc list-inside text-sm text-rose-900 space-y-0.5">
                      {r.confusions_common.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  {/* tools */}
                  <div className="rounded-md bg-sky-50 border border-sky-200 p-3">
                    <h4 className="text-xs font-semibold text-sky-700 mb-1">
                      Tools &amp; Visual Aids in Use
                    </h4>
                    <ul className="list-disc list-inside text-sm text-sky-900 space-y-0.5">
                      {r.tools_in_use.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {/* breakthroughs timeline */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">
                      Breakthroughs
                    </h4>
                    <div className="space-y-2">
                      {r.breakthroughs.map((b, i) => (
                        <div
                          key={i}
                          className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-medium text-amber-700">
                              {b.date}
                            </span>
                          </div>
                          <p className="text-sm text-amber-900 mt-1">
                            {b.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* staff phrasing tips */}
                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">
                      Staff Phrasing Tips
                    </h4>
                    <ul className="list-disc list-inside text-sm text-blue-900 space-y-0.5">
                      {r.staff_phrasing_tips.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {/* child voice */}
                  {r.child_voice && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">
                        Child&apos;s Voice
                      </h4>
                      <p className="text-sm text-pink-900 italic">
                        &ldquo;{r.child_voice}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* staff observation */}
                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">
                      Staff Observation
                    </h4>
                    <p className="text-sm">{r.staff_observation}</p>
                  </div>

                  {/* next step */}
                  <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                    <h4 className="text-xs font-semibold text-emerald-700 mb-1">
                      Next Step
                    </h4>
                    <p className="text-sm text-emerald-900">{r.next_step}</p>
                  </div>

                  {/* smart links */}
                  <SmartLinkPanel sourceType="emotional-vocab-record" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900 mb-6">
        <strong>Emotional Literacy &amp; Regulatory Frameworks:</strong> Many
        children in care arrive with limited emotional vocabulary as a
        consequence of early adversity — words for feelings simply weren&apos;t
        modelled or named. Building this vocabulary is a core therapeutic task
        and underpins regulation, relationships and recovery. This work draws
        on the Zones of Regulation (Leah Kuypers), the RULER approach (Mark
        Brackett, Yale Center for Emotional Intelligence) and Plutchik&apos;s
        wheel of emotions, delivered through trauma-informed practice. It
        supports Quality Standard 8 (Health &amp; Wellbeing) and the child&apos;s
        rights under UNCRC Articles 12 (right to be heard), 13 (freedom of
        expression) and 17 (access to information that supports their
        wellbeing).
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
