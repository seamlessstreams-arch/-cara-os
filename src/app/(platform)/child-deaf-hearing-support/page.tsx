"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Ear,
  Hand,
  Headphones,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Heart,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HearingRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  hearingStatus:
    | "Hearing — full"
    | "Mild loss"
    | "Moderate loss"
    | "Severe loss"
    | "Profound loss"
    | "Single-sided deafness"
    | "Auditory processing difficulties"
    | "Awaiting assessment";
  identifyAsDeaf: boolean;
  preferredLanguage: "Spoken English" | "BSL" | "SSE (Sign Supported English)" | "Lip-reading + spoken" | "Mixed" | "Other";
  hearingAids?: { side: "Left" | "Right" | "Both"; type: string; fitted: string; battery?: string };
  cochlearImplant?: { side: "Left" | "Right" | "Both"; surgeryDate: string; processor: string };
  audiologyService: string;
  audiologistName?: string;
  lastReview?: string;
  nextReviewDue?: string;
  bslLevel?: "Pre-introduction" | "Some signs" | "Level 1" | "Level 2" | "Level 3" | "Fluent / native";
  bslLearningPlan: string[];
  staffSigningTrained: string[];
  schoolHasPlan: boolean;
  schoolHasRadioAid: boolean;
  homeAdaptations: string[];
  socialOpportunitiesDeaf: string[];
  identityWork: string[];
  emergencyAlarms: string[];
  childVoice: string;
  staffObservation: string;
  flagsForReview: string[];
  reviewDate: string;
  keyWorker: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const records: HearingRecord[] = [
  {
    id: "hear_001",
    youngPerson: "yp_casey",
    recordedDate: d(-21),
    hearingStatus: "Hearing — full",
    identifyAsDeaf: false,
    preferredLanguage: "Spoken English",
    audiologyService: "Routine school screening only",
    bslLevel: "Some signs",
    bslLearningPlan: [
      "Casey learning BSL Level 1 informally to communicate with Ellie's deaf cousin Mia",
      "Online resource (BSL Sign Bank) used with Anna",
      "Anna also learning alongside Casey — shared activity",
      "BSL Level 1 course considered for Casey + Anna in summer holidays",
      "Casey teaches Jordan and Alex new signs at family meals",
    ],
    staffSigningTrained: [
      "Anna (some signs alongside Casey)",
      "Devon (BSL Level 1 from previous role)",
    ],
    schoolHasPlan: false,
    schoolHasRadioAid: false,
    homeAdaptations: [],
    socialOpportunitiesDeaf: [
      "Friendship with Ellie's family — Mia (Ellie's cousin) is profoundly deaf and visits monthly",
      "Local Deaf Children's Society family fun day attended once",
    ],
    identityWork: [
      "Casey understands Deaf identity is a culture not a disability",
      "Watched 'Coda' with Anna and discussed",
      "Jordan, Alex, Casey all sign 'thank you' at meals as a small ritual",
    ],
    emergencyAlarms: [],
    childVoice:
      "Mia and me sign now. I taught Anna 'biscuit' and 'tired' and 'best friend'. I want to learn more. I'm not deaf but Mia is and I want to be a good friend.",
    staffObservation:
      "Casey's friendship-led learning is meaningful. The fact this is shared activity (Anna learning too) keeps it dignified. Watch for moments to connect with the wider Deaf community without tokenising. Identity work is informal and well-pitched.",
    flagsForReview: [
      "Consider routine audiology screening — Casey's processing differences (sensory) sometimes resemble auditory processing",
    ],
    reviewDate: d(120),
    keyWorker: "staff_anna",
  },
];

const exportCols: ExportColumn<HearingRecord>[] = [
  { header: "Young Person", accessor: (r: HearingRecord) => getYPName(r.youngPerson) },
  { header: "Recorded", accessor: (r: HearingRecord) => r.recordedDate },
  { header: "Hearing Status", accessor: (r: HearingRecord) => r.hearingStatus },
  { header: "Identifies as Deaf", accessor: (r: HearingRecord) => (r.identifyAsDeaf ? "Yes" : "No") },
  { header: "Preferred Language", accessor: (r: HearingRecord) => r.preferredLanguage },
  { header: "BSL Level", accessor: (r: HearingRecord) => r.bslLevel ?? "—" },
  { header: "Hearing Aids", accessor: (r: HearingRecord) => (r.hearingAids ? `${r.hearingAids.side} ${r.hearingAids.type}` : "—") },
  { header: "Cochlear Implant", accessor: (r: HearingRecord) => (r.cochlearImplant ? `${r.cochlearImplant.side} ${r.cochlearImplant.processor}` : "—") },
  { header: "Audiology Service", accessor: (r: HearingRecord) => r.audiologyService },
  { header: "Last Review", accessor: (r: HearingRecord) => r.lastReview ?? "—" },
  { header: "Next Review", accessor: (r: HearingRecord) => r.nextReviewDue ?? "—" },
  { header: "Staff Trained", accessor: (r: HearingRecord) => r.staffSigningTrained.join("; ") },
  { header: "School Plan", accessor: (r: HearingRecord) => (r.schoolHasPlan ? "Yes" : "No") },
  { header: "Child Voice", accessor: (r: HearingRecord) => r.childVoice },
  { header: "Review", accessor: (r: HearingRecord) => r.reviewDate },
  { header: "Key Worker", accessor: (r: HearingRecord) => getStaffName(r.keyWorker) },
];

const statusColour: Record<HearingRecord["hearingStatus"], string> = {
  "Hearing — full": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Mild loss": "bg-blue-100 text-blue-800 border-blue-200",
  "Moderate loss": "bg-sky-100 text-sky-800 border-sky-200",
  "Severe loss": "bg-amber-100 text-amber-800 border-amber-200",
  "Profound loss": "bg-orange-100 text-orange-800 border-orange-200",
  "Single-sided deafness": "bg-purple-100 text-purple-800 border-purple-200",
  "Auditory processing difficulties": "bg-violet-100 text-violet-800 border-violet-200",
  "Awaiting assessment": "bg-slate-100 text-slate-800 border-slate-200",
};

export default function ChildDeafHearingSupportPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "status" | "review">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.youngPerson).toLowerCase().includes(search.toLowerCase()) ||
        rec.preferredLanguage.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || rec.hearingStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
      if (sortBy === "status") return a.hearingStatus.localeCompare(b.hearingStatus);
      if (sortBy === "review") return a.reviewDate.localeCompare(b.reviewDate);
      return b.recordedDate.localeCompare(a.recordedDate);
    });
    return r;
  }, [search, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const tracked = records.length;
    const deafIdentifying = records.filter((r) => r.identifyAsDeaf).length;
    const bslLearners = records.filter((r) => r.bslLevel && r.bslLevel !== "Pre-introduction").length;
    const reviewsDue = records.filter((r) => r.reviewDate <= d(60)).length;
    return { tracked, deafIdentifying, bslLearners, reviewsDue };
  }, []);

  return (
    <PageShell
      title="Deaf & Hearing Support"
      subtitle="Per-child hearing status and Deaf identity work — hearing aids, cochlear implants, BSL/SSE language preference, audiology, school plans, home adaptations, Deaf community connection. Honours Deaf identity as culture, not deficit."
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-deaf-hearing-support" />
          <PrintButton title="Deaf & Hearing Support" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Ear className="h-4 w-4" />
            <span>Children tracked</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.tracked}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Heart className="h-4 w-4" />
            <span>Deaf-identifying</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.deafIdentifying}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Hand className="h-4 w-4" />
            <span>BSL learners</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.bslLearners}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Headphones className="h-4 w-4" />
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
            placeholder="Search young person or preferred language..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Hearing status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Hearing — full">Hearing — full</SelectItem>
            <SelectItem value="Mild loss">Mild loss</SelectItem>
            <SelectItem value="Moderate loss">Moderate loss</SelectItem>
            <SelectItem value="Severe loss">Severe loss</SelectItem>
            <SelectItem value="Profound loss">Profound loss</SelectItem>
            <SelectItem value="Single-sided deafness">Single-sided deafness</SelectItem>
            <SelectItem value="Auditory processing difficulties">Auditory processing difficulties</SelectItem>
            <SelectItem value="Awaiting assessment">Awaiting assessment</SelectItem>
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
            <SelectItem value="status">Status</SelectItem>
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
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", statusColour[r.hearingStatus])}>
                      {r.hearingStatus}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                      {r.preferredLanguage}
                    </span>
                    {r.bslLevel ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-violet-100 text-violet-800 border-violet-200">
                        BSL: {r.bslLevel}
                      </span>
                    ) : null}
                    {r.identifyAsDeaf ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-pink-100 text-pink-800 border-pink-200">
                        Deaf identity
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    Recorded {r.recordedDate} · Review {r.reviewDate} · {getStaffName(r.keyWorker)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-violet-200 bg-violet-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-violet-700 uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-violet-900 italic">&ldquo;{r.childVoice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-slate-700">{r.staffObservation}</p>
                    </div>
                    {r.hearingAids ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Hearing aids</div>
                        <div className="text-sm text-slate-700 space-y-1">
                          <div><span className="text-slate-500">Side:</span> {r.hearingAids.side}</div>
                          <div><span className="text-slate-500">Type:</span> {r.hearingAids.type}</div>
                          <div><span className="text-slate-500">Fitted:</span> {r.hearingAids.fitted}</div>
                          {r.hearingAids.battery ? <div><span className="text-slate-500">Battery:</span> {r.hearingAids.battery}</div> : null}
                        </div>
                      </div>
                    ) : null}
                    {r.cochlearImplant ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Cochlear implant</div>
                        <div className="text-sm text-slate-700 space-y-1">
                          <div><span className="text-slate-500">Side:</span> {r.cochlearImplant.side}</div>
                          <div><span className="text-slate-500">Surgery:</span> {r.cochlearImplant.surgeryDate}</div>
                          <div><span className="text-slate-500">Processor:</span> {r.cochlearImplant.processor}</div>
                        </div>
                      </div>
                    ) : null}
                    {r.bslLearningPlan.length ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">BSL learning plan</div>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {r.bslLearningPlan.map((b, i) => (
                            <li key={i} className="flex gap-2"><span className="text-violet-500">·</span><span>{b}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff signing-trained</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.staffSigningTrained.map((s, i) => (
                          <li key={i} className="flex gap-2"><span className="text-emerald-500">·</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    {r.identityWork.length ? (
                      <div className="rounded-md border border-pink-200 bg-pink-50 p-3">
                        <div className="text-xs font-semibold text-pink-700 uppercase mb-2">Identity work</div>
                        <ul className="text-sm text-pink-900 space-y-1">
                          {r.identityWork.map((s, i) => (
                            <li key={i} className="flex gap-2"><span>♡</span><span>{s}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.socialOpportunitiesDeaf.length ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Social opportunities — Deaf community</div>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {r.socialOpportunitiesDeaf.map((s, i) => (
                            <li key={i} className="flex gap-2"><span className="text-slate-400">·</span><span>{s}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.flagsForReview.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Flags for review</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.flagsForReview.map((f, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>
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

      <div className="mt-6 rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Deafness is recognised as cultural identity (the Deaf community), not solely a disability. Practice is
          grounded in the Equality Act 2010 (disability and language), British Sign Language Act 2022, Quality
          Standards 6 (Enjoyment & Achievement) and 8 (Health), the SEND Code of Practice 2015 (where applicable),
          NDCS (National Deaf Children&rsquo;s Society) family support guidance, and UNCRC Articles 8 (identity),
          13 (expression) and 23 (disability rights). Hearing aid maintenance, audiology review schedules, and
          school radio aid arrangements are coordinated through the Sensory Impairment / Teacher of the Deaf
          service where applicable.
        </p>
      </div>
    </PageShell>
  );
}
