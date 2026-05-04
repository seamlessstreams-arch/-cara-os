"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Droplet, Heart, Shield, ChevronUp, ChevronDown, ArrowUpDown, Search, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

interface ContinencePlan {
  id: string;
  youngPerson: string;
  planDate: string;
  presentation:
    | "Nocturnal enuresis"
    | "Daytime wetting"
    | "Encopresis (soiling)"
    | "Mixed"
    | "Post-trauma onset"
    | "Developmental — being patient"
    | "Resolving"
    | "Resolved";
  presentationDuration: string;
  triggersLinks: string[];
  productsInUse: string[];
  bedProtectionInUse: string[];
  fluidPlan: string[];
  toiletingRoutines: string[];
  alarmTherapy?: string;
  medication?: string;
  externalSupportEngaged: { service: string; clinician: string; frequency: string }[];
  childLanguageUsed: string;
  privacyMeasures: string[];
  laundryRoutine: string[];
  staffDoStrategies: string[];
  staffDoNotStrategies: string[];
  progressNotes: string[];
  childVoice: string;
  staffObservation: string;
  reviewDate: string;
  keyWorker: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: ContinencePlan[] = [
  {
    id: "ccsp_001",
    youngPerson: "yp_casey",
    planDate: d(-30),
    presentation: "Post-trauma onset",
    presentationDuration: "Nocturnal enuresis — 14 months since coming into care; pre-care history unclear",
    triggersLinks: [
      "Onset coincided with placement move and disclosure work",
      "Worse on nights following contact with birth family",
      "Worse when Anna (key worker) is on annual leave",
      "Sometimes worse after vivid dreams or nightmares",
      "Not related to fluid volume or constipation (ruled out by paediatric continence nurse)",
    ],
    productsInUse: [
      "DryNites pyjama pants (size 8–15) — Casey calls these 'night pants'",
      "Stocked discreetly in lined ottoman at the foot of Casey's bed",
      "Fresh pack rotated weekly so supply is never visibly low",
      "Spare pack in Anna's locked key-worker cabinet",
      "Never stored in shared bathroom or communal cupboard",
    ],
    bedProtectionInUse: [
      "Full waterproof mattress protector (machine-washable, fitted)",
      "Brolly Sheet (waterproof tuck-in pad) layered UNDER the fitted sheet — invisible when bed is made",
      "Spare bedding set folded in Casey's wardrobe so a quick change can be done independently if she wakes",
      "Two duvet sets in rotation — never any visible difference between 'wet night' and 'dry night' bedding",
    ],
    fluidPlan: [
      "Front-loaded fluid intake: aim 6–8 drinks across the day, majority before 4pm (per NICE NG111)",
      "NO fluid restriction overnight — NICE explicitly advises against this; Casey may drink water freely if thirsty",
      "Last large drink with evening meal at 5:30pm; small water by bed permitted",
      "Avoid caffeine and fizzy drinks (bladder irritants) — offer squash, milk, water",
      "Track fluid pattern in shared health notes if a wetter week — never ask Casey to log it herself",
    ],
    toiletingRoutines: [
      "Casey uses the toilet as part of bedtime wind-down at 9pm (own bathroom, door closed, never prompted in front of others)",
      "Optional second 'sleepy wee' offered by Anna or Edward only — quietly, near the door, never announced",
      "On waking, Casey goes straight to her own bathroom — change of pants/pyjamas if needed available in her drawer",
      "No 'lifting' (waking the child to wee at night) — NICE NG111 advises against unless child requests it; Casey has not",
    ],
    alarmTherapy:
      "Stay-dry pad-and-bell alarm (Malem) trialled for 8 weeks (months 6–8 of placement) — paused after Casey reported it was making her anxious and disrupting sleep. Paediatric continence nurse agreed pause. Will revisit only if Casey asks or if pattern remains after trauma work concludes.",
    medication:
      "No medication currently. Desmopressin (DesmoMelt) considered by paediatric continence service but deferred — preference is to allow trauma-informed approach time to work first. Reviewable at next consultant appointment.",
    externalSupportEngaged: [
      { service: "Paediatric Continence Service — Northgate Children's Hospital", clinician: "Nurse Specialist Priya Shah", frequency: "Every 3 months — next " + d(45) },
      { service: "ERIC (The Children's Bowel & Bladder Charity) — Helpline & online chat", clinician: "Various advisors; resources accessed by Anna", frequency: "Ad hoc, used by Anna for guidance" },
      { service: "GP — Northgate Health Centre", clinician: "Dr Helena Marsh", frequency: "Annually or as needed; aware of plan" },
      { service: "Casey's therapist — trauma-focused CBT", clinician: "Dr Iona Rees (private, LA-funded)", frequency: "Weekly; aware enuresis is trauma-linked" },
    ],
    childLanguageUsed:
      "Casey calls her pull-ups 'night pants'. She refers to wet nights as 'a tricky one'. Staff use ONLY Casey's words — never 'accident', 'wet the bed', 'dirty', 'soiled', or any clinical term in front of her or in her hearing.",
    privacyMeasures: [
      "ONLY Anna (key worker) and Edward (deputy/co-key worker) handle laundry, product stocking and bedding changes",
      "All other staff are aware Casey has a plan but NOT the detail — strictly need-to-know",
      "Bedding changes done in the morning AFTER Casey has left for school, or BEFORE she wakes if a weekend",
      "Soiled bedding placed straight into a closed laundry bag in Casey's room, carried to utility — never paraded through the home",
      "Casey's bedroom door always closed when changing bedding; never discussed in communal areas",
      "Other young people in the home have NEVER been told — this is Casey's information to share if and when she chooses",
      "Visitors, agency staff and inspectors are not briefed unless operationally essential",
      "Plan stored in encrypted health folder, not on the open key-worker shelf",
    ],
    laundryRoutine: [
      "Wet bedding goes straight in washing machine on a 60°C cotton cycle, separately from communal laundry",
      "Anna or Edward run the cycle BEFORE Casey wakes (weekends) or while she is at school (weekdays)",
      "Spare set always made up on the bed within 30 minutes — Casey's bed is always presented as 'made and ready'",
      "Mattress protector wiped with antibac and air-dried in Casey's room with door closed",
      "Pull-ups disposed of in a lidded nappy-bin in Casey's bathroom (changed daily by key worker)",
      "Laundry never left visible in shared utility — moved to dryer/airer immediately",
    ],
    staffDoStrategies: [
      "Greet Casey each morning the same way regardless of whether the night was dry or wet",
      "Use Casey's language ('night pants', 'tricky night') if she raises it",
      "If she mentions it, respond calmly: 'Thanks for telling me. All sorted.' — then change the subject to her day",
      "Make sure 'night pants' are always restocked BEFORE the pack is empty (Anna checks every Sunday)",
      "Praise effort and bravery in unrelated areas — never tie praise to a 'dry night'",
      "Read ERIC and NICE NG111 guidance during induction — refresh annually",
      "If Casey raises shame, reflect back: 'Lots of children your age have this. It's not your fault. Your body will get there.'",
    ],
    staffDoNotStrategies: [
      "NEVER use a sticker chart, star chart, or reward system tied to dry nights — NICE advises against and it shifts blame onto the child",
      "NEVER restrict fluids overnight",
      "NEVER wake Casey to use the toilet ('lifting') unless she has explicitly asked",
      "NEVER discuss the plan in front of other young people, in the kitchen, or where it could be overheard",
      "NEVER use the words 'wet', 'accident', 'dirty', 'soiled', 'baby', or 'big girl now' in any context related to this",
      "NEVER show frustration, sigh, or react when changing bedding — even subtle expressions are felt",
      "NEVER strip the bed in front of Casey",
      "NEVER mention this in handover meetings where non-essential staff are present",
    ],
    progressNotes: [
      d(-180) + " — Plan started; 6 wet nights in 7 (baseline)",
      d(-120) + " — Average 4 wet nights in 7; Casey first used the phrase 'night pants' herself",
      d(-90) + " — Alarm trial started",
      d(-60) + " — Alarm trial paused at Casey's request; she said 'it makes me feel scared'",
      d(-30) + " — Average 3 wet nights in 7; longer dry stretches around weekends with Anna on shift",
      d(-7) + " — First dry week in 14 months (7 consecutive dry nights). Not mentioned to Casey to avoid pressure on the next week",
    ],
    childVoice:
      "I don't really like talking about it. Anna says it's just my body still figuring stuff out, and that lots of people my age have it. The night pants are okay because they don't feel like nappies. I like that nobody else knows. I want to go on the residential next term and I'm a bit worried about it but Anna said we'd sort it.",
    staffObservation:
      "Casey's enuresis is clearly trauma-linked — onset coincided with arrival into care and pattern tracks emotional regulation rather than fluids or bladder function (ruled out clinically). Recent dry stretch is encouraging but we are deliberately not flagging it to Casey; pressure is the enemy here. The most important thing this plan does is preserve Casey's dignity. She has chosen to disclose to no one in the home, and that choice is held. Pre-emptive work needed for school residential next term — Anna to liaise discreetly with school nurse and trip lead. Plan to be reviewed in 90 days or sooner at Casey's request.",
    reviewDate: d(60),
    keyWorker: "staff_anna",
  },
  {
    id: "ccsp_002",
    youngPerson: "yp_alex",
    planDate: d(-365),
    presentation: "Resolved",
    presentationDuration: "Not applicable — no current presentation",
    triggersLinks: ["Not applicable"],
    productsInUse: ["Not applicable"],
    bedProtectionInUse: ["Standard mattress protector retained as routine household practice — not specific to Alex"],
    fluidPlan: ["Standard household fluid offers — 6–8 drinks across the day"],
    toiletingRoutines: ["Standard household routines — independent"],
    externalSupportEngaged: [],
    childLanguageUsed: "Not applicable",
    privacyMeasures: [
      "Plan retained on file as 'closed' — not actively in use",
      "No current need-to-know briefing",
    ],
    laundryRoutine: ["Standard household laundry — not applicable"],
    staffDoStrategies: ["No active strategies required"],
    staffDoNotStrategies: ["Do not raise historic continence issues unless Alex initiates"],
    progressNotes: [d(-365) + " — Plan closed; no presentation for 12+ months"],
    childVoice: "Not applicable — no current concerns raised by Alex.",
    staffObservation:
      "Plan retained for completeness only. Alex has had no continence-related concerns during placement. File closed and stored per retention policy.",
    reviewDate: d(180),
    keyWorker: "staff_marcus",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ChildContinenceSupportPlanPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPresentation, setFilterPresentation] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        getYPName(r.youngPerson).toLowerCase().includes(q) ||
        r.presentation.toLowerCase().includes(q) ||
        r.presentationDuration.toLowerCase().includes(q),
      );
    }
    if (filterPresentation !== "all") rows = rows.filter((r) => r.presentation === filterPresentation);
    rows.sort((a, b) =>
      sortBy === "newest"
        ? b.planDate.localeCompare(a.planDate)
        : a.planDate.localeCompare(b.planDate),
    );
    return rows;
  }, [data, search, filterPresentation, sortBy]);

  const activePlans = data.filter((r) => r.presentation !== "Resolved").length;
  const postTrauma = data.filter((r) => r.presentation === "Post-trauma onset").length;
  const externalEngaged = data.filter((r) => r.externalSupportEngaged.length > 0).length;
  const today = d(0);
  const ninetyDays = d(90);
  const reviewsDue90 = data.filter((r) => r.reviewDate >= today && r.reviewDate <= ninetyDays).length;

  const exportCols: ExportColumn<ContinencePlan>[] = [
    { header: "Young Person", accessor: (r: ContinencePlan) => getYPName(r.youngPerson) },
    { header: "Plan Date", accessor: (r: ContinencePlan) => r.planDate },
    { header: "Presentation", accessor: (r: ContinencePlan) => r.presentation },
    { header: "Duration", accessor: (r: ContinencePlan) => r.presentationDuration },
    { header: "Triggers / Links", accessor: (r: ContinencePlan) => r.triggersLinks.join("; ") },
    { header: "Products In Use", accessor: (r: ContinencePlan) => r.productsInUse.join("; ") },
    { header: "Bed Protection", accessor: (r: ContinencePlan) => r.bedProtectionInUse.join("; ") },
    { header: "Fluid Plan", accessor: (r: ContinencePlan) => r.fluidPlan.join("; ") },
    { header: "Toileting Routines", accessor: (r: ContinencePlan) => r.toiletingRoutines.join("; ") },
    { header: "Alarm Therapy", accessor: (r: ContinencePlan) => r.alarmTherapy ?? "—" },
    { header: "Medication", accessor: (r: ContinencePlan) => r.medication ?? "—" },
    { header: "External Support", accessor: (r: ContinencePlan) => r.externalSupportEngaged.map((e) => `${e.service} (${e.clinician}, ${e.frequency})`).join("; ") },
    { header: "Child Language", accessor: (r: ContinencePlan) => r.childLanguageUsed },
    { header: "Privacy Measures", accessor: (r: ContinencePlan) => r.privacyMeasures.join("; ") },
    { header: "Laundry Routine", accessor: (r: ContinencePlan) => r.laundryRoutine.join("; ") },
    { header: "Staff DO", accessor: (r: ContinencePlan) => r.staffDoStrategies.join("; ") },
    { header: "Staff DO NOT", accessor: (r: ContinencePlan) => r.staffDoNotStrategies.join("; ") },
    { header: "Progress Notes", accessor: (r: ContinencePlan) => r.progressNotes.join("; ") },
    { header: "Child Voice", accessor: (r: ContinencePlan) => r.childVoice },
    { header: "Staff Observation", accessor: (r: ContinencePlan) => r.staffObservation },
    { header: "Review Date", accessor: (r: ContinencePlan) => r.reviewDate },
    { header: "Key Worker", accessor: (r: ContinencePlan) => getStaffName(r.keyWorker) },
  ];

  return (
    <PageShell
      title="Child Continence Support Plan"
      subtitle="Per-child, dignity-led continence support · NICE NG111 · NICE CG99 · ERIC framework · UNCRC Art. 12, 16, 24"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Continence Support Plans" />
          <ExportButton data={data} columns={exportCols} filename="child-continence-support-plan" />
        </div>
      }
    >
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Plans", value: activePlans, icon: Droplet, clr: "text-sky-600" },
            { label: "Post-Trauma Onset", value: postTrauma, icon: Heart, clr: "text-teal-600" },
            { label: "External Support Engaged", value: externalEngaged, icon: Star, clr: "text-sky-700" },
            { label: "Reviews Due 90d", value: reviewsDue90, icon: Shield, clr: "text-teal-700" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search young person or presentation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterPresentation} onValueChange={setFilterPresentation}>
            <SelectTrigger className="w-[230px]"><SelectValue placeholder="Presentation" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Presentations</SelectItem>
              <SelectItem value="Nocturnal enuresis">Nocturnal enuresis</SelectItem>
              <SelectItem value="Daytime wetting">Daytime wetting</SelectItem>
              <SelectItem value="Encopresis (soiling)">Encopresis (soiling)</SelectItem>
              <SelectItem value="Mixed">Mixed</SelectItem>
              <SelectItem value="Post-trauma onset">Post-trauma onset</SelectItem>
              <SelectItem value="Developmental — being patient">Developmental — being patient</SelectItem>
              <SelectItem value="Resolving">Resolving</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const borderClr = r.presentation === "Resolved"
              ? "border-l-slate-300"
              : r.presentation === "Resolving"
                ? "border-l-teal-300"
                : "border-l-sky-400";
            return (
              <Card key={r.id} className={cn("border-l-4", borderClr)}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.youngPerson)}
                        <Badge variant="outline" className="bg-sky-100 text-sky-800">{r.presentation}</Badge>
                        {r.externalSupportEngaged.length > 0 && (
                          <Badge variant="outline" className="bg-teal-50 text-teal-700">External support engaged</Badge>
                        )}
                        {r.alarmTherapy && (
                          <Badge variant="outline" className="bg-sky-50 text-sky-700">Alarm trialled</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Plan: {r.planDate} · Key worker: {getStaffName(r.keyWorker)} · Review: {r.reviewDate}
                      </p>
                      <p className="text-xs text-muted-foreground italic">{r.presentationDuration}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div>
                      <p className="font-medium mb-1">Triggers / Links</p>
                      <ul className="space-y-0.5">
                        {r.triggersLinks.map((t, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {t}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded p-2 border border-sky-200 bg-sky-50">
                        <p className="text-xs font-semibold text-sky-900 mb-1">Products In Use</p>
                        <ul className="space-y-0.5">
                          {r.productsInUse.map((p, i) => (
                            <li key={i} className="text-xs text-sky-900">• {p}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded p-2 border border-teal-200 bg-teal-50">
                        <p className="text-xs font-semibold text-teal-900 mb-1">Bed Protection</p>
                        <ul className="space-y-0.5">
                          {r.bedProtectionInUse.map((b, i) => (
                            <li key={i} className="text-xs text-teal-900">• {b}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded p-2 border border-sky-200 bg-sky-50/60">
                        <p className="text-xs font-semibold text-sky-900 mb-1">Fluid Plan</p>
                        <ul className="space-y-0.5">
                          {r.fluidPlan.map((f, i) => (
                            <li key={i} className="text-xs text-sky-900">• {f}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded p-2 border border-teal-200 bg-teal-50/60">
                        <p className="text-xs font-semibold text-teal-900 mb-1">Toileting Routines</p>
                        <ul className="space-y-0.5">
                          {r.toiletingRoutines.map((t, i) => (
                            <li key={i} className="text-xs text-teal-900">• {t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded p-2 border bg-muted/30">
                        <p className="text-xs font-semibold mb-1">Alarm Therapy</p>
                        <p className="text-xs text-muted-foreground">
                          {r.alarmTherapy ?? "Not currently in use"}
                        </p>
                      </div>
                      <div className="rounded p-2 border bg-muted/30">
                        <p className="text-xs font-semibold mb-1">Medication</p>
                        <p className="text-xs text-muted-foreground">
                          {r.medication ?? "None currently prescribed"}
                        </p>
                      </div>
                    </div>

                    {r.externalSupportEngaged.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">External Support Engaged</p>
                        <div className="space-y-1">
                          {r.externalSupportEngaged.map((e, i) => (
                            <div key={i} className="border rounded p-2 text-xs">
                              <p className="font-semibold">{e.service}</p>
                              <p className="text-muted-foreground">{e.clinician} · {e.frequency}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded p-2 border border-sky-300 bg-sky-50">
                      <p className="text-xs font-semibold text-sky-900 mb-1">Child&apos;s Own Language</p>
                      <p className="text-xs text-sky-900">{r.childLanguageUsed}</p>
                    </div>

                    <div className="rounded p-3 border-2 border-teal-400 bg-teal-50">
                      <p className="text-xs font-semibold text-teal-900 mb-1 flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5" /> Privacy Measures — strictly upheld
                      </p>
                      <ul className="space-y-1">
                        {r.privacyMeasures.map((m, i) => (
                          <li key={i} className="text-xs text-teal-900">• {m}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded p-2 border border-sky-200 bg-sky-50/40">
                      <p className="text-xs font-semibold text-sky-900 mb-1">Laundry Routine</p>
                      <ul className="space-y-0.5">
                        {r.laundryRoutine.map((l, i) => (
                          <li key={i} className="text-xs text-sky-900">• {l}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded p-2 border border-teal-300 bg-teal-50">
                        <p className="text-xs font-semibold text-teal-900 mb-1">Staff DO</p>
                        <ul className="space-y-0.5">
                          {r.staffDoStrategies.map((s, i) => (
                            <li key={i} className="text-xs text-teal-900">• {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded p-2 border border-slate-300 bg-slate-50">
                        <p className="text-xs font-semibold text-slate-900 mb-1">Staff DO NOT</p>
                        <ul className="space-y-0.5">
                          {r.staffDoNotStrategies.map((s, i) => (
                            <li key={i} className="text-xs text-slate-800">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {r.progressNotes.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Progress Notes</p>
                        <ul className="space-y-0.5">
                          {r.progressNotes.map((p, i) => (
                            <li key={i} className="text-xs text-muted-foreground">• {p}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="font-medium text-xs text-purple-800 mb-1">Child&apos;s Voice</p>
                      <p className="text-xs text-purple-700 italic">&ldquo;{r.childVoice}&rdquo;</p>
                    </div>

                    <div className="bg-sky-50 border border-sky-200 rounded p-2">
                      <p className="font-medium text-xs text-sky-800 mb-1">Staff Observation</p>
                      <p className="text-xs text-sky-700">{r.staffObservation}</p>
                    </div>

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Plan logged by {getStaffName("staff_darren")} · Reviewed with {getStaffName(r.keyWorker)} · Next review: {r.reviewDate}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework — Continence Support</p>
          <p>
            Continence support for children in care must be dignity-led, child-paced and clinically informed. NICE NG111 (Bedwetting in under 19s) sets the standard for nocturnal enuresis: no fluid restriction, no punishment, no reward charts tied to dry nights, and a stepped approach progressing from reassurance and routine through alarm therapy to desmopressin only where appropriate. NICE CG99 (Constipation in children and young people) governs the assessment and management of soiling (encopresis), recognising that the majority of soiling presentations are secondary to underlying constipation and require disimpaction and maintenance regimens rather than behavioural interventions. The ERIC charity (The Children&apos;s Bowel &amp; Bladder Charity) provides the lived-experience framework most widely adopted in residential childcare and is the recommended source of resources, helpline support and family-facing language. Children&apos;s Homes (England) Regulations 2015, Quality Standard 8 (Health and wellbeing) requires the registered person to ensure each child receives healthcare that meets their needs, provided in a way that respects their dignity. UNCRC Article 12 (right to be heard), Article 16 (right to privacy) and Article 24 (right to the highest attainable standard of health) are central — privacy is not a soft consideration but a binding right, and continence presentations carry deep risk of shame that staff must actively guard against. Where presentation is post-trauma in onset, the plan must be held alongside the child&apos;s therapeutic work and never treated as a behavioural issue. Plans must be reviewed at least every 6 months, after every significant change, and at the child&apos;s request.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
