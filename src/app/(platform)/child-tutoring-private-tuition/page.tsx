"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
  PoundSterling,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TutorRecord {
  id: string;
  youngPerson: string;
  subject: string;
  examFocus?: string;
  tutorName: string;
  tutorQualifications: string;
  dbsCheckedDate: string;
  agency?: string;
  startDate: string;
  endDate?: string;
  ongoing: boolean;
  format: "Online" | "In-home" | "Tutor's home" | "Library" | "Mixed";
  hoursPerWeek: number;
  hourlyRate: number;
  costToDate: number;
  fundingSource:
    | "Pupil Premium Plus"
    | "Virtual School grant"
    | "Leaving Care fund"
    | "Home budget"
    | "Family contribution"
    | "Mixed"
    | "Free (charity)";
  baselineGrade?: string;
  currentGrade?: string;
  targetGrade?: string;
  resourcesProvided: string[];
  childMotivation: "High" | "Building" | "Mixed" | "Low";
  parentSwAware: boolean;
  childVoice: string;
  staffObservation: string;
  nextSession?: string;
  reviewDate: string;
  keyWorker: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: TutorRecord[] = [
  {
    id: "tut-001",
    youngPerson: "yp_jordan",
    subject: "GCSE Maths",
    examFocus: "AQA GCSE Mathematics — Higher tier — May/June 2026",
    tutorName: "Bilal Khan",
    tutorQualifications: "PGCE Secondary Mathematics, BSc Maths (1st), 5 years secondary teaching, Tutorful verified",
    dbsCheckedDate: "2025-09-04",
    agency: "Tutorful",
    startDate: "2026-01-12",
    ongoing: true,
    format: "In-home",
    hoursPerWeek: 2,
    hourlyRate: 30,
    costToDate: 960,
    fundingSource: "Mixed",
    baselineGrade: "4",
    currentGrade: "5",
    targetGrade: "6",
    resourcesProvided: [
      "CGP GCSE Maths Higher revision guide + workbook",
      "Casio fx-83GT calculator",
      "Maths Made Easy practice paper subscription",
      "Bespoke topic notebook (Bilal-prepared)",
    ],
    childMotivation: "High",
    parentSwAware: true,
    childVoice:
      "Bilal explains things how my brain actually works. I get it now. I'm gonna smash that 6.",
    staffObservation:
      "16 weeks in. Confidence transformed — Jordan now volunteers in class. Bilal a steady male academic role model. Funding split: Pupil Premium Plus £600 + Virtual School top-up £360. Worth every penny.",
    nextSession: d(2),
    reviewDate: d(28),
    keyWorker: "staff_chervelle",
  },
  {
    id: "tut-002",
    youngPerson: "yp_jordan",
    subject: "GCSE English Language & Literature",
    examFocus: "AQA GCSE English Language Paper 1 + 2; Literature An Inspector Calls + Macbeth",
    tutorName: "Sarah Wills",
    tutorQualifications: "QTS English Secondary, MA English Lit, 8 years tutoring",
    dbsCheckedDate: "2025-08-20",
    agency: "Tutorful",
    startDate: "2026-02-09",
    ongoing: true,
    format: "Online",
    hoursPerWeek: 1,
    hourlyRate: 25,
    costToDate: 300,
    fundingSource: "Pupil Premium Plus",
    baselineGrade: "4",
    currentGrade: "4",
    targetGrade: "5",
    resourcesProvided: [
      "York Notes for An Inspector Calls + Macbeth",
      "AQA past papers (annotated by Sarah)",
      "Quote bank — bespoke flashcards",
    ],
    childMotivation: "Building",
    parentSwAware: true,
    childVoice:
      "Online's alright. Sarah's nice. Maths is more my thing but I'm trying.",
    staffObservation:
      "Pairing with Maths tutoring deliberate — closing exam-readiness gap together. Online format suits Jordan's evening schedule around football. Slow start but engagement strengthening.",
    nextSession: d(4),
    reviewDate: d(56),
    keyWorker: "staff_chervelle",
  },
  {
    id: "tut-003",
    youngPerson: "yp_alex",
    subject: "A-level Sociology",
    examFocus: "AQA A-level Sociology Paper 1 (Education + methods), Paper 2 (Topics), Paper 3 (Crime + theory) — 2026",
    tutorName: "Dr Paula Reid",
    tutorQualifications: "PhD Sociology (Manchester), PGCE FE, 12 years A-level examining experience",
    dbsCheckedDate: "2025-11-02",
    agency: "MyTutor",
    startDate: "2026-01-20",
    ongoing: true,
    format: "Online",
    hoursPerWeek: 2,
    hourlyRate: 40,
    costToDate: 1120,
    fundingSource: "Leaving Care fund",
    baselineGrade: "C",
    currentGrade: "B",
    targetGrade: "A",
    resourcesProvided: [
      "AQA A-level Sociology textbook (Webb)",
      "Tutor2u online resource subscription",
      "Annotated 25-mark essay exemplars",
      "Theory mind-maps (bespoke)",
    ],
    childMotivation: "Building",
    parentSwAware: true,
    childVoice:
      "Paula gets why I want uni. She doesn't pity me. She just expects me to do the work — and I do.",
    staffObservation:
      "Alex (16+, leaving care eligible) — funded via Leaving Care personal advisor budget under Care Leavers Regs 2010. Paula ideal: academic without being patronising. Aspiration shifting from 'maybe' to 'definitely' uni.",
    nextSession: d(1),
    reviewDate: d(42),
    keyWorker: "staff_anna",
  },
  {
    id: "tut-004",
    youngPerson: "yp_casey",
    subject: "Year 6 SATs — Maths",
    examFocus: "Year 6 KS2 SATs — Maths reasoning + arithmetic — May 2026",
    tutorName: "Mrs Linda Harper",
    tutorQualifications: "QTS Primary, 22 years Year 6 teaching (recently retired), school-organised",
    dbsCheckedDate: "2025-09-01",
    startDate: "2026-02-02",
    ongoing: true,
    format: "In-home",
    hoursPerWeek: 1,
    hourlyRate: 0,
    costToDate: 0,
    fundingSource: "Free (charity)",
    baselineGrade: "Working towards expected",
    currentGrade: "Approaching expected",
    targetGrade: "Expected standard",
    resourcesProvided: [
      "CGP KS2 Maths SATs Question Book",
      "School-supplied past papers",
      "Sensory-friendly visual timer for sessions",
    ],
    childMotivation: "High",
    parentSwAware: true,
    childVoice:
      "Mrs Harper is kind. We do maths at the kitchen table. I like the sticker chart.",
    staffObservation:
      "School-organised tutoring funded via Pupil Premium at primary level (free to home). Mrs Harper trauma-aware and sensory-aware — sessions calibrated to Casey's regulation. SATs not high-stakes for Casey but progress matters for confidence.",
    nextSession: d(3),
    reviewDate: d(35),
    keyWorker: "staff_anna",
  },
];

const motivationColour: Record<string, string> = {
  High: "bg-emerald-100 text-emerald-800",
  Building: "bg-sky-100 text-sky-800",
  Mixed: "bg-amber-100 text-amber-800",
  Low: "bg-rose-100 text-rose-800",
};

const fundingColour: Record<string, string> = {
  "Pupil Premium Plus": "bg-violet-100 text-violet-800",
  "Virtual School grant": "bg-indigo-100 text-indigo-800",
  "Leaving Care fund": "bg-purple-100 text-purple-800",
  "Home budget": "bg-slate-100 text-slate-800",
  "Family contribution": "bg-blue-100 text-blue-800",
  Mixed: "bg-fuchsia-100 text-fuchsia-800",
  "Free (charity)": "bg-emerald-100 text-emerald-800",
};

const exportCols: ExportColumn<TutorRecord>[] = [
  { header: "Young Person", accessor: (r: TutorRecord) => getYPName(r.youngPerson) },
  { header: "Subject", accessor: (r: TutorRecord) => r.subject },
  { header: "Exam Focus", accessor: (r: TutorRecord) => r.examFocus ?? "" },
  { header: "Tutor", accessor: (r: TutorRecord) => r.tutorName },
  { header: "Qualifications", accessor: (r: TutorRecord) => r.tutorQualifications },
  { header: "DBS Checked", accessor: (r: TutorRecord) => r.dbsCheckedDate },
  { header: "Agency", accessor: (r: TutorRecord) => r.agency ?? "Direct" },
  { header: "Format", accessor: (r: TutorRecord) => r.format },
  { header: "Hours/Week", accessor: (r: TutorRecord) => `${r.hoursPerWeek}` },
  { header: "Hourly Rate £", accessor: (r: TutorRecord) => `£${r.hourlyRate}` },
  { header: "Cost To Date £", accessor: (r: TutorRecord) => `£${r.costToDate}` },
  { header: "Funding", accessor: (r: TutorRecord) => r.fundingSource },
  { header: "Baseline", accessor: (r: TutorRecord) => r.baselineGrade ?? "" },
  { header: "Current", accessor: (r: TutorRecord) => r.currentGrade ?? "" },
  { header: "Target", accessor: (r: TutorRecord) => r.targetGrade ?? "" },
  { header: "Motivation", accessor: (r: TutorRecord) => r.childMotivation },
  { header: "Parent/SW Aware", accessor: (r: TutorRecord) => (r.parentSwAware ? "Yes" : "No") },
  { header: "Review Date", accessor: (r: TutorRecord) => r.reviewDate },
  { header: "Key Worker", accessor: (r: TutorRecord) => getStaffName(r.keyWorker) },
];

export default function ChildTutoringPrivateTuitionPage() {
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [sortBy, setSortBy] = useState("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const subjects = useMemo(
    () => Array.from(new Set(data.map((r) => r.subject))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterSubject !== "all") items = items.filter((r) => r.subject === filterSubject);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          r.subject.toLowerCase().includes(q) ||
          r.tutorName.toLowerCase().includes(q) ||
          getYPName(r.youngPerson).toLowerCase().includes(q) ||
          (r.examFocus ?? "").toLowerCase().includes(q),
      );
    }
    items.sort((a, b) => {
      switch (sortBy) {
        case "review":
          return a.reviewDate.localeCompare(b.reviewDate);
        case "cost":
          return b.costToDate - a.costToDate;
        case "hours":
          return b.hoursPerWeek - a.hoursPerWeek;
        case "subject":
          return a.subject.localeCompare(b.subject);
        default:
          return 0;
      }
    });
    return items;
  }, [filterSubject, search, sortBy]);

  const activeTutoring = data.filter((r) => r.ongoing).length;
  const totalHoursPerWeek = data
    .filter((r) => r.ongoing)
    .reduce((s, r) => s + r.hoursPerWeek, 0);
  const costYTD = data.reduce((s, r) => s + r.costToDate, 0);
  const today = new Date();
  const reviewsDue90 = data.filter((r) => {
    const rd = new Date(r.reviewDate);
    const diff = (rd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 90;
  }).length;

  return (
    <PageShell
      title="Tutoring & Private Tuition"
      subtitle="Per-child academic support — closing the attainment gap with intentional, funded, monitored tuition"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="child-tutoring" />
          <PrintButton title="Tutoring & Private Tuition" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-sky-600">{activeTutoring}</p>
          <p className="text-xs text-muted-foreground">Active Tutoring Arrangements</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-violet-600">{totalHoursPerWeek}</p>
          <p className="text-xs text-muted-foreground">Total Hours / Week</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">£{costYTD.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Cost to Date (YTD)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{reviewsDue90}</p>
          <p className="text-xs text-muted-foreground">Reviews Due (90d)</p>
        </div>
      </div>

      <div className="rounded-lg bg-violet-50 border border-violet-200 p-3 mb-6 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
        <p className="text-sm text-violet-800">
          Looked-after children and care leavers face a documented attainment gap. Tutoring is a
          high-leverage entitlement — funded via Pupil Premium Plus, Virtual School grants and
          Leaving Care personal budgets. We track each tutor&apos;s qualifications, DBS, and the
          child&apos;s progress and voice.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search subject, tutor, child..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 border rounded-md text-sm w-[260px]"
          />
        </div>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="review">By Review Date</SelectItem>
              <SelectItem value="cost">By Cost</SelectItem>
              <SelectItem value="hours">By Hours/Week</SelectItem>
              <SelectItem value="subject">By Subject</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <BookOpen className="h-5 w-5 text-sky-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {r.subject} &middot; {getYPName(r.youngPerson)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      Tutor: {r.tutorName} &middot; started {r.startDate}
                      {r.ongoing ? " · ongoing" : r.endDate ? ` · ended ${r.endDate}` : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-medium">
                        {r.subject}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {r.format}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                        {r.hoursPerWeek} hr/wk
                      </span>
                      <span
                        className={cn(
                          "text-[11px] px-2 py-0.5 rounded-full font-medium",
                          fundingColour[r.fundingSource],
                        )}
                      >
                        {r.fundingSource}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] px-2 py-0.5 rounded-full font-medium",
                          motivationColour[r.childMotivation],
                        )}
                      >
                        {r.childMotivation} motivation
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm font-semibold text-indigo-600">
                    £{r.costToDate.toLocaleString()}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <GraduationCap className="h-3 w-3 inline mr-1" />
                      Tutor
                    </p>
                    <p className="text-sm font-medium">{r.tutorName}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {r.tutorQualifications}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      DBS checked {r.dbsCheckedDate}
                      {r.agency ? ` · via ${r.agency}` : " · direct"}
                    </p>
                  </div>

                  {r.examFocus && (
                    <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                      <p className="text-xs font-semibold text-violet-800 uppercase tracking-wide mb-1">
                        <Award className="h-3 w-3 inline mr-1" />
                        Exam Focus
                      </p>
                      <p className="text-sm">{r.examFocus}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Format</p>
                      <p className="font-medium">{r.format}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Hours/wk</p>
                      <p className="font-medium">{r.hoursPerWeek}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Hourly rate</p>
                      <p className="font-medium">
                        <PoundSterling className="h-3 w-3 inline" />
                        {r.hourlyRate}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Cost to date</p>
                      <p className="font-medium">£{r.costToDate.toLocaleString()}</p>
                    </div>
                  </div>

                  {(r.baselineGrade || r.currentGrade || r.targetGrade) && (
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Progress
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 text-center">
                          <p className="text-xs text-muted-foreground">Baseline</p>
                          <p className="text-lg font-bold text-slate-700">
                            {r.baselineGrade ?? "—"}
                          </p>
                        </div>
                        <div className="flex-1 h-1 bg-gradient-to-r from-slate-300 via-sky-400 to-violet-500 rounded-full" />
                        <div className="flex-1 text-center">
                          <p className="text-xs text-muted-foreground">Current</p>
                          <p className="text-lg font-bold text-sky-600">
                            {r.currentGrade ?? "—"}
                          </p>
                        </div>
                        <div className="flex-1 h-1 bg-gradient-to-r from-sky-400 to-violet-500 rounded-full" />
                        <div className="flex-1 text-center">
                          <p className="text-xs text-muted-foreground">Target</p>
                          <p className="text-lg font-bold text-violet-700">
                            {r.targetGrade ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {r.resourcesProvided.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Resources Provided
                      </p>
                      <ul className="space-y-1">
                        {r.resourcesProvided.map((res, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <BookOpen className="h-3 w-3 text-sky-500 mt-1 shrink-0" />
                            <span>{res}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        r.parentSwAware
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800",
                      )}
                    >
                      Parent / Social Worker {r.parentSwAware ? "aware" : "NOT aware"}
                    </span>
                    {r.nextSession && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                        Next session: {r.nextSession}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                      Review: {r.reviewDate}
                    </span>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      Child&apos;s Voice
                    </p>
                    <p className="text-sm italic">&ldquo;{r.childVoice}&rdquo;</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      Staff Observation
                    </p>
                    <p className="text-sm">{r.staffObservation}</p>
                  </div>

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Key worker: {getStaffName(r.keyWorker)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Pupil Premium Plus (DfE allocation for
          looked-after children, deployed via the Virtual School Head); Virtual School Head
          statutory duty under s.20 Children and Young Persons Act 2008; LSCP / Personal
          Education Plan (PEP) statutory guidance — tutoring entries should mirror PEP
          actions; Care Leavers (England) Regulations 2010 — Leaving Care personal budget
          eligible from 16+; DBS Enhanced + Children&apos;s Barred List check required for
          any tutor working alone with a child; Keeping Children Safe in Education (KCSIE)
          2024 — safer recruitment principles apply; UNCRC Articles 28 (right to education)
          and 29 (development of personality and talents). Cross-links: Education page,
          PEP records, Outcomes, Leaving Care plan, Funding tracker, DBS register.
        </p>
      </div>
    </PageShell>
  );
}
