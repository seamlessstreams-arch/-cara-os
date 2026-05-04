"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle, CheckCircle2,
  Clock, Search, Lock, Shield, Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type RestrictionType = "locked_doors" | "window_restrictors" | "bedroom_door_alarm" | "cctv" | "confiscation" | "search" | "internet_monitoring" | "curfew" | "geographic_restriction" | "contact_restriction" | "other";
type LegalBasis = "care_plan" | "court_order" | "parental_consent" | "best_interests" | "risk_assessment" | "behaviour_support_plan";
type ReviewStatus = "current" | "under_review" | "removed" | "expired" | "court_pending";

interface DoLRecord {
  id: string;
  youngPersonId: string;
  restrictionType: RestrictionType;
  description: string;
  legalBasis: LegalBasis;
  authorisedById: string;
  dateImposed: string;
  reviewDate: string;
  status: ReviewStatus;
  proportionate: boolean;
  necessaryJustification: string;
  childConsulted: boolean;
  childViews: string;
  swConsulted: boolean;
  swViews: string;
  iloConsulted: boolean;
  courtAuthorised: boolean;
  courtRef: string;
  alternativesConsidered: string[];
  impactOnChild: string;
  reviewHistory: { date: string; outcome: string }[];
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TYPE_LABEL: Record<RestrictionType, string> = {
  locked_doors: "Locked Doors/Gates", window_restrictors: "Window Restrictors", bedroom_door_alarm: "Bedroom Door Alarm",
  cctv: "CCTV Monitoring", confiscation: "Confiscation of Item", search: "Room/Person Search",
  internet_monitoring: "Internet Monitoring/Filtering", curfew: "Curfew", geographic_restriction: "Geographic Restriction",
  contact_restriction: "Contact Restriction", other: "Other Restriction",
};

const BASIS_LABEL: Record<LegalBasis, string> = {
  care_plan: "Care Plan", court_order: "Court Order", parental_consent: "Parental Consent",
  best_interests: "Best Interests", risk_assessment: "Risk Assessment", behaviour_support_plan: "Behaviour Support Plan",
};

const STATUS_LABEL: Record<ReviewStatus, string> = { current: "Current", under_review: "Under Review", removed: "Removed", expired: "Expired", court_pending: "Court Pending" };
const STATUS_CLR: Record<ReviewStatus, string> = { current: "bg-amber-100 text-amber-800", under_review: "bg-blue-100 text-blue-800", removed: "bg-green-100 text-green-800", expired: "bg-slate-100 text-slate-700", court_pending: "bg-purple-100 text-purple-800" };
const STATUS_BORDER: Record<ReviewStatus, string> = { current: "border-l-amber-400", under_review: "border-l-blue-400", removed: "border-l-green-400", expired: "border-l-slate-300", court_pending: "border-l-purple-400" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: DoLRecord[] = [
  {
    id: "dol_001", youngPersonId: "yp_casey", restrictionType: "window_restrictors",
    description: "Restrictive window lock fitted to Casey's bedroom window following an incident where Casey climbed out at night and was found at the retail park with an unknown adult male. Lock limits window opening to 10cm — sufficient for ventilation but prevents exit.",
    legalBasis: "risk_assessment", authorisedById: "staff_darren",
    dateImposed: d(-60), reviewDate: d(0), status: "under_review",
    proportionate: true,
    necessaryJustification: "Casey has a documented pattern of leaving the home at night via bedroom window. On the most recent occasion, Casey was located with an unknown adult male at the retail park — CSE screening rates Casey as HIGH risk. The window restrictor is a proportionate measure to prevent Casey from placing herself at risk of exploitation during the night. Alternative measures (increased night checks, verbal agreements) were tried first but were insufficient.",
    childConsulted: true,
    childViews: "Casey was initially upset about the window restrictor, describing it as 'being locked in.' After discussion with Darren, Casey acknowledged she understands why it's there but still feels it is unfair. Casey asked if the restriction could be reviewed monthly, which was agreed. Casey also stated she wants a fan in her room since she can't open the window fully.",
    swConsulted: true, swViews: "Lisa Green (SW) agreed the restriction is proportionate given the CSE risk level. SW confirmed this should be recorded as a deprivation of liberty measure and reviewed at each LAC review.",
    iloConsulted: true, courtAuthorised: false, courtRef: "",
    alternativesConsidered: [
      "Increased night checks (every 15 minutes) — tried for 2 weeks, Casey still exited via window between checks",
      "Verbal agreement with Casey not to leave at night — Casey agreed but breached on 3 occasions",
      "Moving Casey's bedroom to upstairs room — not possible (only ground floor rooms available)",
      "Sensor alarm on window — considered but Casey could still exit before staff responded",
    ],
    impactOnChild: "Casey reports feeling 'trapped' at times, particularly on warm evenings. A desk fan has been provided. Casey understands the safety rationale but finds it emotionally difficult. Direct work ongoing with Casey about safety and exploitation awareness. The restriction has been effective — no further missing episodes via the window since installation.",
    reviewHistory: [
      { date: d(-30), outcome: "Maintained — CSE risk level unchanged. Casey's views recorded. Fan provided. Review in 30 days." },
    ],
    notes: "This restriction is under review today. Casey's CSE risk remains HIGH. The window restrictor has been effective in preventing night-time absconding. Casey has been consulted and her views are documented. The IRO and SW both support continuation at this time. Legal advice confirmed this does not require court authorisation as it is a proportionate safeguarding measure under the care plan, but it must be regularly reviewed and documented as a deprivation of liberty measure.",
  },
  {
    id: "dol_002", youngPersonId: "yp_casey", restrictionType: "contact_restriction",
    description: "Casey is not permitted to have unsupervised contact with Marcus (known to police as person of interest for CSE). Casey's phone is monitored for contact attempts from Marcus. Any social media messages from Marcus must be reported to police.",
    legalBasis: "court_order", authorisedById: "staff_darren",
    dateImposed: d(-45), reviewDate: d(15), status: "current",
    proportionate: true,
    necessaryJustification: "Marcus is identified by police and the exploitation screening as a person of concern linked to Casey's CSE risk. A court order restricts Casey's contact with Marcus. Phone monitoring is in place with Casey's knowledge. This is a safeguarding necessity endorsed by the court, police, and placing authority.",
    childConsulted: true,
    childViews: "Casey is angry about this restriction. Casey describes Marcus as 'just a friend' and doesn't believe he is dangerous. Casey has said 'you can't stop me talking to who I want.' Casey's views are respected but the court order is in place and must be followed. Direct work is ongoing to help Casey understand grooming patterns.",
    swConsulted: true, swViews: "Lisa Green fully supports. This is a court-ordered restriction. SW is working with police on the exploitation investigation.",
    iloConsulted: true, courtAuthorised: true, courtRef: "FC-2025-0847",
    alternativesConsidered: [
      "Voluntary agreement with Casey — Casey refused to agree to no contact",
      "Education-based approach only — considered insufficient given HIGH risk level",
    ],
    impactOnChild: "Casey is frustrated and sometimes angry about this restriction. She has expressed feeling controlled. Staff validate Casey's feelings while maintaining the boundary. Direct work sessions focus on healthy vs unhealthy relationships, consent, and exploitation awareness. Casey's advocate has been involved to ensure Casey's voice is heard in the process.",
    reviewHistory: [
      { date: d(-15), outcome: "Maintained — court order remains in force. Police investigation ongoing. Casey's views recorded." },
    ],
    notes: "Court-ordered restriction. Non-negotiable but Casey's emotional response is monitored and supported. Direct work ongoing. Police intelligence suggests Marcus may have moved away from the area — investigation continues. Next court review date: " + d(30) + ".",
  },
  {
    id: "dol_003", youngPersonId: "yp_jordan", restrictionType: "internet_monitoring",
    description: "Jordan's internet access is monitored through a content filter that blocks age-inappropriate content and flags concerning search terms. Jordan is aware of the filtering. Specific filtering applied to Roblox and social media platforms following online exploitation screening.",
    legalBasis: "care_plan", authorisedById: "staff_darren",
    dateImposed: d(-90), reviewDate: d(10), status: "current",
    proportionate: true,
    necessaryJustification: "Jordan's online exploitation screening identified contact from an unknown user (DarkW0lf_UK) on Roblox who was asking personal questions and requesting photos. Content filtering is age-appropriate and proportionate. Jordan has ASD and may be more vulnerable to online manipulation due to social communication difficulties.",
    childConsulted: true,
    childViews: "Jordan understands there is a filter and initially asked 'why can't I see everything?' Staff explained in accessible language that some content isn't safe. Jordan accepted this and hasn't raised concerns since. Jordan appreciates that gaming is still available.",
    swConsulted: true, swViews: "Michael Osei agreed the filtering is proportionate and age-appropriate. SW noted this is standard good practice for any child of Jordan's age.",
    iloConsulted: false, courtAuthorised: false, courtRef: "",
    alternativesConsidered: [
      "No filtering — considered inappropriate given Jordan's age and vulnerability",
      "Complete internet ban — disproportionate and would remove Jordan's main leisure activity",
      "Supervised-only access — tried but impractical (Jordan uses tablet for homework and relaxation throughout the day)",
    ],
    impactOnChild: "Minimal negative impact. Jordan's gaming and homework access is maintained. The filter operates in the background. Jordan occasionally asks why a specific website is blocked — staff explain and can whitelist educational sites as needed. The filtering has been effective — no further concerning contacts since the Roblox user was blocked and reported.",
    reviewHistory: [
      { date: d(-30), outcome: "Maintained — filtering effective. Jordan's engagement positive. No further online concerns." },
    ],
    notes: "This is a proportionate, age-appropriate measure. The filtering would be considered standard parenting practice for any 13-year-old. Documented as a restriction for transparency. Jordan's views are consistently sought and he is not distressed by the restriction. The DarkW0lf_UK user was reported to CEOP and Roblox — account was suspended.",
  },
  {
    id: "dol_004", youngPersonId: "yp_alex", restrictionType: "curfew",
    description: "Alex has an agreed curfew of 20:00 on school nights and 21:00 on weekends/holidays. This is part of Alex's placement plan and was agreed with Alex, his social worker, and his mother.",
    legalBasis: "care_plan", authorisedById: "staff_darren",
    dateImposed: d(-180), reviewDate: d(30), status: "current",
    proportionate: true,
    necessaryJustification: "Age-appropriate boundary for a 14-year-old. Consistent with what a reasonable parent would impose. Alex needs structure and routine to support his education and wellbeing. The curfew allows Alex independence to see friends after school while ensuring he is home at a reasonable time.",
    childConsulted: true,
    childViews: "Alex is generally happy with the curfew. He has asked for 21:00 on school nights 'like his friends' but accepted the explanation that most of his friends' parents have similar rules. Alex negotiated the 21:00 weekend curfew himself and is proud of this.",
    swConsulted: true, swViews: "Karen Holding agreed this is age-appropriate and reasonable.",
    iloConsulted: false, courtAuthorised: false, courtRef: "",
    alternativesConsidered: [
      "No curfew — considered inappropriate for a 14-year-old, particularly in a care setting where safeguarding duties apply",
    ],
    impactOnChild: "Positive impact. Alex benefits from the structure. He knows where he stands and the consistency has helped reduce conflict. Alex feels the weekend curfew is 'fair' because he negotiated it.",
    reviewHistory: [
      { date: d(-60), outcome: "Maintained unchanged. Alex's views positive. SW agrees age-appropriate." },
      { date: d(-120), outcome: "Weekend curfew extended from 20:30 to 21:00 at Alex's request — agreed as proportionate for his age and behaviour." },
    ],
    notes: "This is a standard, age-appropriate boundary that would be imposed by any reasonable parent. Documented as a restriction for regulatory transparency (Reg 20). Alex is positive about the arrangement. Will be reviewed as Alex approaches 15 — may extend school night curfew to 20:30.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function DeprivationOfLibertyPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        getYPName(r.youngPersonId).toLowerCase().includes(q) ||
        TYPE_LABEL[r.restrictionType].toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) => sortBy === "newest" ? b.dateImposed.localeCompare(a.dateImposed) : a.dateImposed.localeCompare(b.dateImposed));
    return rows;
  }, [data, search, filterStatus, sortBy]);

  const total = data.length;
  const current = data.filter((r) => r.status === "current" || r.status === "under_review").length;
  const courtOrdered = data.filter((r) => r.courtAuthorised).length;
  const dueReview = data.filter((r) => {
    if (r.status === "removed" || r.status === "expired") return false;
    return r.reviewDate <= d(7);
  }).length;

  const exportCols: ExportColumn<DoLRecord>[] = [
    { header: "Young Person", accessor: (r: DoLRecord) => getYPName(r.youngPersonId) },
    { header: "Restriction", accessor: (r: DoLRecord) => TYPE_LABEL[r.restrictionType] },
    { header: "Legal Basis", accessor: (r: DoLRecord) => BASIS_LABEL[r.legalBasis] },
    { header: "Imposed", accessor: (r: DoLRecord) => r.dateImposed },
    { header: "Review Due", accessor: (r: DoLRecord) => r.reviewDate },
    { header: "Status", accessor: (r: DoLRecord) => STATUS_LABEL[r.status] },
    { header: "Court Authorised", accessor: (r: DoLRecord) => r.courtAuthorised ? "Yes" : "No" },
    { header: "Child Consulted", accessor: (r: DoLRecord) => r.childConsulted ? "Yes" : "No" },
    { header: "Proportionate", accessor: (r: DoLRecord) => r.proportionate ? "Yes" : "No" },
  ];

  return (
    <PageShell
      title="Restrictions & Deprivation of Liberty"
      subtitle="Reg 20 · Restraints & Restrictions · Proportionality · Child's Voice"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Restrictions & DoL Register" />
          <ExportButton data={data} columns={exportCols} filename="deprivation-of-liberty" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Log Restriction</Button>
        </div>
      }
    >
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Restrictions", value: total, icon: Lock, clr: "text-blue-600" },
            { label: "Current / Active", value: current, icon: Shield, clr: "text-amber-600" },
            { label: "Court Ordered", value: courtOrdered, icon: Scale, clr: "text-purple-600" },
            { label: "Review Due (7d)", value: dueReview, icon: Clock, clr: "text-red-600" },
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
            <Input className="pl-8" placeholder="Search restrictions..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {(Object.entries(STATUS_LABEL) as [ReviewStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}>
            <ArrowUpDown className="h-4 w-4 mr-1" />{sortBy === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>

        {dueReview > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{dueReview} restriction(s) due for review within 7 days</p>
              <p className="text-amber-700">All restrictions on children&apos;s liberty must be regularly reviewed for proportionality and necessity (Reg 20). The child&apos;s views must be sought at every review. Restrictions that are no longer proportionate must be removed immediately.</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", STATUS_BORDER[r.status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.youngPersonId)} — {TYPE_LABEL[r.restrictionType]}
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                        {r.courtAuthorised && <Badge variant="outline" className="bg-purple-100 text-purple-800">Court Order</Badge>}
                        {!r.childConsulted && <Badge variant="outline" className="bg-red-100 text-red-800">Child Not Consulted</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {BASIS_LABEL[r.legalBasis]} · Imposed: {r.dateImposed} · Review: {r.reviewDate} · Auth: {getStaffName(r.authorisedById)}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div><p className="font-medium mb-1">Description</p><p className="text-muted-foreground text-xs">{r.description}</p></div>

                    <div className="bg-amber-50 border border-amber-200 rounded p-2">
                      <p className="font-medium text-xs text-amber-800 mb-1">Justification (Necessity & Proportionality)</p>
                      <p className="text-xs text-amber-700">{r.necessaryJustification}</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Child&apos;s Views</p>
                      <p className="text-xs text-blue-700">{r.childViews}</p>
                    </div>

                    {r.swViews && (
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="font-medium text-xs text-green-800 mb-1">Social Worker&apos;s Views</p>
                        <p className="text-xs text-green-700">{r.swViews}</p>
                      </div>
                    )}

                    {r.alternativesConsidered.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Alternatives Considered</p>
                        <ul className="space-y-1">
                          {r.alternativesConsidered.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs"><AlertTriangle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" /><span>{a}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="font-medium text-xs text-purple-800 mb-1">Impact on Child</p>
                      <p className="text-xs text-purple-700">{r.impactOnChild}</p>
                    </div>

                    {r.reviewHistory.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Review History</p>
                        {r.reviewHistory.map((rev, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 mb-1 text-xs">
                            <span className="font-medium">{rev.date}:</span> {rev.outcome}
                          </div>
                        ))}
                      </div>
                    )}

                    {r.courtRef && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Court Ref</p><p className="text-xs font-bold">{r.courtRef}</p></div>
                        <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Court Authorised</p><p className="text-xs font-bold">{r.courtAuthorised ? "Yes" : "No"}</p></div>
                      </div>
                    )}

                    <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground text-xs">{r.notes}</p></div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 20 — restrictions on liberty. Any measure that restricts a child&apos;s liberty must be: necessary, proportionate, the least restrictive option, regularly reviewed, and documented. The child must be consulted and their views recorded. Restrictions that amount to a deprivation of liberty may require court authorisation. All restrictions must be reported to Ofsted, the placing authority, and the IRO. The Responsible Individual must be satisfied that all restrictions are proportionate and necessary. Restrictions are subject to Reg 44 independent scrutiny and Ofsted inspection.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Restriction</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Young Person</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select YP" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
                  <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
                  <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Restriction Type</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_LABEL) as [RestrictionType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea placeholder="Describe the restriction in detail..." /></div>
            <div><Label>Justification</Label><Textarea placeholder="Why is this necessary and proportionate?" /></div>
            <div><Label>Child&apos;s Views</Label><Textarea placeholder="What does the child think about this restriction?" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={() => setShowNew(false)}>Log Restriction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
