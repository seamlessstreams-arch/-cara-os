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
  Cigarette, Heart, Activity, ChevronUp, ChevronDown, ArrowUpDown, Search, Shield, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

interface SmokingRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  status:
    | "Never used"
    | "Tried — not regular"
    | "Occasional vape"
    | "Regular vape"
    | "Occasional cigarette"
    | "Regular cigarette"
    | "Multiple substances"
    | "Stopped"
    | "In stop programme";
  substancesUsed: string[];
  estimatedFrequency?: string;
  triggersIdentified: string[];
  briefInterventionDelivered: boolean;
  briefInterventionDate?: string;
  stopSmokingReferral?: {
    service: string;
    clinicianName?: string;
    status: "Referred" | "Engaged" | "Discharged" | "Declined";
  };
  harmReductionStrategies: string[];
  homePolicyReinforcement: string[];
  externalSupport: string[];
  childAttitude:
    | "Openly dismissive"
    | "Mixed"
    | "Curious about quitting"
    | "Building motivation"
    | "Actively quitting"
    | "Quit > 6 months";
  childVoice: string;
  staffObservation: string;
  flagsConcerns: string[];
  reviewDate: string;
  keyWorker: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: SmokingRecord[] = [
  {
    id: "smk_001",
    youngPerson: "yp_jordan",
    recordedDate: d(-30),
    status: "Never used",
    substancesUsed: [],
    triggersIdentified: [],
    briefInterventionDelivered: true,
    briefInterventionDate: d(-30),
    harmReductionStrategies: [
      "Conversation framed around Jordan's existing identity — football, mosque attendance, fitness goals",
      "Discussed how vaping/smoking would affect lung capacity for football",
      "Open question: 'What would you do if a mate offered you a vape?' — Jordan rehearsed refusal scripts",
      "Reinforced that nothing he says will be punished — staff want to know so they can support him",
    ],
    homePolicyReinforcement: [
      "Oak House is a smoke-free and vape-free home (indoors and on grounds)",
      "Adults model behaviour — no staff smoking in front of children, no smell of smoke on clothes",
      "Vapes/cigarettes found will be safely stored and returned to a parent / discussed at next meeting, not destroyed punitively",
    ],
    externalSupport: [
      "School PSHE drug education curriculum (already engaged)",
      "Mosque youth group — peer-positive identity reinforcement",
      "Football club — fitness/health rationale built in",
    ],
    childAttitude: "Quit > 6 months",
    childVoice: "I've never tried it and I don't want to. My dad smoked and his lungs were rough. I'd rather spend my money on football boots. The lads at the mosque don't vape either so it's not really around me.",
    staffObservation: "Preventative conversation only. Jordan presents with strong protective factors — religious identity, sporting goals, peer group that does not normalise vaping. No indication of use, no smell on clothes or in bedroom, no devices found. Conversation logged for completeness and to ensure annual screening trail. Watchful — particularly around school transitions and any future peer group changes.",
    flagsConcerns: [],
    reviewDate: d(335),
    keyWorker: "staff_marcus",
  },
  {
    id: "smk_002",
    youngPerson: "yp_alex",
    recordedDate: d(-14),
    status: "Tried — not regular",
    substancesUsed: ["Disposable vape (fruit flavour, 20mg/ml nicotine — Elf Bar style)"],
    estimatedFrequency: "Tried twice in two weeks at boxing gym; not used since (14 days clear)",
    triggersIdentified: [
      "Social — older lads at boxing gym share a vape between rounds",
      "Curiosity — wanted to know what the flavour was like",
      "Anxiety regulation — Alex has noticed peers using vapes when stressed pre-fight",
    ],
    briefInterventionDelivered: true,
    briefInterventionDate: d(-14),
    harmReductionStrategies: [
      "Open, non-judgmental conversation — Alex disclosed use voluntarily, which is the win",
      "Brief intervention (NICE NG209): asked, advised, assessed, assisted, arranged follow-up",
      "Discussed nicotine content of disposables (one Elf Bar ≈ 20 cigarettes worth of nicotine)",
      "Explored why people vape — anxiety regulation, social belonging, sensory enjoyment — and named alternatives Alex already uses (boxing, music, talking to key worker)",
      "Agreed Alex will tell key worker if offered again, and will not carry a device into the home",
      "Reframed: 'You're not in trouble. You told us. That makes it easier for us to help you make the choice that's right for you.'",
    ],
    homePolicyReinforcement: [
      "Smoke-free / vape-free home reaffirmed without lecture",
      "Devices not to be brought into the home — if offered one, hand to staff or dispose at gym",
      "No punishment for honesty — log entry frames disclosure as positive trust-building",
    ],
    externalSupport: [
      "Boxing coach informed (with Alex's permission) — coach now monitors changing room culture",
      "School pastoral lead aware — Alex can access drop-in if anxiety spikes",
      "Stop Smoking service NOT yet referred — Alex is not nicotine-dependent and active referral could pathologise experimentation",
    ],
    childAttitude: "Curious about quitting",
    childVoice: "It tasted alright but it made me a bit dizzy. I don't really want to do it again because I'm trying to get fitter for boxing and it's expensive. I'm telling you because you said I could and you wouldn't go mad. I just didn't want to be the only one not doing it.",
    staffObservation: "Alex disclosed use voluntarily during a key-work session — significant trust marker. Behaviour-first response: praised honesty, did not consequence. Brief intervention delivered following NICE NG209 5-As model. Two-week follow-up showed no further use. Watchful, not punitive. If frequency increases or nicotine dependence develops, will refer to NHS Stop Smoking service (free for under-25s). Worth noting Alex's identification of anxiety regulation as a peer driver — this aligns with what we already know about the boxing gym social dynamic.",
    flagsConcerns: [
      "Peer-group exposure at boxing gym — social use is normalised in that space",
      "Watchful for any escalation; review in 4 weeks",
    ],
    reviewDate: d(14),
    keyWorker: "staff_anna",
  },
  {
    id: "smk_003",
    youngPerson: "yp_casey",
    recordedDate: d(-45),
    status: "Never used",
    substancesUsed: [],
    triggersIdentified: [],
    briefInterventionDelivered: true,
    briefInterventionDate: d(-45),
    harmReductionStrategies: [
      "Age-appropriate (12) preventative conversation — focus on lungs, taste, cost, addiction",
      "Used the school 'Decision' programme materials — Casey already familiar from Year 7 PSHE",
      "Refusal-skills role-play — what to say if a Year 9 offers a vape on the bus",
      "Talked about colourful packaging and fruit flavours being deliberately marketed to young people",
    ],
    homePolicyReinforcement: [
      "Smoke-free / vape-free home — explained as caring rule, not punishment rule",
      "Casey shown where adults can go for help (key worker, school nurse, GP) if she ever needs to talk about it",
    ],
    externalSupport: [
      "School PSHE — anti-smoking module already covered Spring term",
      "School nurse drop-in — Casey has used this for other matters and knows the route",
    ],
    childAttitude: "Quit > 6 months",
    childVoice: "We did vapes at school. Mrs Khan said they wreck your lungs and the colours are a trick to get kids to buy them. I think they smell weird anyway. Some of the older girls at school do it but I don't want to.",
    staffObservation: "Casey, age 12, has had robust school-based education and presents with clear understanding and protective attitudes. No indication of use. Annual screening conversation logged preventatively — important to capture even when result is negative, so trend data exists if circumstances change. Conversation kept light and short — over-emphasising the topic with a 12-year-old who is not at risk would be counterproductive.",
    flagsConcerns: [],
    reviewDate: d(320),
    keyWorker: "staff_anna",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ChildSmokingVapingTrackerPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        getYPName(r.youngPerson).toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.substancesUsed.some((s) => s.toLowerCase().includes(q)) ||
        r.triggersIdentified.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) =>
      sortBy === "newest"
        ? b.recordedDate.localeCompare(a.recordedDate)
        : a.recordedDate.localeCompare(b.recordedDate),
    );
    return rows;
  }, [data, search, filterStatus, sortBy]);

  const childrenScreened = data.length;
  const regularUsers = data.filter((r) =>
    r.status === "Regular vape" ||
    r.status === "Regular cigarette" ||
    r.status === "Multiple substances",
  ).length;
  const inStopProgramme = data.filter((r) => r.status === "In stop programme").length;
  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  const briefInterventionsYTD = data.filter(
    (r) => r.briefInterventionDelivered && r.briefInterventionDate && new Date(r.briefInterventionDate) >= yearStart,
  ).length;

  const exportCols: ExportColumn<SmokingRecord>[] = [
    { header: "Young Person", accessor: (r: SmokingRecord) => getYPName(r.youngPerson) },
    { header: "Recorded Date", accessor: (r: SmokingRecord) => r.recordedDate },
    { header: "Status", accessor: (r: SmokingRecord) => r.status },
    { header: "Substances Used", accessor: (r: SmokingRecord) => r.substancesUsed.join("; ") },
    { header: "Estimated Frequency", accessor: (r: SmokingRecord) => r.estimatedFrequency ?? "—" },
    { header: "Triggers Identified", accessor: (r: SmokingRecord) => r.triggersIdentified.join("; ") },
    { header: "Brief Intervention", accessor: (r: SmokingRecord) => r.briefInterventionDelivered ? "Yes" : "No" },
    { header: "Brief Intervention Date", accessor: (r: SmokingRecord) => r.briefInterventionDate ?? "—" },
    { header: "Stop Smoking Referral", accessor: (r: SmokingRecord) => r.stopSmokingReferral ? `${r.stopSmokingReferral.service} (${r.stopSmokingReferral.status})` : "—" },
    { header: "Harm Reduction Strategies", accessor: (r: SmokingRecord) => r.harmReductionStrategies.join("; ") },
    { header: "Home Policy Reinforcement", accessor: (r: SmokingRecord) => r.homePolicyReinforcement.join("; ") },
    { header: "External Support", accessor: (r: SmokingRecord) => r.externalSupport.join("; ") },
    { header: "Child Attitude", accessor: (r: SmokingRecord) => r.childAttitude },
    { header: "Child Voice", accessor: (r: SmokingRecord) => r.childVoice },
    { header: "Staff Observation", accessor: (r: SmokingRecord) => r.staffObservation },
    { header: "Flags / Concerns", accessor: (r: SmokingRecord) => r.flagsConcerns.join("; ") },
    { header: "Review Date", accessor: (r: SmokingRecord) => r.reviewDate },
    { header: "Key Worker", accessor: (r: SmokingRecord) => getStaffName(r.keyWorker) },
  ];

  return (
    <PageShell
      title="Child Smoking & Vaping Tracker"
      subtitle="Per-child screening · Brief intervention model · NICE NG209 · Behaviour-first, not punitive"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Smoking & Vaping Tracker" />
          <ExportButton data={data} columns={exportCols} filename="child-smoking-vaping-tracker" />
        </div>
      }
    >
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Children Screened", value: childrenScreened, icon: Shield, clr: "text-sky-600" },
            { label: "Regular Users", value: regularUsers, icon: AlertTriangle, clr: "text-amber-600" },
            { label: "In Stop Programme", value: inStopProgramme, icon: Heart, clr: "text-teal-600" },
            { label: "Brief Interventions YTD", value: briefInterventionsYTD, icon: Activity, clr: "text-sky-600" },
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
              placeholder="Search young person, status, substance or trigger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Never used">Never used</SelectItem>
              <SelectItem value="Tried — not regular">Tried — not regular</SelectItem>
              <SelectItem value="Occasional vape">Occasional vape</SelectItem>
              <SelectItem value="Regular vape">Regular vape</SelectItem>
              <SelectItem value="Occasional cigarette">Occasional cigarette</SelectItem>
              <SelectItem value="Regular cigarette">Regular cigarette</SelectItem>
              <SelectItem value="Multiple substances">Multiple substances</SelectItem>
              <SelectItem value="Stopped">Stopped</SelectItem>
              <SelectItem value="In stop programme">In stop programme</SelectItem>
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
            const borderClr =
              r.status === "Regular vape" || r.status === "Regular cigarette" || r.status === "Multiple substances"
                ? "border-l-amber-500"
                : r.status === "In stop programme" || r.status === "Stopped"
                  ? "border-l-teal-500"
                  : "border-l-sky-400";
            const statusBadgeClr =
              r.status === "Regular vape" || r.status === "Regular cigarette" || r.status === "Multiple substances"
                ? "bg-amber-100 text-amber-800"
                : r.status === "In stop programme" || r.status === "Stopped"
                  ? "bg-teal-100 text-teal-800"
                  : "bg-sky-100 text-sky-800";
            return (
              <Card key={r.id} className={cn("border-l-4", borderClr)}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.youngPerson)}
                        <Badge variant="outline" className={statusBadgeClr}>{r.status}</Badge>
                        {r.briefInterventionDelivered && (
                          <Badge variant="outline" className="bg-sky-50 text-sky-700">Brief intervention delivered</Badge>
                        )}
                        <Badge variant="outline" className="bg-teal-50 text-teal-700">{r.childAttitude}</Badge>
                        {r.stopSmokingReferral && (
                          <Badge variant="outline" className="bg-teal-100 text-teal-800">
                            Stop service: {r.stopSmokingReferral.status}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Recorded: {r.recordedDate} · Key worker: {getStaffName(r.keyWorker)} · Review: {r.reviewDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.flagsConcerns.length > 0 && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800">
                          {r.flagsConcerns.length} flag{r.flagsConcerns.length === 1 ? "" : "s"}
                        </Badge>
                      )}
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {r.substancesUsed.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Cigarette className="h-3.5 w-3.5 text-amber-600" /> Substances Used
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {r.substancesUsed.map((s, i) => (
                            <Badge key={i} variant="outline" className="bg-amber-50 text-amber-800">{s}</Badge>
                          ))}
                        </div>
                        {r.estimatedFrequency && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">Frequency: </span>{r.estimatedFrequency}
                          </p>
                        )}
                      </div>
                    )}

                    {r.triggersIdentified.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Triggers Identified
                        </p>
                        <ul className="space-y-0.5">
                          {r.triggersIdentified.map((t, i) => (
                            <li key={i} className="text-xs text-muted-foreground">• {t}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="rounded p-2 border border-sky-200 bg-sky-50">
                      <p className="text-xs font-semibold text-sky-900 mb-1 flex items-center gap-1">
                        <Activity className="h-3 w-3" /> Brief Intervention (NICE NG209)
                      </p>
                      {r.briefInterventionDelivered ? (
                        <p className="text-xs text-sky-800">
                          Delivered{r.briefInterventionDate ? ` on ${r.briefInterventionDate}` : ""} —
                          {" "}5-As model: Ask, Advise, Assess, Assist, Arrange follow-up.
                        </p>
                      ) : (
                        <p className="text-xs italic text-sky-800">Not yet delivered — schedule with key worker</p>
                      )}
                    </div>

                    {r.stopSmokingReferral && (
                      <div className="rounded p-2 border border-teal-200 bg-teal-50">
                        <p className="text-xs font-semibold text-teal-900 mb-1">Stop Smoking Service Referral</p>
                        <p className="text-xs text-teal-800">
                          <span className="font-medium">Service: </span>{r.stopSmokingReferral.service}
                        </p>
                        {r.stopSmokingReferral.clinicianName && (
                          <p className="text-xs text-teal-800">
                            <span className="font-medium">Clinician: </span>{r.stopSmokingReferral.clinicianName}
                          </p>
                        )}
                        <p className="text-xs text-teal-800">
                          <span className="font-medium">Status: </span>{r.stopSmokingReferral.status}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-sky-50 border border-sky-200 rounded p-2">
                        <p className="font-medium text-xs text-sky-900 mb-1 flex items-center gap-1">
                          <Heart className="h-3 w-3" /> Harm Reduction Strategies
                        </p>
                        <ul className="space-y-0.5">
                          {r.harmReductionStrategies.map((h, i) => (
                            <li key={i} className="text-xs text-sky-800">• {h}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-teal-50 border border-teal-200 rounded p-2">
                        <p className="font-medium text-xs text-teal-900 mb-1 flex items-center gap-1">
                          <Shield className="h-3 w-3" /> Home Policy Reinforcement
                        </p>
                        <ul className="space-y-0.5">
                          {r.homePolicyReinforcement.map((h, i) => (
                            <li key={i} className="text-xs text-teal-800">• {h}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {r.externalSupport.length > 0 && (
                      <div className="bg-muted/30 rounded p-2">
                        <p className="text-xs font-medium mb-1">External Support</p>
                        <ul className="space-y-0.5">
                          {r.externalSupport.map((e, i) => (
                            <li key={i} className="text-xs text-muted-foreground">• {e}</li>
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

                    {r.flagsConcerns.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-2">
                        <p className="font-medium text-xs text-amber-900 mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Flags &amp; Concerns
                        </p>
                        <ul className="space-y-0.5">
                          {r.flagsConcerns.map((f, i) => (
                            <li key={i} className="text-xs text-amber-800">• {f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Logged by {getStaffName("staff_darren")} · Reviewed with {getStaffName(r.keyWorker)} · Next review: {r.reviewDate}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework — Smoking, Vaping &amp; Harm Reduction</p>
          <p>
            NICE NG209 (Tobacco: preventing uptake, promoting quitting and treating dependence, 2021) is the controlling guidance and recommends a brief intervention model — Ask, Advise, Assess, Assist, Arrange — at every contact with a young person who uses tobacco or vapes nicotine. Local NHS Stop Smoking services are free at point of use and accept self-referral or professional referral from age 12 upward; behavioural support combined with appropriate nicotine-replacement therapy (where clinically indicated) gives the strongest evidence base for cessation. Children&apos;s Homes (England) Regulations 2015 Quality Standard 8 (Health and wellbeing) requires the registered person to ensure each child receives healthcare that meets their needs, including help to make positive lifestyle choices, and Quality Standard 9 (Positive relationships) underpins a behaviour-first, non-punitive approach which is essential to honest disclosure. The Children and Families Act 2014 sections 91-92 prohibit smoking in private vehicles carrying anyone under 18. The Tobacco and Vapes Bill (in progress through Parliament) is expected to raise the legal age of sale of tobacco progressively and to restrict disposable vape design and marketing aimed at children. UNCRC Article 24 recognises the right of every child to the highest attainable standard of health, and Article 12 the right to be heard — both require that the child&apos;s voice and identity (peer group, faith, sport, sexuality) shape the response, rather than a one-size-fits-all warning. Cannabis vape detection requires a sensitive safeguarding response and may trigger separate substance-misuse referral pathways alongside this record.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
