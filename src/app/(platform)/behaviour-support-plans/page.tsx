"use client";

// ==============================================================================
// CORNERSTONE -- BEHAVIOUR SUPPORT PLANS
// Formal, structured plans for supporting children with challenging behaviour.
// Covers triggers, de-escalation (traffic-light model), positive strategies,
// safety plans, restrictive interventions, and multi-agency professional input.
// Aligned with SEND Code of Practice, Reg 19, trauma-informed practice.
// ==============================================================================

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown,
  ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Clock, Heart, Shield, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCreateBehaviourSupportPlan } from "@/hooks/use-behaviour-support";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getStaffName, getYPName } from "@/lib/seed-data";

// -- Types --------------------------------------------------------------------

interface PrimaryBehaviour {
  behaviour: string;
  frequency: "daily" | "weekly" | "occasional" | "rare";
  severity: "low" | "medium" | "high";
  trend: "improving" | "stable" | "worsening";
}

interface KnownTrigger {
  trigger: string;
  category: "environmental" | "emotional" | "social" | "sensory" | "routine_change" | "demand" | "transition";
  likelihood: "high" | "medium" | "low";
}

interface DeEscalationStage {
  stage: "green" | "amber" | "red";
  strategies: string[];
  staffApproach: string;
}

interface PositiveStrategy {
  strategy: string;
  frequency: string;
  effectiveness: "highly_effective" | "effective" | "partially_effective" | "not_effective";
}

interface Reward {
  reward: string;
  earnedBy: string;
  frequency: string;
}

interface Boundary {
  boundary: string;
  consequence: string;
  rationale: string;
}

interface SafetyPlanItem {
  scenario: string;
  response: string;
  staffRequired: number;
}

interface ProfessionalInput {
  name: string;
  role: string;
  recommendation: string;
  date: string;
}

interface RestrictiveIntervention {
  intervention: string;
  lastResort: boolean;
  authorisedBy: string;
  conditions: string;
}

interface ReviewHistoryEntry {
  date: string;
  reviewedBy: string;
  changes: string;
  outcome: string;
}

interface BehaviourSupportPlan {
  id: string;
  youngPersonId: string;
  createdDate: string;
  createdBy: string;
  reviewDate: string;
  lastReviewed: string | null;
  status: "active" | "under_review" | "draft" | "archived" | "suspended";
  diagnosis: string[];
  primaryBehaviours: PrimaryBehaviour[];
  knownTriggers: KnownTrigger[];
  earlyWarnings: string[];
  deEscalation: DeEscalationStage[];
  positiveStrategies: PositiveStrategy[];
  rewards: Reward[];
  boundaries: Boundary[];
  safetyPlan: SafetyPlanItem[];
  communicationNeeds: string;
  sensoryConsiderations: string;
  childViews: string;
  parentViews: string;
  professionalInput: ProfessionalInput[];
  staffGuidance: string[];
  restrictiveInterventions: RestrictiveIntervention[];
  reviewHistory: ReviewHistoryEntry[];
}

// -- Helpers ------------------------------------------------------------------

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const STATUS_COLOURS: Record<BehaviourSupportPlan["status"], string> = {
  active: "bg-green-100 text-green-800",
  under_review: "bg-amber-100 text-amber-800",
  draft: "bg-gray-100 text-gray-700",
  archived: "bg-slate-100 text-slate-700",
  suspended: "bg-red-100 text-red-800",
};

const SEVERITY_COLOURS: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

const LIKELIHOOD_COLOURS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

const EFFECTIVENESS_COLOURS: Record<string, string> = {
  highly_effective: "bg-green-100 text-green-800",
  effective: "bg-blue-100 text-blue-800",
  partially_effective: "bg-amber-100 text-amber-800",
  not_effective: "bg-red-100 text-red-800",
};

const CATEGORY_COLOURS: Record<string, string> = {
  environmental: "bg-teal-100 text-teal-800",
  emotional: "bg-pink-100 text-pink-800",
  social: "bg-indigo-100 text-indigo-800",
  sensory: "bg-purple-100 text-purple-800",
  routine_change: "bg-orange-100 text-orange-800",
  demand: "bg-red-100 text-red-800",
  transition: "bg-blue-100 text-blue-800",
};

const trendArrow = (t: string) =>
  t === "improving" ? <span className="text-green-600 font-bold">&uarr;</span> :
  t === "stable"    ? <span className="text-gray-500 font-bold">&rarr;</span> :
                      <span className="text-red-600 font-bold">&darr;</span>;

const trendColour = (t: string) =>
  t === "improving" ? "text-green-600" : t === "stable" ? "text-gray-500" : "text-red-600";

// -- Seed Data ----------------------------------------------------------------

const SEED: BehaviourSupportPlan[] = [
  // Alex
  {
    id: "bsp_001",
    youngPersonId: "yp_alex",
    createdDate: d(-120),
    createdBy: "staff_darren",
    reviewDate: d(10),
    lastReviewed: d(-30),
    status: "active",
    diagnosis: ["ADHD", "Attachment Disorder"],
    primaryBehaviours: [
      { behaviour: "Verbal aggression towards staff", frequency: "weekly", severity: "medium", trend: "improving" },
      { behaviour: "Property damage (throwing objects, kicking furniture)", frequency: "occasional", severity: "high", trend: "stable" },
      { behaviour: "Refusal and avoidance of demands", frequency: "daily", severity: "low", trend: "improving" },
    ],
    knownTriggers: [
      { trigger: "Academic or routine demands", category: "demand", likelihood: "high" },
      { trigger: "Transitions between activities", category: "transition", likelihood: "high" },
      { trigger: "Tiredness or poor sleep", category: "emotional", likelihood: "medium" },
      { trigger: "Perceived rejection by peers or staff", category: "emotional", likelihood: "medium" },
      { trigger: "Boredom or unstructured time", category: "environmental", likelihood: "low" },
    ],
    earlyWarnings: [
      "Pacing around the room, unable to sit still",
      "Voice getting louder, tone becoming confrontational",
      "Refusing eye contact and turning away from staff",
      "Muttering under breath or swearing quietly",
    ],
    deEscalation: [
      {
        stage: "green",
        strategies: [
          "Offer choices rather than direct demands",
          "Use humour and light conversation to maintain connection",
          "Ensure routine is predictable with visual schedule",
          "Praise effort rather than outcome",
        ],
        staffApproach: "Warm, relaxed, and conversational. Build rapport through shared interests (gaming, football). Avoid power struggles.",
      },
      {
        stage: "amber",
        strategies: [
          "Acknowledge feelings before addressing behaviour",
          "Offer a break or walk outside",
          "Reduce demands temporarily",
          "Give processing time -- do not crowd or rush",
        ],
        staffApproach: "Calm, low voice. Use PACE approach. Validate emotions. Do not escalate language or raise voice. Give physical space.",
      },
      {
        stage: "red",
        strategies: [
          "Remove other young people from the area",
          "Maintain safe distance, stay visible but not threatening",
          "Use minimal language -- short, calm instructions",
          "Call for additional staff support if needed",
        ],
        staffApproach: "Safety-first. Do not attempt to reason or negotiate. Wait for de-escalation. Only intervene physically as absolute last resort per positive handling plan.",
      },
    ],
    positiveStrategies: [
      { strategy: "1:1 key work sessions focused on emotional literacy", frequency: "Twice weekly", effectiveness: "highly_effective" },
      { strategy: "Xbox time as earned reward with clear expectations", frequency: "Daily", effectiveness: "effective" },
      { strategy: "Physical activity (gym, football) to regulate energy", frequency: "3x weekly", effectiveness: "highly_effective" },
      { strategy: "Visual routine board in bedroom", frequency: "Daily", effectiveness: "effective" },
    ],
    rewards: [
      { reward: "Extra 30 mins Xbox time", earnedBy: "Following morning routine independently", frequency: "Daily" },
      { reward: "Weekly takeaway choice", earnedBy: "No property damage for full week", frequency: "Weekly" },
      { reward: "Activity trip with key worker", earnedBy: "Consistent engagement with education for 2 weeks", frequency: "Fortnightly" },
    ],
    boundaries: [
      { boundary: "No physical aggression towards people", consequence: "Immediate de-escalation protocol; restorative conversation within 24 hours", rationale: "Safety of all residents and staff is non-negotiable" },
      { boundary: "Screen time ends at agreed time", consequence: "Gentle reminder, then natural consequence (reduced time next day)", rationale: "Consistent routine supports emotional regulation (ADHD management)" },
      { boundary: "Respectful language -- no targeted name-calling", consequence: "Brief acknowledgement, then revisit in calm moment", rationale: "Building relationship skills and mutual respect" },
    ],
    safetyPlan: [
      { scenario: "Alex becomes physically aggressive and poses risk to others", response: "Remove others from area. Two staff maintain safe distance. Use de-escalation language. If immediate risk of harm, follow positive handling plan (team-teach standing hold). Debrief within 24 hours.", staffRequired: 2 },
      { scenario: "Alex attempts to leave the building in a distressed state at night", response: "One staff follows at safe distance. Second staff calls manager. Do not physically block unless immediate danger. Use verbal engagement. If Alex leaves grounds, follow missing from care protocol.", staffRequired: 2 },
    ],
    communicationNeeds: "Alex responds best to direct, honest communication. Avoids sarcasm. Needs processing time (10-15 seconds) before responding. Visual supports helpful for routine. Key worker relationship is the primary communication channel.",
    sensoryConsiderations: "Can become overstimulated by loud environments. Prefers quieter spaces when dysregulated. Background music at low volume can help regulation. Dislikes being touched unexpectedly.",
    childViews: "Alex says: 'I know I kick off sometimes but I'm trying to get better. Don't shout at me -- it makes it worse. If I need space, let me go to my room. I like it when staff actually listen to me and don't just tell me off.'",
    parentViews: "No current parental contact. Social worker represents parental views. SW supports the plan and agrees the approach is proportionate.",
    professionalInput: [
      { name: "Dr. Sarah Ahmed", role: "CAMHS Psychiatrist", recommendation: "Continue current ADHD medication. Behaviour plan should incorporate sensory breaks and reduced demand during medication transition periods.", date: d(-45) },
      { name: "Karen Holding", role: "Social Worker", recommendation: "Supports current plan. Recommends continued focus on positive reinforcement over punitive measures. Agrees with restrictive intervention threshold.", date: d(-30) },
      { name: "James Brooks", role: "Education SENCO", recommendation: "Alex is making progress with modified curriculum. Recommends aligning home and school behaviour strategies for consistency.", date: d(-20) },
    ],
    staffGuidance: [
      "Always offer choices -- never issue ultimatums",
      "Use PACE approach: Playful, Accepting, Curious, Empathic",
      "Give processing time after instructions -- count to 10 silently",
      "Praise specifically -- 'I noticed you handled that calmly' not just 'good job'",
      "If escalation occurs, do NOT raise your voice -- it will escalate further",
    ],
    restrictiveInterventions: [
      { intervention: "Team-teach standing hold", lastResort: true, authorisedBy: "staff_darren", conditions: "Only when there is immediate risk of serious harm to Alex or others. Maximum 5 minutes. Two staff minimum. Debrief required within 24 hours. Record in restraint log immediately." },
    ],
    reviewHistory: [
      { date: d(-30), reviewedBy: "staff_darren", changes: "Updated de-escalation strategies following successful use of PACE approach. Reduced severity rating for verbal aggression from high to medium. Added new positive strategy (visual routine board).", outcome: "Plan continues -- positive trajectory. Review again in 6 weeks." },
    ],
  },
  // Jordan
  {
    id: "bsp_002",
    youngPersonId: "yp_jordan",
    createdDate: d(-90),
    createdBy: "staff_ryan",
    reviewDate: d(20),
    lastReviewed: d(-15),
    status: "active",
    diagnosis: ["ASD Level 1", "Anxiety"],
    primaryBehaviours: [
      { behaviour: "Meltdowns (sensory or emotional overload)", frequency: "weekly", severity: "medium", trend: "stable" },
      { behaviour: "Absconding attempts when overwhelmed", frequency: "occasional", severity: "high", trend: "improving" },
      { behaviour: "Self-harm (scratching, head-banging during crisis)", frequency: "rare", severity: "high", trend: "improving" },
    ],
    knownTriggers: [
      { trigger: "Sensory overload (noise, crowds, bright lights)", category: "sensory", likelihood: "high" },
      { trigger: "Unexpected changes to routine or plans", category: "routine_change", likelihood: "high" },
      { trigger: "Social demands (group activities, unfamiliar people)", category: "social", likelihood: "medium" },
      { trigger: "Food textures or unfamiliar meals", category: "sensory", likelihood: "medium" },
    ],
    earlyWarnings: [
      "Covering ears or squinting (sensory distress)",
      "Repetitive questioning -- 'What's happening next?'",
      "Withdrawal to bedroom without explanation",
      "Rocking or hand-flapping increasing in frequency",
      "Stomach complaints (anxiety somatisation)",
    ],
    deEscalation: [
      {
        stage: "green",
        strategies: [
          "Maintain predictable routine with visual timetable",
          "Offer sensory tools (weighted blanket, fidget items)",
          "Pre-warn of any changes at least 30 minutes ahead",
          "Allow Jordan to eat familiar/safe foods without pressure",
        ],
        staffApproach: "Calm, predictable, and patient. Use clear, literal language -- avoid idioms or ambiguous phrasing. Respect Jordan's need for personal space.",
      },
      {
        stage: "amber",
        strategies: [
          "Guide to quiet, low-stimulation space",
          "Offer noise-cancelling headphones",
          "Reduce verbal demands -- use visual prompts",
          "Allow sensory self-regulation (rocking is calming, not concerning)",
        ],
        staffApproach: "Minimal language. Soft, even tone. Do not touch without permission. Offer presence without pressure. Use a calm countdown if transition is needed.",
      },
      {
        stage: "red",
        strategies: [
          "Ensure Jordan is in a safe space with no harmful objects",
          "One staff member stays nearby but gives physical space",
          "Do not attempt to stop stimming behaviours -- they are regulatory",
          "If self-harm risk, calmly remove harmful objects without restraint",
        ],
        staffApproach: "Safety-first. One familiar staff member only -- too many people will escalate. Do not physically restrain unless immediate risk of serious injury. Wait for the meltdown to pass -- it will. Recovery takes 30-60 minutes.",
      },
    ],
    positiveStrategies: [
      { strategy: "Structured sensory diet throughout the day", frequency: "Daily", effectiveness: "highly_effective" },
      { strategy: "Social stories for new or changing situations", frequency: "As needed", effectiveness: "effective" },
      { strategy: "1:1 outdoor time (nature walks are calming)", frequency: "3x weekly", effectiveness: "highly_effective" },
    ],
    rewards: [
      { reward: "Lego building time (preferred activity)", earnedBy: "Engaging with daily routine without meltdown", frequency: "Daily" },
      { reward: "Special interest time (trains/maps)", earnedBy: "Trying one new food item at mealtime", frequency: "Weekly" },
      { reward: "Trip to the science museum", earnedBy: "Two consecutive weeks of attending school fully", frequency: "Fortnightly" },
      { reward: "Extra quiet time in room with audiobook", earnedBy: "Using calm-down strategies independently", frequency: "As earned" },
    ],
    boundaries: [
      { boundary: "Cannot leave the building without staff knowledge", consequence: "Gentle conversation about safety; additional check-ins", rationale: "Absconding risk -- Jordan may not recognise danger when overwhelmed" },
      { boundary: "Mealtimes are together but food choices are flexible", consequence: "Safe foods always available; no forced eating", rationale: "Sensory food issues are neurological, not defiance" },
    ],
    safetyPlan: [
      { scenario: "Jordan attempts to abscond from the building", response: "One staff follows at safe distance. Use calm, familiar voice. Offer to walk together instead. If Jordan leaves grounds, second staff initiates missing from care protocol. Do not physically block unless imminent traffic/danger risk.", staffRequired: 2 },
      { scenario: "Jordan engages in self-harm during meltdown", response: "Remove harmful objects calmly. Do not restrain. Offer weighted blanket. Stay present but give space. If injury occurs, administer first aid. Complete body map. Inform CAMHS if significant. Record in daily log.", staffRequired: 1 },
    ],
    communicationNeeds: "Jordan processes language literally -- avoid metaphors, sarcasm, and ambiguity. Use visual supports and social stories. Allow extra processing time. Written instructions work better than verbal for multi-step tasks. Jordan may not make eye contact -- this is not defiance.",
    sensoryConsiderations: "Hypersensitive to noise (especially sudden or loud), bright/fluorescent lighting, certain food textures (mushy/slimy), and unexpected touch. Weighted blanket, fidget spinner, and noise-cancelling headphones are essential regulation tools. Room is set up as a low-stimulation environment.",
    childViews: "Jordan says: 'I don't mean to run away. Sometimes everything gets too loud and I just need to be somewhere quiet. The headphones help a lot. I like it when staff tell me what's happening next so I don't get surprised.'",
    parentViews: "Mother is supportive of the plan. She has shared strategies that work at home including use of the weighted blanket and allowing Jordan to retreat to a quiet space. Father has limited involvement.",
    professionalInput: [
      { name: "Dr. Priya Nair", role: "CAMHS Clinical Psychologist", recommendation: "ASD-informed approach is essential. Meltdowns are not tantrums -- they are neurological overwhelm. Avoid punitive responses. Sensory diet is key to regulation.", date: d(-40) },
      { name: "Lisa Thompson", role: "Occupational Therapist", recommendation: "Sensory profile assessment completed. Recommends proprioceptive input activities (heavy work, climbing) and a dedicated calm space with low lighting.", date: d(-25) },
    ],
    staffGuidance: [
      "Jordan's behaviours are autism-related, not intentional defiance",
      "Never force eye contact or physical interaction",
      "Pre-warn of ALL changes -- even small ones like a different staff member collecting from school",
      "Stimming (rocking, flapping) is self-regulation -- do not ask Jordan to stop",
      "If Jordan is overwhelmed, reduce language to short, clear phrases",
    ],
    restrictiveInterventions: [
      { intervention: "Guided escort away from danger (e.g. road)", lastResort: true, authorisedBy: "staff_ryan", conditions: "Only when Jordan is at imminent risk of physical harm (traffic, water). Gentle guiding by elbow -- no restrictive holds. Jordan must be informed of what you are doing and why." },
      { intervention: "Removal of harmful objects during self-harm episode", lastResort: false, authorisedBy: "staff_ryan", conditions: "Not considered restrictive but documented. Remove items calmly without physical contact with Jordan wherever possible. Replace with sensory alternatives (stress ball, fabric)." },
    ],
    reviewHistory: [
      { date: d(-15), reviewedBy: "staff_ryan", changes: "Added OT recommendations to sensory section. Updated absconding trend from stable to improving following 6 weeks with no incidents.", outcome: "Plan continues. Positive progress noted." },
    ],
  },
  // Casey
  {
    id: "bsp_003",
    youngPersonId: "yp_casey",
    createdDate: d(-180),
    createdBy: "staff_darren",
    reviewDate: d(-10),
    lastReviewed: d(-60),
    status: "under_review",
    diagnosis: ["PTSD", "Reactive Attachment Disorder (RAD)"],
    primaryBehaviours: [
      { behaviour: "Emotional dysregulation (intense distress, crying, panic)", frequency: "daily", severity: "high", trend: "worsening" },
      { behaviour: "Aggressive outbursts (throwing items, slamming doors)", frequency: "weekly", severity: "medium", trend: "stable" },
      { behaviour: "Dissociation (appearing 'zoned out', unresponsive)", frequency: "occasional", severity: "medium", trend: "stable" },
      { behaviour: "Night terrors (screaming, thrashing during sleep)", frequency: "weekly", severity: "medium", trend: "stable" },
    ],
    knownTriggers: [
      { trigger: "Raised voices or shouting (even between others)", category: "environmental", likelihood: "high" },
      { trigger: "Unexpected physical touch", category: "sensory", likelihood: "high" },
      { trigger: "Specific anniversary dates related to trauma", category: "emotional", likelihood: "high" },
      { trigger: "Men in positions of authority (initial response)", category: "social", likelihood: "medium" },
      { trigger: "Bedtime and darkness", category: "routine_change", likelihood: "medium" },
      { trigger: "Feeling trapped or confined (locked doors, small rooms)", category: "environmental", likelihood: "high" },
    ],
    earlyWarnings: [
      "Eyes glazing over or becoming 'distant'",
      "Picking at skin on hands or arms",
      "Asking repetitive questions about safety ('Am I safe here?')",
      "Becoming very clingy with preferred staff member",
      "Refusal to eat or sudden loss of appetite",
      "Retreating under furniture or into small spaces",
    ],
    deEscalation: [
      {
        stage: "green",
        strategies: [
          "Maintain consistent, predictable daily routine",
          "Use warm, gentle tone -- never raise voice in Casey's presence",
          "Provide choices to build sense of control",
          "Trauma-informed check-ins: 'How are you feeling right now?'",
        ],
        staffApproach: "Nurturing, warm, and consistent. Build trust through reliability. Keep promises -- broken promises are deeply triggering. Use the language of safety: 'You are safe here. I am here.'",
      },
      {
        stage: "amber",
        strategies: [
          "Grounding exercise: name 5 things you can see, 4 you can hear...",
          "Offer Casey's comfort object (specific blanket)",
          "Key worker to be contacted if not on shift",
          "Reduce all environmental stimulation (dim lights, quiet)",
        ],
        staffApproach: "Gentle, slow movements. Announce what you are doing before you do it. Do not touch without asking. Get down to Casey's level. Maintain a calm, steady voice. Reassure repeatedly that Casey is safe.",
      },
      {
        stage: "red",
        strategies: [
          "Ensure Casey is in a safe space -- remove anything throwable",
          "One trusted staff member stays present, others withdraw",
          "If dissociation occurs, use gentle grounding (cold cloth on wrists)",
          "Do not attempt to process the trauma in the moment",
        ],
        staffApproach: "Casey may not recognise you during a flashback. Use her name gently. Remind her where she is: 'Casey, you are at Oak House. You are safe. It is [current year].' Do not restrain under any circumstances -- it will retraumatise. Wait for the crisis to pass.",
      },
    ],
    positiveStrategies: [
      { strategy: "Art therapy sessions (painting, drawing)", frequency: "3x weekly", effectiveness: "highly_effective" },
      { strategy: "Therapeutic life-story work with key worker", frequency: "Weekly", effectiveness: "effective" },
      { strategy: "Bedtime routine with calming music and low lighting", frequency: "Daily", effectiveness: "partially_effective" },
      { strategy: "Animal-assisted therapy (visits from therapy dog)", frequency: "Weekly", effectiveness: "highly_effective" },
    ],
    rewards: [
      { reward: "Art supplies (new sketchbook, pens)", earnedBy: "Attending school for a full week", frequency: "Weekly" },
      { reward: "1:1 baking session with key worker", earnedBy: "Using a coping strategy independently", frequency: "As earned" },
      { reward: "Extra time with therapy dog", earnedBy: "Engaging in life-story session", frequency: "Weekly" },
    ],
    boundaries: [
      { boundary: "No throwing objects at people", consequence: "Immediate de-escalation; restorative conversation when calm", rationale: "Safety -- but approach with empathy, understanding the behaviour communicates distress" },
      { boundary: "Night-time routine to be followed even when distressed", consequence: "Flexible timing but structure maintained; staff stays nearby", rationale: "Consistency reduces trauma-related hypervigilance at bedtime" },
      { boundary: "Casey must inform staff before leaving communal areas", consequence: "Gentle reminder; additional check-ins for 30 minutes", rationale: "Safety awareness while respecting need for autonomy" },
    ],
    safetyPlan: [
      { scenario: "Casey experiences a severe dissociative episode", response: "Do not move or touch Casey. Speak gently using her name and current location. Dim lights if possible. Use cold cloth on wrists for grounding if Casey is responsive to sensory input. If episode lasts more than 20 minutes, call CAMHS crisis line. Record fully in daily log.", staffRequired: 1 },
      { scenario: "Casey becomes aggressive during a flashback", response: "Maintain safe distance. Remove other YP from the area. Do NOT restrain -- it will worsen the flashback. Use calm, repetitive reassurance. Wait for the episode to pass. Once calm, offer water and comfort object. Debrief with key worker within 24 hours.", staffRequired: 2 },
    ],
    communicationNeeds: "Casey communicates best through art and writing. Verbal processing can be difficult during heightened emotional states. Give time and do not fill silences. Use open-ended questions rather than direct questioning. Never ask 'Why did you do that?' -- ask 'What was happening for you?'",
    sensoryConsiderations: "Hypervigilant to sound -- startles easily. Dislikes sudden changes in lighting. Finds comfort in soft textures (blankets, plush items). Weighted blanket at night helps with sleep. Scented items (lavender) can be grounding but should be offered, not imposed.",
    childViews: "Casey says: 'Sometimes I feel really scared and I don't know why. I don't want to hurt anyone -- I just feel like everything is too much. Chervelle makes me feel safe. I like drawing because I can show how I feel without talking.'",
    parentViews: "Mother has sporadic contact. Agrees with the plan in principle but engagement is inconsistent. Father has no contact (perpetrator of trauma). IRO represents Casey's welfare interests alongside SW.",
    professionalInput: [
      { name: "Dr. Helen Cartwright", role: "Clinical Psychologist (Trauma Specialist)", recommendation: "Casey requires a trauma-informed environment above all else. The current worsening of emotional dysregulation is likely linked to approaching anniversary dates. Recommend increasing therapy sessions to twice weekly for the next 8 weeks.", date: d(-20) },
      { name: "Fiona Brennan", role: "Social Worker", recommendation: "Concerned about the worsening trend. Requests an urgent review of this BSP with updated strategies. Considers whether additional therapeutic input is needed.", date: d(-12) },
      { name: "Sarah Mitchell", role: "Independent Reviewing Officer", recommendation: "Reviewed at last LAC review. Satisfied with trauma-informed approach but wants to see updated BSP reflecting current presentation. Next LAC review in 6 weeks.", date: d(-35) },
    ],
    staffGuidance: [
      "Casey's behaviour is a trauma response -- she is not being deliberately difficult",
      "NEVER raise your voice near Casey, even if speaking to someone else",
      "Do not touch Casey without asking first, even casually",
      "If Casey dissociates, do NOT shake her or shout -- ground gently",
      "Male staff should build trust slowly -- Casey's trauma involves a male authority figure",
      "Broken promises are deeply harmful -- only commit to what you can guarantee",
    ],
    restrictiveInterventions: [
      { intervention: "No restrictive interventions authorised", lastResort: true, authorisedBy: "staff_darren", conditions: "Casey's trauma history means any physical restraint would be retraumatising and is contraindicated. If Casey poses a risk to herself or others, use environmental management (remove objects, clear the room) rather than physical intervention. In an extreme emergency, call 999." },
    ],
    reviewHistory: [
      { date: d(-60), reviewedBy: "staff_darren", changes: "Standard 3-month review. No significant changes. Casey settling well.", outcome: "Plan continues unchanged." },
    ],
  },
];

// -- Export Columns -----------------------------------------------------------

const EXPORT_COLS: ExportColumn<BehaviourSupportPlan>[] = [
  { header: "Young Person", accessor: (r: BehaviourSupportPlan) => getYPName(r.youngPersonId) },
  { header: "Status", accessor: (r: BehaviourSupportPlan) => r.status.replace(/_/g, " ") },
  { header: "Diagnoses", accessor: (r: BehaviourSupportPlan) => r.diagnosis.join(", ") },
  { header: "Created", accessor: (r: BehaviourSupportPlan) => r.createdDate },
  { header: "Created By", accessor: (r: BehaviourSupportPlan) => getStaffName(r.createdBy) },
  { header: "Review Due", accessor: (r: BehaviourSupportPlan) => r.reviewDate },
  { header: "Last Reviewed", accessor: (r: BehaviourSupportPlan) => r.lastReviewed ?? "N/A" },
  { header: "Primary Behaviours", accessor: (r: BehaviourSupportPlan) => r.primaryBehaviours.map((b) => `${b.behaviour} (${b.frequency}, ${b.severity}, ${b.trend})`).join("; ") },
  { header: "Known Triggers", accessor: (r: BehaviourSupportPlan) => r.knownTriggers.map((t) => `${t.trigger} (${t.category})`).join("; ") },
  { header: "Early Warnings", accessor: (r: BehaviourSupportPlan) => r.earlyWarnings.join("; ") },
  { header: "Communication Needs", accessor: (r: BehaviourSupportPlan) => r.communicationNeeds },
  { header: "Child Views", accessor: (r: BehaviourSupportPlan) => r.childViews },
  { header: "Staff Guidance", accessor: (r: BehaviourSupportPlan) => r.staffGuidance.join("; ") },
  { header: "Sensory Considerations", accessor: (r: BehaviourSupportPlan) => r.sensoryConsiderations },
];

// =============================================================================
// Component
// =============================================================================

export default function BehaviourSupportPlansPage() {
  const createBSP = useCreateBehaviourSupportPlan();
  const [plans] = useState<BehaviourSupportPlan[]>(SEED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [childFilter, setChildFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));
  const today = new Date().toISOString().slice(0, 10);

  const children = useMemo(() => {
    const ids = [...new Set(plans.map((p) => p.youngPersonId))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [plans]);

  const filtered = useMemo(() => {
    let list = [...plans];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          getYPName(p.youngPersonId).toLowerCase().includes(s) ||
          p.diagnosis.some((dx) => dx.toLowerCase().includes(s)) ||
          p.primaryBehaviours.some((b) => b.behaviour.toLowerCase().includes(s)) ||
          p.knownTriggers.some((t) => t.trigger.toLowerCase().includes(s))
      );
    }
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (childFilter !== "all") list = list.filter((p) => p.youngPersonId === childFilter);
    return list;
  }, [plans, search, statusFilter, childFilter]);

  const stats = useMemo(() => {
    const active = plans.filter((p) => p.status === "active").length;
    const dueReview = plans.filter((p) => p.reviewDate <= today).length;
    const allBehaviours = plans.flatMap((p) => p.primaryBehaviours);
    const improving = allBehaviours.filter((b) => b.trend === "improving").length;
    const improvingPct = allBehaviours.length > 0 ? Math.round((improving / allBehaviours.length) * 100) : 0;
    // Incidents this week -- mock count based on worsening/stable behaviours
    const incidentsThisWeek = plans.flatMap((p) => p.primaryBehaviours).filter((b) => b.frequency === "daily" || b.frequency === "weekly").length;
    return { active, dueReview, improvingPct, incidentsThisWeek };
  }, [plans, today]);

  const overdueReviews = plans.filter((p) => p.reviewDate <= today);
  const underReviewPlans = plans.filter((p) => p.status === "under_review");

  return (
    <PageShell
      title="Behaviour Support Plans"
      subtitle="Formal behaviour support strategies -- triggers, de-escalation, positive reinforcement, and safety plans"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Behaviour Support Plans" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="behaviour-support-plans" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> New BSP
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* -- Summary Strip ------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Active Plans", value: stats.active, icon: Shield, colour: "text-blue-600" },
            { label: "Due for Review", value: stats.dueReview, icon: Clock, colour: stats.dueReview > 0 ? "text-orange-600" : "text-green-600" },
            { label: "Improving Behaviours", value: `${stats.improvingPct}%`, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Incidents This Week", value: stats.incidentsThisWeek, icon: AlertTriangle, colour: stats.incidentsThisWeek > 3 ? "text-red-600" : "text-amber-600" },
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

        {/* -- Alert Banners ------------------------------------------------- */}
        {overdueReviews.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div className="text-sm text-red-800">
              <strong>Overdue Review:</strong>{" "}
              {overdueReviews.map((p) => getYPName(p.youngPersonId)).join(", ")} &mdash;
              BSP review is overdue. Please schedule an urgent review with the care team.
            </div>
          </div>
        )}
        {underReviewPlans.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
            <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <strong>Under Review:</strong>{" "}
              {underReviewPlans.map((p) => getYPName(p.youngPersonId)).join(", ")} &mdash;
              BSP is currently under review following professional recommendations.
            </div>
          </div>
        )}

        {/* -- Filters ------------------------------------------------------- */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search behaviours, triggers, diagnoses..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* -- Per-Child Overview Cards --------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {children.map((c) => {
            const cp = plans.find((p) => p.youngPersonId === c.id);
            if (!cp) return null;
            const behaviourCount = cp.primaryBehaviours.length;
            const improvingCount = cp.primaryBehaviours.filter((b) => b.trend === "improving").length;
            const worseningCount = cp.primaryBehaviours.filter((b) => b.trend === "worsening").length;
            return (
              <Card
                key={c.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setChildFilter(childFilter === c.id ? "all" : c.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{c.name}</p>
                    <Badge className={cn("text-xs", STATUS_COLOURS[cp.status])}>
                      {cp.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span>{behaviourCount} behaviours</span>
                    {improvingCount > 0 && <span className="text-green-600">{improvingCount} improving</span>}
                    {worseningCount > 0 && <span className="text-red-600">{worseningCount} worsening</span>}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {cp.diagnosis.map((dx) => (
                      <Badge key={dx} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        {dx}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Review due: <span className={cn(cp.reviewDate <= today ? "text-red-600 font-medium" : "")}>{cp.reviewDate}</span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* -- BSP Detail Cards ---------------------------------------------- */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No behaviour support plans match your filters.</p>
          )}
          {filtered.map((plan) => {
            const isExpanded = !!expanded[plan.id];
            const reviewOverdue = plan.reviewDate <= today;

            return (
              <div key={plan.id} className={cn("rounded-xl border bg-white overflow-hidden", reviewOverdue && "border-l-4 border-l-red-400")}>
                {/* -- Header ------------------------------------------------ */}
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => toggle(plan.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Shield className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{getYPName(plan.youngPersonId)}</p>
                        <Badge className={cn("text-xs", STATUS_COLOURS[plan.status])}>
                          {plan.status.replace(/_/g, " ")}
                        </Badge>
                        {reviewOverdue && (
                          <Badge variant="destructive" className="text-xs">Review overdue</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        <span>Created: {plan.createdDate}</span>
                        <span>By {getStaffName(plan.createdBy)}</span>
                        <span>Review: {plan.reviewDate}</span>
                        <span className="flex items-center gap-1">
                          {plan.primaryBehaviours.map((b, i) => (
                            <span key={i} className={cn("inline-flex items-center gap-0.5", trendColour(b.trend))}>
                              {trendArrow(b.trend)}
                            </span>
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {/* -- Expanded Content -------------------------------------- */}
                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* Diagnoses */}
                    <div className="flex flex-wrap gap-1">
                      {plan.diagnosis.map((dx) => (
                        <Badge key={dx} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          {dx}
                        </Badge>
                      ))}
                    </div>

                    {/* Primary Behaviours Table */}
                    <div>
                      <p className="text-sm font-medium mb-2">Primary Behaviours</p>
                      <div className="rounded-lg border bg-white overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className="text-left p-2 font-medium text-xs">Behaviour</th>
                              <th className="text-left p-2 font-medium text-xs">Frequency</th>
                              <th className="text-left p-2 font-medium text-xs">Severity</th>
                              <th className="text-left p-2 font-medium text-xs">Trend</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plan.primaryBehaviours.map((b, i) => (
                              <tr key={i} className="border-t">
                                <td className="p-2">{b.behaviour}</td>
                                <td className="p-2">
                                  <Badge variant="outline" className="text-xs">{b.frequency}</Badge>
                                </td>
                                <td className="p-2">
                                  <Badge className={cn("text-xs", SEVERITY_COLOURS[b.severity])}>{b.severity}</Badge>
                                </td>
                                <td className="p-2">
                                  <span className={cn("inline-flex items-center gap-1 text-xs font-medium", trendColour(b.trend))}>
                                    {trendArrow(b.trend)} {b.trend}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Traffic Light De-Escalation */}
                    <div>
                      <p className="text-sm font-medium mb-2">De-Escalation (Traffic Light Model)</p>
                      <div className="space-y-2">
                        {plan.deEscalation.map((stage) => {
                          const stageConfig = {
                            green: { bg: "bg-green-50 border-green-200", title: "Green Zone -- Calm / Regulated", titleColour: "text-green-800", icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
                            amber: { bg: "bg-amber-50 border-amber-200", title: "Amber Zone -- Early Signs / Escalating", titleColour: "text-amber-800", icon: <AlertTriangle className="h-4 w-4 text-amber-600" /> },
                            red:   { bg: "bg-red-50 border-red-200", title: "Red Zone -- Crisis", titleColour: "text-red-800", icon: <AlertTriangle className="h-4 w-4 text-red-600" /> },
                          }[stage.stage];
                          return (
                            <div key={stage.stage} className={cn("rounded-lg border p-3", stageConfig.bg)}>
                              <div className="flex items-center gap-2 mb-2">
                                {stageConfig.icon}
                                <p className={cn("text-xs font-semibold", stageConfig.titleColour)}>{stageConfig.title}</p>
                              </div>
                              <ul className="space-y-1 mb-2">
                                {stage.strategies.map((s, i) => (
                                  <li key={i} className="text-sm flex items-start gap-1">
                                    <span className="text-muted-foreground mt-0.5 shrink-0">&#8226;</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                              <p className="text-xs text-muted-foreground">
                                <strong>Staff approach:</strong> {stage.staffApproach}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Known Triggers */}
                    <div>
                      <p className="text-sm font-medium mb-2">Known Triggers</p>
                      <div className="space-y-1">
                        {plan.knownTriggers.map((t, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm bg-white rounded-lg border p-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            <span className="flex-1">{t.trigger}</span>
                            <Badge className={cn("text-xs", CATEGORY_COLOURS[t.category])}>{t.category.replace(/_/g, " ")}</Badge>
                            <Badge className={cn("text-xs", LIKELIHOOD_COLOURS[t.likelihood])}>{t.likelihood}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Early Warning Signs */}
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-2">Early Warning Signs</p>
                      <ol className="space-y-1 list-decimal list-inside">
                        {plan.earlyWarnings.map((w, i) => (
                          <li key={i} className="text-sm text-amber-900">{w}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Positive Strategies Table */}
                    <div>
                      <p className="text-sm font-medium mb-2">Positive Strategies</p>
                      <div className="rounded-lg border bg-white overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className="text-left p-2 font-medium text-xs">Strategy</th>
                              <th className="text-left p-2 font-medium text-xs">Frequency</th>
                              <th className="text-left p-2 font-medium text-xs">Effectiveness</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plan.positiveStrategies.map((s, i) => (
                              <tr key={i} className="border-t">
                                <td className="p-2">{s.strategy}</td>
                                <td className="p-2 text-muted-foreground">{s.frequency}</td>
                                <td className="p-2">
                                  <Badge className={cn("text-xs", EFFECTIVENESS_COLOURS[s.effectiveness])}>
                                    {s.effectiveness.replace(/_/g, " ")}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Rewards & Boundaries side-by-side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Rewards */}
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-semibold text-green-800 mb-2">Rewards</p>
                        <div className="space-y-2">
                          {plan.rewards.map((r, i) => (
                            <div key={i} className="text-sm">
                              <p className="font-medium">{r.reward}</p>
                              <p className="text-xs text-green-700">Earned by: {r.earnedBy} &middot; {r.frequency}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Boundaries */}
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-800 mb-2">Boundaries</p>
                        <div className="space-y-2">
                          {plan.boundaries.map((b, i) => (
                            <div key={i} className="text-sm">
                              <p className="font-medium">{b.boundary}</p>
                              <p className="text-xs text-slate-600">Consequence: {b.consequence}</p>
                              <p className="text-xs text-muted-foreground">Rationale: {b.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Safety Plan */}
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-red-600" />
                        <p className="text-xs font-semibold text-red-800">Safety Plan</p>
                      </div>
                      <div className="space-y-3">
                        {plan.safetyPlan.map((sp, i) => (
                          <div key={i} className="text-sm">
                            <p className="font-medium text-red-900">{sp.scenario}</p>
                            <p className="text-red-800 mt-1">{sp.response}</p>
                            <p className="text-xs text-red-600 mt-0.5">Staff required: {sp.staffRequired}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Restrictive Interventions */}
                    <div className="rounded-lg bg-slate-800 text-white p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-slate-300" />
                        <p className="text-xs font-semibold text-slate-200">Restrictive Interventions</p>
                      </div>
                      <div className="space-y-2">
                        {plan.restrictiveInterventions.map((ri, i) => (
                          <div key={i} className="text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{ri.intervention}</p>
                              {ri.lastResort && (
                                <Badge className="text-xs bg-red-500/20 text-red-300 border border-red-500/30">LAST RESORT</Badge>
                              )}
                            </div>
                            <p className="text-slate-300 text-xs">Authorised by: {getStaffName(ri.authorisedBy)}</p>
                            <p className="text-slate-300 text-xs mt-0.5">{ri.conditions}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Child Views, Parent Views, Professional Input */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Child Views */}
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Heart className="h-4 w-4 text-pink-600" />
                          <p className="text-xs font-semibold text-pink-800">Child&apos;s Views</p>
                        </div>
                        <p className="text-sm text-pink-900">{plan.childViews}</p>
                      </div>
                      {/* Parent Views */}
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Parent / Carer Views</p>
                        <p className="text-sm text-blue-900">{plan.parentViews}</p>
                      </div>
                    </div>

                    {/* Professional Input */}
                    <div>
                      <p className="text-sm font-medium mb-2">Professional Input</p>
                      <div className="rounded-lg border bg-white overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className="text-left p-2 font-medium text-xs">Name</th>
                              <th className="text-left p-2 font-medium text-xs">Role</th>
                              <th className="text-left p-2 font-medium text-xs">Recommendation</th>
                              <th className="text-left p-2 font-medium text-xs">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plan.professionalInput.map((pi, i) => (
                              <tr key={i} className="border-t">
                                <td className="p-2 font-medium">{pi.name}</td>
                                <td className="p-2 text-muted-foreground">{pi.role}</td>
                                <td className="p-2">{pi.recommendation}</td>
                                <td className="p-2 text-muted-foreground text-xs">{pi.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Staff Guidance */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-semibold text-blue-800">Staff Guidance -- Essential Reading</p>
                      </div>
                      <ul className="space-y-1">
                        {plan.staffGuidance.map((g, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Communication Needs & Sensory Considerations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg border bg-white p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Communication Needs</p>
                        <p className="text-sm">{plan.communicationNeeds}</p>
                      </div>
                      <div className="rounded-lg border bg-white p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Sensory Considerations</p>
                        <p className="text-sm">{plan.sensoryConsiderations}</p>
                      </div>
                    </div>

                    {/* Review History */}
                    <div>
                      <p className="text-sm font-medium mb-2">Review History</p>
                      <div className="space-y-2">
                        {plan.reviewHistory.map((rh, i) => (
                          <div key={i} className="rounded-lg border bg-white p-3 text-sm">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                              <span>{rh.date}</span>
                              <span>Reviewed by {getStaffName(rh.reviewedBy)}</span>
                            </div>
                            <p className="mb-1">{rh.changes}</p>
                            <p className="text-xs text-muted-foreground"><strong>Outcome:</strong> {rh.outcome}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <SmartLinkPanel sourceType="behaviour_support" sourceId={plan.id} childId={plan.youngPersonId} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* -- Regulatory Note ----------------------------------------------- */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>SEND Code of Practice, Regulation 19 & Trauma-Informed Practice:</strong>{" "}
          Behaviour support plans must be developed in line with the SEND Code of Practice (2015)
          and the Children&apos;s Homes Regulations 2015, Regulation 19 (behaviour management). Plans
          must prioritise positive behaviour support, de-escalation, and trauma-informed approaches.
          Restrictive interventions are a last resort only. Each plan must reflect the child&apos;s voice,
          involve multi-agency professionals, and be reviewed regularly. The home must ensure all
          staff are trained in the approaches outlined and that plans are accessible to the full team.
        </div>
      </div>

      {/* -- New BSP Dialog -------------------------------------------------- */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Behaviour Support Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bsp-child">Young Person</Label>
                <Select>
                  <SelectTrigger id="bsp-child">
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bsp-status">Status</Label>
                <Select>
                  <SelectTrigger id="bsp-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="bsp-diagnosis">Diagnoses (comma-separated)</Label>
              <Input id="bsp-diagnosis" placeholder="e.g. ADHD, Anxiety" />
            </div>
            <div>
              <Label htmlFor="bsp-behaviours">Primary Behaviours</Label>
              <Textarea id="bsp-behaviours" placeholder="Describe the primary behaviours of concern..." rows={3} />
            </div>
            <div>
              <Label htmlFor="bsp-triggers">Known Triggers</Label>
              <Textarea id="bsp-triggers" placeholder="List known triggers..." rows={3} />
            </div>
            <div>
              <Label htmlFor="bsp-warnings">Early Warning Signs</Label>
              <Textarea id="bsp-warnings" placeholder="Observable signs before escalation..." rows={3} />
            </div>
            <div>
              <Label htmlFor="bsp-deescalation">De-Escalation Strategies</Label>
              <Textarea id="bsp-deescalation" placeholder="Green / Amber / Red zone strategies..." rows={4} />
            </div>
            <div>
              <Label htmlFor="bsp-positive">Positive Strategies</Label>
              <Textarea id="bsp-positive" placeholder="Positive reinforcement strategies..." rows={3} />
            </div>
            <div>
              <Label htmlFor="bsp-safety">Safety Plan</Label>
              <Textarea id="bsp-safety" placeholder="High-risk scenarios and responses..." rows={3} />
            </div>
            <div>
              <Label htmlFor="bsp-child-views">Child&apos;s Views</Label>
              <Textarea id="bsp-child-views" placeholder="What has the child said about their behaviour and support?" rows={3} />
            </div>
            <div>
              <Label htmlFor="bsp-comms">Communication Needs</Label>
              <Textarea id="bsp-comms" placeholder="Communication preferences and needs..." rows={2} />
            </div>
            <div>
              <Label htmlFor="bsp-sensory">Sensory Considerations</Label>
              <Textarea id="bsp-sensory" placeholder="Sensory sensitivities and preferences..." rows={2} />
            </div>
            <div>
              <Label htmlFor="bsp-guidance">Staff Guidance</Label>
              <Textarea id="bsp-guidance" placeholder="Key points for all staff to follow..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bsp-review">Review Date</Label>
                <Input id="bsp-review" type="date" />
              </div>
              <div>
                <Label htmlFor="bsp-created-by">Created By</Label>
                <Select>
                  <SelectTrigger id="bsp-created-by">
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff_darren">{getStaffName("staff_darren")}</SelectItem>
                    <SelectItem value="staff_ryan">{getStaffName("staff_ryan")}</SelectItem>
                    <SelectItem value="staff_edward">{getStaffName("staff_edward")}</SelectItem>
                    <SelectItem value="staff_anna">{getStaffName("staff_anna")}</SelectItem>
                    <SelectItem value="staff_chervelle">{getStaffName("staff_chervelle")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button disabled={createBSP.isPending} onClick={() => { createBSP.mutate({ title: "New Behaviour Support Plan", status: "draft", created_date: new Date().toISOString().slice(0, 10), review_date: new Date(Date.now() + 42 * 86400000).toISOString().slice(0, 10), triggers: [], de_escalation_strategies: [], positive_strategies: [], staff_id: "staff_darren" }, { onSuccess: () => toast.success("BSP created"), onError: () => toast.error("Failed to create BSP") }); setShowNew(false); }}>{createBSP.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Creating...</> : "Create BSP"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
