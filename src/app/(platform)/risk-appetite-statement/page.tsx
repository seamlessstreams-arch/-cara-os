"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  TreePine,
  Users,
  Wifi,
  Heart,
  Clock,
  GraduationCap,
  AlertTriangle,
  Scale,
  Activity,
  CheckCircle2,
  FileText,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type AppetiteLevel = "high" | "medium-high" | "medium" | "low" | "graduated";

interface Domain {
  id: string;
  name: string;
  icon: React.ElementType;
  appetiteLevel: AppetiteLevel;
  rationale: string;
  examples: string[];
  redLines: string[];
  decisionAuthority: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const APPETITE_META: Record<AppetiteLevel, { label: string; color: string }> = {
  high: { label: "HIGH", color: "bg-green-100 text-green-800" },
  "medium-high": { label: "MEDIUM-HIGH", color: "bg-emerald-100 text-emerald-800" },
  medium: { label: "MEDIUM", color: "bg-amber-100 text-amber-800" },
  low: { label: "LOW", color: "bg-red-100 text-red-800" },
  graduated: { label: "GRADUATED", color: "bg-blue-100 text-blue-800" },
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const DOMAINS: Domain[] = [
  {
    id: "dom_1",
    name: "Physical Activity & Outdoor Play",
    icon: TreePine,
    appetiteLevel: "high",
    rationale: "We encourage age-appropriate risk-taking in physical activities. Climbing trees, cycling, rough play with peers are normal childhood experiences. We assess but do not eliminate risk.",
    examples: [
      "Children can climb trees in the garden without being told to come down unless there is genuine danger",
      "Cycling to the local park without staff escort (age/maturity dependent)",
      "Rough-and-tumble play with peers — redirected only if escalating to harm",
      "Skateboarding, trampolining, and water play with proportionate supervision",
      "Playing outside in all weather — rain is not a reason to stay indoors",
    ],
    redLines: [
      "No activity near roads or water without assessed competence",
      "No activity where a child has a specific medical contraindication",
      "Staff must intervene if play becomes targeted aggression",
    ],
    decisionAuthority: "Any on-shift staff member can authorise routine physical play. Residential Manager approval for higher-risk activities (e.g. open water swimming).",
  },
  {
    id: "dom_2",
    name: "Social Relationships & Friendships",
    icon: Users,
    appetiteLevel: "high",
    rationale: "Children should have friends, go to sleepovers, attend parties. Friendship risks are normal. We manage, not prevent.",
    examples: [
      "Sleepovers at friends' houses after proportionate DBS-free checks (knowing the family, not CRB-checking them)",
      "Attending birthday parties and social events without staff presence",
      "Having friends visit the home — treated as normal, not an 'event'",
      "Age-appropriate romantic relationships acknowledged and supported",
      "Choosing their own friendship groups even if staff have reservations about peer influence",
    ],
    redLines: [
      "No contact with peers where there is assessed exploitation risk",
      "No unsupervised contact with adults who pose a safeguarding concern",
      "Immediate intervention if friendship involves coercion, control, or criminal activity",
    ],
    decisionAuthority: "Key worker or any senior staff member. Residential Manager for sleepovers where family is unknown.",
  },
  {
    id: "dom_3",
    name: "Online Activity",
    icon: Wifi,
    appetiteLevel: "medium",
    rationale: "Age-appropriate online access is a right. We use proportionate monitoring, not blanket restrictions. Children learn digital citizenship through guided exposure.",
    examples: [
      "Social media accounts appropriate to age — not blanket-banned",
      "Gaming online with peers, including voice chat",
      "Researching topics of interest independently",
      "Proportionate monitoring using agreed tools — not reading every message",
      "Teaching children to identify and report concerns rather than restricting access",
    ],
    redLines: [
      "No unsupervised access to age-inappropriate content (gambling, explicit material)",
      "Immediate intervention if online grooming indicators emerge",
      "No sharing of personal information (address, care status) publicly",
      "No online contact with individuals identified as posing risk",
    ],
    decisionAuthority: "Any staff member for routine access. Key worker for new platform access. Residential Manager for restriction or removal of existing access.",
  },
  {
    id: "dom_4",
    name: "Contact with Birth Family",
    icon: Heart,
    appetiteLevel: "medium-high",
    rationale: "Contact is presumed unless assessed as harmful. We support difficult contact rather than avoiding it. Even messy contact can have value.",
    examples: [
      "Supporting contact even when the child returns dysregulated — dysregulation is not a reason to stop contact",
      "Facilitating indirect contact (letters, calls) even where face-to-face is restricted",
      "Allowing spontaneous phone calls to family outside of scheduled contact times",
      "Supporting children who want to attend family events (funerals, birthdays, weddings)",
      "Not interpreting a child's distress after contact as evidence contact should stop",
    ],
    redLines: [
      "No contact that breaches a court order",
      "No unsupervised contact with individuals who have caused significant harm where risk remains unmanaged",
      "Immediate safeguarding referral if contact reveals current abuse",
      "No facilitation of contact that the child explicitly and consistently refuses",
    ],
    decisionAuthority: "Key worker for routine scheduled contact. Residential Manager for unscheduled or first-time contact. Social worker consulted for changes to contact plans.",
  },
  {
    id: "dom_5",
    name: "Independence & Unsupervised Time",
    icon: Clock,
    appetiteLevel: "graduated",
    rationale: "Matched to age, maturity, and track record. We actively build toward independence — not restrict until 18 and release.",
    examples: [
      "Age 10-12: Walking to local shops alone, playing out with friends in agreed area",
      "Age 13-14: Travelling independently to school, spending time in town with friends",
      "Age 15-16: Evening activities with peers, part-time work, managing own schedule",
      "Age 16+: Overnight stays, independent travel, cooking own meals, budgeting",
      "All ages: Privacy in bedroom, time alone when needed, personal space respected",
    ],
    redLines: [
      "No unsupervised time for any child where there is an active exploitation concern without specific risk assessment",
      "No overnight stays until social worker and Residential Manager are satisfied with arrangements",
      "Independence must not be withdrawn as a sanction",
    ],
    decisionAuthority: "Graduated: staff on shift for everyday independence. Key worker for new freedoms. Residential Manager for significant changes. Social worker consultation for overnight stays.",
  },
  {
    id: "dom_6",
    name: "Education & Activities",
    icon: GraduationCap,
    appetiteLevel: "high",
    rationale: "We say yes to school trips, sports clubs, residentials. The default is participation, not exclusion. We find ways to manage risk, not avoid activity.",
    examples: [
      "School trips are consented to as the default — staff find ways to enable, not reasons to refuse",
      "Residential trips including overnight stays — consent given unless specific assessed risk",
      "Joining sports clubs, drama groups, Scouts/Guides without staff needing to accompany",
      "After-school activities that mean walking home later or getting lifts with other parents",
      "Trying new activities even if there is a possibility of failure or injury",
    ],
    redLines: [
      "No activities that require medical clearance without it being obtained",
      "No activities where a specific, current risk assessment contraindicates participation",
      "Staff must ensure appropriate consent paperwork is completed (delegated authority)",
    ],
    decisionAuthority: "Any staff member can consent to routine school activities. Key worker for new clubs/activities. Residential Manager for residential trips or activities involving higher risk.",
  },
  {
    id: "dom_7",
    name: "Substance Use",
    icon: AlertTriangle,
    appetiteLevel: "low",
    rationale: "We don't accept drug/alcohol use but respond with support not punishment. Harm reduction over zero tolerance.",
    examples: [
      "Open conversations about drugs and alcohol without fear of punishment for honesty",
      "Harm reduction education appropriate to age and exposure",
      "If a child returns intoxicated: ensure safety first, conversation the next day",
      "Working with specialist substance misuse services when needed",
      "Not searching rooms punitively but discussing concerns openly",
    ],
    redLines: [
      "No use of substances within the home",
      "No tolerance of drug dealing or supply from or to the home",
      "Immediate safeguarding response if substance use is linked to exploitation",
      "No staff response that shames, punishes, or criminalises a child for substance use",
    ],
    decisionAuthority: "All staff respond to incidents. Key worker leads ongoing support planning. Residential Manager for escalation to specialist services or multi-agency strategy.",
  },
  {
    id: "dom_8",
    name: "Missing from Care",
    icon: Shield,
    appetiteLevel: "low",
    rationale: "Every episode is taken seriously but response is proportionate. Going to the shop late is not the same as staying out all night with exploitation concerns.",
    examples: [
      "Proportionate response based on individual risk assessment, not blanket timescales",
      "Return home interviews that are supportive, not interrogatory",
      "Understanding push/pull factors — addressing why a child leaves rather than just responding when they do",
      "Not calling police for every minor lateness — proportionality is key",
      "Recognising that some 'missing' episodes are normal teenage behaviour (lost track of time, phone died)",
    ],
    redLines: [
      "Every missing episode recorded and reported per local protocol",
      "Immediate police contact where exploitation, trafficking, or county lines concerns exist",
      "No normalisation of missing episodes — each one assessed on its own merits",
      "No punitive response on return (grounding, loss of freedoms, angry confrontation)",
    ],
    decisionAuthority: "Staff on shift make initial proportionate response. Residential Manager contacted for all episodes exceeding individual trigger plan timescales. Police contacted per protocol.",
  },
];

/* ── metadata ──────────────────────────────────────────────────────────────── */

const STATEMENT_META = {
  reviewDate: d(-45),
  nextReview: d(135),
  approvedBy: "staff_darren",
};

const PRINCIPLES = [
  "Would a good parent allow this?",
  "Is restriction proportionate?",
  "Are we protecting or controlling?",
];

/* ── export columns ────────────────────────────────────────────────────────── */

const exportCols: ExportColumn<Domain>[] = [
  { header: "Domain", accessor: (r: Domain) => r.name },
  { header: "Appetite Level", accessor: (r: Domain) => APPETITE_META[r.appetiteLevel].label },
  { header: "Rationale", accessor: (r: Domain) => r.rationale },
  { header: "Red Lines", accessor: (r: Domain) => r.redLines.join("; ") },
  { header: "Decision Authority", accessor: (r: Domain) => r.decisionAuthority },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function RiskAppetiteStatementPage() {
  const [data] = useState<Domain[]>(DOMAINS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── summary stats ──── */
  const stats = useMemo(() => {
    const levels = data.map((d) => d.appetiteLevel);
    const toleranceMap: Record<AppetiteLevel, number> = {
      high: 5,
      "medium-high": 4,
      medium: 3,
      graduated: 3,
      low: 1,
    };
    const avg = levels.reduce((sum, l) => sum + toleranceMap[l], 0) / levels.length;
    return {
      domainsCovered: data.length,
      averageTolerance: avg.toFixed(1),
      lastReview: STATEMENT_META.reviewDate,
    };
  }, [data]);

  return (
    <PageShell
      title="Risk Appetite Statement"
      subtitle="Framework for balancing proportionate risk-taking with safeguarding at Oak House"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="risk-appetite-statement" />
          <PrintButton title="Risk Appetite Statement" />
        </div>
      }
    >
      {/* ── summary bar ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Domains Covered</p>
              <p className="text-xl font-semibold">{stats.domainsCovered}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Scale className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Risk Tolerance</p>
              <p className="text-xl font-semibold">{stats.averageTolerance} / 5</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Last Review</p>
              <p className="text-xl font-semibold">{STATEMENT_META.reviewDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── guiding principles ───────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Guiding Principles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {PRINCIPLES.map((p) => (
              <Badge key={p} variant="outline" className="text-sm py-1 px-3">
                {p}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Every decision about restricting a child&apos;s liberty, movement, or access should pass through these three questions. If the answer to any is &quot;no&quot;, the restriction must be reconsidered.
          </p>
        </CardContent>
      </Card>

      {/* ── domain cards ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {data.map((domain) => {
          const expanded = expandedId === domain.id;
          const Icon = domain.icon;
          const meta = APPETITE_META[domain.appetiteLevel];

          return (
            <Card key={domain.id} className="overflow-hidden">
              <button
                className="w-full text-left"
                onClick={() => setExpandedId(expanded ? null : domain.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{domain.name}</CardTitle>
                      <Badge className={cn("text-xs", meta.color)}>
                        {meta.label}
                      </Badge>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </button>

              {expanded && (
                <CardContent className="pt-0 space-y-4">
                  {/* rationale */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Rationale</p>
                    <p className="text-sm">{domain.rationale}</p>
                  </div>

                  {/* examples */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Examples of Practice</p>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {domain.examples.map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  </div>

                  {/* red lines */}
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-1">Red Lines</p>
                    <ul className="text-sm space-y-1 list-disc list-inside text-red-700">
                      {domain.redLines.map((rl, i) => (
                        <li key={i}>{rl}</li>
                      ))}
                    </ul>
                  </div>

                  {/* decision authority */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Decision Authority</p>
                    <p className="text-sm">{domain.decisionAuthority}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── regulatory context ───────────────────────────────────────────── */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            Regulatory Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            This statement is informed by the UN Convention on the Rights of the Child (UNCRC), which affirms children&apos;s rights to play (Article 31), privacy (Article 16), freedom of association (Article 15), and participation in decisions affecting them (Article 12).
          </p>
          <p>
            The Children&apos;s Homes (England) Regulations 2015, Quality Standard 3, requires that any restriction on a child&apos;s liberty or autonomy is proportionate and necessary. Blanket restrictions — rules applied to all children regardless of individual risk — are not acceptable.
          </p>
          <p>
            Ofsted has consistently criticised homes that are overly restrictive, noting that excessive risk aversion deprives children of normal childhood experiences and fails to prepare them for independence. A good children&apos;s home enables children to take age-appropriate risks as part of their development.
          </p>
          <p className="text-muted-foreground italic">
            Proportionality is the key principle: restrictions must be the minimum necessary to keep a child safe, individually assessed, regularly reviewed, and clearly recorded with the child&apos;s views captured.
          </p>
        </CardContent>
      </Card>

      {/* ── approval footer ──────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t pt-4">
        <span>Approved by: <span className="font-medium text-foreground">{getStaffName(STATEMENT_META.approvedBy)}</span></span>
        <span>Review date: <span className="font-medium text-foreground">{STATEMENT_META.reviewDate}</span></span>
        <span>Next review: <span className="font-medium text-foreground">{STATEMENT_META.nextReview}</span></span>
      </div>
    </PageShell>
  );
}
