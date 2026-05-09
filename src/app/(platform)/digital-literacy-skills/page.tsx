"use client";

import { useState, useMemo } from "react";
import {
  Laptop,
  Mail,
  Lock,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
  Globe,
  Loader2,
} from "lucide-react";
import { PageShell }    from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type {
  DigitalLiteracySkillRecord,
  DigitalLiteracyDomain,
  DigitalLiteracyCompetency,
} from "@/types/extended";
import {
  DIGITAL_LITERACY_DOMAIN_LABEL,
  DIGITAL_LITERACY_COMPETENCY_LABEL,
} from "@/types/extended";
import { useDigitalLiteracySkillRecords } from "@/hooks/use-digital-literacy-skill-records";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── constants ─────────────────────────────────────────────────────────── */

const DOMAINS: DigitalLiteracyDomain[] = [
  "device_basics",
  "email",
  "word_processing",
  "cloud_storage",
  "online_banking",
  "gov_uk_services",
  "scam_awareness",
  "password_hygiene",
  "form_completion",
  "job_applications",
  "browsing_safely",
];

const COMPETENCIES: DigitalLiteracyCompetency[] = [
  "not_yet_introduced",
  "aware",
  "did_with_help",
  "did_independently",
  "confident",
];

const COMP_META: Record<DigitalLiteracyCompetency, { colour: string; order: number }> = {
  not_yet_introduced: { colour: "bg-gray-100 text-gray-700",     order: 0 },
  aware:              { colour: "bg-violet-100 text-violet-700", order: 1 },
  did_with_help:      { colour: "bg-amber-100 text-amber-800",   order: 2 },
  did_independently:  { colour: "bg-blue-100 text-blue-700",     order: 3 },
  confident:          { colour: "bg-indigo-100 text-indigo-800", order: 4 },
};

const DOMAIN_COLOUR: Record<DigitalLiteracyDomain, string> = {
  device_basics:     "bg-indigo-50 text-indigo-700 border-indigo-200",
  email:             "bg-violet-50 text-violet-700 border-violet-200",
  word_processing:   "bg-sky-50 text-sky-700 border-sky-200",
  cloud_storage:     "bg-cyan-50 text-cyan-700 border-cyan-200",
  online_banking:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  gov_uk_services:   "bg-blue-50 text-blue-700 border-blue-200",
  scam_awareness:    "bg-rose-50 text-rose-700 border-rose-200",
  password_hygiene:  "bg-amber-50 text-amber-800 border-amber-200",
  form_completion:   "bg-teal-50 text-teal-700 border-teal-200",
  job_applications:  "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  browsing_safely:   "bg-lime-50 text-lime-700 border-lime-200",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function DigitalLiteracySkillsPage() {
  const { data: raw, isLoading } = useDigitalLiteracySkillRecords();
  const records = raw?.data ?? [];

  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recorded" | "competency" | "review" | "child">("recorded");

  /* ── stats ───────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const thirtyDaysStr = thirtyDays.toISOString().slice(0, 10);

    const skillsTracked = records.length;
    const confident = records.filter((r) => r.competency === "confident").length;
    const reviewsDue = records.filter((r) => r.review_date <= thirtyDaysStr).length;
    const realWorld = records.reduce((acc, r) => acc + r.real_world_application.length, 0);
    void today;
    return { skillsTracked, confident, reviewsDue, realWorld };
  }, [records]);

  /* ── filtered & sorted ──────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (filterDomain !== "all") list = list.filter((r) => r.domain === filterDomain);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          DIGITAL_LITERACY_DOMAIN_LABEL[r.domain].toLowerCase().includes(q) ||
          r.staff_observation.toLowerCase().includes(q) ||
          r.child_voice.toLowerCase().includes(q) ||
          r.specific_skills.some((s) => s.skill.toLowerCase().includes(q)) ||
          r.tools_used.some((t) => t.toLowerCase().includes(q)),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "competency":
          return COMP_META[b.competency].order - COMP_META[a.competency].order;
        case "review":
          return a.review_date.localeCompare(b.review_date);
        case "child":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "recorded":
        default:
          return b.recorded_date.localeCompare(a.recorded_date);
      }
    });
    return list;
  }, [records, filterDomain, search, sortBy]);

  /* ── export ──────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<DigitalLiteracySkillRecord>[] = [
    { header: "Young Person",          accessor: (r: DigitalLiteracySkillRecord) => getYPName(r.child_id) },
    { header: "Recorded",              accessor: (r: DigitalLiteracySkillRecord) => r.recorded_date },
    { header: "Domain",                accessor: (r: DigitalLiteracySkillRecord) => DIGITAL_LITERACY_DOMAIN_LABEL[r.domain] },
    { header: "Competency",            accessor: (r: DigitalLiteracySkillRecord) => DIGITAL_LITERACY_COMPETENCY_LABEL[r.competency] },
    { header: "Specific Skills",       accessor: (r: DigitalLiteracySkillRecord) => r.specific_skills.map((s) => `${s.achieved ? "[x]" : "[ ]"} ${s.skill}`).join("; ") },
    { header: "Tools Used",            accessor: (r: DigitalLiteracySkillRecord) => r.tools_used.join("; ") },
    { header: "Real-World Application", accessor: (r: DigitalLiteracySkillRecord) => r.real_world_application.join("; ") },
    { header: "Child Voice",           accessor: (r: DigitalLiteracySkillRecord) => r.child_voice },
    { header: "Staff Observation",     accessor: (r: DigitalLiteracySkillRecord) => r.staff_observation },
    { header: "Next Step",             accessor: (r: DigitalLiteracySkillRecord) => r.next_step },
    { header: "Review Date",           accessor: (r: DigitalLiteracySkillRecord) => r.review_date },
    { header: "Key Worker",            accessor: (r: DigitalLiteracySkillRecord) => getStaffName(r.key_worker) },
    { header: "Notes",                 accessor: (r: DigitalLiteracySkillRecord) => r.notes ?? "" },
  ];

  /* ── loading ─────────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <PageShell
        title="Digital Literacy Skills"
        subtitle="Per-child digital competence — from device basics to online banking, gov.uk services and scam awareness. A core preparation-for-adulthood skill, distinct from online safety."
      >
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <PageShell
      title="Digital Literacy Skills"
      subtitle="Per-child digital competence — from device basics to online banking, gov.uk services and scam awareness. A core preparation-for-adulthood skill, distinct from online safety."
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="digital-literacy-skills" />
          <PrintButton title="Digital Literacy Skills" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stat cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Skills tracked",           value: stats.skillsTracked, icon: Laptop, c: "text-indigo-600" },
            { label: "Confident competencies",   value: stats.confident,     icon: Award,  c: "text-violet-600" },
            { label: "Reviews due ≤ 30 days",    value: stats.reviewsDue,    icon: Lock,   c: "text-amber-600" },
            { label: "Real-world applications",  value: stats.realWorld,     icon: Globe,  c: "text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <s.icon className={cn("h-5 w-5", s.c)} />
                <span className="text-2xl font-bold">{s.value}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── filters ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search child, domain, skill, tool…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterDomain} onValueChange={setFilterDomain}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All domains</SelectItem>
              {DOMAINS.map((dm) => (
                <SelectItem key={dm} value={dm}>{DIGITAL_LITERACY_DOMAIN_LABEL[dm]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="recorded">Most recently recorded</option>
              <option value="competency">Highest competency</option>
              <option value="review">Soonest review</option>
              <option value="child">Child name</option>
            </select>
          </div>
        </div>

        {/* ── records ───────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
              No records match the current filters.
            </div>
          )}
          {filtered.map((rec) => {
            const isOpen = expanded === rec.id;
            const achievedCount = rec.specific_skills.filter((s) => s.achieved).length;
            return (
              <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : rec.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-indigo-50/40 transition-colors"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 p-2 text-white">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 flex-wrap">
                        {getYPName(rec.child_id)}
                        <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", DOMAIN_COLOUR[rec.domain])}>
                          {DIGITAL_LITERACY_DOMAIN_LABEL[rec.domain]}
                        </span>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", COMP_META[rec.competency].colour)}>
                          {DIGITAL_LITERACY_COMPETENCY_LABEL[rec.competency]}
                        </span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Recorded {rec.recorded_date} · Key worker {getStaffName(rec.key_worker)} · {achievedCount}/{rec.specific_skills.length} specific skills achieved · Review {rec.review_date}
                      </p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="border-t bg-gradient-to-b from-indigo-50/30 to-white p-4 space-y-4">
                    {/* specific skills checklist */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-indigo-600" /> Specific skills
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {rec.specific_skills.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span
                              className={cn(
                                "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold",
                                s.achieved
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : "bg-white text-transparent border-gray-300",
                              )}
                              aria-hidden
                            >
                              {s.achieved ? "✓" : ""}
                            </span>
                            <span className={cn(s.achieved ? "text-gray-900" : "text-muted-foreground")}>{s.skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* tools & real-world */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
                        <h4 className="text-sm font-semibold text-violet-800 mb-1.5 flex items-center gap-1.5">
                          <Mail className="h-4 w-4" /> Tools used
                        </h4>
                        <ul className="list-disc list-inside text-sm text-violet-900 space-y-0.5">
                          {rec.tools_used.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                        <h4 className="text-sm font-semibold text-emerald-800 mb-1.5 flex items-center gap-1.5">
                          <Globe className="h-4 w-4" /> Real-world application
                        </h4>
                        <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                          {rec.real_world_application.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* child voice */}
                    <div className="rounded-lg border border-pink-200 bg-pink-50/60 p-3">
                      <h4 className="text-sm font-semibold text-pink-800 mb-1">Child&apos;s voice</h4>
                      <p className="text-sm text-pink-900 italic">&ldquo;{rec.child_voice}&rdquo;</p>
                    </div>

                    {/* staff observation */}
                    <div className="rounded-lg border bg-white p-3">
                      <h4 className="text-sm font-semibold mb-1">Staff observation</h4>
                      <p className="text-sm text-gray-800">{rec.staff_observation}</p>
                    </div>

                    {/* next step */}
                    <div className="rounded-lg border-l-4 border-indigo-500 bg-indigo-50 p-3">
                      <h4 className="text-sm font-semibold text-indigo-800 mb-1">Next step</h4>
                      <p className="text-sm text-indigo-900">{rec.next_step}</p>
                    </div>

                    {rec.notes && (
                      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                        <span className="font-semibold">Notes: </span>{rec.notes}
                      </div>
                    )}

                    {/* Smart Link Panel */}
                    <SmartLinkPanel
                      sourceType="digital_literacy_skill"
                      sourceId={rec.id}
                      childId={rec.child_id}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ───────────────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 text-sm text-indigo-900 space-y-1">
          <p>
            <strong>Pathway Plan</strong> — Care Leavers (England) Regulations 2010: digital literacy is a core preparation-for-adulthood domain captured in each young person&apos;s pathway plan.
          </p>
          <p>
            <strong>Quality Standard 5 (Education) &amp; Quality Standard 6 (Enjoyment &amp; Achievement)</strong> — Children&apos;s Homes Regulations 2015: the home must help every child develop the skills, confidence and competence to participate fully in education and modern life.
          </p>
          <p>
            <strong>UNCRC Article 17</strong> — every child has the right to access information from a diversity of sources, with appropriate support to use it safely and effectively.
          </p>
          <p className="text-xs text-indigo-800/80 pt-1">
            This module is distinct from the home&apos;s Online Safety record (which logs incidents and risk). Digital Literacy evidences <em>competence</em> — what each child can independently do.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
