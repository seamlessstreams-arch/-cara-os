"use client";

import { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Heart, BookOpen, Users, Scale, Mic, Home, GraduationCap,
  HeartPulse, Globe, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
  Star, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type ComplianceLevel = "fully" | "partially" | "action_needed";

interface RightEntry {
  id: string;
  article: string;
  title: string;
  icon: React.ElementType;
  uncrcSummary: string;
  howWeUphold: string[];
  evidence: string[];
  childFeedback: string;
  complianceLevel: ComplianceLevel;
  actionNeeded: string | null;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const COMPLIANCE_META: Record<ComplianceLevel, { label: string; color: string }> = {
  fully: { label: "Fully Met", color: "bg-green-100 text-green-800" },
  partially: { label: "Partially Met", color: "bg-amber-100 text-amber-800" },
  action_needed: { label: "Action Needed", color: "bg-red-100 text-red-800" },
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const RIGHTS: RightEntry[] = [
  {
    id: "r_01", article: "Article 3", title: "Best Interests", icon: Heart,
    uncrcSummary: "In all actions concerning children, the best interests of the child shall be a primary consideration.",
    howWeUphold: [
      "All decisions about the children at Oak House are made with their best interests as the primary consideration",
      "Impact assessments are completed before any placement decision",
      "Care plans are individualised and regularly reviewed",
      "The Registered Manager ensures all policies prioritise the child's welfare",
      "Multi-agency meetings are convened when complex decisions arise",
    ],
    evidence: [
      "Individual care plans reviewed quarterly",
      "Impact assessments completed for all new admissions",
      "LAC review minutes demonstrate best interest decision-making",
      "Casey's contact restriction — implemented to protect Casey's safety despite her objections",
    ],
    childFeedback: `${getYPName("yp_alex")} said: "They always ask what I think about stuff." ${getYPName("yp_casey")} said: "Sometimes they do things I don't want but I know it's because they care."`,
    complianceLevel: "fully",
    actionNeeded: null,
  },
  {
    id: "r_02", article: "Article 12", title: "Right to Be Heard", icon: Mic,
    uncrcSummary: "Children have the right to express their views in all matters affecting them, and for those views to be given due weight.",
    howWeUphold: [
      "Children's meetings held monthly — all children invited to contribute",
      "Key work sessions include direct work on the child's wishes and feelings",
      "Children's views are recorded in all PEPs, LAC reviews, and care plan reviews",
      "YP feedback forms available and encouraged",
      "Advocates available for all children — Jordan's advocate supports communication needs",
      "Children contribute to house rules and meal planning",
    ],
    evidence: [
      "Children's meeting minutes — all children contributed (Jordan via visual aids)",
      "YP feedback collected quarterly — 100% response rate",
      "Casey's views recorded in PEP despite reluctance to engage initially",
      "Alex chose his own football club — decision respected",
      "Jordan's sensory profile developed with Jordan's input (visual scale)",
    ],
    childFeedback: `${getYPName("yp_alex")} said: "They listen to me mostly." ${getYPName("yp_jordan")} pointed to 'happy face' when asked about being listened to. ${getYPName("yp_casey")} said: "They ask my opinion but then do what they want anyway" — staff working on helping Casey understand safety vs. control.`,
    complianceLevel: "partially",
    actionNeeded: "Continue direct work with Casey to build understanding that safety restrictions are not about ignoring her voice. Ensure Casey's advocate is involved in all key decisions.",
  },
  {
    id: "r_03", article: "Article 19", title: "Protection from Harm", icon: Shield,
    uncrcSummary: "Children have the right to be protected from all forms of physical or mental violence, injury, abuse, neglect, or exploitation.",
    howWeUphold: [
      "Robust safeguarding procedures in place — all staff trained to Level 3",
      "DBS checks and safer recruitment for all staff",
      "LADO referral procedure followed when allegations arise",
      "Exploitation screening and risk assessments regularly updated",
      "30-minute checks for high-risk children (Casey)",
      "Contact restrictions enforced where risk identified (Casey — Marcus)",
      "Window restrictors and environmental safety measures in place",
    ],
    evidence: [
      "Staff training records — 100% safeguarding compliant",
      "LADO investigation handled promptly and correctly",
      "Casey's exploitation risk assessment updated weekly",
      "Reg 35 notifications submitted within statutory timescales",
      "Incident records demonstrate appropriate responses",
    ],
    childFeedback: `${getYPName("yp_alex")} said: "I feel safe here." ${getYPName("yp_jordan")} pointed to 'safe face'. ${getYPName("yp_casey")} said: "It's alright I suppose. Better than before."`,
    complianceLevel: "fully",
    actionNeeded: null,
  },
  {
    id: "r_04", article: "Article 24", title: "Health & Wellbeing", icon: HeartPulse,
    uncrcSummary: "Children have the right to the best possible health and to facilities for the treatment of illness and rehabilitation.",
    howWeUphold: [
      "All children registered with GP, dentist, and optician",
      "Health assessments completed on admission and annually",
      "Medication managed safely — weekly stock checks, trained staff",
      "CAMHS support in place for Jordan and Casey",
      "Healthy meals planned with children's input",
      "Physical activity encouraged — Alex's football, Jordan's swimming exploration",
      "Emotional wellbeing monitored through Outcome Star assessments",
    ],
    evidence: [
      "Health records up to date for all children",
      "Jordan's CAMHS appointments attended consistently",
      "Casey's CAMHS urgent review arranged following self-harm incident",
      "Medication audit — zero errors in last quarter",
      "Alex's asthma managed with inhaler always accessible",
    ],
    childFeedback: `${getYPName("yp_alex")} said: "They take me to the doctor when I need to go. The food is pretty good." ${getYPName("yp_casey")} said: "My CAMHS worker is alright."`,
    complianceLevel: "fully",
    actionNeeded: null,
  },
  {
    id: "r_05", article: "Article 28", title: "Right to Education", icon: GraduationCap,
    uncrcSummary: "Children have the right to education. Primary education should be compulsory and free. Discipline should respect children's dignity.",
    howWeUphold: [
      "All children have school/college placements",
      "PEPs completed termly and tracked actively",
      "Pupil Premium Plus used effectively for each child",
      "Homework support provided — quiet study space, resources",
      "Virtual School Head engaged in all educational decisions",
      "Part-time timetable for Jordan — plan to increase progressively",
      "College reintegration plan being developed for Casey",
    ],
    evidence: [
      "Alex: 91% attendance, on track in most subjects",
      "Jordan: EHCP provision well-matched, specialist school",
      "PEP reviews current for Alex and Jordan",
      "Pupil Premium Plus tracked and impact evidenced",
    ],
    childFeedback: `${getYPName("yp_alex")} said: "School is alright. I like PE best." ${getYPName("yp_jordan")} drew a picture of the art room — clear favourite. ${getYPName("yp_casey")} said: "I can't be bothered with college" — but acknowledged she'd go back for art.`,
    complianceLevel: "partially",
    actionNeeded: "Casey has not attended college for 4 weeks. Reintegration plan needed urgently. CME notification submitted. This is the priority action for Article 28 compliance.",
  },
  {
    id: "r_06", article: "Article 8", title: "Identity", icon: Globe,
    uncrcSummary: "Children have the right to preserve their identity, including nationality, name, and family relations.",
    howWeUphold: [
      "Cultural identity assessments completed for all children",
      "Life story work undertaken with key workers",
      "Family contact facilitated and supported (within safety parameters)",
      "Children's names, preferences, and identity markers respected",
      "Jordan's ASD identity respected and affirmed — not treated as deficit",
      "Religious and cultural practices supported",
    ],
    evidence: [
      "Cultural identity plans in place for all 3 children",
      "Alex: family contact maintained with grandmother, exploring contact with dad",
      "Casey: weekly call with grandmother Margaret facilitated",
      "Jordan: advocate ensures communication preferences respected",
      "Life story books in progress for all children",
    ],
    childFeedback: `${getYPName("yp_alex")} said: "I miss my mum but I can talk to my nan." ${getYPName("yp_casey")} said: "At least I can still talk to my nan."`,
    complianceLevel: "fully",
    actionNeeded: null,
  },
  {
    id: "r_07", article: "Article 15", title: "Freedom of Association", icon: Users,
    uncrcSummary: "Children have the right to meet with other children and to join groups and organisations.",
    howWeUphold: [
      "Children supported to maintain friendships and social connections",
      "After-school clubs and activities facilitated",
      "Alex attends football club — transported by staff",
      "Jordan exploring community groups (ASD-friendly activities)",
      "Peer relationships monitored positively — not restrictively",
      "Contact restrictions only applied where safety requires (Casey — Marcus, with legal authority)",
    ],
    evidence: [
      "Alex: regular football practice, peer friendships maintained",
      "Jordan: Lego club identified, taster session planned",
      "Casey: contact restriction with Marcus — proportionate, court-authorised, reviewed regularly",
      "Children's meetings — children socialise positively together",
    ],
    childFeedback: `${getYPName("yp_alex")} said: "I see my mates at football." ${getYPName("yp_casey")} said: "You won't let me see Marcus" — staff continue to explain this is a safety measure, not a punishment.`,
    complianceLevel: "partially",
    actionNeeded: "Continue to identify safe community activities for Casey. Explore alternative social opportunities that don't involve exploitation risk. Jordan's community participation remains limited — the ASD-friendly group exploration is an active action.",
  },
  {
    id: "r_08", article: "Article 16", title: "Right to Privacy", icon: Lock,
    uncrcSummary: "Children have the right to privacy. No child shall be subjected to arbitrary interference with their privacy, family, home, or correspondence.",
    howWeUphold: [
      "Children have their own bedrooms with lockable drawers for personal items",
      "Knock-and-wait policy — 10 seconds before entry (all rooms)",
      "Personal belongings inventory maintained and respected",
      "Diary/journal privacy respected — staff do not read without consent",
      "Phone monitoring only where assessed as necessary for safety (Casey — with her knowledge)",
      "Confidential space available for private conversations",
    ],
    evidence: [
      "Knock-and-wait policy documented and observed — Jordan's 10-second protocol",
      "Personal belongings inventories current",
      "Casey's phone monitoring — documented, proportionate, Casey informed and consents reviewed",
      "Room searches only conducted with valid reason and child informed",
    ],
    childFeedback: `${getYPName("yp_alex")} said: "They knock before coming in." ${getYPName("yp_jordan")} responded positively to question about privacy. ${getYPName("yp_casey")} said: "They check my phone which is annoying but I know why."`,
    complianceLevel: "fully",
    actionNeeded: null,
  },
  {
    id: "r_09", article: "Article 31", title: "Rest, Leisure & Play", icon: Star,
    uncrcSummary: "Children have the right to rest, leisure, play, and to participate in cultural and artistic activities.",
    howWeUphold: [
      "Activity programme in place — varied and child-led",
      "Holiday planning includes trips and experiences",
      "Garden and outdoor space available",
      "TV, gaming, arts and crafts supplies provided",
      "Chill-out hour before bed introduced (children's meeting suggestion)",
      "Birthday and cultural celebrations supported",
      "Screen time managed but not overly restricted — age-appropriate",
    ],
    evidence: [
      "Activity log showing varied activities across the home",
      "Alex: football, gaming, outdoor activities",
      "Jordan: art materials (specialist set), colouring, Lego",
      "Casey: art, music, social media (monitored)",
      "Holiday planning record — caravan trip planned for half-term",
      "Children's meeting requested and received movie night Fridays",
    ],
    childFeedback: `${getYPName("yp_alex")} said: "It's fun here mostly. I like movie night." ${getYPName("yp_jordan")} drew a picture of the art table — Jordan's favourite space. ${getYPName("yp_casey")} said: "It's alright. Gets boring sometimes."`,
    complianceLevel: "fully",
    actionNeeded: null,
  },
  {
    id: "r_10", article: "Article 25", title: "Review of Placement", icon: Scale,
    uncrcSummary: "Children placed by the state for care, protection or treatment have the right to have that placement regularly reviewed.",
    howWeUphold: [
      "LAC reviews held within statutory timescales",
      "Reg 44 independent visits conducted monthly",
      "Reg 45 quality of care reports completed bi-annually",
      "Children contribute to their reviews — directly or through advocates",
      "IRO oversight in place for all children",
      "Placement stability monitored — disruption meetings held if needed",
    ],
    evidence: [
      "LAC review dates current for all children",
      "Reg 44 reports — last visit within past month",
      "Reg 45 report — completed on time, shared with Ofsted",
      "All 3 children contributed views to their last LAC review",
      "No placement disruptions in the last 12 months",
    ],
    childFeedback: `${getYPName("yp_alex")} said: "The lady comes and talks to me — I can tell her stuff." ${getYPName("yp_casey")} said: "My IRO listens to me."`,
    complianceLevel: "fully",
    actionNeeded: null,
  },
  {
    id: "r_11", article: "Article 39", title: "Recovery & Reintegration", icon: Heart,
    uncrcSummary: "Children who have experienced neglect, abuse, or exploitation have the right to special care to help them recover.",
    howWeUphold: [
      "Trauma-informed care approach embedded across the home",
      "Therapeutic input available — CAMHS for Jordan and Casey",
      "Direct work sessions on exploitation awareness (Casey — Chervelle)",
      "Distress tolerance toolkit available (Casey)",
      "Outcome Star assessments track progress across wellbeing domains",
      "Staff trained in therapeutic crisis intervention",
      "Key working relationships prioritised",
    ],
    evidence: [
      "Casey: direct work programme on exploitation — ongoing",
      "Casey: CAMHS safety plan updated following self-harm incident",
      "Jordan: CAMHS phone appointments attended consistently",
      "Outcome Star shows improvement trends for Alex and Jordan",
      "All staff completed therapeutic care training",
    ],
    childFeedback: `${getYPName("yp_casey")} said: "Chervelle gets it. She doesn't judge me." ${getYPName("yp_alex")} said: "I talk to Ryan about stuff sometimes."`,
    complianceLevel: "fully",
    actionNeeded: null,
  },
  {
    id: "r_12", article: "Article 42", title: "Knowledge of Rights", icon: BookOpen,
    uncrcSummary: "Children have the right to know their rights. Adults should make the UNCRC known to children and adults.",
    howWeUphold: [
      "Children's Guide includes a rights summary in accessible language",
      "Rights poster displayed in communal areas",
      "Key work sessions cover rights awareness",
      "Children know how to complain and how to contact their advocate, IRO, and Ofsted",
      "Staff training includes children's rights",
    ],
    evidence: [
      "Children's Guide distributed to all children on admission",
      "Rights poster displayed in hallway and lounge",
      "Complaints procedure explained — all children aware",
      "Alex and Casey can name their IRO",
      "Jordan's rights explained through visual resources",
    ],
    childFeedback: `${getYPName("yp_alex")} said: "I know I can complain if I want. I know who my IRO is." ${getYPName("yp_casey")} said: "I know my rights."`,
    complianceLevel: "partially",
    actionNeeded: "Update Children's Guide with clearer rights section. Create visual rights resource for Jordan. Consider rights workshop at next children's meeting.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ChildrensRightsPage() {
  const [data] = useState(RIGHTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fullyMet = data.filter((r) => r.complianceLevel === "fully").length;
  const partiallyMet = data.filter((r) => r.complianceLevel === "partially").length;
  const actionNeeded = data.filter((r) => r.complianceLevel === "action_needed").length;

  return (
    <PageShell
      title="Children's Rights"
      subtitle="UNCRC · Rights-Based Practice · How We Uphold Children's Rights at Oak House"
      actions={<PrintButton title="Children's Rights Charter" />}
    >
      <div id="print-area">
        {/* intro banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800">United Nations Convention on the Rights of the Child (UNCRC)</p>
              <p className="text-blue-700">Oak House is committed to upholding the rights of every child in our care. This charter sets out how we meet the key UNCRC articles relevant to residential care, with evidence, children&apos;s own feedback, and identified actions. This document is reviewed quarterly by the Registered Manager and shared with the Reg 44 Visitor and Ofsted upon request.</p>
            </div>
          </div>
        </div>

        {/* summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-green-600">{fullyMet}</p>
              <p className="text-xs text-muted-foreground">Rights Fully Met</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{partiallyMet}</p>
              <p className="text-xs text-muted-foreground">Partially Met</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-red-600">{actionNeeded}</p>
              <p className="text-xs text-muted-foreground">Action Needed</p>
            </CardContent>
          </Card>
        </div>

        {/* actions summary */}
        {data.filter((r) => r.actionNeeded).length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <p className="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Actions Required</p>
            <div className="space-y-1">
              {data.filter((r) => r.actionNeeded).map((r) => (
                <div key={r.id} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="font-medium shrink-0">{r.article}:</span>
                  <span>{r.actionNeeded}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* rights cards */}
        <div className="space-y-3">
          {data.map((r) => {
            const isOpen = expandedId === r.id;
            const Icon = r.icon;
            return (
              <Card key={r.id} className={cn(
                "border-l-4",
                r.complianceLevel === "fully" ? "border-l-green-400" :
                r.complianceLevel === "partially" ? "border-l-amber-400" :
                "border-l-red-500"
              )}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className="h-4 w-4 text-blue-600" />
                        {r.article} — {r.title}
                        <Badge variant="outline" className={COMPLIANCE_META[r.complianceLevel].color}>
                          {COMPLIANCE_META[r.complianceLevel].label}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{r.uncrcSummary}</p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* how we uphold */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-600" /> How We Uphold This Right</p>
                      <ul className="space-y-0.5">
                        {r.howWeUphold.map((item, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-green-600 shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* evidence */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><BookOpen className="h-4 w-4 text-blue-600" /> Evidence</p>
                      <ul className="space-y-0.5">
                        {r.evidence.map((item, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-blue-600 shrink-0">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* child feedback */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1 flex items-center gap-1">
                        <Mic className="h-3.5 w-3.5" /> Children&apos;s Feedback
                      </p>
                      <p className="text-xs text-blue-700">{r.childFeedback}</p>
                    </div>

                    {/* action needed */}
                    {r.actionNeeded && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-2">
                        <p className="font-medium text-xs text-amber-800 mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Action Required
                        </p>
                        <p className="text-xs text-amber-700">{r.actionNeeded}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Children&apos;s Rights Framework</p>
          <p>The UK ratified the UNCRC in 1991. While not directly incorporated into domestic law, the principles underpin the Children Act 1989, the Children&apos;s Homes (England) Regulations 2015, and the Quality Standards. Ofsted inspectors assess whether children&apos;s rights are upheld in practice — this includes listening to children, acting in their best interests, and ensuring they can participate in decisions about their lives. The Children&apos;s Commissioner for England promotes and protects children&apos;s rights. Every children&apos;s home should have a rights-based culture where children understand their rights and can exercise them. This charter should be reviewed quarterly and updated when evidence changes. Children should be involved in the review process.</p>
        </div>
      </div>
    </PageShell>
  );
}
