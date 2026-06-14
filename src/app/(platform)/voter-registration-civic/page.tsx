"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import type { CivicRecord } from "@/types/extended";
import { useCivicRecords } from "@/hooks/use-civic-records";
import { cn } from "@/lib/utils";
import {
  Vote,
  Landmark,
  Users,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  CheckCircle,
  Calendar,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};


const exportCols: ExportColumn<CivicRecord>[] = [
  { header: "Young Person", accessor: (r: CivicRecord) => getYPName(r.child_id) },
  { header: "Age", accessor: (r: CivicRecord) => `${r.ageAtRecord}` },
  { header: "Recorded", accessor: (r: CivicRecord) => r.recordedDate },
  { header: "Voter Status", accessor: (r: CivicRecord) => r.voterRegistrationStatus },
  { header: "Registered", accessor: (r: CivicRecord) => r.registrationDate ?? "—" },
  { header: "Method", accessor: (r: CivicRecord) => r.registrationMethod ?? "—" },
  { header: "Voter ID", accessor: (r: CivicRecord) => r.voterIdHeld ?? "—" },
  { header: "Causes", accessor: (r: CivicRecord) => r.causesOfInterest.join("; ") },
  { header: "Community", accessor: (r: CivicRecord) => r.communityActivities.join("; ") },
  { header: "Reps Contacted", accessor: (r: CivicRecord) => (r.hasContactedRepresentative ? "Yes" : "No") },
  { header: "Reps Known", accessor: (r: CivicRecord) => r.representativesKnown.join("; ") },
  { header: "Child Voice", accessor: (r: CivicRecord) => r.childVoice },
  { header: "Next Step", accessor: (r: CivicRecord) => r.nextStep },
  { header: "Review", accessor: (r: CivicRecord) => r.reviewDate },
  { header: "Key Worker", accessor: (r: CivicRecord) => getStaffName(r.keyWorker) },
];

const statusColour: Record<CivicRecord["voterRegistrationStatus"], string> = {
  "Too young": "bg-slate-100 text-slate-800 border-slate-200",
  "Eligible — not registered": "bg-amber-100 text-amber-800 border-amber-200",
  "Registered (attainer)": "bg-blue-100 text-blue-800 border-blue-200",
  "Registered — full": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Postal vote arranged": "bg-purple-100 text-purple-800 border-purple-200",
  "Voter ID confirmed": "bg-teal-100 text-teal-800 border-teal-200",
};

export default function VoterRegistrationCivicPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "age" | "status">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: result, isLoading } = useCivicRecords(undefined, "home_oak");
  const records = result?.data ?? [];

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        rec.causesOfInterest.some((c) => c.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || rec.voterRegistrationStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      if (sortBy === "age") return b.ageAtRecord - a.ageAtRecord;
      if (sortBy === "status") return a.voterRegistrationStatus.localeCompare(b.voterRegistrationStatus);
      return b.recordedDate.localeCompare(a.recordedDate);
    });
    return r;
  }, [search, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const registered = records.filter((r) => r.voterRegistrationStatus.startsWith("Registered")).length;
    const eligibleNotRegistered = records.filter((r) => r.voterRegistrationStatus === "Eligible — not registered").length;
    const repsContacted = records.filter((r) => r.hasContactedRepresentative).length;
    const reviewsDue = records.filter((r) => r.reviewDate <= d(60)).length;
    return { registered, eligibleNotRegistered, repsContacted, reviewsDue };
  }, [records]);

  return (
    <PageShell
      title="Voter Registration & Civic Participation"
      subtitle="Per-young-person civic engagement — voter registration (16+ attainer in some elections), voter ID, elections, contacting representatives, causes of interest, community activities. Children in care vote less than peers — this work changes that."
      caraContext={{ pageTitle: "Voter Registration & Civic Participation", sourceType: "care_plan" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="voter-registration-civic" />
          <PrintButton title="Voter Registration & Civic Participation" />
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Vote className="h-4 w-4" />
            <span>Registered</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.registered}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <CheckCircle className="h-4 w-4" />
            <span>Reps contacted</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.repsContacted}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Landmark className="h-4 w-4" />
            <span>Eligible, not yet registered</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.eligibleNotRegistered}</div>
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
            placeholder="Search young person or cause..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Voter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Too young">Too young</SelectItem>
            <SelectItem value="Eligible — not registered">Eligible — not registered</SelectItem>
            <SelectItem value="Registered (attainer)">Registered (attainer)</SelectItem>
            <SelectItem value="Registered — full">Registered — full</SelectItem>
            <SelectItem value="Postal vote arranged">Postal vote arranged</SelectItem>
            <SelectItem value="Voter ID confirmed">Voter ID confirmed</SelectItem>
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
            <SelectItem value="age">Age</SelectItem>
            <SelectItem value="status">Status</SelectItem>
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
                    <span className="text-slate-500">age {r.ageAtRecord}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", statusColour[r.voterRegistrationStatus])}>
                      {r.voterRegistrationStatus}
                    </span>
                    {r.voterIdHeld ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-teal-100 text-teal-800 border-teal-200">
                        ID: {r.voterIdHeld}
                      </span>
                    ) : null}
                    {r.hasContactedRepresentative ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
                        Has contacted rep
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
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-slate-700 italic">&ldquo;{r.childVoice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-slate-700">{r.staffObservation}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Causes of interest</div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.causesOfInterest.map((c, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full border bg-blue-50 text-blue-800 border-blue-200">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Community activities</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.communityActivities.map((c, i) => (
                          <li key={i} className="flex gap-2"><span className="text-emerald-500">·</span><span>{c}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Civic education covered</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.civicEducationCovered.map((c, i) => (
                          <li key={i} className="flex gap-2"><span className="text-slate-400">·</span><span>{c}</span></li>
                        ))}
                      </ul>
                    </div>
                    {r.electionsEligibleNext.length ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Elections eligible next</div>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {r.electionsEligibleNext.map((e, i) => (
                            <li key={i} className="flex gap-2 justify-between"><span>{e.name}</span><span className="text-slate-500">{e.date}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.representativesKnown.length ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Reps known</div>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {r.representativesKnown.map((rep, i) => (
                            <li key={i} className="flex gap-2"><Users className="h-3.5 w-3.5 text-slate-400 mt-0.5" /><span>{rep}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-blue-800 uppercase mb-2">Next step</div>
                      <p className="text-sm text-blue-900">{r.nextStep}</p>
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
          Looked-after children and care leavers vote at lower rates than peers. Practice is grounded in Quality
          Standards 5 (Education) and 6 (Enjoyment & Achievement), the Pathway Plan duty (Care Leavers (England)
          Regulations 2010), and UNCRC Articles 12 (voice), 13 (expression), and 17 (information). 16-year-olds can
          register as &ldquo;attainers&rdquo; and voter ID under the Elections Act 2022 must be planned for in
          advance — Citizen Cards are free for care leavers.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Voter Registration & Civic Participation — electoral roll registration, citizenship education, civic engagement activities, rights and responsibilities, Reg 45 rights/participation evidence"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
