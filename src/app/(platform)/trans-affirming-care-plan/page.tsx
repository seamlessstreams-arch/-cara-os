"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Heart,
  Shield,
  Users,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Star,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

interface TransPlan {
  id: string;
  youngPerson: string;
  planDate: string;
  identitySharedWithStaff: string;
  pronouns: string;
  pronounsUsedConsistently: boolean;
  preferredName: string;
  legalNameMatches: boolean;
  preferredNameWhereUsed: string[];
  whereDeadnameStillAppears: string[];
  socialTransitionStage:
    | "Pre-questioning"
    | "Questioning / exploring"
    | "Privately identified"
    | "Out to staff only"
    | "Selectively out"
    | "Fully socially transitioned"
    | "Detransitioned / re-exploring";
  childPaceConfirmed: boolean;
  affirmingActions: string[];
  clothingAccessSupported: string[];
  bindingPolicy?: string;
  packerPolicy?: string;
  voiceCoachingActive?: string;
  hairCareAffirming: string[];
  pronounEducationForVisitors: boolean;
  externalSupport: { agency: string; clinician?: string; frequency: string }[];
  giccConsidered: boolean;
  giccStatus?: string;
  childCanRequestPause: boolean;
  parentalAwareness:
    | "Out and supported"
    | "Out — strained"
    | "Selectively"
    | "Not yet — child's choice"
    | "Not yet — risk-assessed"
    | "Hostile family — no contact agreed";
  schoolAware: "Fully" | "Partially" | "Not aware — child's choice";
  schoolUsingPreferredNamePronouns: boolean;
  bathroomChangingArrangements: string;
  safetyRiskAssessment: string[];
  recordsLanguageUpdated: boolean;
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

const records: TransPlan[] = [
  {
    id: "trans_001",
    youngPerson: "yp_alex",
    planDate: d(-21),
    identitySharedWithStaff: "Non-binary, they/them",
    pronouns: "they/them",
    pronounsUsedConsistently: true,
    preferredName: "Alex",
    legalNameMatches: true,
    preferredNameWhereUsed: [
      "Home (always)",
      "School (yes — agreed with school)",
      "Boxing club (Coach Khalid uses they/them)",
      "GP (record updated to mark they/them, name unchanged)",
      "Proud Trust youth group",
    ],
    whereDeadnameStillAppears: [
      "Some legacy social services records pre-care (flagged for update)",
      "Birth certificate (legal — Alex aware, no GRC discussion at this age)",
    ],
    socialTransitionStage: "Selectively out",
    childPaceConfirmed: true,
    affirmingActions: [
      "Pronouns in handover at every shift",
      "Pronouns on bedroom door (they/them, written by Alex)",
      "Gender-neutral language in care planning",
      "Trans-affirming books in lounge (sourced with Anna)",
      "Photos on noticeboard chosen by Alex (post-haircut images only — Alex's choice)",
      "Pre-binder education provided — chest binder safe-use info shared",
      "Period products available regardless of gender — discreet placement",
      "Birthday cards sourced gender-neutral",
    ],
    clothingAccessSupported: [
      "Boy section / unisex shopping budget supported",
      "Sports bra / binder budget separate from clothing budget",
      "No pressure to wear gendered school uniform — discussed school adaptations",
    ],
    bindingPolicy: "Alex uses GC2B binder — staff-aware safe-use guidance: max 8 hours, never sleeping/exercise, alternate days, never wet, replace every 2 years",
    packerPolicy: "Not currently using",
    voiceCoachingActive: "Not currently — Alex not interested at this age",
    hairCareAffirming: [
      "Cropped style — barber Imran (Jordan's barber, also cuts Alex's hair, gender-neutral conversation)",
      "Casey often comes along — sibling activity",
      "No commentary on 'feminine' regrowth",
    ],
    pronounEducationForVisitors: true,
    externalSupport: [
      { agency: "Proud Trust", clinician: "Casey Lee (youth worker)", frequency: "Fortnightly group" },
      { agency: "CAMHS gender-aware therapist", clinician: "Dr Patel", frequency: "Fortnightly" },
      { agency: "Mermaids parent helpline (for Alex's mum)", frequency: "Family-led" },
    ],
    giccConsidered: false,
    giccStatus: "Discussed at CAMHS — not currently pursuing GIDS / GIC referral. Watchful waiting model. Alex's choice and clinician-supported. Will revisit annually.",
    childCanRequestPause: true,
    parentalAwareness: "Out — strained",
    schoolAware: "Fully",
    schoolUsingPreferredNamePronouns: true,
    bathroomChangingArrangements:
      "Alex uses gender-neutral toilet at school. Boxing gym uses staff bathroom (agreed with Coach Khalid). At home: no specific arrangement — bathroom is private.",
    safetyRiskAssessment: [
      "Family contact: paternal side hostile. Contact paused at Alex's request post-coming-out. Maternal side accepting, mum still adjusting language.",
      "Birth dad threats noted on case file — police aware historically.",
      "Online safety: extra vigilance for transphobic content / grooming targeting LGBTQ+ youth — Anna with Alex monthly.",
      "Public spaces: Alex chooses where to use which bathroom — supported, never policed.",
    ],
    recordsLanguageUpdated: true,
    childVoice:
      "I'm them. That's it. I don't need to explain. I'm grateful that the home doesn't make a big deal of it but also takes it seriously — both. Don't celebrate me for being trans. Just let me be a person.",
    staffObservation:
      "Plan working well. Alex's identity has stabilised since coming out 14 months ago. Mood and engagement strong. Pronouns are second nature for staff now. Watchful approach to medical pathway respected by all clinicians. Family contact issues remain the live risk.",
    flagsForReview: [
      "Watch for periodic dysphoria spikes around growth/period",
      "Family contact strategy — review post-Eid (paternal side may attempt re-contact)",
      "Renewal of binder budget annually",
    ],
    reviewDate: d(60),
    keyWorker: "staff_anna",
  },
];

const exportCols: ExportColumn<TransPlan>[] = [
  { header: "Young Person", accessor: (r: TransPlan) => getYPName(r.youngPerson) },
  { header: "Plan Date", accessor: (r: TransPlan) => r.planDate },
  { header: "Identity", accessor: (r: TransPlan) => r.identitySharedWithStaff },
  { header: "Pronouns", accessor: (r: TransPlan) => r.pronouns },
  { header: "Preferred Name", accessor: (r: TransPlan) => r.preferredName },
  { header: "Stage", accessor: (r: TransPlan) => r.socialTransitionStage },
  { header: "Child Pace Confirmed", accessor: (r: TransPlan) => (r.childPaceConfirmed ? "Yes" : "No") },
  { header: "Parental Awareness", accessor: (r: TransPlan) => r.parentalAwareness },
  { header: "School Aware", accessor: (r: TransPlan) => r.schoolAware },
  { header: "School Using Pronouns", accessor: (r: TransPlan) => (r.schoolUsingPreferredNamePronouns ? "Yes" : "No") },
  { header: "Affirming Actions", accessor: (r: TransPlan) => r.affirmingActions.join("; ") },
  { header: "External Support", accessor: (r: TransPlan) => r.externalSupport.map((s) => s.agency).join("; ") },
  { header: "Safety Risks", accessor: (r: TransPlan) => r.safetyRiskAssessment.join("; ") },
  { header: "Records Updated", accessor: (r: TransPlan) => (r.recordsLanguageUpdated ? "Yes" : "No") },
  { header: "Review", accessor: (r: TransPlan) => r.reviewDate },
  { header: "Key Worker", accessor: (r: TransPlan) => getStaffName(r.keyWorker) },
];

const stageColour: Record<TransPlan["socialTransitionStage"], string> = {
  "Pre-questioning": "bg-slate-100 text-slate-800 border-slate-200",
  "Questioning / exploring": "bg-amber-100 text-amber-800 border-amber-200",
  "Privately identified": "bg-blue-100 text-blue-800 border-blue-200",
  "Out to staff only": "bg-sky-100 text-sky-800 border-sky-200",
  "Selectively out": "bg-violet-100 text-violet-800 border-violet-200",
  "Fully socially transitioned": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Detransitioned / re-exploring": "bg-rose-100 text-rose-800 border-rose-200",
};

export default function TransAffirmingCarePlanPage() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "stage" | "review">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.youngPerson).toLowerCase().includes(search.toLowerCase()) ||
        rec.identitySharedWithStaff.toLowerCase().includes(search.toLowerCase());
      const matchesStage = stageFilter === "all" || rec.socialTransitionStage === stageFilter;
      return matchesSearch && matchesStage;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
      if (sortBy === "stage") return a.socialTransitionStage.localeCompare(b.socialTransitionStage);
      if (sortBy === "review") return a.reviewDate.localeCompare(b.reviewDate);
      return b.planDate.localeCompare(a.planDate);
    });
    return r;
  }, [search, stageFilter, sortBy]);

  const stats = useMemo(() => {
    const activePlans = records.length;
    const childPaceRespected = records.filter((r) => r.childPaceConfirmed).length;
    const externalSupportEngaged = records.filter((r) => r.externalSupport.length > 0).length;
    const reviewsDue = records.filter((r) => r.reviewDate <= d(60)).length;
    return { activePlans, childPaceRespected, externalSupportEngaged, reviewsDue };
  }, []);

  return (
    <PageShell
      title="Trans-Affirming Care Plans"
      subtitle="Per-child trans-affirming care plans for trans, non-binary and gender-questioning young people. Child-led pace, identity-affirming actions, family/school/community coordination, safety risk assessment, watchful-waiting clinical model. Distinct from broader LGBTQ+ inclusion records."
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "care_plan" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="trans-affirming-care-plan" />
          <PrintButton title="Trans-Affirming Care Plans" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Heart className="h-4 w-4" />
            <span>Active plans</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.activePlans}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Star className="h-4 w-4" />
            <span>Child pace confirmed</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.childPaceRespected}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Users className="h-4 w-4" />
            <span>External support engaged</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.externalSupportEngaged}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Shield className="h-4 w-4" />
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
            placeholder="Search young person or identity..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            <SelectItem value="Pre-questioning">Pre-questioning</SelectItem>
            <SelectItem value="Questioning / exploring">Questioning / exploring</SelectItem>
            <SelectItem value="Privately identified">Privately identified</SelectItem>
            <SelectItem value="Out to staff only">Out to staff only</SelectItem>
            <SelectItem value="Selectively out">Selectively out</SelectItem>
            <SelectItem value="Fully socially transitioned">Fully socially transitioned</SelectItem>
            <SelectItem value="Detransitioned / re-exploring">Detransitioned / re-exploring</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent plan</SelectItem>
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
                    <span className="text-slate-700">{r.preferredName} · {r.pronouns}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", stageColour[r.socialTransitionStage])}>
                      {r.socialTransitionStage}
                    </span>
                    {r.childPaceConfirmed ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-pink-100 text-pink-800 border-pink-200">
                        Child-paced
                      </span>
                    ) : null}
                    {r.recordsLanguageUpdated ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
                        Records updated
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">
                        Records pending
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-600">
                    Plan {r.planDate} · Review {r.reviewDate} · {getStaffName(r.keyWorker)}
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
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Affirming actions</div>
                      <ul className="text-sm text-emerald-900 space-y-1">
                        {r.affirmingActions.map((a, i) => (
                          <li key={i} className="flex gap-2"><span>+</span><span>{a}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Clothing & body</div>
                      <ul className="text-sm text-slate-700 space-y-1.5">
                        {r.clothingAccessSupported.map((c, i) => (
                          <li key={i} className="flex gap-2"><span className="text-slate-400">·</span><span>{c}</span></li>
                        ))}
                        {r.bindingPolicy ? (
                          <li className="border-t border-slate-100 pt-1.5"><span className="text-xs text-slate-500 uppercase">Binder policy:</span> <span>{r.bindingPolicy}</span></li>
                        ) : null}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Where preferred name used</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.preferredNameWhereUsed.map((n, i) => (
                          <li key={i} className="flex gap-2"><span className="text-emerald-500">+</span><span>{n}</span></li>
                        ))}
                      </ul>
                    </div>
                    {r.whereDeadnameStillAppears.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Deadname remaining</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.whereDeadnameStillAppears.map((n, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{n}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">External support</div>
                      <ul className="text-sm text-slate-700 space-y-1.5">
                        {r.externalSupport.map((s, i) => (
                          <li key={i}>
                            <div className="font-medium">{s.agency}</div>
                            <div className="text-slate-500">{s.clinician ?? "—"} · {s.frequency}</div>
                          </li>
                        ))}
                      </ul>
                      {r.giccStatus ? (
                        <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-100">{r.giccStatus}</p>
                      ) : null}
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Family & school</div>
                      <div className="text-sm text-slate-700 space-y-1">
                        <div><span className="text-slate-500">Parental awareness:</span> {r.parentalAwareness}</div>
                        <div><span className="text-slate-500">School aware:</span> {r.schoolAware}</div>
                        <div><span className="text-slate-500">School using pronouns:</span> {r.schoolUsingPreferredNamePronouns ? "Yes" : "No"}</div>
                        <div><span className="text-slate-500">Bathroom/changing:</span> {r.bathroomChangingArrangements}</div>
                      </div>
                    </div>
                    <div className="rounded-md border border-rose-200 bg-rose-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-rose-700 uppercase mb-2">Safety risk assessment</div>
                      <ul className="text-sm text-rose-900 space-y-1">
                        {r.safetyRiskAssessment.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>!</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    {r.flagsForReview.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Flags for review</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.flagsForReview.map((f, i) => (
                            <li key={i} className="flex gap-2"><span>·</span><span>{f}</span></li>
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
          Care is child-led, child-paced, and watchful-waiting. Practice is grounded in the Equality Act 2010 (gender
          reassignment), Children&rsquo;s Homes Quality Standards 6 (Enjoyment & Achievement), 7 (Positive Relationships)
          and 9 (Protection), KCSIE 2024 (LGBTQ+ harms and protections), the Cass Review (2024) and current NHS
          England gender service guidance, GIDS / NHS Children & Young People&rsquo;s Gender Service pathway, and UNCRC
          Articles 8 (identity), 12 (voice), 14 (thought / conscience), 16 (privacy), 19 (protection from harm) and
          24 (health). External support typically includes Proud Trust, Mermaids, gender-aware CAMHS, and
          school inclusion teams.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
