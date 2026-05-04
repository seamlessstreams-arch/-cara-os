"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle, CheckCircle2,
  Search, Shield, Heart, Scale, ShieldAlert, FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type TargetType = "Young person" | "Staff" | "Visitor";
type PerpetratorType = "External community" | "Peer at school" | "Visitor" | "Other YP" | "Staff" | "Online";
type IncidentType = "Racist" | "Homophobic/Transphobic" | "Religious" | "Disability-related" | "Antisemitic" | "Misogynistic" | "Other";
type Status = "Open" | "Closed - resolved" | "Closed - escalated";

interface HateIncident {
  id: string;
  date: string;
  time: string;
  location: string;
  targetType: TargetType;
  targetIdentity: string;
  perpetratorType: PerpetratorType;
  incidentType: IncidentType;
  description: string;
  affectedPersonResponse: string;
  supportProvided: string[];
  reportedBy: string;
  reportedToPolice: boolean;
  policeReference: string;
  reportedToOfsted: boolean;
  reportedToLA: boolean;
  schoolNotified: boolean;
  restorativeApproach: string;
  perpetratorAddressed: string;
  preventionMeasuresAdded: string[];
  followUpDate: string;
  status: Status;
  learnings: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TYPE_CLR: Record<IncidentType, string> = {
  "Racist": "bg-red-100 text-red-800",
  "Homophobic/Transphobic": "bg-purple-100 text-purple-800",
  "Religious": "bg-amber-100 text-amber-800",
  "Disability-related": "bg-blue-100 text-blue-800",
  "Antisemitic": "bg-orange-100 text-orange-800",
  "Misogynistic": "bg-pink-100 text-pink-800",
  "Other": "bg-slate-100 text-slate-800",
};

const STATUS_CLR: Record<Status, string> = {
  "Open": "bg-amber-100 text-amber-800",
  "Closed - resolved": "bg-green-100 text-green-800",
  "Closed - escalated": "bg-red-100 text-red-800",
};

const STATUS_BORDER: Record<Status, string> = {
  "Open": "border-l-amber-400",
  "Closed - resolved": "border-l-green-400",
  "Closed - escalated": "border-l-red-500",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: HateIncident[] = [
  {
    id: "hi_001",
    date: d(-62),
    time: "14:35",
    location: "Oakwood Academy — school playground",
    targetType: "Young person",
    targetIdentity: "Mixed-heritage Black male YP",
    perpetratorType: "Peer at school",
    incidentType: "Racist",
    description: "Two Year 10 peers used a racial slur (the n-word) towards Alex during lunch break, then made comments about his hair. A third peer filmed part of the incident on a phone. Alex walked away and reported it to a teaching assistant within 10 minutes.",
    affectedPersonResponse: "Alex was visibly upset on return to the home — quiet, withdrew to his bedroom. Said he felt 'tired of having to deal with this' and that it 'wasn't the first time' those peers had made comments. Initially did not want to make a 'big deal' of it.",
    supportProvided: [
      "Immediate emotional support and key-work session same evening with Anna",
      "Reassurance that the behaviour was wrong and that reporting was the right thing to do",
      "Offered choice of trusted adult to lead follow-up conversations",
      "Connected Alex with the home's anti-racism resource pack and identity-affirming books",
      "Phone call with Alex's mum to keep her informed and aligned",
    ],
    reportedBy: "staff_anna",
    reportedToPolice: true,
    policeReference: "MET/2026/HC/4421",
    reportedToOfsted: true,
    reportedToLA: true,
    schoolNotified: true,
    restorativeApproach: "Alex declined a face-to-face restorative meeting with the perpetrators (his choice — fully respected). School arranged a separate restorative process with the perpetrators' families. Alex agreed to a written apology being read to him by a teacher he trusts.",
    perpetratorAddressed: "Handled by school under their behaviour policy and hate-incident protocol. Both perpetrators received fixed-term exclusions. School ran an anti-racism workshop for the year group. The peer who filmed received a separate sanction and the footage was deleted.",
    preventionMeasuresAdded: [
      "Anti-racism reading and conversation built into Alex's monthly key-work plan (only with his consent)",
      "Home staff briefed on identity-affirming responses for mixed-heritage YP",
      "RM raised pattern with school SLT — termly review of incidents involving Alex",
      "Alex offered (and accepted) a mentor from a local mixed-heritage youth project",
    ],
    followUpDate: d(-30),
    status: "Closed - resolved",
    learnings: "Alex's instinct to minimise reflects how often Black YP are expected to absorb racism. Staff response must consistently name it as hate, never frame it as 'banter'. Police reference logged for pattern monitoring even though Alex did not want to pursue prosecution — this respects his autonomy while preserving the record.",
  },
  {
    id: "hi_002",
    date: d(-41),
    time: "17:50",
    location: "Local high street — outside corner shop",
    targetType: "Young person",
    targetIdentity: "South Asian female YP wearing hijab",
    perpetratorType: "External community",
    incidentType: "Religious",
    description: "An adult man (white, approx 40s) shouted at Casey while she was walking back to the home with Ryan, telling her to 'go back where you came from' and making derogatory remarks about her hijab. He then spat on the pavement near her. The man walked off towards the bus stop. Casey is British-born; she had been to the shop for sweets.",
    affectedPersonResponse: "Casey was shaken and tearful. Said she felt 'small' and 'wrong for being out'. Did not want to take her hijab off but said she felt scared to walk that route alone. Asked Ryan not to tell other YP at the home because she didn't want to be 'the racism story'.",
    supportProvided: [
      "Ryan stayed close and walked Casey back at her pace, validating her feelings without minimising",
      "Same-evening 1:1 with female staff member (Anna) of Casey's choosing",
      "Casey's wishes about confidentiality respected — only need-to-know staff briefed",
      "Faith-affirming check-in: did she want to speak to her local mosque's youth worker (yes)",
      "Calming sensory items and a hot drink offered; Casey chose to journal",
      "Home offered to accompany Casey on that route until she felt comfortable alone again",
    ],
    reportedBy: "staff_ryan",
    reportedToPolice: true,
    policeReference: "MET/2026/HC/4587",
    reportedToOfsted: false,
    reportedToLA: true,
    schoolNotified: false,
    restorativeApproach: "Not applicable — perpetrator unknown to Casey and not identified. Casey chose to write a private letter (not sent) as part of her own processing.",
    perpetratorAddressed: "CCTV from the shop and bus stop reviewed by police. Description circulated. No identification at time of writing. Police victim-care officer assigned and offered a follow-up call.",
    preventionMeasuresAdded: [
      "Risk assessment of Casey's regular routes updated with safer alternatives",
      "Staff briefed on accompanying Casey discreetly without making her feel surveilled",
      "Casey added to local police 'community trigger' watchlist (with her consent) so repeat incidents in the area escalate faster",
      "Anti-Muslim hate awareness session added to next staff team meeting",
    ],
    followUpDate: d(-14),
    status: "Closed - resolved",
    learnings: "A child's right to wear faith-based dress without fear is non-negotiable. Casey's request not to be 'the racism story' is important — staff must be careful not to over-share an incident across the team in ways that re-traumatise. Reporting was led by Casey's wishes at every step.",
  },
  {
    id: "hi_003",
    date: d(-18),
    time: "21:10",
    location: "Online — Discord gaming server",
    targetType: "Young person",
    targetIdentity: "White male YP, openly bisexual",
    perpetratorType: "Online",
    incidentType: "Homophobic/Transphobic",
    description: "While playing online, Jordan was sent a string of homophobic slurs in voice chat by another user after he mentioned a male crush. The user then sent a private message containing a homophobic slur and a threat to 'find out where he lives'. Jordan screenshotted the messages and immediately came downstairs to tell Edward (night staff).",
    affectedPersonResponse: "Jordan was angry and unsettled — particularly by the threat. Said it had 'ruined' a game he uses to relax. Worried it would happen again if he mentioned being bi online. Asked whether he should 'just not say it' next time. Was clear he did not want to be told to come off the platform.",
    supportProvided: [
      "Edward validated Jordan's feelings and explicitly told him being out was not the problem",
      "Same-evening message to Darren (RM) so a plan could be in place by morning",
      "Joint conversation next day about online safety without shaming Jordan's identity",
      "Connected Jordan with an LGBTQ+ youth helpline he can use confidentially",
      "Pride-affirming books and a small rainbow pin offered (Jordan accepted the pin)",
      "Jordan's existing key worker Anna ran a session on online hate vs healthy disclosure",
    ],
    reportedBy: "staff_ryan",
    reportedToPolice: true,
    policeReference: "ONL/2026/HC/0912",
    reportedToOfsted: false,
    reportedToLA: true,
    schoolNotified: false,
    restorativeApproach: "Not applicable — perpetrator anonymous. Jordan reported the user to Discord with staff support; account was banned within 48 hours. Jordan chose to keep playing on the same server with privacy settings adjusted.",
    perpetratorAddressed: "Reported to Discord Trust & Safety with screenshots; account suspended. Police logged the threat and gave Jordan a crime reference number; no identifiable suspect at this stage.",
    preventionMeasuresAdded: [
      "Jordan's online safety plan updated — privacy settings, blocking workflow, screenshot-and-report habit",
      "Home staff training note: never frame the answer to homophobic abuse as 'don't say you're bi'",
      "Pride flag and inclusive welcome statement added to the home noticeboard at Jordan's suggestion",
      "Reg 44 visitor briefed on the incident and home's response (anonymised)",
    ],
    followUpDate: d(2),
    status: "Open",
    learnings: "Online hate is real hate. Staff response must protect Jordan's right to be openly bi, not police it. Jordan asking 'should I just not say it' is itself a sign of harm — the answer is always no, and the home's job is to make the world (and our home) safer, not to ask him to shrink.",
  },
  {
    id: "hi_004",
    date: d(-9),
    time: "15:20",
    location: "Oakwood Academy — corridor outside RE classroom",
    targetType: "Young person",
    targetIdentity: "Jewish male YP",
    perpetratorType: "Peer at school",
    incidentType: "Antisemitic",
    description: "A Year 11 peer made an antisemitic remark towards Alex during a corridor exchange about a recent news story, then drew a swastika in the margin of Alex's exercise book when Alex briefly left the desk. Alex saw it on return and showed the teacher immediately. The peer was overheard laughing about it to two friends.",
    affectedPersonResponse: "Alex was outwardly calm but described feeling 'numb' and said it was 'the third stupid thing this year'. Said he was tired of explaining why a swastika is not a joke. Did want it formally recorded — was clear that he wanted school and the home to take it seriously.",
    supportProvided: [
      "Immediate emotional check-in with Anna; Alex chose a quiet evening with no demands",
      "RM contacted school SLT same afternoon to align on response",
      "Exercise book page photographed for evidence then replaced (Alex did not want to keep it)",
      "Alex offered a session with a community antisemitism education charity (accepted)",
      "Home re-affirmed in writing (note in Alex's room) that this home stands against antisemitism",
      "Family liaison call with Alex's grandfather (Holocaust survivor relative) handled by Alex's choice of staff",
    ],
    reportedBy: "staff_darren",
    reportedToPolice: true,
    policeReference: "MET/2026/HC/4910",
    reportedToOfsted: true,
    reportedToLA: true,
    schoolNotified: true,
    restorativeApproach: "Alex agreed to a structured restorative meeting only on the condition that the peer first complete an antisemitism education module — Alex did not want to be the one teaching. School agreed. Meeting scheduled for follow-up date.",
    perpetratorAddressed: "School issued a fixed-term exclusion and is following its hate-incident policy. Peer required to complete antisemitism education before any restorative meeting. Parents invited to a separate meeting with school SLT.",
    preventionMeasuresAdded: [
      "RM requested termly hate-incident review meeting with school covering all faiths",
      "Home staff CPD session on antisemitism scheduled — beyond Holocaust-only framing",
      "Alex's wishes about pace and confidentiality recorded in his care plan as standing instructions",
      "Whole-school assembly on antisemitism agreed by school for next half term",
    ],
    followUpDate: d(5),
    status: "Open",
    learnings: "Pattern of repeated incidents for Alex (this is the third) means we must escalate beyond single-incident responses. The home's job is not just to support after the fact but to push systems — school, LA, police — to take cumulative harm seriously. Alex's clarity about not wanting to be the educator is a boundary we protect.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function HateIncidentLogPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.description.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.targetIdentity.toLowerCase().includes(q) ||
        getStaffName(r.reportedBy).toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") rows = rows.filter((r) => r.incidentType === filterType);
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) => sortBy === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
    return rows;
  }, [data, search, filterType, filterStatus, sortBy]);

  /* ── stats (12 month window) ────────────────────────────────────────────── */
  const cutoff12mo = d(-365);
  const last12 = data.filter((r) => r.date >= cutoff12mo);
  const cutoffQ = d(-90);
  const thisQuarter = data.filter((r) => r.date >= cutoffQ).length;
  const policeReported = last12.filter((r) => r.reportedToPolice).length;
  const closed = last12.filter((r) => r.status !== "Open").length;
  const resolvedPct = last12.length === 0 ? 0 : Math.round((closed / last12.length) * 100);

  const exportCols: ExportColumn<HateIncident>[] = [
    { header: "Date", accessor: (r: HateIncident) => r.date },
    { header: "Time", accessor: (r: HateIncident) => r.time },
    { header: "Location", accessor: (r: HateIncident) => r.location },
    { header: "Target", accessor: (r: HateIncident) => `${r.targetType} — ${r.targetIdentity}` },
    { header: "Perpetrator", accessor: (r: HateIncident) => r.perpetratorType },
    { header: "Type", accessor: (r: HateIncident) => r.incidentType },
    { header: "Reported By", accessor: (r: HateIncident) => getStaffName(r.reportedBy) },
    { header: "Police", accessor: (r: HateIncident) => r.reportedToPolice ? r.policeReference || "Yes" : "No" },
    { header: "Ofsted", accessor: (r: HateIncident) => r.reportedToOfsted ? "Yes" : "No" },
    { header: "LA", accessor: (r: HateIncident) => r.reportedToLA ? "Yes" : "No" },
    { header: "School", accessor: (r: HateIncident) => r.schoolNotified ? "Yes" : "No" },
    { header: "Status", accessor: (r: HateIncident) => r.status },
    { header: "Follow-up", accessor: (r: HateIncident) => r.followUpDate },
  ];

  const openCount = data.filter((r) => r.status === "Open").length;

  return (
    <PageShell
      title="Hate Incident Log"
      subtitle="Equality Act 2010 · Quality Standard 5 (Protection) · Public Sector Equality Duty"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Hate Incident Log" />
          <ExportButton data={data} columns={exportCols} filename="hate-incident-log" />
        </div>
      }
    >
      <div id="print-area">
        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Incidents (12 mo)", value: last12.length, icon: FileWarning, clr: "text-red-600" },
            { label: "This Quarter", value: thisQuarter, icon: AlertTriangle, clr: "text-amber-600" },
            { label: "Police-reported", value: policeReported, icon: Scale, clr: "text-blue-600" },
            { label: "Resolved %", value: `${resolvedPct}%`, icon: CheckCircle2, clr: "text-green-600" },
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

        {/* sensitive note — child's right */}
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <Heart className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-rose-800">Reporting hate incidents is a child&apos;s right, not optional</p>
            <p className="text-rose-700">
              Every child living here has the right to be free from prejudice and to have hate against them
              taken seriously, recorded, and acted upon. Staff must never minimise, frame as &quot;banter&quot;,
              or place the burden of proof on the child. The child&apos;s wishes about how to respond
              (police, restorative, confidentiality, pace) lead the process — but the duty to record and learn is ours.
            </p>
          </div>
        </div>

        {/* open alert */}
        {openCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{openCount} open incident(s) requiring follow-up</p>
              <p className="text-amber-700">
                Open hate incidents must be reviewed at every supervision and every Reg 44 visit until closure.
                Check that the affected child still feels supported and that agreed prevention measures are in place.
              </p>
            </div>
          </div>
        )}

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search incidents..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Incident type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {(Object.keys(TYPE_CLR) as IncidentType[]).map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(STATUS_CLR) as Status[]).map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* incident cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", STATUS_BORDER[r.status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {r.incidentType}
                        <Badge variant="outline" className={TYPE_CLR[r.incidentType]}>{r.targetType}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{r.status}</Badge>
                        {r.reportedToPolice && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                            <Scale className="h-3 w-3 mr-1" />Police
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.date} {r.time} · {r.location}
                        {" "}· Target: {r.targetIdentity}
                        {" "}· Perpetrator: {r.perpetratorType}
                        {" "}· Reported by: {getStaffName(r.reportedBy)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* description */}
                    <div>
                      <p className="font-medium mb-1">Factual Account</p>
                      <p className="text-muted-foreground text-xs">{r.description}</p>
                    </div>

                    {/* affected person response */}
                    <div className="bg-rose-50 border border-rose-200 rounded p-2">
                      <p className="font-medium text-xs text-rose-800 mb-1">Affected Person&apos;s Response & Voice</p>
                      <p className="text-xs text-rose-700">{r.affectedPersonResponse}</p>
                    </div>

                    {/* support */}
                    {r.supportProvided.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-green-700">Support Provided</p>
                        <ul className="space-y-1">
                          {r.supportProvided.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <Heart className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* reporting */}
                    <div>
                      <p className="font-medium mb-1">External Reporting</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className={r.reportedToPolice ? "bg-blue-50 text-blue-700 text-xs" : "bg-muted/50 text-xs"}>
                          Police: {r.reportedToPolice ? (r.policeReference || "Yes") : "No"}
                        </Badge>
                        <Badge variant="outline" className={r.reportedToOfsted ? "bg-blue-50 text-blue-700 text-xs" : "bg-muted/50 text-xs"}>
                          Ofsted: {r.reportedToOfsted ? "Yes" : "No"}
                        </Badge>
                        <Badge variant="outline" className={r.reportedToLA ? "bg-blue-50 text-blue-700 text-xs" : "bg-muted/50 text-xs"}>
                          LA: {r.reportedToLA ? "Yes" : "No"}
                        </Badge>
                        <Badge variant="outline" className={r.schoolNotified ? "bg-blue-50 text-blue-700 text-xs" : "bg-muted/50 text-xs"}>
                          School: {r.schoolNotified ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>

                    {/* restorative */}
                    {r.restorativeApproach && (
                      <div>
                        <p className="font-medium mb-1">Restorative Approach</p>
                        <p className="text-muted-foreground text-xs">{r.restorativeApproach}</p>
                      </div>
                    )}

                    {/* perpetrator addressed */}
                    {r.perpetratorAddressed && (
                      <div>
                        <p className="font-medium mb-1">How the Perpetrator was Addressed</p>
                        <p className="text-muted-foreground text-xs">{r.perpetratorAddressed}</p>
                      </div>
                    )}

                    {/* prevention */}
                    {r.preventionMeasuresAdded.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-blue-700">Prevention Measures Added</p>
                        <ul className="space-y-1">
                          {r.preventionMeasuresAdded.map((m, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* learnings */}
                    {r.learnings && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-2">
                        <p className="font-medium text-xs text-purple-800 mb-1">Learnings</p>
                        <p className="text-xs text-purple-700">{r.learnings}</p>
                      </div>
                    )}

                    {/* follow up */}
                    <div className="text-xs text-muted-foreground">
                      Follow-up review: <span className="font-medium text-foreground">{r.followUpDate}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>
            Hate incidents must be recorded and addressed under the Equality Act 2010, the Public Sector Equality
            Duty, and Quality Standard 5 (Protection of Children) of the Children&apos;s Homes Regulations 2015.
            Where an incident may also be a notifiable event under Regulation 40, Ofsted must be notified without
            delay. The local authority and (where relevant) the placing authority must be informed. Hate crimes
            must be reported to the police where the affected child consents, or where there is a safeguarding
            duty to report regardless of consent. Records are reviewed at each Reg 44 visit, in supervision, and in
            quarterly equality monitoring. The home&apos;s response is led by the affected child&apos;s wishes — but
            the duty to record, escalate where there is a safeguarding concern, and learn from each incident is the
            home&apos;s, not the child&apos;s.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
