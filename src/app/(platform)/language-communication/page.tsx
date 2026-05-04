"use client";

import { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
  BookOpen, Users, Globe, Ear, Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type CommLevel = "age_appropriate" | "below_age" | "significant_need" | "non_verbal";
type SupportLevel = "no_additional" | "some_support" | "significant_support" | "specialist";

interface CommunicationStrategy {
  strategy: string;
  inUse: boolean;
  effectiveness: "effective" | "partially_effective" | "not_effective" | "not_yet_evaluated";
  notes: string;
}

interface CommunicationProfile {
  id: string;
  youngPersonId: string;
  lastReviewDate: string;
  reviewedBy: string;
  preferredLanguage: string;
  additionalLanguages: string[];
  interpreterRequired: boolean;
  interpreterDetails: string | null;
  receptiveLevel: CommLevel;
  expressiveLevel: CommLevel;
  supportLevel: SupportLevel;
  sendStatus: "none" | "sen_support" | "ehcp";
  saltInvolved: boolean;
  saltDetails: string | null;
  strengths: string[];
  challenges: string[];
  strategies: CommunicationStrategy[];
  aacTools: string[];
  staffGuidance: string;
  childViews: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const COMM_LEVEL_META: Record<CommLevel, { label: string; color: string }> = {
  age_appropriate: { label: "Age Appropriate", color: "bg-green-100 text-green-800" },
  below_age: { label: "Below Age", color: "bg-amber-100 text-amber-800" },
  significant_need: { label: "Significant Need", color: "bg-red-100 text-red-800" },
  non_verbal: { label: "Non-Verbal / Minimal Verbal", color: "bg-purple-100 text-purple-800" },
};

const SUPPORT_META: Record<SupportLevel, { label: string; color: string }> = {
  no_additional: { label: "No Additional Support", color: "bg-green-100 text-green-800" },
  some_support: { label: "Some Support", color: "bg-blue-100 text-blue-800" },
  significant_support: { label: "Significant Support", color: "bg-amber-100 text-amber-800" },
  specialist: { label: "Specialist Support", color: "bg-red-100 text-red-800" },
};

const EFFECT_META: Record<string, { label: string; color: string }> = {
  effective: { label: "Effective", color: "text-green-700" },
  partially_effective: { label: "Partially Effective", color: "text-amber-700" },
  not_effective: { label: "Not Effective", color: "text-red-700" },
  not_yet_evaluated: { label: "Not Yet Evaluated", color: "text-slate-500" },
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: CommunicationProfile[] = [
  {
    id: "cp_001", youngPersonId: "yp_alex", lastReviewDate: d(-30), reviewedBy: "staff_ryan",
    preferredLanguage: "English", additionalLanguages: [], interpreterRequired: false, interpreterDetails: null,
    receptiveLevel: "age_appropriate", expressiveLevel: "age_appropriate",
    supportLevel: "no_additional", sendStatus: "none", saltInvolved: false, saltDetails: null,
    strengths: [
      "Good verbal communication — articulate and confident in conversation",
      "Can express emotions when he feels safe to do so",
      "Engages well in group discussions (house meetings, school)",
      "Reads at age-appropriate level — enjoys adventure books",
      "Uses humour effectively in social situations",
    ],
    challenges: [
      "Can become monosyllabic when anxious or upset (particularly around family contact)",
      "Sometimes uses bravado to mask feelings — 'I'm fine' when clearly not",
      "Written expression slightly below verbal — finds extended writing tasks challenging",
      "Can misread social cues in conflict situations — responds defensively",
    ],
    strategies: [
      { strategy: "Allow processing time — don't press for answers immediately", inUse: true, effectiveness: "effective", notes: "Alex responds better when given space. Pushing for immediate answers causes shut-down." },
      { strategy: "Use activity-based conversations (walking, cooking, driving) rather than face-to-face", inUse: true, effectiveness: "effective", notes: "Alex opens up much more during football or car journeys. Less pressure than sitting at a table." },
      { strategy: "Validate emotions before problem-solving", inUse: true, effectiveness: "effective", notes: "Saying 'that sounds tough' before offering solutions helps Alex feel heard." },
      { strategy: "Use scaling questions (1-10) to assess emotional state", inUse: true, effectiveness: "partially_effective", notes: "Works sometimes but Alex can be dismissive — 'I dunno, 7?' More effective when combined with activity." },
    ],
    aacTools: [],
    staffGuidance: "Alex communicates well at age level. The main consideration is his tendency to mask emotions with bravado. Staff should create low-pressure opportunities for communication — activity-based conversations work best. Don't push Alex to talk about feelings directly — allow it to happen naturally. When Alex says 'I'm fine,' gently acknowledge that it's OK not to be fine without forcing the conversation. Alex responds very well to humour.",
    childViews: "Alex said: 'I can talk fine. I just don't always want to.' When asked what helps him communicate, he said: 'When people don't make a big deal out of it. Like when Ryan and me are doing stuff and we just chat.'",
  },
  {
    id: "cp_002", youngPersonId: "yp_jordan", lastReviewDate: d(-14), reviewedBy: "staff_anna",
    preferredLanguage: "English", additionalLanguages: [], interpreterRequired: false, interpreterDetails: null,
    receptiveLevel: "below_age", expressiveLevel: "significant_need",
    supportLevel: "specialist", sendStatus: "ehcp", saltInvolved: true,
    saltDetails: "Weekly SALT sessions at Meadowbank School (Ms. Fiona Carter). Focus areas: functional communication, social communication, narrative skills. Communication passport maintained and shared with all professionals. Last SALT report: 3 months ago — progress noted in functional requesting and use of visual supports.",
    strengths: [
      "Strong visual processing — understands pictures, symbols, and visual schedules very well",
      "Can use PECS (Picture Exchange Communication System) effectively for requesting",
      "Communicates emotions through art — drawing is a major communication channel",
      "Responds well to Makaton signs for key words",
      "Can follow 2-step visual instructions independently",
      "Good at communicating preferences through pointing and selecting",
    ],
    challenges: [
      "Verbal expression is limited to single words and short phrases",
      "Receptive language is better than expressive but still below age expectations",
      "Struggles with abstract concepts — needs concrete, visual explanations",
      "Cannot reliably communicate pain or illness verbally — staff must observe for non-verbal signs",
      "Becomes overwhelmed and shuts down in noisy or busy environments",
      "Difficulty with open-ended questions — needs closed or either/or options",
      "Echolalia — repeats phrases without always understanding context",
      "Processing time needed — can take 10-15 seconds to respond",
    ],
    strategies: [
      { strategy: "Use visual schedule for all daily routines and transitions", inUse: true, effectiveness: "effective", notes: "Visual schedule on bedroom door. Jordan checks it independently. Reduces anxiety significantly." },
      { strategy: "Offer choices using visual cards (2-3 options maximum)", inUse: true, effectiveness: "effective", notes: "Choice boards for meals, activities, clothing. Jordan selects confidently." },
      { strategy: "Allow 10-15 seconds processing time after speaking", inUse: true, effectiveness: "effective", notes: "Essential. Staff must resist repeating or rephrasing too quickly." },
      { strategy: "Use Makaton signs alongside speech for key words", inUse: true, effectiveness: "partially_effective", notes: "Some staff more confident than others. Additional training needed for Lackson and Edward." },
      { strategy: "Communication passport available for all professionals", inUse: true, effectiveness: "effective", notes: "A4 laminated passport. Given to all new staff, agency workers, and professionals visiting." },
      { strategy: "Use 'now and next' board for transitions", inUse: true, effectiveness: "effective", notes: "Reduces transition anxiety. Jordan can predict what comes next." },
      { strategy: "Social Stories for new or unusual situations", inUse: true, effectiveness: "partially_effective", notes: "Work well when prepared in advance. Less effective for unexpected changes." },
      { strategy: "Use visual pain scale and body map for health concerns", inUse: true, effectiveness: "effective", notes: "Jordan can point to where it hurts and select a pain level face." },
    ],
    aacTools: [
      "PECS communication book (kept in Jordan's bag)",
      "Visual schedule (bedroom door + portable version)",
      "Choice boards (meals, activities, clothes)",
      "iPad with Proloquo2Go communication app (backup AAC)",
      "Now and Next board",
      "Visual pain scale",
      "Emotion cards (happy, sad, angry, worried, tired, OK)",
      "Social Stories folder",
      "Communication passport (laminated A4)",
    ],
    staffGuidance: "Jordan has significant communication needs linked to ASD. ALL staff must be familiar with Jordan's communication passport before working directly with Jordan. Key rules: (1) Always use visual supports alongside speech. (2) Give 10-15 seconds processing time — do not repeat or rephrase immediately. (3) Use closed questions or offer 2-3 choices — never open-ended questions. (4) Monitor for non-verbal signs of distress (hand-flapping, rocking, covering ears = sensory overload). (5) Jordan's art is a communication channel — take drawings seriously and explore their meaning. (6) If Jordan becomes non-responsive, reduce demands and offer a sensory break. (7) Knock and wait 10 seconds before entering Jordan's room. (8) New staff and agency workers must read the communication passport and have a handover from a staff member who knows Jordan well.",
    childViews: "Jordan communicated views through visual scale and with advocate support. Jordan pointed to 'happy face' for the visual schedule and choice boards. Jordan drew a picture of the art room and pointed to 'favourite.' When asked about communication at the home, Jordan selected the 'OK' emotion card. Jordan's advocate noted that Jordan appears most comfortable communicating with Anna and with the art teacher at school.",
  },
  {
    id: "cp_003", youngPersonId: "yp_casey", lastReviewDate: d(-21), reviewedBy: "staff_chervelle",
    preferredLanguage: "English", additionalLanguages: [], interpreterRequired: false, interpreterDetails: null,
    receptiveLevel: "age_appropriate", expressiveLevel: "age_appropriate",
    supportLevel: "some_support", sendStatus: "sen_support", saltInvolved: false, saltDetails: null,
    strengths: [
      "Articulate and intelligent — can express herself clearly when she chooses to",
      "Good vocabulary and comprehension",
      "Can advocate for herself effectively",
      "Engages well in creative writing and storytelling",
      "Good at reading social situations (though sometimes uses this manipulatively)",
      "Can communicate with adults she trusts — strong relationship with Chervelle",
    ],
    challenges: [
      "Uses communication defensively — sarcasm, deflection, 'I don't care'",
      "Struggles to express vulnerability — masks distress with anger or bravado",
      "Can be manipulative in communication — tells different adults different things",
      "Shuts down completely when overwhelmed — goes to room and refuses to engage",
      "Difficulty trusting adults — affects willingness to communicate openly",
      "May minimise exploitation experiences — language used about Marcus suggests grooming impact ('he's my friend,' 'he cares about me')",
      "Self-harm as communication — when verbal expression fails, Casey may self-harm to express distress",
    ],
    strategies: [
      { strategy: "Build communication through trusted relationship with Chervelle", inUse: true, effectiveness: "effective", notes: "Casey opens up most with Chervelle. This relationship is the primary communication channel for sensitive topics." },
      { strategy: "Offer written/creative alternatives to verbal communication", inUse: true, effectiveness: "partially_effective", notes: "Casey sometimes writes in a journal. Has used art to express feelings in direct work sessions." },
      { strategy: "Use distress tolerance toolkit before attempting verbal de-escalation", inUse: true, effectiveness: "effective", notes: "Grounding techniques and sensory items help Casey regulate before she can communicate what's wrong." },
      { strategy: "Don't challenge manipulative communication in the moment — address patterns in key work", inUse: true, effectiveness: "partially_effective", notes: "Challenging in the moment causes escalation. Patterns are explored in planned sessions with Chervelle." },
      { strategy: "Listen for the feeling behind the words — especially 'I don't care' and 'leave me alone'", inUse: true, effectiveness: "effective", notes: "'I don't care' usually means 'I care too much and it hurts.' 'Leave me alone' sometimes means 'please stay close but don't pressure me.'" },
      { strategy: "Named person for difficult conversations — always Chervelle or Darren", inUse: true, effectiveness: "effective", notes: "Casey responds best when sensitive topics are raised by someone she trusts." },
    ],
    aacTools: [],
    staffGuidance: "Casey communicates at age level but her SEMH needs significantly affect how she communicates. Staff must understand that Casey's defensive communication (sarcasm, anger, 'I don't care') is a trauma response, not defiance. Key rules: (1) Never take Casey's words at face value — listen for the emotion underneath. (2) When Casey shuts down, back off but stay nearby. Say 'I'm here when you're ready.' (3) Sensitive topics (exploitation, LADO, self-harm) should only be raised by Chervelle or Darren. (4) If Casey says concerning things about Marcus ('he loves me'), document accurately and share with Chervelle and SW — do not challenge directly. (5) If Casey is self-harming, follow the safety plan. Self-harm IS communication — respond to the distress, not just the behaviour. (6) Casey responds to genuineness — be authentic, don't use scripts or formal language.",
    childViews: "Casey said: 'I can talk fine. I just don't want to talk to people I don't trust.' When asked who she trusts to talk to, Casey named Chervelle and 'my nan.' Casey said she finds it easier to write things down sometimes. When asked what doesn't help, Casey said: 'When people ask loads of questions. Or when they say they understand when they don't.'",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function LanguageCommunicationPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const specialistCount = data.filter((p) => p.supportLevel === "specialist" || p.supportLevel === "significant_support").length;
  const saltCount = data.filter((p) => p.saltInvolved).length;
  const ehcpCount = data.filter((p) => p.sendStatus === "ehcp").length;

  return (
    <PageShell
      title="Language & Communication"
      subtitle="Communication Profiles · SEND · AAC · Staff Guidance"
      actions={<PrintButton title="Communication Profiles" />}
    >
      <div id="print-area">
        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{data.length}</p>
              <p className="text-xs text-muted-foreground">Communication Profiles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-amber-600">{specialistCount}</p>
              <p className="text-xs text-muted-foreground">Significant / Specialist Need</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-blue-600">{saltCount}</p>
              <p className="text-xs text-muted-foreground">SALT Involved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-purple-600">{ehcpCount}</p>
              <p className="text-xs text-muted-foreground">EHCP in Place</p>
            </CardContent>
          </Card>
        </div>

        {/* alert for specialist needs */}
        {data.some((p) => p.supportLevel === "specialist") && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <Ear className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-purple-800">Specialist Communication Needs</p>
              <p className="text-purple-700">
                {data.filter((p) => p.supportLevel === "specialist").map((p) => getYPName(p.youngPersonId)).join(", ")} — has specialist communication needs. All staff must read the communication passport before working directly with this child.
                {saltCount > 0 && " SALT is actively involved — strategies must align with SALT recommendations."}
              </p>
            </div>
          </div>
        )}

        {/* profile cards */}
        <div className="space-y-3">
          {data.map((profile) => {
            const isOpen = expandedId === profile.id;
            return (
              <Card key={profile.id} className={cn(
                "border-l-4",
                profile.supportLevel === "no_additional" ? "border-l-green-400" :
                profile.supportLevel === "some_support" ? "border-l-blue-400" :
                profile.supportLevel === "significant_support" ? "border-l-amber-400" :
                "border-l-purple-500"
              )}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : profile.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-blue-600" />
                        {getYPName(profile.youngPersonId)}
                        <Badge variant="outline" className={SUPPORT_META[profile.supportLevel].color}>{SUPPORT_META[profile.supportLevel].label}</Badge>
                        {profile.sendStatus !== "none" && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800">{profile.sendStatus === "ehcp" ? "EHCP" : "SEN Support"}</Badge>
                        )}
                        {profile.saltInvolved && <Badge variant="outline" className="bg-blue-100 text-blue-800">SALT</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Receptive: {COMM_LEVEL_META[profile.receptiveLevel].label} · Expressive: {COMM_LEVEL_META[profile.expressiveLevel].label} · Last reviewed: {profile.lastReviewDate}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* language info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Preferred Language</p>
                        <p className="font-medium">{profile.preferredLanguage}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Receptive Level</p>
                        <Badge variant="outline" className={cn("text-[10px]", COMM_LEVEL_META[profile.receptiveLevel].color)}>{COMM_LEVEL_META[profile.receptiveLevel].label}</Badge>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Expressive Level</p>
                        <Badge variant="outline" className={cn("text-[10px]", COMM_LEVEL_META[profile.expressiveLevel].color)}>{COMM_LEVEL_META[profile.expressiveLevel].label}</Badge>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Reviewed By</p>
                        <p className="font-medium">{getStaffName(profile.reviewedBy)}</p>
                      </div>
                    </div>

                    {/* SALT */}
                    {profile.saltInvolved && profile.saltDetails && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="font-medium text-xs text-blue-800 mb-1 flex items-center gap-1"><Volume2 className="h-3.5 w-3.5" /> Speech & Language Therapy</p>
                        <p className="text-xs text-blue-700">{profile.saltDetails}</p>
                      </div>
                    )}

                    {/* strengths & challenges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="font-medium text-xs text-green-800 mb-1">Strengths</p>
                        <ul className="space-y-0.5">
                          {profile.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                              <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded p-2">
                        <p className="font-medium text-xs text-amber-800 mb-1">Challenges</p>
                        <ul className="space-y-0.5">
                          {profile.challenges.map((c, i) => (
                            <li key={i} className="text-xs text-amber-700 flex items-start gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* strategies */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><BookOpen className="h-4 w-4 text-blue-600" /> Communication Strategies</p>
                      <div className="space-y-1">
                        {profile.strategies.map((s, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2">
                            <div className="flex items-start justify-between mb-0.5">
                              <p className="text-xs font-medium flex-1">{s.strategy}</p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {s.inUse && <Badge variant="outline" className="bg-green-100 text-green-800 text-[10px]">In Use</Badge>}
                                <span className={cn("text-[10px] font-medium", EFFECT_META[s.effectiveness].color)}>
                                  {EFFECT_META[s.effectiveness].label}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{s.notes}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AAC tools */}
                    {profile.aacTools.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1"><Ear className="h-4 w-4 text-purple-600" /> AAC & Communication Tools</p>
                        <div className="flex flex-wrap gap-1">
                          {profile.aacTools.map((tool, i) => (
                            <Badge key={i} variant="outline" className="bg-purple-50 text-purple-800 text-xs">{tool}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* staff guidance */}
                    <div className="bg-amber-50 border border-amber-200 rounded p-2">
                      <p className="font-medium text-xs text-amber-800 mb-1 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Staff Guidance — Essential Reading</p>
                      <p className="text-xs text-amber-700">{profile.staffGuidance}</p>
                    </div>

                    {/* child views */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Child&apos;s Views</p>
                      <p className="text-xs text-blue-700">{profile.childViews}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Communication & SEND</p>
          <p>The Children&apos;s Homes Regulations 2015 and Quality Standards require that children&apos;s communication needs are understood and met. This includes ensuring that children can express their views, understand what is happening to them, and participate in decisions about their care. For children with SEND, reasonable adjustments must be made in line with the Equality Act 2010 and the Children and Families Act 2014. Communication profiles should be reviewed at least annually or when needs change. SALT recommendations must be integrated into daily practice. All staff should be trained in the communication strategies relevant to the children in their care. Ofsted inspectors will assess whether children&apos;s communication needs are being met and whether staff are equipped to support them.</p>
        </div>
      </div>
    </PageShell>
  );
}
