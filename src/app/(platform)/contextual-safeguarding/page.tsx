"use client";

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
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, MapPin, Users, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type RiskLevel = "low" | "medium" | "high" | "very_high";
type ContextType = "location" | "peer_group" | "online_space" | "transport_route" | "school" | "community_facility";
type Status = "active" | "monitoring" | "resolved" | "escalated";

interface ContextualRisk {
  id: string;
  dateIdentified: string;
  lastReviewed: string;
  identifiedBy: string;
  contextType: ContextType;
  riskLevel: RiskLevel;
  status: Status;
  locationOrContext: string;
  description: string;
  childrenAffected: string[];
  riskFactors: string[];
  protectiveActions: string[];
  multiAgencyActions: string[];
  policeIntelligence: string;
  communityMapping: string;
  reviewDate: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CONTEXT_LABEL: Record<ContextType, string> = { location: "Physical Location", peer_group: "Peer Group", online_space: "Online Space", transport_route: "Transport Route", school: "School / Education", community_facility: "Community Facility" };
const CONTEXT_CLR: Record<ContextType, string> = { location: "bg-blue-100 text-blue-800", peer_group: "bg-purple-100 text-purple-800", online_space: "bg-indigo-100 text-indigo-800", transport_route: "bg-amber-100 text-amber-800", school: "bg-green-100 text-green-800", community_facility: "bg-teal-100 text-teal-800" };
const RISK_LABEL: Record<RiskLevel, string> = { low: "Low", medium: "Medium", high: "High", very_high: "Very High" };
const RISK_CLR: Record<RiskLevel, string> = { low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-orange-100 text-orange-800", very_high: "bg-red-100 text-red-800" };
const STATUS_LABEL: Record<Status, string> = { active: "Active Risk", monitoring: "Monitoring", resolved: "Resolved", escalated: "Escalated" };
const STATUS_CLR: Record<Status, string> = { active: "bg-red-100 text-red-800", monitoring: "bg-amber-100 text-amber-800", resolved: "bg-green-100 text-green-800", escalated: "bg-purple-100 text-purple-800" };
const BORDER_RISK: Record<RiskLevel, string> = { low: "border-l-green-400", medium: "border-l-yellow-400", high: "border-l-orange-500", very_high: "border-l-red-600" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: ContextualRisk[] = [
  {
    id: "cs_1", dateIdentified: d(-90), lastReviewed: d(-7), identifiedBy: "staff_darren",
    contextType: "location", riskLevel: "high", status: "active",
    locationOrContext: "Retail Park — Off Elm Road (approx 1.2 miles from home)",
    description: "The retail park car park and surrounding area has been identified as a CSE hotspot by the local safeguarding partnership. Multiple intelligence reports of older males approaching young people in the car park area, particularly in the evenings. Fast food outlets used as meeting points. Dark areas around loading bays with limited CCTV coverage.",
    childrenAffected: ["yp_casey", "yp_alex"],
    riskFactors: [
      "Known CSE hotspot — police intelligence confirms multiple reports",
      "Casey has been found at this location during missing episodes",
      "Alex mentioned visiting the McDonald's there with 'Jayden' and 'Rico'",
      "Limited CCTV — dark areas around loading bays",
      "Public transport access (bus route 7 stops directly outside)",
      "Mix of adult and youth footfall — difficult to monitor",
    ],
    protectiveActions: [
      "Casey — missing protocol updated to include retail park as a priority search location",
      "Alex — discussed during key work; Alex understands the risks and has agreed to check in by text if visiting",
      "Staff awareness briefing completed — all staff know this is a high-risk location",
      "Bus route 7 timetable displayed — staff aware of when children could easily access the area",
      "Police community team requested additional evening patrols",
    ],
    multiAgencyActions: [
      "Reported to MACE panel",
      "Police community team conducting targeted patrols",
      "Local authority safeguarding partnership aware",
      "McDonald's manager contacted — awareness raised with their staff",
    ],
    policeIntelligence: "Operation Compass — ongoing police operation targeting CSE activity at this location. Three intelligence submissions in the last 6 months. One arrest in February (adult male approaching minors). Police have requested children's homes in the area report any sightings of their YP at this location.",
    communityMapping: "Located on Elm Road, accessible via bus route 7 (15-minute journey from home). Walking distance approx 25 minutes. Area includes: McDonald's, KFC, Argos, car park (ground level — limited CCTV). Loading bay area behind Argos is the primary concern — blind spot from road. Adjacent to a park with limited lighting after 8pm.",
    reviewDate: d(14),
  },
  {
    id: "cs_2", dateIdentified: d(-60), lastReviewed: d(-14), identifiedBy: "staff_darren",
    contextType: "peer_group", riskLevel: "medium", status: "monitoring",
    locationOrContext: "Skate park friendship group — Elm Road Park",
    description: "Alex has been socialising with a group of young people at the skate park after school. The group includes older teenagers (16-17 year olds). Two individuals of concern: 'Jayden' and 'Rico'. While no direct exploitation indicators have been confirmed, the age differential and unknown backgrounds of these individuals require ongoing monitoring.",
    childrenAffected: ["yp_alex"],
    riskFactors: [
      "Age differential — Alex is 14, associates appear 16-17",
      "No parental/carer information available for Jayden or Rico",
      "Meeting location is unsupervised",
      "Alex can become secretive when asked about the group",
      "Group dynamics unknown — Alex may be on the periphery",
    ],
    protectiveActions: [
      "Alex encouraged to bring friends to the home (offered use of garden, PS5)",
      "After-school return time agreed at 5pm on weekdays",
      "Key work sessions on peer pressure and exploitation awareness",
      "Phone check schedule maintained",
      "Staff have visited the skate park area to understand the environment",
    ],
    multiAgencyActions: [
      "Police intel check requested on Jayden and Rico — no results returned",
      "School DSL informed — no concerns from school perspective",
      "Social worker (Karen Holding) aware and monitoring",
    ],
    policeIntelligence: "No intelligence on Jayden or Rico returned from police check. Skate park not flagged as a high-risk location. Community PCSO aware of the general youth gathering — reports no ASB or concerns.",
    communityMapping: "Elm Road Park skate park is a 10-minute walk from the home. Well-lit during daylight hours but limited lighting after dark. CCTV covers the main path but not the skate area. Public park — open access. Popular with teenagers from local schools.",
    reviewDate: d(30),
  },
  {
    id: "cs_3", dateIdentified: d(-30), lastReviewed: d(-7), identifiedBy: "staff_edward",
    contextType: "online_space", riskLevel: "medium", status: "monitoring",
    locationOrContext: "Roblox gaming platform — specific game servers",
    description: "Jordan was approached by an unknown adult on Roblox who began sending in-game gifts and asking personal questions. The account (DarkW0lf_UK) has been reported to CEOP and blocked. Jordan's account settings have been tightened. No further contact since intervention. Context: Roblox allows user-generated games where moderations can be inconsistent.",
    childrenAffected: ["yp_jordan"],
    riskFactors: [
      "Jordan has ASD — difficulty reading social cues and identifying manipulation online",
      "Roblox has inconsistent moderation across user-generated games",
      "Jordan enjoys the platform and would resist removal — proportionate response needed",
      "Jordan's technical ability means potential to bypass basic controls",
    ],
    protectiveActions: [
      "Account reported to CEOP (ref: CEOP/2024/REF-8891)",
      "Parental controls tightened: friends-only messaging, restricted games",
      "6 sessions of online safety direct work completed",
      "Monthly device checks",
      "Jordan briefed on how to block and report — demonstrated understanding",
    ],
    multiAgencyActions: [
      "CEOP referral submitted and acknowledged",
      "School provided additional online safety sessions",
      "Social worker informed",
    ],
    policeIntelligence: "CEOP referral acknowledged. No intelligence shared back at this stage. DarkW0lf_UK account still active on platform but blocked by Jordan.",
    communityMapping: "Online context — no physical location mapping applicable. Roblox platform accessible from Jordan's iPad (home Wi-Fi). Jordan does not play Roblox at school.",
    reviewDate: d(60),
  },
  {
    id: "cs_4", dateIdentified: d(-120), lastReviewed: d(-30), identifiedBy: "staff_darren",
    contextType: "transport_route", riskLevel: "low", status: "resolved",
    locationOrContext: "Bus route 14 — school to home (Alex)",
    description: "Concern raised after Alex reported being approached by an older male on the bus who asked for his name and which school he attended. Alex appropriately declined and moved seats. Male did not follow. Single incident with no recurrence. Bus CCTV requested and reviewed — male identified as a regular passenger (elderly gentleman who was likely making friendly conversation). No safeguarding concern after investigation.",
    childrenAffected: ["yp_alex"],
    riskFactors: ["Single incident — no pattern", "Public transport — limited control over who is present"],
    protectiveActions: ["Alex praised for appropriate response", "Discussed stranger awareness in key work", "School informed of route"],
    multiAgencyActions: ["Bus company reviewed CCTV — no concern identified"],
    policeIntelligence: "Not escalated to police — resolved after CCTV review.",
    communityMapping: "Bus route 14 runs from town centre to school. Journey takes approximately 12 minutes. Bus is used by school children and general public.",
    reviewDate: d(90),
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ContextualSafeguardingPage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("risk");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterRisk !== "all" && r.riskLevel !== filterRisk) return false;
      if (filterType !== "all" && r.contextType !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.locationOrContext.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.dateIdentified.localeCompare(a.dateIdentified);
        case "risk": { const o = ["very_high", "high", "medium", "low"]; return o.indexOf(a.riskLevel) - o.indexOf(b.riskLevel); }
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterRisk, filterType, sortBy]);

  const activeRisks = data.filter((r) => r.status === "active" || r.status === "escalated").length;
  const highVeryHigh = data.filter((r) => r.riskLevel === "high" || r.riskLevel === "very_high").length;
  const monitoring = data.filter((r) => r.status === "monitoring").length;

  const exportCols: ExportColumn<ContextualRisk>[] = [
    { header: "Date Identified", accessor: (r: ContextualRisk) => r.dateIdentified },
    { header: "Context Type", accessor: (r: ContextualRisk) => CONTEXT_LABEL[r.contextType] },
    { header: "Location/Context", accessor: (r: ContextualRisk) => r.locationOrContext },
    { header: "Risk Level", accessor: (r: ContextualRisk) => RISK_LABEL[r.riskLevel] },
    { header: "Status", accessor: (r: ContextualRisk) => STATUS_LABEL[r.status] },
    { header: "Children Affected", accessor: (r: ContextualRisk) => r.childrenAffected.map(getYPName).join(", ") },
    { header: "Description", accessor: (r: ContextualRisk) => r.description },
    { header: "Review Date", accessor: (r: ContextualRisk) => r.reviewDate },
    { header: "Identified By", accessor: (r: ContextualRisk) => getStaffName(r.identifiedBy) },
  ];

  return (
    <PageShell title="Contextual Safeguarding" subtitle="Working Together 2023 · Community Risk Mapping · Environmental Factors" actions={<div className="flex items-center gap-2"><PrintButton title="Contextual Safeguarding" /><ExportButton data={filtered} columns={exportCols} filename="contextual-safeguarding" /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Add Context</Button></div>}>
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Contexts", value: data.length, icon: MapPin, clr: "text-blue-600" },
            { label: "Active Risks", value: activeRisks, icon: AlertTriangle, clr: "text-red-600" },
            { label: "High / Very High", value: highVeryHigh, icon: Shield, clr: "text-orange-600" },
            { label: "Monitoring", value: monitoring, icon: Users, clr: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        {highVeryHigh > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm"><p className="font-semibold text-red-800">{highVeryHigh} high/very high contextual risk(s) active</p><p className="text-red-700">These locations or contexts pose significant risks to young people. Staff must be aware and follow protective measures.</p></div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search location, context…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={filterRisk} onValueChange={setFilterRisk}><SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Risk</SelectItem>{(Object.keys(RISK_LABEL) as RiskLevel[]).map((k) => (<SelectItem key={k} value={k}>{RISK_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{(Object.keys(CONTEXT_LABEL) as ContextType[]).map((k) => (<SelectItem key={k} value={k}>{CONTEXT_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="risk">By Risk Level</SelectItem><SelectItem value="date-desc">Newest First</SelectItem></SelectContent></Select>
        </div>

        <div className="space-y-4">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_RISK[r.riskLevel])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        {r.locationOrContext}
                        <Badge variant="outline" className={CONTEXT_CLR[r.contextType]}>{CONTEXT_LABEL[r.contextType]}</Badge>
                        <Badge variant="outline" className={RISK_CLR[r.riskLevel]}>{RISK_LABEL[r.riskLevel]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Children: {r.childrenAffected.map(getYPName).join(", ")} · Identified: {r.dateIdentified} · Review: {r.reviewDate}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    <div><p className="font-medium mb-1">Description</p><p className="text-muted-foreground">{r.description}</p></div>
                    <div className="bg-red-50 rounded-lg p-3"><p className="font-medium text-red-800 mb-2">Risk Factors</p><ul className="space-y-1">{r.riskFactors.map((rf, i) => (<li key={i} className="text-xs text-red-700 flex items-start gap-1"><AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" /> {rf}</li>))}</ul></div>
                    <div className="bg-green-50 rounded-lg p-3"><p className="font-medium text-green-800 mb-2">Protective Actions</p><ul className="space-y-1">{r.protectiveActions.map((pa, i) => (<li key={i} className="text-xs text-green-700 flex items-start gap-1"><CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" /> {pa}</li>))}</ul></div>
                    <div className="bg-indigo-50 rounded-lg p-3"><p className="font-medium text-indigo-800 mb-2">Multi-Agency Actions</p><ul className="space-y-1">{r.multiAgencyActions.map((ma, i) => (<li key={i} className="text-xs text-indigo-700 flex items-start gap-1"><Shield className="h-3 w-3 shrink-0 mt-0.5" /> {ma}</li>))}</ul></div>
                    {r.policeIntelligence && <div className="bg-amber-50 rounded-lg p-3"><p className="font-medium text-amber-800 mb-1">Police Intelligence</p><p className="text-amber-700 text-xs">{r.policeIntelligence}</p></div>}
                    <div><p className="font-medium mb-1">Community Mapping</p><p className="text-muted-foreground text-xs">{r.communityMapping}</p></div>
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground"><span>Identified by: {getStaffName(r.identifiedBy)}</span><span>Last reviewed: {r.lastReviewed}</span><span>Next review: {r.reviewDate}</span></div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Contextual safeguarding recognises that young people face risks outside the home — in their communities, peer groups, and online spaces. Working Together to Safeguard Children 2023 requires a contextual approach. Children&apos;s Homes must maintain awareness of local risks (locality risk assessment, Reg 46) and actively map the contexts that affect the young people in their care. This record supports the location assessment (Reg 46), MACE engagement, and Ofsted inspection framework.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Contextual Risk</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Context Type</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(CONTEXT_LABEL) as ContextType[]).map((k) => (<SelectItem key={k} value={k}>{CONTEXT_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Risk Level</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(RISK_LABEL) as RiskLevel[]).map((k) => (<SelectItem key={k} value={k}>{RISK_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Location / Context</Label><Input placeholder="Where or what is the context?" /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea rows={3} placeholder="Describe the risk…" /></div>
            <div className="col-span-2"><Label>Community Mapping</Label><Textarea rows={2} placeholder="Describe the physical/online environment…" /></div>
            <div><Label>Review Date</Label><Input type="date" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Context</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}