"use client";

import { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home, Heart, GraduationCap, Shield, Users, Star, MapPin,
  ChevronDown, ChevronUp, CheckCircle2, Stethoscope, Activity,
  Palette, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── types ─────────────────────────────────────────────────────────────────── */

type OfferCategory = "care" | "education" | "health" | "safety" | "activities" | "community" | "independence" | "therapeutic" | "environment" | "workforce";

interface OfferSection {
  id: string;
  category: OfferCategory;
  title: string;
  icon: React.ElementType;
  summary: string;
  whatWeOffer: string[];
  howWeDeliver: string[];
  evidenceOfImpact: string[];
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const CAT_META: Record<OfferCategory, { label: string; color: string }> = {
  care: { label: "Care & Nurture", color: "bg-pink-100 text-pink-800" },
  education: { label: "Education", color: "bg-blue-100 text-blue-800" },
  health: { label: "Health & Wellbeing", color: "bg-green-100 text-green-800" },
  safety: { label: "Safety & Protection", color: "bg-red-100 text-red-800" },
  activities: { label: "Activities & Leisure", color: "bg-amber-100 text-amber-800" },
  community: { label: "Community", color: "bg-purple-100 text-purple-800" },
  independence: { label: "Independence", color: "bg-teal-100 text-teal-800" },
  therapeutic: { label: "Therapeutic", color: "bg-indigo-100 text-indigo-800" },
  environment: { label: "Environment", color: "bg-emerald-100 text-emerald-800" },
  workforce: { label: "Workforce", color: "bg-slate-100 text-slate-700" },
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SECTIONS: OfferSection[] = [
  {
    id: "lo_01", category: "care", title: "Individualised Care", icon: Heart,
    summary: "Every child at Oak House receives care that is tailored to their unique needs, history, and aspirations.",
    whatWeOffer: [
      "Individual care plans developed with the child and reviewed quarterly",
      "Named key worker for each child — consistent, trusted relationship",
      "Trauma-informed approach embedded across all staff practice",
      "Child-centred decision-making — children's views shape their care",
      "Placement stability — our goal is for every child to feel settled and secure",
      "Family contact facilitated and supported (where safe and appropriate)",
      "Life story work to help children understand their history",
      "Cultural identity plans — celebrating each child's heritage",
    ],
    howWeDeliver: [
      "Key working sessions (weekly minimum) — structured and responsive",
      "Outcome Star assessments — collaborative progress tracking across 10 domains",
      "Children's meetings — monthly, child-led agenda",
      "Daily logs capture each child's day — experiences, achievements, and needs",
      "Multi-agency working — social workers, CAMHS, education, health all involved",
    ],
    evidenceOfImpact: [
      "100% placement stability over the last 12 months",
      "All children contributed views to their last LAC review",
      "Average Outcome Star score improving quarter-on-quarter",
      "Positive feedback from children: 'It feels like home'",
    ],
  },
  {
    id: "lo_02", category: "education", title: "Education & Learning", icon: GraduationCap,
    summary: "We champion every child's education, working closely with schools and the Virtual School to maximise attainment and aspiration.",
    whatWeOffer: [
      "Personal Education Plans (PEPs) — completed termly with school and Virtual School",
      "Pupil Premium Plus — used effectively to support each child's educational needs",
      "Homework support — quiet study space, resources, and staff assistance",
      "School attendance monitoring and advocacy",
      "After-school clubs and extra-curricular activities supported",
      "SEND support — EHCP coordination, SALT liaison, specialist provision advocacy",
      "Career guidance and aspirational conversations",
      "Educational visits and trips — broadening experiences",
    ],
    howWeDeliver: [
      "Designated staff member attends all PEP meetings",
      "Daily communication with schools — building strong relationships",
      "Homework time built into daily routine (flexible, not forced)",
      "Transport to school and activities provided",
      "1:1 tutoring arranged where needed (funded via Pupil Premium Plus)",
    ],
    evidenceOfImpact: [
      "Alex: 91% attendance, on track across most subjects, football team captain",
      "Jordan: specialist school placement well-matched, art skills flourishing",
      "Pupil Premium Plus utilisation tracked and impact evidenced",
    ],
  },
  {
    id: "lo_03", category: "health", title: "Health & Wellbeing", icon: Stethoscope,
    summary: "We ensure every child's physical and mental health needs are met, with timely access to services and proactive health promotion.",
    whatWeOffer: [
      "All children registered with GP, dentist, and optician",
      "Health assessments on admission and annually",
      "Health passports — portable health summaries for each child",
      "CAMHS access and support — referrals made promptly",
      "Medication management — safe storage, administration, and auditing",
      "Healthy eating — nutritious meals planned with children's input",
      "Physical activity encouraged — sports, outdoor play, gym memberships",
      "Emotional wellbeing support — daily check-ins, key working, therapeutic tools",
    ],
    howWeDeliver: [
      "Weekly medication stock checks and monthly audits",
      "Staff trained in medication administration",
      "Menu planning with children's input — dietary needs accommodated",
      "Health appointments accompanied by key worker where appropriate",
      "Outcome Star health domain tracked quarterly",
    ],
    evidenceOfImpact: [
      "100% health assessments up to date",
      "Zero medication errors in the last quarter",
      "All children's dental checks within timescale",
      "CAMHS engagement for children who need it",
    ],
  },
  {
    id: "lo_04", category: "safety", title: "Safety & Protection", icon: Shield,
    summary: "Keeping children safe is our absolute priority. We are vigilant, trained, and work with partners to protect every child.",
    whatWeOffer: [
      "All staff safeguarding trained to Level 3",
      "DBS-checked workforce — safer recruitment fully embedded",
      "Risk assessments for every child — reviewed regularly",
      "Exploitation screening and awareness programme",
      "Missing from care protocols — immediate response and return home interviews",
      "Night checks at assessed frequencies (30-min, 45-min, or hourly)",
      "Environmental safety — window restrictors, secure storage, CCTV (external)",
      "Multi-agency safeguarding — close liaison with police, social care, MASH",
    ],
    howWeDeliver: [
      "Daily risk briefings at every shift handover",
      "Safeguarding supervision for all staff",
      "Direct work sessions on safety awareness (exploitation, online safety)",
      "Reg 35 notifications submitted within statutory timescales",
      "Regular training updates and scenario-based learning",
    ],
    evidenceOfImpact: [
      "100% safeguarding training compliance",
      "All risk assessments current",
      "Reg 35 notifications — 100% within timescale",
      "Effective multi-agency working demonstrated in complex cases",
    ],
  },
  {
    id: "lo_05", category: "activities", title: "Activities & Leisure", icon: Palette,
    summary: "We provide a rich and varied programme of activities, driven by children's interests and designed to build skills, confidence, and fun.",
    whatWeOffer: [
      "Football — coaching, clubs, and team participation",
      "Art — specialist materials, displays, creative sessions",
      "Cooking and baking — practical life skills with fun",
      "Days out — parks, cinema, bowling, museums",
      "Holiday activities — caravan trips, adventure days",
      "Movie nights — weekly, child-chosen films",
      "Garden activities — outdoor play, basketball (planned)",
      "Gaming — age-appropriate, time-managed",
      "Reading — library visits, book collections",
      "Community activities — exploring local ASD-friendly groups for Jordan",
    ],
    howWeDeliver: [
      "Activity log maintained — variety and participation tracked",
      "Children choose activities through house meetings and daily conversations",
      "Budget allocated for activities and trips",
      "Transport provided for all activities",
      "Staff actively participate alongside children",
    ],
    evidenceOfImpact: [
      "All children engaged in regular activities",
      "Alex: county football trial opportunity arising from supported activity",
      "Jordan: art recognised by school as exceptional talent",
      "Children's meeting: positive feedback about movie night and planned trips",
    ],
  },
  {
    id: "lo_06", category: "community", title: "Community Connections", icon: MapPin,
    summary: "We help children build positive connections with their local community, promoting belonging and social inclusion.",
    whatWeOffer: [
      "Local sports clubs and community groups — supported and facilitated",
      "Library membership for all children",
      "Community volunteering opportunities (age-appropriate)",
      "Engagement with local services — youth centres, faith groups",
      "Neighbourhood awareness — children know their local area and feel part of it",
      "Diversity calendar — celebrating cultural events together",
    ],
    howWeDeliver: [
      "Key workers actively research and suggest community activities",
      "Transport to community activities provided",
      "Locality risk assessment ensures safety in the local area",
      "Positive relationships maintained with neighbours and local businesses",
    ],
    evidenceOfImpact: [
      "Alex: established in local football club",
      "Jordan: ASD-friendly Lego club identified, taster session planned",
      "Diversity calendar events marked and celebrated",
    ],
  },
  {
    id: "lo_07", category: "independence", title: "Independence & Life Skills", icon: Star,
    summary: "We prepare children for their future by building practical life skills in a supportive, age-appropriate way.",
    whatWeOffer: [
      "Cooking skills — weekly sessions with key worker",
      "Money management — pocket money, budgeting, savings",
      "Personal hygiene and self-care — age-appropriate guidance",
      "Travel training — building confidence to travel independently",
      "Laundry, cleaning, and household tasks — participation encouraged",
      "Transition planning for older children — preparing for semi-independence",
      "Independence skills tracker — visual progress recording",
    ],
    howWeDeliver: [
      "Independence skills assessment on admission and reviewed quarterly",
      "Daily routines build skills naturally (morning routine, bedtime routine)",
      "Pocket money system teaches financial responsibility",
      "Visual schedules support independent task completion (Jordan)",
      "Age-appropriate expectations — not rushed",
    ],
    evidenceOfImpact: [
      "Independence skills improving across Outcome Star assessments",
      "Alex: beginning cooking sessions — engaging well",
      "Jordan: independent morning routine improving with visual schedule",
    ],
  },
  {
    id: "lo_08", category: "therapeutic", title: "Therapeutic Approach", icon: Heart,
    summary: "Oak House is a therapeutically-informed home. Our approach is rooted in understanding trauma and building healing relationships.",
    whatWeOffer: [
      "Trauma-informed care model — all staff trained",
      "Therapeutic Crisis Intervention (TCI) — team trained and reflective",
      "PACE approach (Playfulness, Acceptance, Curiosity, Empathy)",
      "Direct work tools — distress tolerance, grounding, sensory regulation",
      "CAMHS liaison and facilitation — appointments supported",
      "Behaviour support plans — positive, individualised, reviewed",
      "Sensory profiles for children who need them",
      "Attachment-aware practice — understanding relational needs",
    ],
    howWeDeliver: [
      "Quarterly TCI team reflections",
      "Supervision includes reflective practice",
      "Staff trained in emotion coaching and co-regulation",
      "Distress tolerance toolkits available for children who need them",
      "Behaviour mapping to identify patterns and triggers",
    ],
    evidenceOfImpact: [
      "Only 1 restraint in the last quarter — lowest rate in 12 months",
      "Staff consistently use de-escalation before any physical intervention",
      "Positive Ofsted observation: 'Strong trauma-informed practice and genuine warmth'",
      "Casey's relationship with Chervelle demonstrates the power of trusted relationships",
    ],
  },
  {
    id: "lo_09", category: "environment", title: "Home Environment", icon: Home,
    summary: "Oak House is a warm, homely, safe environment where children feel comfortable and proud to live.",
    whatWeOffer: [
      "Individual bedrooms — personalised and decorated to each child's taste",
      "Communal lounge — comfortable, welcoming, with TV and gaming",
      "Kitchen and dining area — meals eaten together where possible",
      "Garden and outdoor space — being developed with children's input",
      "Study space — quiet area for homework",
      "Sensory-friendly spaces — adaptations for children with sensory needs",
      "Secure storage for personal belongings",
      "Regular maintenance — responsive to children's requests",
    ],
    howWeDeliver: [
      "Children choose their bedroom décor",
      "Regular maintenance schedule — issues resolved promptly",
      "Health and safety checks conducted monthly",
      "Fire drills completed regularly",
      "Home is clean, well-maintained, and homely — not institutional",
    ],
    evidenceOfImpact: [
      "Children describe Oak House as 'home'",
      "Reg 44 visitor: 'The home is well-presented and feels warm and welcoming'",
      "Maintenance issues resolved within agreed timescales",
    ],
  },
  {
    id: "lo_10", category: "workforce", title: "Our Team", icon: Users,
    summary: "Oak House has a stable, experienced, and caring staff team who are committed to making a difference for every child.",
    whatWeOffer: [
      "Registered Manager with Level 5 qualification (studying Level 7)",
      "Experienced deputy manager",
      "Consistent staff team — low turnover, children know their carers",
      "All staff DBS checked and safely recruited",
      "Ongoing training programme — mandatory and developmental",
      "Regular supervision and annual appraisals",
      "Staff wellbeing support — EAP, debriefs, reflective practice",
      "Diversity within the team — reflecting the children we care for",
    ],
    howWeDeliver: [
      "Robust safer recruitment process — references, DBS, interviews",
      "Training matrix tracked and monitored",
      "Supervision matrix — all staff receive regular supervision",
      "Staff meetings — monthly, inclusive, action-oriented",
      "Annual development reviews with career pathway discussions",
    ],
    evidenceOfImpact: [
      "95% mandatory training compliance",
      "Staff describe the team as supportive and well-led",
      "Low staff turnover — stability benefits the children",
      "Positive exit interview feedback from former staff",
    ],
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function LocalOfferPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <PageShell
      title="Local Offer"
      subtitle="What Oak House Offers · Our Strengths · Our Commitments"
      actions={<PrintButton title="Oak House — Local Offer" />}
    >
      <div id="print-area">
        {/* intro */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Home className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800">Oak House — Our Local Offer</p>
              <p className="text-blue-700">This document sets out what Oak House offers to the children in our care, their families, and our local community. It is designed to help placing authorities, social workers, and families understand what we provide and how we deliver it. This document is shared with prospective placing authorities as part of the referral process and is reviewed annually alongside the Statement of Purpose.</p>
            </div>
          </div>
        </div>

        {/* quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card>
            <CardContent className="pt-3 pb-2 text-center">
              <p className="text-lg font-bold text-blue-600">3</p>
              <p className="text-[10px] text-muted-foreground">Children (capacity 4)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 text-center">
              <p className="text-lg font-bold text-green-600">11–17</p>
              <p className="text-[10px] text-muted-foreground">Age Range</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 text-center">
              <p className="text-lg font-bold text-amber-600">Good</p>
              <p className="text-[10px] text-muted-foreground">Ofsted Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 text-center">
              <p className="text-lg font-bold text-purple-600">7</p>
              <p className="text-[10px] text-muted-foreground">Staff Team</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 text-center">
              <p className="text-lg font-bold text-green-600">100%</p>
              <p className="text-[10px] text-muted-foreground">Placement Stability</p>
            </CardContent>
          </Card>
        </div>

        {/* category cards */}
        <div className="space-y-3">
          {SECTIONS.map((section) => {
            const isOpen = expandedId === section.id;
            const Icon = section.icon;
            return (
              <Card key={section.id} className="border-l-4 border-l-blue-400">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : section.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className="h-4 w-4 text-blue-600" />
                        {section.title}
                        <Badge variant="outline" className={CAT_META[section.category].color}>{CAT_META[section.category].label}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{section.summary}</p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* what we offer */}
                    <div>
                      <p className="font-medium text-xs mb-1">What We Offer</p>
                      <ul className="space-y-0.5">
                        {section.whatWeOffer.map((item, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-blue-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* how we deliver */}
                    <div>
                      <p className="font-medium text-xs mb-1">How We Deliver It</p>
                      <ul className="space-y-0.5">
                        {section.howWeDeliver.map((item, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-green-600 shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* evidence of impact */}
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <p className="font-medium text-xs text-green-800 mb-1">Evidence of Impact</p>
                      <ul className="space-y-0.5">
                        {section.evidenceOfImpact.map((item, i) => (
                          <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                            <Star className="h-3 w-3 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Local Offer</p>
          <p>The Local Offer describes what a children&apos;s home provides for the children in its care. Under the Children and Families Act 2014, local authorities are required to publish a Local Offer for children with SEND, and children&apos;s homes should articulate their own offer clearly. The Statement of Purpose (Reg 16) and Children&apos;s Guide (Reg 19) complement this document. The Local Offer should be shared with placing authorities during the referral process and reviewed annually. Ofsted inspectors use the Statement of Purpose and Local Offer to understand the home&apos;s intended purpose and assess whether practice matches the stated offer.</p>
        </div>
      </div>
    </PageShell>
  );
}
