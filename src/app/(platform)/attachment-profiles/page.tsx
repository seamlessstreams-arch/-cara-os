"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Shield,
  Lightbulb,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type AttachmentStyle = "secure" | "anxious_ambivalent" | "anxious_avoidant" | "disorganised" | "emerging_secure";
type ProfileStatus = "active" | "under_review" | "archived";

interface AttachmentBehaviour {
  context: string;
  behaviour: string;
  underlyingNeed: string;
  recommendedResponse: string;
}

interface KeyRelationship {
  person: string;
  role: string;
  quality: "strong" | "developing" | "strained" | "absent";
  notes: string;
}

interface AttachmentProfile {
  id: string;
  youngPersonId: string;
  status: ProfileStatus;
  primaryStyle: AttachmentStyle;
  secondaryPatterns: string[];
  assessedBy: string;
  assessmentDate: string;
  reviewDate: string;
  assessmentSource: string;
  earlyHistory: string;
  placementHistory: string;
  behaviours: AttachmentBehaviour[];
  keyRelationships: KeyRelationship[];
  therapeuticApproach: string[];
  staffGuidance: string[];
  protectiveFactors: string[];
  riskFactors: string[];
  childViews: string;
  professionalInput: string;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STYLE_LABELS: Record<AttachmentStyle, string> = {
  secure: "Secure", anxious_ambivalent: "Anxious-Ambivalent",
  anxious_avoidant: "Anxious-Avoidant", disorganised: "Disorganised",
  emerging_secure: "Emerging Secure",
};
const STYLE_COLOURS: Record<AttachmentStyle, string> = {
  secure: "bg-green-100 text-green-800",
  anxious_ambivalent: "bg-amber-100 text-amber-800",
  anxious_avoidant: "bg-blue-100 text-blue-800",
  disorganised: "bg-red-100 text-red-800",
  emerging_secure: "bg-emerald-100 text-emerald-800",
};

const STATUS_LABELS: Record<ProfileStatus, string> = { active: "Active", under_review: "Under Review", archived: "Archived" };
const STATUS_COLOURS: Record<ProfileStatus, string> = {
  active: "bg-green-100 text-green-800", under_review: "bg-amber-100 text-amber-800", archived: "bg-gray-100 text-gray-700",
};

const QUALITY_COLOURS: Record<string, string> = {
  strong: "bg-green-100 text-green-800", developing: "bg-blue-100 text-blue-800",
  strained: "bg-amber-100 text-amber-800", absent: "bg-gray-100 text-gray-700",
};

const SEED: AttachmentProfile[] = [
  {
    id: "ap1", youngPersonId: "yp_alex", status: "active",
    primaryStyle: "anxious_avoidant", secondaryPatterns: ["Self-reliance as defence", "Minimisation of needs", "Testing boundaries before trusting"],
    assessedBy: "staff_anna", assessmentDate: d(-45), reviewDate: d(45),
    assessmentSource: "Clinical psychologist assessment + keyworker observations over 6 months",
    earlyHistory: "Experienced inconsistent care in early years. Birth father absent from age 3. Mother struggled with substance use — periods of emotional unavailability alternating with warm care. Neglect identified age 6. Multiple moves between mother and maternal grandparents before care entry age 12.",
    placementHistory: "Three foster placements (age 12–15), two disruptions due to 'behavioural challenges' — likely attachment-driven rejection of care. Current placement at Oak House since September 2024.",
    behaviours: [
      { context: "When upset or distressed", behaviour: "Withdraws to bedroom, refuses to talk, says 'I'm fine' or 'I don't care'", underlyingNeed: "Needs to know adults will persist gently without forcing. Fear of vulnerability and rejection.", recommendedResponse: "Don't pursue but stay available. Offer a drink/snack. Leave the door open. Check in after 20 mins with low-key approach. Never say 'I know you're upset' — let Alex name their feelings." },
      { context: "When receiving praise", behaviour: "Dismisses it, changes subject, sometimes becomes dysregulated after praise", underlyingNeed: "Praise can feel unfamiliar and threatening. Alex may expect it to be followed by criticism or withdrawal.", recommendedResponse: "Keep praise specific, brief, and matter-of-fact. 'You handled that well' rather than emotional expressions. Avoid over-praising. Normalise competence." },
      { context: "Before family contact", behaviour: "Becomes irritable, picks arguments, may refuse to go", underlyingNeed: "Anxiety about contact triggers avoidant defences. Easier to control by refusing than to risk being let down.", recommendedResponse: "Acknowledge anxiety without labelling it. Offer routine and structure. Don't force attendance but do explore feelings gently. Always debrief after contact." },
      { context: "New staff or unfamiliar adults", behaviour: "Surface-level politeness, doesn't engage deeply, watches from a distance", underlyingNeed: "Assessing safety. Alex needs time to evaluate whether adults are reliable before investing.", recommendedResponse: "Be consistent and predictable. Don't try to force a bond. Let Alex observe and approach at their pace. Shared activities work better than direct conversation." },
      { context: "Transitions and endings", behaviour: "Pre-emptive rejection — pushes people away before they can leave", underlyingNeed: "Deep fear of abandonment based on repeated losses. Better to control the ending than be abandoned.", recommendedResponse: "Name transitions early and repeatedly. Be honest about timescales. Maintain relationships beyond transitions where possible. Create rituals for endings." },
    ],
    keyRelationships: [
      { person: "Anna (Key Worker)", role: "Key Worker", quality: "strong", notes: "Alex has slowly built trust with Anna over 8 months. Allows vulnerability in small moments. Anna's consistency has been crucial." },
      { person: "Edward (Staff)", role: "Support Staff", quality: "developing", notes: "Shared interest in sport creates a comfortable bridge. Edward doesn't push emotional connection — Alex respects this." },
      { person: "Michelle (Birth Mum)", role: "Birth Mother", quality: "developing", notes: "Complex feelings — love mixed with anger about early experiences. Contact has improved recently." },
      { person: "Craig (Birth Dad)", role: "Birth Father", quality: "strained", notes: "Repeated DNAs at contact have reinforced avoidant patterns. Alex protects self by dismissing importance." },
    ],
    therapeuticApproach: [
      "DDP (Dyadic Developmental Psychotherapy) principles — PACE: Playfulness, Acceptance, Curiosity, Empathy",
      "Relationship-based practice — consistency over intensity",
      "Therapeutic life story work — at Alex's pace",
      "Strengths-based — build on Alex's resourcefulness without pathologising self-reliance",
    ],
    staffGuidance: [
      "Never take avoidance personally — it's a learned survival strategy",
      "Be predictable and reliable above all else",
      "Use 'alongside' activities (cooking, driving, gaming) rather than face-to-face emotional conversations",
      "Repair ruptures quickly — a simple 'I'm sorry about earlier' models healthy relationships",
      "Don't interpret silence as rejection — Alex is processing",
      "Avoid ultimatums — they trigger the avoidant cycle",
      "Celebrate small moments of vulnerability without making them 'a big deal'",
    ],
    protectiveFactors: [
      "Developing trust with key worker",
      "Intelligence and self-awareness (emerging)",
      "Enjoys college and has educational ambitions",
      "Growing relationship with birth mum",
      "Positive peer relationships in the home",
    ],
    riskFactors: [
      "Pattern of placement disruption",
      "Avoidant coping — may mask genuine distress",
      "Father's repeated DNAs reinforcing worthlessness narrative",
      "Upcoming move to semi-independent — transition anxiety likely",
    ],
    childViews: "Alex hasn't used the word 'attachment' but has said: 'I just find it hard to let people in. Everyone leaves eventually.' When asked what helps, Alex said: 'When people don't give up on me even when I push them away. And when they don't make a massive fuss.'",
    professionalInput: "Clinical psychologist (Dr Patel, CAMHS, Nov 2024): Alex presents with anxious-avoidant attachment consistent with early relational trauma. Recommend DDP-informed approach. Stability of current placement is therapeutically essential. Avoid placement moves if at all possible. Transition to semi-independence needs very gradual approach with maintained connection to Oak House.",
    notes: "Profile shared with all staff at team meeting. Refreshed based on updated CAMHS assessment. Review before discharge transition planning.",
  },
  {
    id: "ap2", youngPersonId: "yp_jordan", status: "active",
    primaryStyle: "disorganised", secondaryPatterns: ["Freeze response in conflict", "Contradictory approach-avoidance with caregivers", "Hypervigilance to emotional cues"],
    assessedBy: "staff_chervelle", assessmentDate: d(-30), reviewDate: d(60),
    assessmentSource: "CAMHS assessment + therapeutic input + residential observations",
    earlyHistory: "Significant early trauma — domestic violence in the home from birth to age 5. Witnessed physical violence between parents. Mother protective but overwhelmed. Father unpredictable — source of both comfort and terror. This created the contradictory attachment pattern: the person who should provide safety was also the source of fear.",
    placementHistory: "Care entry age 5. Long-term foster placement (age 5–11) provided stability but foster carer became ill. Two further foster placements, then residential. Short stay at Greenfield Children's Home before Oak House.",
    behaviours: [
      { context: "When adults raise their voice", behaviour: "Freezes completely — goes very still, stops talking, may dissociate briefly", underlyingNeed: "Triggered by early experiences of violence. Freeze is a trauma response, not defiance.", recommendedResponse: "Lower your voice immediately. Get down to their level. Don't touch without asking. Say: 'You're safe, I'm not angry with you.' Allow time to 'come back.' Never interpret freezing as ignoring you." },
      { context: "Bedtime", behaviour: "Difficulty settling, needs to know where staff are, may get up multiple times", underlyingNeed: "Nighttime was dangerous in early life. Hypervigilance prevents relaxation. Needs to confirm safety.", recommendedResponse: "Consistent bedtime routine. Reassure of staff presence. Night light. Rocking chair. Allow Jordan to check staff location once without consequence. Never lock doors." },
      { context: "Close emotional moments", behaviour: "May suddenly push away, become aggressive, or say hurtful things during moments of closeness", underlyingNeed: "Closeness triggers the disorganised pattern — wanting comfort but fearing the person providing it. Not rejection of you.", recommendedResponse: "Stay calm. Don't withdraw. Say: 'I'm still here. It's ok to feel complicated feelings about people.' Give space but remain visibly available. This is the disorganised cycle — it will pass." },
      { context: "Transition between activities", behaviour: "Becomes anxious, asks repetitive questions about what's next, may refuse to start new activity", underlyingNeed: "Unpredictability in early life makes transitions feel dangerous. Needs to know what's coming.", recommendedResponse: "Visual schedule. 5-2-1 minute warnings. Transition objects. Narrate what's happening: 'In 5 minutes we'll finish art and go to the kitchen for dinner.'" },
    ],
    keyRelationships: [
      { person: "Chervelle (Key Worker)", role: "Key Worker", quality: "developing", notes: "Jordan is slowly beginning to seek Chervelle out when distressed — significant progress. Still approach-avoid at times." },
      { person: "Ryan (Deputy)", role: "Deputy Manager", quality: "developing", notes: "Ryan's calm, predictable presence is regulating for Jordan. Doesn't push emotional content." },
      { person: "Tyler (Brother)", role: "Sibling", quality: "strong", notes: "Strongest attachment relationship. Tyler provides emotional safety. Video contact is a protective factor." },
    ],
    therapeuticApproach: [
      "Trauma-informed care — Dan Hughes' DDP model",
      "PACE framework throughout all interactions",
      "Art therapy (current) — provides non-verbal expression",
      "Sensory regulation integrated with emotional regulation",
      "Narrative work when Jordan is ready — not yet",
    ],
    staffGuidance: [
      "NEVER raise your voice — this is not a preference, it's a safety need",
      "Freeze responses are trauma, not defiance — respond with gentle reassurance",
      "Expect the push-pull cycle — it's the attachment pattern, not about you",
      "Be boring and predictable — this is therapeutic, not boring",
      "Jordan reads micro-expressions — be aware of your facial expressions and body language",
      "Don't ask 'why?' questions — they require cognitive processing unavailable during distress",
      "Use 'wondering' language: 'I wonder if you might be feeling...'",
      "Physical boundaries: always ask before any touch, even passing items",
    ],
    protectiveFactors: [
      "Strong sibling bond with Tyler",
      "Emerging trust with key worker",
      "Artistic talent — provides emotional outlet",
      "Developing self-awareness (can sometimes name feelings)",
      "Engaged in therapy",
    ],
    riskFactors: [
      "Disorganised attachment linked to higher trauma vulnerability",
      "Freeze/dissociative responses may mask distress",
      "Previous placement disruption",
      "Hypervigilance is exhausting — impacts daily functioning",
      "Sensory sensitivities compound emotional dysregulation",
    ],
    childViews: "Jordan drew a picture of a hedgehog and said: 'That's me. I want people to come close but my prickles come out.' In a therapy session, Jordan said: 'Sometimes I want a hug but when someone hugs me it feels scary and nice at the same time.'",
    professionalInput: "CAMHS therapist (Dr Shah): Disorganised attachment consistent with early exposure to domestic violence. The care system must provide what was missing: predictable, non-threatening adult relationships. Art therapy providing an important outlet. Recommend minimum 12 months placement stability. Avoid multiple carer changes.",
    notes: "This profile is essential reading for all staff before working with Jordan. Annual review scheduled. Adapting approach as Jordan develops greater emotional literacy through therapy.",
  },
  {
    id: "ap3", youngPersonId: "yp_casey", status: "active",
    primaryStyle: "anxious_ambivalent", secondaryPatterns: ["Heightened need for reassurance", "Difficulty separating from preferred adults", "Exaggerated emotional displays to elicit care"],
    assessedBy: "staff_anna", assessmentDate: d(-20), reviewDate: d(70),
    assessmentSource: "School observations + keyworker assessment + SW reports",
    earlyHistory: "Mum experienced postnatal depression — intermittent availability in Casey's first 2 years. When present, mum was warm and loving. When depressed, emotionally absent. Casey learned that needs were sometimes met and sometimes ignored — leading to amplified signalling to maximise chances of response.",
    placementHistory: "Lived with birth mum until age 9 with periods of family support. Brief period with maternal gran. Care entry age 9 when mum's mental health deteriorated. One foster placement (9 months), then Oak House. Return to mum being planned.",
    behaviours: [
      { context: "Key worker leaving shift", behaviour: "Becomes clingy, asks multiple times when they'll be back, may cry or become angry", underlyingNeed: "Separation triggers anxiety about whether the adult will return. Needs concrete reassurance.", recommendedResponse: "Give specific return information: 'I'll be back on Thursday morning at 8am.' Use visual calendar. Leave a small personal item as a 'holding object.' Consistent handover routine." },
      { context: "Perceiving rejection", behaviour: "Over-interprets neutral events as rejection. A staff member being busy = 'they don't like me'", underlyingNeed: "Hypervigilance to signs of emotional withdrawal based on early experience. Needs explicit reassurance.", recommendedResponse: "Name it: 'I need to do this task now, but I'm not going anywhere. Let's do something together at 4 o'clock.' Be explicit — don't assume Casey knows you care." },
      { context: "After family contact", behaviour: "Heightened emotional state — clingy, tearful, or overexcited. May comfort-eat or regress to younger behaviour", underlyingNeed: "Contact reactivates the approach-separation cycle. Mum's inconsistent attention reinforces the pattern.", recommendedResponse: "Post-contact routine: 30 minutes with key worker, favourite activity, warm drink. Validate feelings without problem-solving. Allow regression without shame." },
      { context: "Bedtime", behaviour: "Multiple requests — drink, toilet, story, one more hug. Calls out after lights off.", underlyingNeed: "Separation anxiety peaks at night. Each request is a check that the adult is still there.", recommendedResponse: "Rich bedtime routine with predictable sequence. Final reassurance: 'Staff are here all night. You're safe.' One check-back visit after 10 minutes (planned, not reactive)." },
    ],
    keyRelationships: [
      { person: "Anna (Key Worker)", role: "Key Worker", quality: "strong", notes: "Very attached to Anna. Managing the intensity of attachment is important — avoid dependency while honouring the bond." },
      { person: "Sarah (Birth Mum)", role: "Birth Mother", quality: "developing", notes: "Casey adores mum. Mum's inconsistent attention during contact is the core dynamic. Improving with support." },
      { person: "Margaret (Gran)", role: "Maternal Grandmother", quality: "strong", notes: "Consistent, warm relationship. Margaret is the most reliable adult figure in Casey's life. Important protective factor." },
    ],
    therapeuticApproach: [
      "Attachment-focused caregiving — consistency and predictability",
      "Theraplay principles — structured, engaging, nurturing activities",
      "Gradual building of tolerance for separation",
      "Supporting mum's capacity through contact to provide consistent attention",
    ],
    staffGuidance: [
      "Be warm but boundaried — Casey needs to learn that care is reliable, not unlimited",
      "Don't respond to every escalation — sometimes calm naming is enough",
      "Build independence gradually — small wins, lots of encouragement",
      "Avoid accidentally reinforcing the cycle by only responding to heightened behaviour",
      "Model healthy separation — 'I'm going now and I'll be back'",
      "Be explicit about caring — Casey needs to hear it, not just feel it",
      "Distribute attachment across the team — avoid sole dependency on one staff member",
    ],
    protectiveFactors: [
      "Strong bond with grandmother — consistent and reliable",
      "Warm, loving temperament",
      "Good peer relationships",
      "Engaged in school with supportive SENCO",
      "Return to mum being planned — mum engaged in support",
    ],
    riskFactors: [
      "Anxious attachment may intensify during transition home",
      "Mum's inconsistent attention during contact",
      "Over-reliance on single key worker",
      "Comfort eating as coping mechanism",
      "Vulnerability to exploitative relationships in adolescence (seeking attachment)",
    ],
    childViews: "Casey says: 'I just want to know people won't forget about me.' When asked what helps most, Casey said: 'When Anna says she'll be back and she actually comes back. And when gran phones every Wednesday — she never, ever misses it.'",
    professionalInput: "School SENCO reports similar anxious-ambivalent pattern in class — seeks constant reassurance from teacher. SW James Okafor recommends that return to mum includes maintained contact with Oak House staff for transitional period. Therapeutic support recommended during transition.",
    notes: "Key focus: building secure base while preparing for reunification. Gran's consistent presence is the anchor. Ensure transition plan accounts for attachment needs.",
  },
];

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string; primaryStyle: string; secondaryPatterns: string;
  status: string; assessedBy: string; assessmentDate: string; reviewDate: string;
  protectiveFactors: string; riskFactors: string; therapeuticApproach: string;
  keyGuidance: string; childViews: string; professionalInput: string;
  notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",      accessor: (r: FlatRow) => r.youngPerson },
  { header: "Primary Style",     accessor: (r: FlatRow) => r.primaryStyle },
  { header: "Secondary Patterns",accessor: (r: FlatRow) => r.secondaryPatterns },
  { header: "Status",            accessor: (r: FlatRow) => r.status },
  { header: "Assessed By",       accessor: (r: FlatRow) => r.assessedBy },
  { header: "Assessment Date",   accessor: (r: FlatRow) => r.assessmentDate },
  { header: "Review Date",       accessor: (r: FlatRow) => r.reviewDate },
  { header: "Protective Factors",accessor: (r: FlatRow) => r.protectiveFactors },
  { header: "Risk Factors",      accessor: (r: FlatRow) => r.riskFactors },
  { header: "Therapeutic Approach",accessor: (r: FlatRow) => r.therapeuticApproach },
  { header: "Staff Guidance",    accessor: (r: FlatRow) => r.keyGuidance },
  { header: "Child Views",       accessor: (r: FlatRow) => r.childViews },
  { header: "Professional Input",accessor: (r: FlatRow) => r.professionalInput },
  { header: "Notes",             accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function AttachmentProfilesPage() {
  const [data] = useState<AttachmentProfile[]>(SEED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const active = data.filter((p) => p.status === "active").length;
    const reviewDue = data.filter((p) => p.reviewDate <= d(14) && p.status !== "archived").length;
    const disorganised = data.filter((p) => p.primaryStyle === "disorganised").length;
    const totalBehaviours = data.reduce((s, p) => s + p.behaviours.length, 0);
    return { active, reviewDue, disorganised, totalBehaviours };
  }, [data]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        getYPName(p.youngPersonId).toLowerCase().includes(q) ||
        STYLE_LABELS[p.primaryStyle].toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") list = list.filter((p) => p.status === filterStatus);
    const out = [...list];
    switch (sortBy) {
      case "name": out.sort((a, b) => getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId))); break;
      case "style": out.sort((a, b) => a.primaryStyle.localeCompare(b.primaryStyle)); break;
      case "review": out.sort((a, b) => a.reviewDate.localeCompare(b.reviewDate)); break;
    }
    return out;
  }, [data, search, filterStatus, sortBy]);

  /* ── export ───────────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    data.map((p) => ({
      youngPerson: getYPName(p.youngPersonId),
      primaryStyle: STYLE_LABELS[p.primaryStyle],
      secondaryPatterns: p.secondaryPatterns.join("; "),
      status: STATUS_LABELS[p.status],
      assessedBy: getStaffName(p.assessedBy),
      assessmentDate: p.assessmentDate,
      reviewDate: p.reviewDate,
      protectiveFactors: p.protectiveFactors.join("; "),
      riskFactors: p.riskFactors.join("; "),
      therapeuticApproach: p.therapeuticApproach.join("; "),
      keyGuidance: p.staffGuidance.join("; "),
      childViews: p.childViews,
      professionalInput: p.professionalInput,
      notes: p.notes,
    })), [data]);

  return (
    <PageShell
      title="Attachment Profiles"
      subtitle="Individualised attachment assessments, care strategies and relational guidance for staff"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Attachment Profiles" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="attachment-profiles" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Profile
          </button>
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Profiles", value: stats.active, icon: Heart, colour: "text-blue-600" },
          { label: "Reviews Due (14 d)", value: stats.reviewDue, icon: AlertTriangle, colour: stats.reviewDue > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Disorganised", value: stats.disorganised, icon: Shield, colour: stats.disorganised > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Behaviour Guides", value: stats.totalBehaviours, icon: Lightbulb, colour: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── per-child summary ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {data.map((p) => (
          <div key={p.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{getYPName(p.youngPersonId)}</h3>
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STYLE_COLOURS[p.primaryStyle])}>{STYLE_LABELS[p.primaryStyle]}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {p.secondaryPatterns.map((pat, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{pat}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>Behaviours: <span className="font-medium text-gray-700">{p.behaviours.length}</span></div>
              <div>Relationships: <span className="font-medium text-gray-700">{p.keyRelationships.length}</span></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Review: {p.reviewDate <= d(0) ? <span className="text-red-600 font-medium">Overdue</span> : p.reviewDate}</p>
          </div>
        ))}
      </div>

      {/* ── filters ────────────────────────────────────────────────── */}
      <div id="profiles-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search children or attachment styles…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="style">Style</SelectItem>
              <SelectItem value="review">Review Due</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((p) => {
          const open = expanded[p.id] ?? false;
          return (
            <div key={p.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(p.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Heart className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{getYPName(p.youngPersonId)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STYLE_COLOURS[p.primaryStyle])}>{STYLE_LABELS[p.primaryStyle]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[p.status])}>{STATUS_LABELS[p.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{p.behaviours.length} behaviour guides · {p.keyRelationships.length} key relationships · {p.staffGuidance.length} staff guidance points</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* assessment info */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Assessed by:</span> <span className="font-medium">{getStaffName(p.assessedBy)}</span></div>
                    <div><span className="text-gray-500">Date:</span> <span className="font-medium">{p.assessmentDate}</span></div>
                    <div><span className="text-gray-500">Review:</span> <span className={cn("font-medium", p.reviewDate <= d(0) ? "text-red-600" : "")}>{p.reviewDate}</span></div>
                    <div><span className="text-gray-500">Source:</span> <span className="font-medium text-xs">{p.assessmentSource}</span></div>
                  </div>

                  {/* early history */}
                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Early History</h4>
                    <p className="text-sm">{p.earlyHistory}</p>
                  </div>

                  {/* placement history */}
                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Placement History</h4>
                    <p className="text-sm">{p.placementHistory}</p>
                  </div>

                  {/* behaviour guides */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Behaviour Guides — &quot;When you see this, try this&quot;</h4>
                    <div className="space-y-3">
                      {p.behaviours.map((b, i) => (
                        <div key={i} className="rounded-md border p-3">
                          <p className="text-sm font-semibold text-gray-800 mb-2">Context: {b.context}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="rounded bg-amber-50 p-2">
                              <p className="text-xs font-medium text-amber-700 mb-0.5">What you may see</p>
                              <p className="text-xs text-amber-800">{b.behaviour}</p>
                            </div>
                            <div className="rounded bg-blue-50 p-2">
                              <p className="text-xs font-medium text-blue-700 mb-0.5">Underlying need</p>
                              <p className="text-xs text-blue-800">{b.underlyingNeed}</p>
                            </div>
                            <div className="rounded bg-green-50 p-2">
                              <p className="text-xs font-medium text-green-700 mb-0.5">Recommended response</p>
                              <p className="text-xs text-green-800">{b.recommendedResponse}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* key relationships */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Key Relationships</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {p.keyRelationships.map((kr, i) => (
                        <div key={i} className="rounded-md border p-3 flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{kr.person}</span>
                              <span className="text-xs text-gray-500">({kr.role})</span>
                              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", QUALITY_COLOURS[kr.quality])}>{kr.quality}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{kr.notes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* therapeutic approach */}
                  <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                    <h4 className="text-xs font-semibold text-purple-700 mb-1">Therapeutic Approach</h4>
                    <ul className="list-disc list-inside text-sm text-purple-800 space-y-0.5">
                      {p.therapeuticApproach.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>

                  {/* staff guidance */}
                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">Staff Guidance — Essential Reading</h4>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                      {p.staffGuidance.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>

                  {/* protective / risk factors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-green-50 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Protective Factors</h4>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                        {p.protectiveFactors.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-red-50 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1">Risk Factors</h4>
                      <ul className="list-disc list-inside text-sm text-red-800 space-y-0.5">
                        {p.riskFactors.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* child's view */}
                  {p.childViews && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Views</h4>
                      <p className="text-sm text-pink-800">{p.childViews}</p>
                    </div>
                  )}

                  {/* professional input */}
                  {p.professionalInput && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Professional Input</h4>
                      <p className="text-sm">{p.professionalInput}</p>
                    </div>
                  )}

                  {/* notes */}
                  {p.notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4>
                      <p className="text-sm text-gray-700">{p.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Attachment &amp; Trauma-Informed Care:</strong> Understanding each child&apos;s attachment style is essential for providing relationship-based care. Attachment profiles should inform all daily interactions, care planning, and staff responses to behaviour. All staff must read and understand each child&apos;s profile. Profiles should be reviewed regularly and updated as the child develops. Behaviour is communication — these profiles help staff understand what children are communicating.
      </div>

      {/* ── dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Attachment Profile</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{["yp_alex","yp_jordan","yp_casey"].map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Primary Attachment Style</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{Object.entries(STYLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Assessment Source</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Clinical psychologist assessment" />
            </div>
            <div>
              <label className="text-sm font-medium">Early History Summary</label>
              <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Key early relational experiences…" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Create Profile</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
