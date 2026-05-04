"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  Users,
  Target,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Quote,
  TrendingUp,
  GraduationCap,
  Heart,
  Compass,
  HomeIcon,
  Stethoscope,
  Globe,
  HandHeart,
} from "lucide-react";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
type Domain =
  | "Relational"
  | "Practice"
  | "Multi-agency"
  | "Environment"
  | "Family"
  | "Education"
  | "Therapeutic"
  | "Independence";

type EvidenceStrength = "Strong" | "Moderate" | "Emerging";
type ImplementationStatus = "Standard practice" | "Emerging practice" | "Identified gap";

interface SuccessFactor {
  id: string;
  factor: string;
  domain: Domain;
  evidenceStrength: EvidenceStrength;
  supportingCases: string[];
  counterCases: string[];
  keyMechanisms: string[];
  conditionsForSuccess: string[];
  recommendedActions: string[];
  evidenceSources: string[];
  childVoiceOnFactor: string;
  staffPerspective: string;
  implementationStatus: ImplementationStatus;
  reviewDate: string;
  reviewedBy: string;
}

/* ─── seed data ─── */
const factors: SuccessFactor[] = [
  {
    id: "psf_001",
    factor: "Consistent key worker relationship 12+ months",
    domain: "Relational",
    evidenceStrength: "Strong",
    supportingCases: ["M.T.", "S.L.", "J.W.", "Casey (current)", "Alex (current)"],
    counterCases: ["D.K. (3 key worker changes in 8 months — placement broke down)", "I.G. (key worker on long-term sick, no consistent replacement — disruption followed)"],
    keyMechanisms: [
      "Predictability of attuned response builds the secure base needed for exploration",
      "Repeated co-regulation episodes lay down new neural patterns over time",
      "Trust is earned through hundreds of small consistent interactions, not single big moments",
      "Children learn that adults can be relied on — directly contradicting prior relational trauma",
    ],
    conditionsForSuccess: [
      "Key worker has protected 1:1 time written into the rota each shift",
      "Cover plan in place when key worker is on leave so the relationship isn't lost",
      "Key worker has clinical supervision to process the emotional load",
      "Matching done thoughtfully — personality fit matters as much as availability",
    ],
    recommendedActions: [
      "Build key worker continuity into the rota as a non-negotiable",
      "Track key worker tenure as a stability indicator on the dashboard",
      "Use exit interviews when staff leave to learn what helps relationships endure",
      "Allocate budget for key worker shared activities (cooking, outings, projects)",
    ],
    evidenceSources: [
      "Internal placement endings audit (last 5 placements)",
      "NICE NG26 — looked-after children and young people",
      "Staying Close evaluation (DfE 2022)",
      "Outcome Star reviews — relational domain trends",
    ],
    childVoiceOnFactor: "M.T. on leaving: 'It worked because Anna stayed. Other places, the staff kept changing — you couldn't get close.' Alex (current): 'I tell Anna things I don't tell anyone.'",
    staffPerspective: "Staff_anna: 'You only see the breakthroughs after the boring middle bit — the months of just turning up, doing the same things, until they believe you'll keep turning up.'",
    implementationStatus: "Standard practice",
    reviewDate: d(-14),
    reviewedBy: "staff_darren",
  },
  {
    id: "psf_002",
    factor: "Pre-admission visits before move-in (minimum 2 visits)",
    domain: "Practice",
    evidenceStrength: "Strong",
    supportingCases: ["S.L. (3 visits before admission — settled within 2 weeks)", "Casey (current — 2 visits, smooth transition)", "Alex (current)"],
    counterCases: ["D.K. (emergency placement, no visits — destabilised for 6+ weeks)", "J.W. (single rushed visit — early concerns took months to resolve)"],
    keyMechanisms: [
      "Reduces fight/flight response on the day of admission — child has already mapped the space",
      "Allows existing children to meet new arrival on neutral terms before sharing space",
      "Surfaces compatibility issues before commitment — better to know early",
      "Gives child a sense of agency in their own move (they choose to come)",
    ],
    conditionsForSuccess: [
      "Placing LA willing and able to fund/support visits (rare in genuine emergencies)",
      "Existing children prepared and consenting to introductions",
      "Visits structured (not just a tour) — meal together, bedroom choice, time with key worker",
      "Realistic information shared honestly — no glossing over to 'sell' the home",
    ],
    recommendedActions: [
      "Two visits as the standard ask in every referral conversation",
      "Document visit observations as part of the matching record",
      "Offer virtual visit option where geography prevents two physical visits",
      "Build visit protocol into the Statement of Purpose",
    ],
    evidenceSources: [
      "Placement endings audit",
      "Quality Standard 13 (Reg 17) guidance",
      "Reg 14 admissions evidence",
      "Coram BAAF research on planned moves",
    ],
    childVoiceOnFactor: "S.L.: 'I'd already picked my room before I arrived. It made it feel like mine, not just a placement.' Casey: 'The first visit I was rude on purpose — I wanted to see what they'd do. They were still nice the second time. That's when I thought maybe.'",
    staffPerspective: "Staff_ryan: 'You learn more in a 2-hour visit about whether a placement will work than in a 200-page referral pack.'",
    implementationStatus: "Standard practice",
    reviewDate: d(-21),
    reviewedBy: "staff_darren",
  },
  {
    id: "psf_003",
    factor: "Active multi-agency formulation meeting within 6 weeks of admission",
    domain: "Multi-agency",
    evidenceStrength: "Moderate",
    supportingCases: ["S.L. (CAMHS + school + SW formulation at week 4)", "Casey (current — formulation at week 5)", "M.T."],
    counterCases: ["I.G. (no formulation, fragmented support — placement ended at month 7)", "D.K. (CAMHS waitlist, no shared formulation — repeated crises)"],
    keyMechanisms: [
      "Shared understanding prevents conflicting approaches across agencies",
      "Sequencing of interventions becomes deliberate, not accidental",
      "Reduces re-traumatising re-tellings of history across multiple professionals",
      "Provides a single 'theory of the child' that staff can hold onto in difficult moments",
    ],
    conditionsForSuccess: [
      "CAMHS engagement available within timescale (postcode lottery in practice)",
      "Education provider willing to attend",
      "SW prioritises rather than treats as optional",
      "Time and a chair to do it — typically 2 hours minimum",
    ],
    recommendedActions: [
      "RM to flag at the 72-hour review whether formulation is achievable in 6 weeks",
      "Escalate to placing LA director if CAMHS not engaging",
      "Use therapeutic consultancy as bridge if NHS CAMHS unavailable",
      "Document attempts where it doesn't happen — pattern matters for commissioning",
    ],
    evidenceSources: [
      "Internal placement endings audit",
      "AFC Right Care Right Person evaluation",
      "Quality Standard 6 (Health and wellbeing)",
      "Anna Freud / NCB practice guidance",
    ],
    childVoiceOnFactor: "S.L.: 'When the meeting happened with the CAMHS lady and my social worker and Anna all together, I only had to say it once. That mattered.'",
    staffPerspective: "Staff_chervelle: 'Without formulation we're all guessing in different directions. With it, we're guessing in the same direction — which is much better.'",
    implementationStatus: "Emerging practice",
    reviewDate: d(-30),
    reviewedBy: "staff_darren",
  },
  {
    id: "psf_004",
    factor: "Stable bedroom environment personalised by the child",
    domain: "Environment",
    evidenceStrength: "Moderate",
    supportingCases: ["M.T. (chose paint colour, kept room across 2 years)", "Alex (gaming setup co-designed)", "J.W. (room as sensory refuge)"],
    counterCases: ["D.K. (room re-decorated mid-placement without consultation — felt 'evicted')"],
    keyMechanisms: [
      "Felt safety in physical space supports nervous system regulation",
      "Personalisation signals 'this is your home, not a residential unit'",
      "Sensory predictability reduces background cognitive load",
      "A retreat space allows healthy withdrawal without escalation",
    ],
    conditionsForSuccess: [
      "Budget available for personalisation (target: 200 GBP per child per year minimum)",
      "Child consulted before any redecoration or furniture change",
      "Room maintained when child is on family contact / hospital — not stripped or used",
      "Quiet zone / sensory considerations factored in (lighting, blackout, sound)",
    ],
    recommendedActions: [
      "Personalisation budget line in placement plan",
      "Photo record of how the child has set up their space (their consent)",
      "Annual room MOT — what does the child want changed?",
      "No staff to enter without permission except in safeguarding circumstances",
    ],
    evidenceSources: [
      "Quality Standard 10 (Care planning) inspection feedback",
      "Children's pledges (internal)",
      "BACP environment-and-recovery literature",
      "Outcome Star — home & safety domain",
    ],
    childVoiceOnFactor: "M.T.: 'My room was the first place I had where stuff stayed where I left it. That sounds small but it wasn't.' Alex: 'Don't change my desk setup — it took me ages.'",
    staffPerspective: "Staff_anna: 'A room someone has chosen the colours of is a different psychological place to a room that was beige when they arrived.'",
    implementationStatus: "Standard practice",
    reviewDate: d(-45),
    reviewedBy: "staff_ryan",
  },
  {
    id: "psf_005",
    factor: "Family time supported by skilled supervision and reflection",
    domain: "Family",
    evidenceStrength: "Moderate",
    supportingCases: ["S.L. (gradual reintroduction with reflective debrief — relationship rebuilt)", "Alex (current — staff support around mum's mental health)", "M.T."],
    counterCases: ["I.G. (contact treated as logistics-only, no debrief — destabilising every time)"],
    keyMechanisms: [
      "Children process family contact in the hours after, not during — debrief catches the regulation work",
      "Skilled supervision protects the child without weaponising contact",
      "Family relationships endure across placements — investing in them pays back long after",
      "Honest narrative of the family helps resolve splitting (all good / all bad)",
    ],
    conditionsForSuccess: [
      "Staff trained in supervised contact (not generic transport role)",
      "Time and space booked for post-contact debrief — not squeezed into handover",
      "Clear plan with placing SW about purpose of each contact",
      "Therapeutic input where contact is high-risk or rupture-prone",
    ],
    recommendedActions: [
      "Build 30-minute debrief into rota after every contact",
      "Train at least 3 staff in supervised contact protocols",
      "Use family time supervision records as material in supervision and reflection",
      "Review contact plan every 3 months, not annually",
    ],
    evidenceSources: [
      "Quality Standard 9 (Promoting positive relationships)",
      "Family Rights Group practice papers",
      "Internal contact records analysis",
      "Reg 8 evidence for family relationships",
    ],
    childVoiceOnFactor: "S.L.: 'Talking to Anna in the car after seeing my mum was the bit that helped — not the visit itself.'",
    staffPerspective: "Staff_chervelle: 'Family time isn't transport. It's clinical work. We've been treating it like clinical work and we're seeing the difference.'",
    implementationStatus: "Emerging practice",
    reviewDate: d(-60),
    reviewedBy: "staff_darren",
  },
  {
    id: "psf_006",
    factor: "Stable education placement with a named champion",
    domain: "Education",
    evidenceStrength: "Strong",
    supportingCases: ["M.T. (same school across 2 years — GCSEs achieved)", "Alex (current — school wellbeing lead is named champion)", "J.W."],
    counterCases: ["D.K. (3 schools in 12 months — no champion at any — disengaged completely)", "I.G. (PRU only, no champion, no progression route — fell out of education)"],
    keyMechanisms: [
      "Education is one of the only universal protective factors that endures into adulthood",
      "A named champion bridges home/school and prevents communication failure",
      "Continuity of peer group during placement turbulence is enormously stabilising",
      "Achievement at school often unlocks other positive identity shifts",
    ],
    conditionsForSuccess: [
      "Virtual School engaged as active partner, not paperwork",
      "PEP meetings attended by someone who actually knows the child",
      "School willing to flex around dysregulation rather than escalate to exclusion",
      "Transport sustainable — school must be reachable across the placement period",
    ],
    recommendedActions: [
      "At admission, identify the named champion at school within 2 weeks",
      "Quarterly tripartite meeting (home / school / VS) for at-risk learners",
      "Track attendance daily, not termly — small dips signal early",
      "Celebrate achievements visibly — assembly mentions, photos at home",
    ],
    evidenceSources: [
      "Quality Standard 8 (Education)",
      "DfE looked-after children outcomes data",
      "Virtual School annual reports",
      "Internal PEP audit",
    ],
    childVoiceOnFactor: "M.T.: 'Mrs F at school knew when I was wobbly before the staff did. She'd just say come and sit in here for ten minutes. That's why I stayed in school.'",
    staffPerspective: "Staff_edward: 'When I see a placement breaking down, the school is usually already broken down. The opposite is also true.'",
    implementationStatus: "Standard practice",
    reviewDate: d(-21),
    reviewedBy: "staff_ryan",
  },
  {
    id: "psf_007",
    factor: "Graduated independence work begun 18+ months before transition",
    domain: "Independence",
    evidenceStrength: "Emerging",
    supportingCases: ["M.T. (planned independence work over 24 months — sustained tenancy at 18m)", "S.L. (Staying Close arrangement)"],
    counterCases: ["J.W. (independence rushed in final 6 months — tenancy lost at 4 months)", "I.G. (no transition planning — unplanned move at 18)"],
    keyMechanisms: [
      "Skill acquisition needs repetition over time, not a course at the end",
      "Internalised competence — 'I can do this' — only forms through repeated success",
      "Relationships with key adults endure into adulthood when transition is planned",
      "The shift from being cared-for to caring-for-self is identity work, not task work",
    ],
    conditionsForSuccess: [
      "Pathway plan starts at 16 in genuine practice, not just on paper",
      "Practice flat / step-down option available locally",
      "Identified post-18 contact person (Staying Close or equivalent)",
      "Financial literacy, cooking, healthcare navigation woven into daily life early",
    ],
    recommendedActions: [
      "Pathway plan review every 3 months from age 16",
      "Maintain post-18 budget for ongoing key worker contact",
      "Build a 'leaving care passport' with practical knowledge",
      "Track care leaver outcomes for 2 years to learn from them",
    ],
    evidenceSources: [
      "Staying Close evaluation (DfE)",
      "Quality Standard 5 (Enjoyment and achievement) and Reg 6",
      "Care leaver outcome tracking (internal)",
      "Become charity practice guidance",
    ],
    childVoiceOnFactor: "M.T. (now 19, in own tenancy): 'The thing that worked was that I was already doing the stuff for ages. By the time I moved out it wasn't a shock — it was just me carrying on.'",
    staffPerspective: "Staff_darren: 'We've moved from teaching independence in the last six months to embedding it from 16. The early evidence says it sticks better.'",
    implementationStatus: "Identified gap",
    reviewDate: d(-7),
    reviewedBy: "staff_darren",
  },
];

/* ─── domain icon ─── */
const domainIcon = (domain: Domain) => {
  switch (domain) {
    case "Relational":
      return <Heart className="h-4 w-4" />;
    case "Practice":
      return <Target className="h-4 w-4" />;
    case "Multi-agency":
      return <Globe className="h-4 w-4" />;
    case "Environment":
      return <HomeIcon className="h-4 w-4" />;
    case "Family":
      return <HandHeart className="h-4 w-4" />;
    case "Education":
      return <GraduationCap className="h-4 w-4" />;
    case "Therapeutic":
      return <Stethoscope className="h-4 w-4" />;
    case "Independence":
      return <Compass className="h-4 w-4" />;
  }
};

/* ─── export columns ─── */
const exportCols: ExportColumn<SuccessFactor>[] = [
  { header: "Factor", accessor: (r: SuccessFactor) => r.factor },
  { header: "Domain", accessor: (r: SuccessFactor) => r.domain },
  { header: "Evidence Strength", accessor: (r: SuccessFactor) => r.evidenceStrength },
  { header: "Implementation", accessor: (r: SuccessFactor) => r.implementationStatus },
  { header: "Supporting Cases", accessor: (r: SuccessFactor) => r.supportingCases.join("; ") },
  { header: "Counter Cases", accessor: (r: SuccessFactor) => r.counterCases.join("; ") },
  { header: "Recommended Actions", accessor: (r: SuccessFactor) => r.recommendedActions.join("; ") },
  { header: "Review Date", accessor: (r: SuccessFactor) => r.reviewDate },
  { header: "Reviewed By", accessor: (r: SuccessFactor) => getStaffName(r.reviewedBy) },
];

/* ─── component ─── */
export default function PlacementSuccessFactorsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("evidence");

  const filtered = useMemo(() => {
    let list = [...factors];
    if (filterDomain !== "all") list = list.filter((r) => r.domain === filterDomain);
    if (filterStatus !== "all") list = list.filter((r) => r.implementationStatus === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "evidence": {
          const order: Record<EvidenceStrength, number> = { Strong: 0, Moderate: 1, Emerging: 2 };
          return order[a.evidenceStrength] - order[b.evidenceStrength];
        }
        case "domain":
          return a.domain.localeCompare(b.domain);
        case "status": {
          const order: Record<ImplementationStatus, number> = {
            "Standard practice": 0,
            "Emerging practice": 1,
            "Identified gap": 2,
          };
          return order[a.implementationStatus] - order[b.implementationStatus];
        }
        case "review":
          return b.reviewDate.localeCompare(a.reviewDate);
        default:
          return 0;
      }
    });
    return list;
  }, [filterDomain, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const strong = factors.filter((f) => f.evidenceStrength === "Strong").length;
    const standard = factors.filter((f) => f.implementationStatus === "Standard practice").length;
    const gaps = factors.filter((f) => f.implementationStatus === "Identified gap").length;
    const domains = new Set(factors.map((f) => f.domain)).size;
    return { strong, standard, gaps, domains };
  }, []);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const evidenceBadge = (e: EvidenceStrength) => {
    switch (e) {
      case "Strong":
        return <Badge className="bg-green-100 text-green-800 text-xs">Strong evidence</Badge>;
      case "Moderate":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Moderate evidence</Badge>;
      case "Emerging":
        return <Badge className="bg-amber-100 text-amber-800 text-xs">Emerging evidence</Badge>;
    }
  };

  const statusBadge = (s: ImplementationStatus) => {
    switch (s) {
      case "Standard practice":
        return <Badge className="bg-emerald-100 text-emerald-800 text-xs">Standard practice</Badge>;
      case "Emerging practice":
        return <Badge className="bg-indigo-100 text-indigo-800 text-xs">Emerging practice</Badge>;
      case "Identified gap":
        return <Badge className="bg-red-100 text-red-800 text-xs">Identified gap</Badge>;
    }
  };

  return (
    <PageShell
      title="Placement Success Factors"
      subtitle="Meta-analysis of what makes placements work — informing future practice across the home"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={factors} columns={exportCols} filename="placement-success-factors" />
          <PrintButton title="Placement Success Factors" />
        </div>
      }
    >
      {/* ─── learning banner ─── */}
      <div className="mb-6 rounded-lg border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-violet-100 p-2 shrink-0">
            <Sparkles className="h-5 w-5 text-violet-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-900">
              Systematic learning across all placements
            </p>
            <p className="mt-1 text-xs text-violet-800">
              This analysis brings together what we have learned from every placement Oak House has
              held — those that thrived, those that disrupted, and those still in progress. Each
              factor is triangulated against supporting cases, counter-cases, child voice, staff
              reflection, and external evidence. The aim is not to produce a list of good ideas, but
              to identify the conditions, mechanisms and actions that make the difference. This
              record is reviewed quarterly and feeds directly into the Statement of Purpose, the
              Reg 45 review, and the home&apos;s development plan.
            </p>
          </div>
        </div>
      </div>

      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.strong}</p>
            <p className="text-xs text-muted-foreground">Strong evidence factors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.standard}</p>
            <p className="text-xs text-muted-foreground">Standard practice items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.gaps}</p>
            <p className="text-xs text-muted-foreground">Identified gaps</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.domains}</p>
            <p className="text-xs text-muted-foreground">Domains covered</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── filters / sort ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterDomain} onValueChange={setFilterDomain}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All domains</SelectItem>
            <SelectItem value="Relational">Relational</SelectItem>
            <SelectItem value="Practice">Practice</SelectItem>
            <SelectItem value="Multi-agency">Multi-agency</SelectItem>
            <SelectItem value="Environment">Environment</SelectItem>
            <SelectItem value="Family">Family</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="Therapeutic">Therapeutic</SelectItem>
            <SelectItem value="Independence">Independence</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Implementation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All implementation states</SelectItem>
            <SelectItem value="Standard practice">Standard practice</SelectItem>
            <SelectItem value="Emerging practice">Emerging practice</SelectItem>
            <SelectItem value="Identified gap">Identified gap</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="evidence">Evidence strength</SelectItem>
              <SelectItem value="domain">Domain</SelectItem>
              <SelectItem value="status">Implementation</SelectItem>
              <SelectItem value="review">Most recently reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── factor cards ─── */}
      <div className="space-y-4">
        {filtered.map((f) => {
          const expanded = expandedId === f.id;

          return (
            <Card
              key={f.id}
              className={cn(
                "overflow-hidden",
                f.implementationStatus === "Identified gap" && "border-red-200",
                f.implementationStatus === "Emerging practice" && "border-indigo-200",
              )}
            >
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(f.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-full",
                        f.implementationStatus === "Identified gap"
                          ? "bg-red-100 text-red-700"
                          : f.implementationStatus === "Emerging practice"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      {domainIcon(f.domain)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{f.factor}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {f.domain}
                        </Badge>
                        {evidenceBadge(f.evidenceStrength)}
                        {statusBadge(f.implementationStatus)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Reviewed</p>
                      <p className="text-sm">{f.reviewDate}</p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* cases */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="text-sm font-medium text-green-900 flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4" /> Supporting cases
                      </p>
                      <ul className="space-y-0.5">
                        {f.supportingCases.map((c, i) => (
                          <li key={i} className="text-xs text-green-900 flex items-start gap-1.5">
                            <span className="mt-1">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm font-medium text-amber-900 flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4" /> Counter cases (absence correlated with disruption)
                      </p>
                      <ul className="space-y-0.5">
                        {f.counterCases.map((c, i) => (
                          <li key={i} className="text-xs text-amber-900 flex items-start gap-1.5">
                            <span className="mt-1">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* mechanisms / conditions / actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" /> Key mechanisms (why it works)
                      </p>
                      <ul className="space-y-0.5">
                        {f.keyMechanisms.map((m, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {m}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                        <Target className="h-3 w-3" /> Conditions for success
                      </p>
                      <ul className="space-y-0.5">
                        {f.conditionsForSuccess.map((c, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {c}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Recommended actions
                      </p>
                      <ul className="space-y-0.5">
                        {f.recommendedActions.map((a, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* voices */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-md bg-blue-50 border border-blue-100 p-3">
                      <p className="text-xs font-medium text-blue-900 flex items-center gap-1 mb-1">
                        <Quote className="h-3 w-3" /> Child voice on this factor
                      </p>
                      <p className="text-xs text-blue-900">{f.childVoiceOnFactor}</p>
                    </div>
                    <div className="rounded-md bg-slate-50 border border-slate-200 p-3">
                      <p className="text-xs font-medium text-slate-700 flex items-center gap-1 mb-1">
                        <Users className="h-3 w-3" /> Staff perspective
                      </p>
                      <p className="text-xs text-slate-700">{f.staffPerspective}</p>
                    </div>
                  </div>

                  {/* sources */}
                  <div>
                    <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> Evidence sources
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {f.evidenceSources.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-normal">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Domain</p>
                      <p className="text-sm font-medium">{f.domain}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Evidence</p>
                      <p className="text-sm font-medium">{f.evidenceStrength}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reviewed</p>
                      <p className="text-sm font-medium">{f.reviewDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reviewed by</p>
                      <p className="text-sm font-medium">{getStaffName(f.reviewedBy)}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          Quality Standard 13 (the Leadership and Management Standard) requires the registered
          person to lead and manage the home in a way that uses learning to continuously improve
          practice. Regulation 45 of the Children&apos;s Homes Regulations 2015 requires the
          registered person to complete a six-monthly review of the quality of care, drawing on
          internal and external evidence to evaluate effectiveness and inform improvement. This
          meta-analysis directly supports both: it identifies the conditions and mechanisms
          associated with placement success, triangulates supporting and counter cases drawn from
          the home&apos;s history, and translates findings into recommended actions that feed the
          development plan and the Statement of Purpose. Children&apos;s voices and staff
          reflection are weighted alongside external evidence to keep the analysis grounded in
          lived experience.
        </p>
      </div>
    </PageShell>
  );
}
