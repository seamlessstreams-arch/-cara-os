"use client";

// ==============================================================================
// CORNERSTONE -- SELF-HARM SAFETY PLANS
//
// Per-child self-harm safety plans, co-produced with the young person and
// CAMHS. Built around the Stanley-Brown Safety Plan framework: warning signs,
// internal coping, distractions, who to contact, professional contacts, means
// restriction, and reasons to live.
//
// Tone: trauma-informed, non-judgemental, hopeful, child-led. The visual
// styling deliberately avoids alarming colours (no reds for the crisis
// content) and uses calm teal / sky / rose tones. Plans are dignified, never
// voyeuristic, and centre the young person's voice.
//
// Regulatory framework:
//   - NICE NG225 (Self-harm: assessment, management and preventing recurrence)
//   - Working Together to Safeguard Children 2023
//   - Children's Homes Quality Standards 8 (Protection) + 9 (Leadership)
//   - Stanley-Brown Safety Planning Intervention
//   - Mental Capacity Act 2005 / Gillick competence
//   - CAMHS clinical protocols
//   - UNCRC Articles 12 (voice) + 24 (health)
// ==============================================================================

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Shield, Heart, Phone, ChevronUp, ChevronDown, ArrowUpDown,
  Search, AlertTriangle, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";

// -- Types --------------------------------------------------------------------

interface SafetyPlan {
  id: string;
  youngPerson: string;
  planDate: string;
  status: "Not currently needed" | "Active — preventive" | "Active — recent incident" | "In review";
  coProducedWith: string[];
  warningSignsExternal: string[];
  warningSignsInternal: string[];
  earlyTriggers: string[];
  internalCopingStrategies: string[];
  socialDistractions: string[];
  peopleToContact: { name: string; relationship: string; how: string }[];
  professionalContacts: { name: string; role: string; how: string }[];
  meansRestrictionAgreed: string[];
  reasonsToLive: string[];
  reasonsForHope: string[];
  childSignedOff: boolean;
  childSignedDate?: string;
  professionalsInformed: string[];
  reviewFrequency: "Weekly" | "Fortnightly" | "Monthly" | "Quarterly" | "After incident";
  nextReviewDate: string;
  childVoice: string;
  staffObservation: string;
  flagsForReview: string[];
  keyWorker: string;
}

// -- Helpers ------------------------------------------------------------------

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const STATUS_COLOURS: Record<SafetyPlan["status"], string> = {
  "Not currently needed":      "bg-slate-100 text-slate-700 border border-slate-200",
  "Active — preventive":       "bg-teal-100 text-teal-800 border border-teal-200",
  "Active — recent incident":  "bg-rose-100 text-rose-800 border border-rose-200",
  "In review":                 "bg-sky-100 text-sky-800 border border-sky-200",
};

const FREQUENCY_COLOURS: Record<SafetyPlan["reviewFrequency"], string> = {
  "Weekly":          "bg-rose-50 text-rose-700 border border-rose-200",
  "Fortnightly":     "bg-amber-50 text-amber-800 border border-amber-200",
  "Monthly":         "bg-teal-50 text-teal-800 border border-teal-200",
  "Quarterly":       "bg-sky-50 text-sky-800 border border-sky-200",
  "After incident":  "bg-slate-50 text-slate-700 border border-slate-200",
};

// -- Seed Data ----------------------------------------------------------------
// Three records. Tone is dignified. Means-restriction language is calm and
// practical, never sensational.

const SEED: SafetyPlan[] = [
  // -------------------------------------------------------------------------
  // Alex -- Active, preventive. Plan supports recovery after a difficult
  // period around coming out. No recent incident. Co-produced with key worker
  // Anna and CAMHS therapist Dr Patel.
  // -------------------------------------------------------------------------
  {
    id: "shsp_001",
    youngPerson: "yp_alex",
    planDate: d(-42),
    status: "Active — preventive",
    coProducedWith: [
      "Alex (young person, lead)",
      "Anna Lingolo (key worker)",
      "Dr Sunita Patel (CAMHS therapist)",
      "Darren Laville (Registered Manager — sign-off only)",
    ],
    warningSignsExternal: [
      "Withdrawing from the lounge to spend extended time alone in bedroom",
      "Avoiding meals or eating in room",
      "Wearing long sleeves in warm weather",
      "Cancelling planned activities last-minute",
    ],
    warningSignsInternal: [
      "A heavy, numb feeling Alex describes as 'flat'",
      "Looping thoughts about not belonging or being a burden",
      "Difficulty sleeping or wanting to sleep all the time",
      "Feeling disconnected from people who care about Alex",
    ],
    earlyTriggers: [
      "Anniversary dates connected to family rejection",
      "Online comments or messages that feel hostile",
      "Anticipating contact from a family member who has been unsupportive",
      "Being misgendered or having identity questioned",
    ],
    internalCopingStrategies: [
      "Listen to a curated 'lift me' playlist Alex made with key worker",
      "Cold-water face dip or holding ice cubes (grounding)",
      "Drawing in the sketchbook kept by the bed",
      "Box-breathing for two minutes (4-4-4-4)",
      "Re-read a short letter Alex wrote to themselves on a good day",
    ],
    socialDistractions: [
      "Walk to the local park with the staff dog",
      "Make a hot chocolate in the kitchen with whoever is on shift",
      "Join the lounge — sit with others without needing to talk",
      "Message a trusted friend from the LGBTQ+ youth group",
    ],
    peopleToContact: [
      { name: "Anna Lingolo", relationship: "Key worker", how: "Available on shift; mobile via office line out of hours" },
      { name: "Chervelle Kinina", relationship: "Trusted staff", how: "Often on sleep-in; happy to be woken if needed" },
      { name: "Sam (peer mentor)",  relationship: "LGBTQ+ youth group buddy", how: "Phone number saved on Alex's phone" },
    ],
    professionalContacts: [
      { name: "Dr Sunita Patel", role: "CAMHS therapist", how: "Weekly session Wednesdays; CAMHS duty line if urgent" },
      { name: "CAMHS Crisis Team", role: "Out-of-hours mental health support", how: "Number on fridge and saved in Alex's phone" },
      { name: "Shout (text 85258)", role: "24/7 text crisis line", how: "Free text from any phone" },
      { name: "111 option 2", role: "NHS urgent mental health", how: "Phone — if Alex prefers not to text" },
    ],
    meansRestrictionAgreed: [
      "Sharps and razors stored in the locked staff bathroom; Alex requests when needed",
      "Medication held in the locked clinic cupboard, dispensed at agreed times",
      "Alex agreed to hand in any item they feel unsafe with — no questions, no shame",
    ],
    reasonsToLive: [
      "Finishing the art portfolio — wants to apply to college next year",
      "The dog at the home — 'she always knows when I'm having a bad day'",
      "Plans to visit cousin Maya in the summer",
      "Wanting to be there for younger LGBTQ+ kids who are where Alex was a year ago",
    ],
    reasonsForHope: [
      "It has been seven months since the last incident — Alex did that",
      "Therapy is helping; Alex can name feelings now that used to feel unnameable",
      "The home feels like home — staff are not going anywhere",
    ],
    childSignedOff: true,
    childSignedDate: d(-42),
    professionalsInformed: [
      "Karen Holding (Social Worker)",
      "James Patterson (IRO)",
      "Derby Alternative Provision (school pastoral lead, with Alex's consent)",
    ],
    reviewFrequency: "Monthly",
    nextReviewDate: d(-2),
    childVoice:
      "I helped write this. I wanted it to sound like me, not like a form. The bit I keep coming back to is the reasons-to-live list — Anna made me write it on a good day so I'd believe it on a bad one. It works.",
    staffObservation:
      "Alex has shown sustained engagement with therapy and the key-work relationship. Sleep has improved. Alex is increasingly able to ask for support before reaching crisis — a significant shift from earlier this year. Plan remains preventive and hopeful.",
    flagsForReview: [
      "Review approaching — schedule with Dr Patel and Anna",
      "Family contact letter expected next month — anticipate possible trigger",
    ],
    keyWorker: "staff_anna",
  },

  // -------------------------------------------------------------------------
  // Casey -- Not currently needed, but observation is in place. Trauma-informed
  // monitoring; would create a plan collaboratively if indicators emerged.
  // -------------------------------------------------------------------------
  {
    id: "shsp_002",
    youngPerson: "yp_casey",
    planDate: d(-90),
    status: "Not currently needed",
    coProducedWith: [
      "Casey (young person, consulted)",
      "Chervelle Kinina (key worker)",
      "Dr Helen Cartwright (Clinical Psychologist)",
    ],
    warningSignsExternal: [
      "(No active plan — these would be developed with Casey if indicators emerged)",
    ],
    warningSignsInternal: [
      "(No active plan — these would be developed with Casey if indicators emerged)",
    ],
    earlyTriggers: [
      "Trauma anniversaries (held in calendar by key worker, never mentioned aloud unless Casey raises)",
      "Unexpected raised voices in the home",
    ],
    internalCopingStrategies: [
      "Casey has existing grounding strategies in her behaviour support plan",
      "Art and weighted blanket are her go-to regulation tools",
    ],
    socialDistractions: [
      "Therapy dog visits",
      "Baking with key worker",
    ],
    peopleToContact: [
      { name: "Chervelle Kinina", relationship: "Key worker", how: "Casey's primary trusted adult" },
    ],
    professionalContacts: [
      { name: "Dr Helen Cartwright", role: "Clinical Psychologist (trauma specialist)", how: "Twice-weekly therapy currently" },
      { name: "CAMHS Crisis Team", role: "Out-of-hours mental health support", how: "Number on fridge" },
    ],
    meansRestrictionAgreed: [
      "Standard home practice — sharps stored centrally; no plan-specific restrictions in place",
    ],
    reasonsToLive: [
      "(To be co-produced with Casey if a plan becomes needed)",
    ],
    reasonsForHope: [
      "Casey is engaging well with art therapy and has not shown self-harm indicators",
      "Trauma-informed environment is supporting recovery",
    ],
    childSignedOff: false,
    professionalsInformed: [
      "Fiona Brennan (Social Worker) — informed of monitoring approach",
      "Sarah Mitchell (IRO) — informed at last LAC review",
    ],
    reviewFrequency: "Quarterly",
    nextReviewDate: d(28),
    childVoice:
      "Casey has been clear she does not want a 'self-harm plan' written about her right now. She knows she can ask, and we have agreed exactly what 'asking' looks like. We hold this plan lightly and ready.",
    staffObservation:
      "Active observation in place via behaviour support plan and daily key-work. No current indicators of self-harm. CAMHS aware. A draft framework exists in the staff team's heads so that, if needed, a plan can be co-produced quickly with Casey rather than to her.",
    flagsForReview: [
      "Review at next LAC review or sooner if any indicators emerge",
    ],
    keyWorker: "staff_chervelle",
  },

  // -------------------------------------------------------------------------
  // Jordan -- Not currently needed, never historically required. Held on file
  // so the team can evidence that the question was considered.
  // -------------------------------------------------------------------------
  {
    id: "shsp_003",
    youngPerson: "yp_jordan",
    planDate: d(-60),
    status: "Not currently needed",
    coProducedWith: [
      "Jordan (young person, consulted briefly and respectfully)",
      "Anna Lingolo (key worker)",
    ],
    warningSignsExternal: [
      "(No plan in place — never historically required)",
    ],
    warningSignsInternal: [
      "(No plan in place — never historically required)",
    ],
    earlyTriggers: [
      "Sensory overload (handled separately via behaviour support plan)",
    ],
    internalCopingStrategies: [
      "Sensory regulation tools — managed via Jordan's existing care plans",
    ],
    socialDistractions: [
      "Lego, train books, nature walks",
    ],
    peopleToContact: [
      { name: "Anna Lingolo", relationship: "Key worker", how: "Available on shift" },
      { name: "Mum", relationship: "Family", how: "Phone — supportive contact" },
    ],
    professionalContacts: [
      { name: "Dr Priya Nair", role: "CAMHS Clinical Psychologist", how: "Routine CAMHS contact for ASD support" },
    ],
    meansRestrictionAgreed: [
      "No plan-specific restrictions in place",
    ],
    reasonsToLive: [
      "(Not applicable — no plan needed)",
    ],
    reasonsForHope: [
      "Jordan is settled and well-supported; ASD-informed care plan is meeting needs",
    ],
    childSignedOff: false,
    professionalsInformed: [
      "Michael Osei (Social Worker) — file note confirming question was considered",
    ],
    reviewFrequency: "Quarterly",
    nextReviewDate: d(45),
    childVoice:
      "Jordan was asked, in plain language, whether he ever thought about hurting himself. He said no. The conversation was brief, calm, and respectful. He knows the question is not a one-off and that any adult here will listen.",
    staffObservation:
      "No historical self-harm. No current indicators. This record exists to evidence that the question was actively asked and considered, not avoided. Will be revisited routinely as part of CAMHS-aligned check-ins.",
    flagsForReview: [],
    keyWorker: "staff_anna",
  },
];

// -- Export Columns -----------------------------------------------------------

const EXPORT_COLS: ExportColumn<SafetyPlan>[] = [
  { header: "Young Person",         accessor: (r: SafetyPlan) => getYPName(r.youngPerson) },
  { header: "Plan Date",            accessor: (r: SafetyPlan) => r.planDate },
  { header: "Status",               accessor: (r: SafetyPlan) => r.status },
  { header: "Co-Produced With",     accessor: (r: SafetyPlan) => r.coProducedWith.join("; ") },
  { header: "External Warning Signs", accessor: (r: SafetyPlan) => r.warningSignsExternal.join("; ") },
  { header: "Internal Warning Signs", accessor: (r: SafetyPlan) => r.warningSignsInternal.join("; ") },
  { header: "Early Triggers",       accessor: (r: SafetyPlan) => r.earlyTriggers.join("; ") },
  { header: "Internal Coping",      accessor: (r: SafetyPlan) => r.internalCopingStrategies.join("; ") },
  { header: "Social Distractions",  accessor: (r: SafetyPlan) => r.socialDistractions.join("; ") },
  { header: "People to Contact",    accessor: (r: SafetyPlan) => r.peopleToContact.map((p) => `${p.name} (${p.relationship})`).join("; ") },
  { header: "Professional Contacts",accessor: (r: SafetyPlan) => r.professionalContacts.map((p) => `${p.name} (${p.role})`).join("; ") },
  { header: "Means Restriction",    accessor: (r: SafetyPlan) => r.meansRestrictionAgreed.join("; ") },
  { header: "Reasons to Live",      accessor: (r: SafetyPlan) => r.reasonsToLive.join("; ") },
  { header: "Reasons for Hope",     accessor: (r: SafetyPlan) => r.reasonsForHope.join("; ") },
  { header: "Child Signed Off",     accessor: (r: SafetyPlan) => (r.childSignedOff ? "Yes" : "No") },
  { header: "Child Signed Date",    accessor: (r: SafetyPlan) => r.childSignedDate ?? "" },
  { header: "Professionals Informed", accessor: (r: SafetyPlan) => r.professionalsInformed.join("; ") },
  { header: "Review Frequency",     accessor: (r: SafetyPlan) => r.reviewFrequency },
  { header: "Next Review Date",     accessor: (r: SafetyPlan) => r.nextReviewDate },
  { header: "Child Voice",          accessor: (r: SafetyPlan) => r.childVoice },
  { header: "Staff Observation",    accessor: (r: SafetyPlan) => r.staffObservation },
  { header: "Flags for Review",     accessor: (r: SafetyPlan) => r.flagsForReview.join("; ") },
  { header: "Key Worker",           accessor: (r: SafetyPlan) => getStaffName(r.keyWorker) },
];

// =============================================================================
// Component
// =============================================================================

type SortKey = "youngPerson" | "status" | "nextReviewDate" | "planDate";
type SortDir = "asc" | "desc";

export default function SelfHarmSafetyPlanPage() {
  const [plans] = useState<SafetyPlan[]>(SEED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("nextReviewDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const today = new Date().toISOString().slice(0, 10);
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const cycleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // -- Filtering + sorting --
  const filtered = useMemo(() => {
    let list = [...plans];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          getYPName(p.youngPerson).toLowerCase().includes(s) ||
          p.status.toLowerCase().includes(s) ||
          p.coProducedWith.some((c) => c.toLowerCase().includes(s)) ||
          p.childVoice.toLowerCase().includes(s) ||
          p.staffObservation.toLowerCase().includes(s),
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    list.sort((a, b) => {
      let av: string;
      let bv: string;
      switch (sortKey) {
        case "youngPerson":
          av = getYPName(a.youngPerson);
          bv = getYPName(b.youngPerson);
          break;
        case "status":
          av = a.status;
          bv = b.status;
          break;
        case "planDate":
          av = a.planDate;
          bv = b.planDate;
          break;
        case "nextReviewDate":
        default:
          av = a.nextReviewDate;
          bv = b.nextReviewDate;
          break;
      }
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [plans, search, statusFilter, sortKey, sortDir]);

  // -- Stats --
  const stats = useMemo(() => {
    const active = plans.filter(
      (p) => p.status === "Active — preventive" || p.status === "Active — recent incident",
    ).length;
    const inReview = plans.filter((p) => p.status === "In review").length;
    const coProducedWithChild = plans.filter(
      (p) =>
        p.childSignedOff ||
        p.coProducedWith.some((c) => c.toLowerCase().includes("young person")),
    ).length;
    const horizon = d(14);
    const dueSoon = plans.filter(
      (p) => p.nextReviewDate >= today && p.nextReviewDate <= horizon,
    ).length;
    return { active, inReview, coProducedWithChild, dueSoon };
  }, [plans, today]);

  return (
    <PageShell
      title="Self-Harm Safety Plans"
      subtitle="Per-child, co-produced safety plans using the Stanley-Brown framework. Trauma-informed, hopeful, and child-led — never sensational."
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Self-Harm Safety Plans" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="self-harm-safety-plans" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* -- Stat Cards (calm palette) ----------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Active plans", value: stats.active, icon: Shield, colour: "text-teal-700" },
            { label: "In review", value: stats.inReview, icon: AlertTriangle, colour: "text-sky-700" },
            { label: "Co-produced with child", value: stats.coProducedWithChild, icon: Heart, colour: "text-rose-600" },
            { label: "Review due (next 14 days)", value: stats.dueSoon, icon: CheckCircle, colour: stats.dueSoon > 0 ? "text-amber-700" : "text-teal-700" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* -- Tone banner -------------------------------------------------- */}
        <Card className="border-teal-200 bg-teal-50/60">
          <CardContent className="p-4 text-sm text-teal-900">
            <p className="font-medium mb-1">A note on these plans</p>
            <p>
              Each plan is co-produced with the young person, never written about them.
              The Stanley-Brown framework is followed sequentially — the young person
              is supported to use earlier steps before reaching out to professionals.
              Plans are hopeful documents that name reasons to live alongside warning
              signs. They are reviewed regularly with CAMHS and the key worker.
            </p>
          </CardContent>
        </Card>

        {/* -- Filters ------------------------------------------------------ */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search young person, status, key worker..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Active — preventive">Active — preventive</SelectItem>
              <SelectItem value="Active — recent incident">Active — recent incident</SelectItem>
              <SelectItem value="In review">In review</SelectItem>
              <SelectItem value="Not currently needed">Not currently needed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortKey}
            onValueChange={(v) => cycleSort(v as SortKey)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nextReviewDate">Sort by next review</SelectItem>
              <SelectItem value="youngPerson">Sort by young person</SelectItem>
              <SelectItem value="status">Sort by status</SelectItem>
              <SelectItem value="planDate">Sort by plan date</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="inline-flex items-center gap-1 rounded-md border bg-white px-3 py-2 text-xs hover:bg-slate-50"
            aria-label="Toggle sort direction"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortDir === "asc" ? "Ascending" : "Descending"}
          </button>
        </div>

        {/* -- Plan Cards --------------------------------------------------- */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No safety plans match your filters.
            </p>
          )}
          {filtered.map((plan) => {
            const isExpanded = !!expanded[plan.id];
            const reviewSoon =
              plan.nextReviewDate >= today && plan.nextReviewDate <= d(14);
            const reviewOverdue = plan.nextReviewDate < today;

            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-xl border bg-white overflow-hidden",
                  plan.status === "Active — recent incident" && "border-l-4 border-l-rose-300",
                  plan.status === "Active — preventive"      && "border-l-4 border-l-teal-300",
                  plan.status === "In review"                && "border-l-4 border-l-sky-300",
                )}
              >
                {/* -- Header --------------------------------------------- */}
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => toggle(plan.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Shield className="h-5 w-5 text-teal-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{getYPName(plan.youngPerson)}</p>
                        <Badge className={cn("text-xs font-normal", STATUS_COLOURS[plan.status])}>
                          {plan.status}
                        </Badge>
                        {plan.childSignedOff && (
                          <Badge className="text-xs font-normal bg-rose-50 text-rose-700 border border-rose-200">
                            <Heart className="h-3 w-3 mr-1" />
                            Child signed off
                          </Badge>
                        )}
                        <Badge className={cn("text-xs font-normal", FREQUENCY_COLOURS[plan.reviewFrequency])}>
                          Review: {plan.reviewFrequency.toLowerCase()}
                        </Badge>
                        {reviewOverdue && (
                          <Badge className="text-xs font-normal bg-amber-100 text-amber-800 border border-amber-200">
                            Review overdue
                          </Badge>
                        )}
                        {reviewSoon && !reviewOverdue && (
                          <Badge className="text-xs font-normal bg-amber-50 text-amber-700 border border-amber-200">
                            Review due soon
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        <span>Plan date: {plan.planDate}</span>
                        <span>Next review: {plan.nextReviewDate}</span>
                        <span>Key worker: {getStaffName(plan.keyWorker)}</span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {/* -- Expanded ------------------------------------------- */}
                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* Co-produced with */}
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-1">Co-produced with</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.coProducedWith.map((c) => (
                          <Badge
                            key={c}
                            variant="outline"
                            className="text-xs bg-white text-slate-700 border-slate-200"
                          >
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Step 1 — Warning signs */}
                    <div className="rounded-lg bg-white border border-sky-200 p-3">
                      <p className="text-xs font-semibold text-sky-800 mb-2">
                        1. Warning signs (so we notice early — together)
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs font-medium text-slate-600 mb-1">External (others may notice)</p>
                          <ul className="space-y-1">
                            {plan.warningSignsExternal.map((w, i) => (
                              <li key={i} className="text-sm flex gap-1">
                                <span className="text-sky-400">&#8226;</span>
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-600 mb-1">Internal (how it feels)</p>
                          <ul className="space-y-1">
                            {plan.warningSignsInternal.map((w, i) => (
                              <li key={i} className="text-sm flex gap-1">
                                <span className="text-sky-400">&#8226;</span>
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-600 mb-1">Early triggers</p>
                          <ul className="space-y-1">
                            {plan.earlyTriggers.map((t, i) => (
                              <li key={i} className="text-sm flex gap-1">
                                <span className="text-sky-400">&#8226;</span>
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 — Internal coping */}
                    <div className="rounded-lg bg-white border border-teal-200 p-3">
                      <p className="text-xs font-semibold text-teal-800 mb-2">
                        2. Things I can do on my own (internal coping)
                      </p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        {plan.internalCopingStrategies.map((c, i) => (
                          <li key={i} className="text-sm flex gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-teal-500 mt-0.5 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Step 3 — Social distractions */}
                    <div className="rounded-lg bg-white border border-teal-200 p-3">
                      <p className="text-xs font-semibold text-teal-800 mb-2">
                        3. People and places that take my mind off it
                      </p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        {plan.socialDistractions.map((c, i) => (
                          <li key={i} className="text-sm flex gap-1">
                            <span className="text-teal-400">&#8226;</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Step 4 — People to contact */}
                    <div className="rounded-lg bg-white border border-rose-200 p-3">
                      <p className="text-xs font-semibold text-rose-800 mb-2">
                        4. People I can reach out to
                      </p>
                      <div className="space-y-2">
                        {plan.peopleToContact.map((p, i) => (
                          <div key={i} className="text-sm flex items-start gap-2">
                            <Heart className="h-3.5 w-3.5 text-rose-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium">{p.name} <span className="font-normal text-muted-foreground">— {p.relationship}</span></p>
                              <p className="text-xs text-muted-foreground">{p.how}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step 5 — Professional contacts */}
                    <div className="rounded-lg bg-white border border-sky-200 p-3">
                      <p className="text-xs font-semibold text-sky-800 mb-2">
                        5. Professionals and crisis lines
                      </p>
                      <div className="space-y-2">
                        {plan.professionalContacts.map((p, i) => (
                          <div key={i} className="text-sm flex items-start gap-2">
                            <Phone className="h-3.5 w-3.5 text-sky-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium">{p.name} <span className="font-normal text-muted-foreground">— {p.role}</span></p>
                              <p className="text-xs text-muted-foreground">{p.how}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step 6 — Means safety (gentle phrasing) */}
                    <div className="rounded-lg bg-white border border-slate-200 p-3">
                      <p className="text-xs font-semibold text-slate-700 mb-2">
                        6. Keeping the environment safer (agreed together)
                      </p>
                      <ul className="space-y-1">
                        {plan.meansRestrictionAgreed.map((m, i) => (
                          <li key={i} className="text-sm flex gap-1">
                            <Shield className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Step 7 — Reasons to live (highlighted, dignified) */}
                    <div className="rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-4 w-4 text-rose-500" />
                        <p className="text-sm font-semibold text-rose-900">
                          7. Reasons for living
                        </p>
                      </div>
                      <ul className="space-y-1.5">
                        {plan.reasonsToLive.map((r, i) => (
                          <li key={i} className="text-sm text-rose-900 flex gap-2">
                            <span className="text-rose-400 font-semibold">&#9825;</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                      {plan.reasonsForHope.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-rose-200/70">
                          <p className="text-xs font-medium text-rose-800 mb-1">
                            Reasons for hope right now
                          </p>
                          <ul className="space-y-1">
                            {plan.reasonsForHope.map((r, i) => (
                              <li key={i} className="text-sm text-rose-900/90 flex gap-2">
                                <span className="text-rose-400">&#10022;</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Child voice (italic) */}
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Heart className="h-4 w-4 text-rose-600" />
                        <p className="text-xs font-semibold text-rose-800">In their own words</p>
                      </div>
                      <p className="text-sm italic text-rose-900">&ldquo;{plan.childVoice}&rdquo;</p>
                      {plan.childSignedOff && plan.childSignedDate && (
                        <p className="text-xs text-rose-700 mt-1">
                          Signed off by young person on {plan.childSignedDate}
                        </p>
                      )}
                    </div>

                    {/* Staff observation */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs font-semibold text-slate-700 mb-1">Staff observation</p>
                      <p className="text-sm text-slate-800">{plan.staffObservation}</p>
                    </div>

                    {/* Professionals informed + flags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs font-semibold text-slate-700 mb-1">Professionals informed</p>
                        <ul className="space-y-0.5">
                          {plan.professionalsInformed.map((p, i) => (
                            <li key={i} className="text-sm flex gap-1">
                              <span className="text-slate-400">&#8226;</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs font-semibold text-slate-700 mb-1">Flags for next review</p>
                        {plan.flagsForReview.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No flags raised.</p>
                        ) : (
                          <ul className="space-y-0.5">
                            {plan.flagsForReview.map((f, i) => (
                              <li key={i} className="text-sm flex gap-1">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* -- Regulatory note --------------------------------------------- */}
        <div className="rounded-lg bg-sky-50 border border-sky-200 p-4 text-sm text-sky-900">
          <strong>Regulatory framework:</strong>{" "}
          Plans follow the Stanley-Brown Safety Planning Intervention and align with
          NICE NG225 (self-harm), Working Together to Safeguard Children 2023, and
          Children&apos;s Homes Quality Standards 8 (Protection) and 9 (Leadership and
          Management). Capacity to consent is assessed under the Mental Capacity Act
          2005 and Gillick competence. CAMHS clinical input is integral to every
          active plan. The young person&apos;s right to be heard (UNCRC Article 12) and
          to the highest attainable standard of health (Article 24) underpin the
          co-production approach. Plans are held with care, reviewed regularly, and
          never used in place of clinical assessment.
        </div>
      </div>
    </PageShell>
  );
}
