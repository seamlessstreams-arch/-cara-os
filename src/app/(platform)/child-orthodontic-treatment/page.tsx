"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Calendar,
  Smile,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrthoRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  stage:
    | "Awaiting referral"
    | "Referred — assessment booked"
    | "Assessed — on waiting list"
    | "Active treatment"
    | "Retention phase"
    | "Discharged"
    | "Not currently indicated";
  iotnScore?: string;
  nhsEligible: boolean;
  privateOption?: string;
  treatmentType?:
    | "Fixed metal braces"
    | "Fixed ceramic braces"
    | "Removable functional appliance"
    | "Twin block"
    | "Clear aligners (Invisalign)"
    | "Lingual"
    | "Other";
  orthodontist?: string;
  practiceName?: string;
  startDate?: string;
  expectedEndDate?: string;
  appointmentFrequency?: string;
  appointmentsAttended: number;
  appointmentsMissed: number;
  oralHygieneCompliance:
    | "Excellent"
    | "Good"
    | "Fair"
    | "Poor — needs support"
    | "Not yet started";
  retainerWearReportedNightly?: boolean;
  retainerType?: string;
  childMotivation: "High" | "Moderate" | "Mixed" | "Low / wants to stop";
  emergencyContacts: { name: string; role: string; phone: string }[];
  costCovered?: string;
  childVoice: string;
  staffObservation: string;
  flagsConcerns: string[];
  reviewDate: string;
  keyWorker: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const records: OrthoRecord[] = [
  {
    id: "ortho_001",
    youngPerson: "yp_casey",
    recordedDate: d(-10),
    stage: "Referred — assessment booked",
    iotnScore: "Expected 4–5 (severe crowding + anterior crossbite flagged at routine dental exam)",
    nhsEligible: true,
    treatmentType: undefined,
    practiceName: "Smile Dental Practice (referring dentist) → community orthodontist",
    orthodontist: "Pending allocation — assessment slot 6 weeks from referral",
    appointmentFrequency: undefined,
    appointmentsAttended: 0,
    appointmentsMissed: 0,
    oralHygieneCompliance: "Good",
    childMotivation: "Moderate",
    emergencyContacts: [
      { name: "Smile Dental Practice", role: "Referring dentist", phone: "01332 500 400" },
      { name: "NHS 111", role: "Out-of-hours dental", phone: "111" },
    ],
    costCovered: "NHS — no charge expected if IOTN score confirms eligibility (4 or 3.6+)",
    childVoice:
      "Ellie has braces and they look cool. I don't want my teeth to look weird forever. I'm a bit scared of the metal bits hurting but Ellie says it's fine after a few days.",
    staffObservation:
      "Casey nervous but motivated — peer modelling (Ellie) is a strong positive factor. Anna completed a prep visit to Smile Dental Practice with Casey to walk through what an orthodontic assessment will involve. Recommend Anna also attend the assessment appointment to reduce anxiety. Crowding and crossbite are visible — likely strong NHS case.",
    flagsConcerns: [
      "Casey has historical medication refusal — may need extra reassurance about pain management at fitting",
      "Confirm IOTN score in writing once assessed — required for NHS funding decision",
    ],
    reviewDate: d(45),
    keyWorker: "staff_chervelle",
  },
  {
    id: "ortho_002",
    youngPerson: "yp_jordan",
    recordedDate: d(-7),
    stage: "Active treatment",
    iotnScore: "4 (confirmed at assessment — overjet 8mm, NHS funded)",
    nhsEligible: true,
    treatmentType: "Fixed metal braces",
    orthodontist: "Mr. P. Chowdhury BDS MOrth",
    practiceName: "Bridgewater Orthodontics",
    startDate: d(-420),
    expectedEndDate: d(180),
    appointmentFrequency: "Every 6 weeks",
    appointmentsAttended: 11,
    appointmentsMissed: 0,
    oralHygieneCompliance: "Good",
    retainerWearReportedNightly: undefined,
    retainerType: "Hawley + bonded lower retainer planned at debond",
    childMotivation: "High",
    emergencyContacts: [
      { name: "Bridgewater Orthodontics", role: "Treating practice", phone: "0115 977 4400" },
      { name: "NHS 111", role: "Out-of-hours dental", phone: "111" },
    ],
    costCovered: "NHS — IOTN 4 confirmed",
    childVoice:
      "I want a nice smile for my college photos next year. The wires hurt for a couple of days when they tighten them but Anna gets me soft food and I'm fine. I'm looking forward to them coming off.",
    staffObservation:
      "Jordan extremely committed — has attended every appointment, brushes twice daily plus interdental, no breakages reported. Retention phase begins approx 6 months. Need to plan retainer-wear support strategy now: Hawley nightly + bonded lower means lower compliance burden but staff prompts still helpful in first months. Halal-compatible orthodontic wax confirmed with practice.",
    flagsConcerns: [
      "Plan retention phase support: prompts + nightly retainer routine to be agreed before debond",
      "Replacement retainer cost is NOT covered by NHS — agree contingency budget with placing LA",
    ],
    reviewDate: d(60),
    keyWorker: "staff_anna",
  },
];

const exportCols: ExportColumn<OrthoRecord>[] = [
  { header: "Young Person", accessor: (r: OrthoRecord) => getYPName(r.youngPerson) },
  { header: "Recorded", accessor: (r: OrthoRecord) => r.recordedDate },
  { header: "Stage", accessor: (r: OrthoRecord) => r.stage },
  { header: "IOTN", accessor: (r: OrthoRecord) => r.iotnScore ?? "—" },
  { header: "NHS Eligible", accessor: (r: OrthoRecord) => (r.nhsEligible ? "Yes" : "No") },
  { header: "Treatment Type", accessor: (r: OrthoRecord) => r.treatmentType ?? "—" },
  { header: "Orthodontist", accessor: (r: OrthoRecord) => r.orthodontist ?? "—" },
  { header: "Practice", accessor: (r: OrthoRecord) => r.practiceName ?? "—" },
  { header: "Start", accessor: (r: OrthoRecord) => r.startDate ?? "—" },
  { header: "Expected End", accessor: (r: OrthoRecord) => r.expectedEndDate ?? "—" },
  { header: "Frequency", accessor: (r: OrthoRecord) => r.appointmentFrequency ?? "—" },
  { header: "Attended", accessor: (r: OrthoRecord) => String(r.appointmentsAttended) },
  { header: "Missed", accessor: (r: OrthoRecord) => String(r.appointmentsMissed) },
  { header: "Oral Hygiene", accessor: (r: OrthoRecord) => r.oralHygieneCompliance },
  { header: "Retainer Type", accessor: (r: OrthoRecord) => r.retainerType ?? "—" },
  {
    header: "Retainer Worn Nightly",
    accessor: (r: OrthoRecord) =>
      r.retainerWearReportedNightly === undefined ? "—" : r.retainerWearReportedNightly ? "Yes" : "No",
  },
  { header: "Motivation", accessor: (r: OrthoRecord) => r.childMotivation },
  { header: "Cost", accessor: (r: OrthoRecord) => r.costCovered ?? "—" },
  { header: "Child Voice", accessor: (r: OrthoRecord) => r.childVoice },
  { header: "Review", accessor: (r: OrthoRecord) => r.reviewDate },
  { header: "Key Worker", accessor: (r: OrthoRecord) => getStaffName(r.keyWorker) },
];

const stageColour: Record<OrthoRecord["stage"], string> = {
  "Awaiting referral": "bg-slate-100 text-slate-800 border-slate-200",
  "Referred — assessment booked": "bg-sky-100 text-sky-800 border-sky-200",
  "Assessed — on waiting list": "bg-blue-100 text-blue-800 border-blue-200",
  "Active treatment": "bg-teal-100 text-teal-800 border-teal-200",
  "Retention phase": "bg-emerald-100 text-emerald-800 border-emerald-200",
  Discharged: "bg-slate-100 text-slate-700 border-slate-200",
  "Not currently indicated": "bg-stone-100 text-stone-700 border-stone-200",
};

const motivationColour: Record<OrthoRecord["childMotivation"], string> = {
  High: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Moderate: "bg-sky-100 text-sky-800 border-sky-200",
  Mixed: "bg-amber-100 text-amber-800 border-amber-200",
  "Low / wants to stop": "bg-rose-100 text-rose-800 border-rose-200",
};

const hygieneColour: Record<OrthoRecord["oralHygieneCompliance"], string> = {
  Excellent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Good: "bg-teal-100 text-teal-800 border-teal-200",
  Fair: "bg-amber-100 text-amber-800 border-amber-200",
  "Poor — needs support": "bg-rose-100 text-rose-800 border-rose-200",
  "Not yet started": "bg-slate-100 text-slate-700 border-slate-200",
};

export default function ChildOrthodonticTreatmentPage() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "stage" | "review">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.youngPerson).toLowerCase().includes(search.toLowerCase()) ||
        (rec.practiceName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (rec.orthodontist ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStage = stageFilter === "all" || rec.stage === stageFilter;
      return matchesSearch && matchesStage;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
      if (sortBy === "stage") return a.stage.localeCompare(b.stage);
      if (sortBy === "review") return a.reviewDate.localeCompare(b.reviewDate);
      return b.recordedDate.localeCompare(a.recordedDate);
    });
    return r;
  }, [search, stageFilter, sortBy]);

  const stats = useMemo(() => {
    const active = records.filter((r) => r.stage === "Active treatment").length;
    const retention = records.filter((r) => r.stage === "Retention phase").length;
    const onNhs = records.filter((r) => r.nhsEligible).length;
    const reviewsDue = records.filter((r) => r.reviewDate <= d(90)).length;
    return { active, retention, onNhs, reviewsDue };
  }, []);

  return (
    <PageShell
      title="Orthodontic Treatment"
      subtitle="Per-child orthodontic journey — referral, IOTN scoring, NHS eligibility, brace type, appointment attendance, oral hygiene compliance, retention phase. Coordinated with general dental records and dietary planning."
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-orthodontic-treatment" />
          <PrintButton title="Orthodontic Treatment" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Active treatment</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.active}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Smile className="h-4 w-4" />
            <span>Retention phase</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.retention}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Award className="h-4 w-4" />
            <span>NHS eligible</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.onNhs}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Reviews due (90d)</span>
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
            placeholder="Search young person, practice or orthodontist..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            <SelectItem value="Awaiting referral">Awaiting referral</SelectItem>
            <SelectItem value="Referred — assessment booked">Referred — assessment booked</SelectItem>
            <SelectItem value="Assessed — on waiting list">Assessed — on waiting list</SelectItem>
            <SelectItem value="Active treatment">Active treatment</SelectItem>
            <SelectItem value="Retention phase">Retention phase</SelectItem>
            <SelectItem value="Discharged">Discharged</SelectItem>
            <SelectItem value="Not currently indicated">Not currently indicated</SelectItem>
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
            <SelectItem value="stage">Stage</SelectItem>
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
                    <span className="font-semibold text-slate-900">{getYPName(r.youngPerson)}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", stageColour[r.stage])}>
                      {r.stage}
                    </span>
                    {r.nhsEligible ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                        NHS eligible
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-stone-100 text-stone-700 border-stone-200">
                        NHS not eligible
                      </span>
                    )}
                    {r.treatmentType ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-teal-100 text-teal-800 border-teal-200">
                        {r.treatmentType}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border",
                        motivationColour[r.childMotivation]
                      )}
                    >
                      Motivation: {r.childMotivation}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Recorded {r.recordedDate} · Review {r.reviewDate} · {getStaffName(r.keyWorker)}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-sky-200 bg-sky-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-sky-700 uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-sky-900 italic">&ldquo;{r.childVoice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Staff Observation
                      </div>
                      <p className="text-sm text-slate-700">{r.staffObservation}</p>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        IOTN & NHS
                      </div>
                      <div className="text-sm text-slate-700 space-y-1">
                        <div>
                          <span className="text-slate-500">IOTN score:</span> {r.iotnScore ?? "—"}
                        </div>
                        <div>
                          <span className="text-slate-500">NHS eligible:</span>{" "}
                          {r.nhsEligible ? "Yes" : "No"}
                        </div>
                        {r.privateOption ? (
                          <div>
                            <span className="text-slate-500">Private option:</span> {r.privateOption}
                          </div>
                        ) : null}
                        {r.costCovered ? (
                          <div>
                            <span className="text-slate-500">Cost cover:</span> {r.costCovered}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Treatment details
                      </div>
                      <div className="text-sm text-slate-700 space-y-1">
                        <div>
                          <span className="text-slate-500">Type:</span> {r.treatmentType ?? "—"}
                        </div>
                        <div>
                          <span className="text-slate-500">Start:</span> {r.startDate ?? "—"}
                        </div>
                        <div>
                          <span className="text-slate-500">Expected end:</span>{" "}
                          {r.expectedEndDate ?? "—"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Orthodontist
                      </div>
                      <div className="text-sm text-slate-700 space-y-1">
                        <div>
                          <span className="text-slate-500">Practice:</span> {r.practiceName ?? "—"}
                        </div>
                        <div>
                          <span className="text-slate-500">Clinician:</span> {r.orthodontist ?? "—"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Appointments
                      </div>
                      <div className="text-sm text-slate-700 space-y-1">
                        <div>
                          <span className="text-slate-500">Frequency:</span>{" "}
                          {r.appointmentFrequency ?? "—"}
                        </div>
                        <div>
                          <span className="text-slate-500">Attended:</span> {r.appointmentsAttended}
                        </div>
                        <div>
                          <span className="text-slate-500">Missed:</span> {r.appointmentsMissed}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Oral hygiene & motivation
                      </div>
                      <div className="text-sm text-slate-700 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Hygiene:</span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full border",
                              hygieneColour[r.oralHygieneCompliance]
                            )}
                          >
                            {r.oralHygieneCompliance}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Motivation:</span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full border",
                              motivationColour[r.childMotivation]
                            )}
                          >
                            {r.childMotivation}
                          </span>
                        </div>
                      </div>
                    </div>

                    {r.retainerType || r.retainerWearReportedNightly !== undefined ? (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                        <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">
                          Retention phase
                        </div>
                        <div className="text-sm text-emerald-900 space-y-1">
                          {r.retainerType ? (
                            <div>
                              <span className="text-emerald-700">Retainer type:</span>{" "}
                              {r.retainerType}
                            </div>
                          ) : null}
                          {r.retainerWearReportedNightly !== undefined ? (
                            <div>
                              <span className="text-emerald-700">Worn nightly:</span>{" "}
                              {r.retainerWearReportedNightly ? "Yes" : "No"}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {r.emergencyContacts.length ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                          Emergency contacts
                        </div>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {r.emergencyContacts.map((c, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-teal-500">·</span>
                              <span>
                                <span className="font-medium">{c.name}</span> — {c.role} ·{" "}
                                <span className="text-slate-600">{c.phone}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {r.flagsConcerns.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">
                          Flags & concerns
                        </div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.flagsConcerns.map((f, i) => (
                            <li key={i} className="flex gap-2">
                              <span>!</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          NHS orthodontic treatment for under-18s is governed by the NHS Business Services Authority
          eligibility rules — IOTN (Index of Orthodontic Treatment Need) score of 4 or 5, or 3 with
          Aesthetic Component 6+ (often summarised as &ldquo;3.6+&rdquo;). Practice follows British
          Orthodontic Society standards, Children&rsquo;s Homes (England) Regulations 2015 Quality
          Standard 8 (Health &amp; Wellbeing), the NHS Long Term Dental Plan, and UNCRC Article 24
          (right to the highest attainable standard of health). Where a child is NHS-ineligible and
          private treatment is being considered, costs and consent must be agreed with the placing
          local authority before any commitment is made. Retainer replacement after debond is not
          NHS-funded — contingency must be planned.
        </p>
      </div>
    </PageShell>
  );
}
