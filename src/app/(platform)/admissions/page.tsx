"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { useCreateReferral, useUpdateReferral } from "@/hooks/use-admissions";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getStaffName } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  UserPlus, Calendar, Clock, AlertTriangle, CheckCircle2,
  XCircle, FileText, Shield, MapPin, Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────
type ReferralStatus = "new" | "under_assessment" | "impact_assessment" | "panel_decision" | "accepted" | "declined" | "withdrawn" | "placed";
type ReferralSource = "local_authority" | "agency" | "emergency" | "internal_transfer" | "court_directed";
type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";

interface Referral {
  id: string;
  childName: string;
  dateOfBirth: string;
  age: number;
  gender: Gender;
  ethnicity: string;
  referralDate: string;
  source: ReferralSource;
  referredBy: string;
  localAuthority: string;
  status: ReferralStatus;
  presentingNeeds: string[];
  riskFactors: string[];
  placementHistory: string;
  impactAssessmentComplete: boolean;
  impactAssessmentNotes: string;
  matchingConsiderations: string;
  decisionDate: string;
  decisionBy: string;
  decisionReason: string;
  estimatedPlacementDate: string;
  notes: string;
  createdAt: string;
}

const STATUS_META: Record<ReferralStatus, { label: string; color: string }> = {
  new:                 { label: "New Referral",       color: "bg-blue-100 text-blue-800" },
  under_assessment:    { label: "Under Assessment",   color: "bg-purple-100 text-purple-800" },
  impact_assessment:   { label: "Impact Assessment",  color: "bg-indigo-100 text-indigo-800" },
  panel_decision:      { label: "Panel Decision",     color: "bg-amber-100 text-amber-800" },
  accepted:            { label: "Accepted",           color: "bg-green-100 text-green-800" },
  declined:            { label: "Declined",           color: "bg-red-100 text-red-800" },
  withdrawn:           { label: "Withdrawn",          color: "bg-gray-100 text-gray-800" },
  placed:              { label: "Placed",             color: "bg-emerald-100 text-emerald-800" },
};

const SOURCE_META: Record<ReferralSource, string> = {
  local_authority:   "Local Authority",
  agency:            "Agency",
  emergency:         "Emergency",
  internal_transfer: "Internal Transfer",
  court_directed:    "Court Directed",
};

// ── Seed data ────────────────────────────────────────────────────────────────
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: Referral[] = [
  {
    id: "ref_001", childName: "Child A", dateOfBirth: "2011-08-15", age: 14, gender: "male",
    ethnicity: "White British", referralDate: d(-3), source: "local_authority",
    referredBy: "Jennifer Brooks — Placement Team", localAuthority: "Nottinghamshire County Council",
    status: "under_assessment",
    presentingNeeds: ["Emotional and behavioural difficulties", "School exclusion", "Previous placement breakdown", "Attachment difficulties"],
    riskFactors: ["Self-harm history", "Absconding from previous placement", "Peer-on-peer aggression"],
    placementHistory: "Two foster placements (both broke down), one residential placement (six months).",
    impactAssessmentComplete: false, impactAssessmentNotes: "",
    matchingConsiderations: "Need to consider impact on current cohort. Age-appropriate. Gender mix would be maintained.",
    decisionDate: "", decisionBy: "", decisionReason: "",
    estimatedPlacementDate: "", notes: "Urgent placement needed. Current placement giving 28 days notice.", createdAt: d(-3),
  },
  {
    id: "ref_002", childName: "Child B", dateOfBirth: "2010-03-22", age: 16, gender: "female",
    ethnicity: "Mixed — White and Black Caribbean", referralDate: d(-14), source: "local_authority",
    referredBy: "Marcus Johnson — CLA Team", localAuthority: "Derby City Council",
    status: "impact_assessment",
    presentingNeeds: ["Learning difficulties", "Low self-esteem", "Family breakdown", "Mild anxiety"],
    riskFactors: ["Vulnerability to exploitation", "Previous missing episodes"],
    placementHistory: "Long-term foster placement ended due to carer retirement. No previous residential.",
    impactAssessmentComplete: true, impactAssessmentNotes: "Impact assessment shows low risk to current group. Child B's needs align well with our model. Age and maturity would be positive addition. Safeguarding considerations re exploitation risk — addressed in risk management plan.",
    matchingConsiderations: "Good match for current cohort. Similar age to Casey. Would benefit from structured environment and therapeutic approach.",
    decisionDate: "", decisionBy: "", decisionReason: "",
    estimatedPlacementDate: d(14), notes: "Positive referral. Strong matching potential. Panel scheduled for next week.", createdAt: d(-14),
  },
  {
    id: "ref_003", childName: "Child C", dateOfBirth: "2012-11-01", age: 13, gender: "male",
    ethnicity: "Asian — Pakistani", referralDate: d(-30), source: "emergency",
    referredBy: "Emergency Duty Team — Derbyshire", localAuthority: "Derbyshire County Council",
    status: "declined",
    presentingNeeds: ["Sexual harmful behaviour", "Fire-setting", "Severe trauma history"],
    riskFactors: ["Sexual harmful behaviour towards peers", "History of fire-setting", "Severe emotional dysregulation"],
    placementHistory: "Three placement breakdowns in 12 months. Currently in unregulated provision.",
    impactAssessmentComplete: true, impactAssessmentNotes: "Impact assessment concluded that placement would pose unacceptable risk to current young people, particularly given sexual harmful behaviour. Our home is not registered for this complexity level.",
    matchingConsiderations: "Not suitable for current cohort. Risk to existing children too high. Registration does not cover this level of need.",
    decisionDate: d(-25), decisionBy: getStaffName("staff_darren"), decisionReason: "Declined — presenting needs exceed our Statement of Purpose and registration. Risk to existing children unacceptable.",
    estimatedPlacementDate: "", notes: "Referral declined with full rationale shared with LA. Suggested specialist provision.", createdAt: d(-30),
  },
  {
    id: "ref_004", childName: "Child D", dateOfBirth: "2010-07-10", age: 15, gender: "non_binary",
    ethnicity: "White British", referralDate: d(-45), source: "agency",
    referredBy: "Compass Fostering — Rebecca Lane", localAuthority: "Leicester City Council",
    status: "withdrawn",
    presentingNeeds: ["Gender identity support needed", "Bullying at school", "Mild ADHD", "Attachment needs"],
    riskFactors: ["Self-harm (historical, resolved)", "Low-level substance experimentation"],
    placementHistory: "Two foster placements. Current foster carer unable to provide gender-affirming support.",
    impactAssessmentComplete: false, impactAssessmentNotes: "",
    matchingConsiderations: "Good potential match. Would benefit from our therapeutic model.",
    decisionDate: d(-35), decisionBy: "", decisionReason: "Withdrawn by LA — child placed with specialist foster carer.",
    estimatedPlacementDate: "", notes: "LA found alternative placement before we completed assessment.", createdAt: d(-45),
  },
  {
    id: "ref_005", childName: "Casey", dateOfBirth: "2011-06-18", age: 14, gender: "female",
    ethnicity: "Mixed — White and Asian", referralDate: d(-60), source: "local_authority",
    referredBy: "Emma Watson — Derby CLA Team", localAuthority: "Derby City Council",
    status: "placed",
    presentingNeeds: ["Identity needs", "Previous placement concerns", "Low confidence", "Creative strengths"],
    riskFactors: ["Vulnerability to emotional harm", "Difficulty trusting adults"],
    placementHistory: "One foster placement — ended due to placement concerns raised by child.",
    impactAssessmentComplete: true, impactAssessmentNotes: "Excellent match for current cohort. Casey's needs align with our strengths — identity work, creative expression, therapeutic model. Low risk to group.",
    matchingConsiderations: "Strong match. Similar age to peers. Would benefit from structured care and creative opportunities.",
    decisionDate: d(-50), decisionBy: getStaffName("staff_darren"), decisionReason: "Accepted — strong match. Casey's needs align well with our Statement of Purpose.",
    estimatedPlacementDate: d(-31), notes: "Casey placed successfully. Settling in well.", createdAt: d(-60),
  },
];

// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<Referral>[] = [
  { header: "ID",                accessor: (r: Referral) => r.id },
  { header: "Child",             accessor: (r: Referral) => r.childName },
  { header: "Age",               accessor: (r: Referral) => String(r.age) },
  { header: "Gender",            accessor: (r: Referral) => r.gender },
  { header: "Referral Date",     accessor: (r: Referral) => r.referralDate },
  { header: "Source",            accessor: (r: Referral) => SOURCE_META[r.source] },
  { header: "Referred By",       accessor: (r: Referral) => r.referredBy },
  { header: "Local Authority",   accessor: (r: Referral) => r.localAuthority },
  { header: "Status",            accessor: (r: Referral) => STATUS_META[r.status].label },
  { header: "Presenting Needs",  accessor: (r: Referral) => r.presentingNeeds.join("; ") },
  { header: "Risk Factors",      accessor: (r: Referral) => r.riskFactors.join("; ") },
  { header: "Decision",          accessor: (r: Referral) => r.decisionReason || "—" },
  { header: "Decision By",       accessor: (r: Referral) => r.decisionBy || "—" },
  { header: "Notes",             accessor: (r: Referral) => r.notes },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function AdmissionsPage() {
  const createReferral = useCreateReferral();
  const updateReferral = useUpdateReferral();
  const [referrals, setReferrals] = useState<Referral[]>(SEED);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState("active");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let list = [...referrals];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((r) => r.childName.toLowerCase().includes(s) || r.referredBy.toLowerCase().includes(s) || r.localAuthority.toLowerCase().includes(s) || r.notes.toLowerCase().includes(s));
    }
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (tab === "active") list = list.filter((r) => !["declined", "withdrawn", "placed"].includes(r.status));
    if (tab === "closed") list = list.filter((r) => ["declined", "withdrawn", "placed"].includes(r.status));

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":   return b.referralDate.localeCompare(a.referralDate);
        case "status": return a.status.localeCompare(b.status);
        case "age":    return a.age - b.age;
        default:       return 0;
      }
    });
    return list;
  }, [referrals, search, statusFilter, tab, sortBy]);

  const stats = useMemo(() => {
    const total = referrals.length;
    const active = referrals.filter((r) => !["declined", "withdrawn", "placed"].includes(r.status)).length;
    const accepted = referrals.filter((r) => r.status === "accepted" || r.status === "placed").length;
    const declined = referrals.filter((r) => r.status === "declined").length;
    return { total, active, accepted, declined };
  }, [referrals]);

  return (
    <PageShell
      title="Admissions & Referrals"
      subtitle="Pre-admission referrals, impact assessments, and matching decisions"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Admissions & Referrals" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="admissions-referrals" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Referral</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Referrals", value: stats.total,    icon: <UserPlus className="h-4 w-4" />,       color: "text-blue-600" },
            { label: "Active",          value: stats.active,   icon: <Clock className="h-4 w-4" />,          color: "text-amber-600" },
            { label: "Accepted/Placed", value: stats.accepted, icon: <CheckCircle2 className="h-4 w-4" />,   color: "text-green-600" },
            { label: "Declined",        value: stats.declined, icon: <XCircle className="h-4 w-4" />,        color: "text-red-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search referrals…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="age">Age</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Referral list ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No referrals match your filters.</p>}
          {filtered.map((r) => {
            const open = !!expanded[r.id];
            const statusM = STATUS_META[r.status];
            return (
              <Card key={r.id} className={cn("border-l-4", r.status === "accepted" || r.status === "placed" ? "border-l-green-500" : r.status === "declined" ? "border-l-red-500" : r.status === "withdrawn" ? "border-l-gray-400" : "border-l-blue-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" role="button" tabIndex={0} aria-expanded={open} aria-label={`Expand referral details for ${r.childName}`} onClick={() => toggle(r.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(r.id); } }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", statusM.color)}>{statusM.label}</Badge>
                        <Badge variant="outline" className="text-xs">{SOURCE_META[r.source]}</Badge>
                        {r.riskFactors.length > 2 && <Badge variant="outline" className="text-xs text-red-600 border-red-300">High complexity</Badge>}
                      </div>
                      <p className="font-semibold">{r.childName} — Age {r.age}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Referred: {r.referralDate}</span>
                        <span>{r.localAuthority}</span>
                        <span>By: {r.referredBy}</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><p className="text-xs text-muted-foreground">DOB</p><p className="font-medium">{r.dateOfBirth}</p></div>
                        <div><p className="text-xs text-muted-foreground">Gender</p><p className="font-medium capitalize">{r.gender.replace("_", " ")}</p></div>
                        <div><p className="text-xs text-muted-foreground">Ethnicity</p><p className="font-medium">{r.ethnicity}</p></div>
                        <div><p className="text-xs text-muted-foreground">LA</p><p className="font-medium">{r.localAuthority}</p></div>
                      </div>

                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Presenting Needs</p>
                        <div className="flex flex-wrap gap-1">{r.presentingNeeds.map((n, i) => <Badge key={i} variant="secondary" className="text-xs">{n}</Badge>)}</div>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Risk Factors</p>
                        <div className="flex flex-wrap gap-1">{r.riskFactors.map((rf, i) => <Badge key={i} variant="outline" className="text-xs text-red-600 border-red-200">{rf}</Badge>)}</div>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Placement History</p>
                        <p className="text-xs">{r.placementHistory}</p>
                      </div>

                      {r.impactAssessmentComplete && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Impact Assessment</p>
                          <p className="bg-blue-50 p-2 rounded text-xs text-blue-900">{r.impactAssessmentNotes}</p>
                        </div>
                      )}
                      {r.matchingConsiderations && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Matching Considerations</p>
                          <p className="text-xs">{r.matchingConsiderations}</p>
                        </div>
                      )}
                      {r.decisionReason && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Decision</p>
                          <p className="text-xs font-medium">{r.decisionReason}</p>
                          {r.decisionBy && <p className="text-xs text-muted-foreground mt-1">By: {r.decisionBy} on {r.decisionDate}</p>}
                        </div>
                      )}
                      {r.notes && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Notes</p>
                          <p className="italic text-muted-foreground text-xs">{r.notes}</p>
                        </div>
                      )}

                      {!["declined", "withdrawn", "placed"].includes(r.status) && (
                        <div className="flex gap-2">
                          {r.status === "new" && <Button size="sm" variant="outline" onClick={() => { setReferrals((prev) => prev.map((x) => x.id === r.id ? { ...x, status: "under_assessment" } : x)); updateReferral.mutate({ id: r.id, status: "under_assessment" }, { onSuccess: () => toast.success("Assessment started") }); }}>Begin Assessment</Button>}
                          {r.status === "under_assessment" && <Button size="sm" variant="outline" onClick={() => { setReferrals((prev) => prev.map((x) => x.id === r.id ? { ...x, status: "impact_assessment" } : x)); updateReferral.mutate({ id: r.id, status: "impact_assessment" }, { onSuccess: () => toast.success("Impact assessment started") }); }}>Impact Assessment</Button>}
                          {r.status === "impact_assessment" && <Button size="sm" variant="outline" onClick={() => { setReferrals((prev) => prev.map((x) => x.id === r.id ? { ...x, status: "panel_decision" } : x)); updateReferral.mutate({ id: r.id, status: "panel_decision" }, { onSuccess: () => toast.success("Sent to panel") }); }}>Send to Panel</Button>}
                          {r.status === "panel_decision" && (
                            <>
                              <Button size="sm" variant="default" onClick={() => { setReferrals((prev) => prev.map((x) => x.id === r.id ? { ...x, status: "accepted", decisionDate: d(0) } : x)); updateReferral.mutate({ id: r.id, status: "accepted" }, { onSuccess: () => toast.success("Referral accepted") }); }}>Accept</Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => { setReferrals((prev) => prev.map((x) => x.id === r.id ? { ...x, status: "declined", decisionDate: d(0) } : x)); updateReferral.mutate({ id: r.id, status: "declined" }, { onSuccess: () => toast.success("Referral declined") }); }}>Decline</Button>
                            </>
                          )}
                        </div>
                      )}
                      <SmartLinkPanel sourceType="admission" sourceId={r.id} compact />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Guidance ─────────────────────────────────────────────────────── */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              All referrals must receive an impact assessment before a child is admitted. The Registered Manager must consider the impact on existing children. Admissions must be in line with the home&apos;s Statement of Purpose and Ofsted registration. Emergency placements require retrospective impact assessment within 72 hours.
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ── New referral dialog ───────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Referral</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createReferral.mutate({ child_name: "New Referral", status: "new", referral_date: new Date().toISOString().slice(0, 10), staff_id: "staff_darren" }, { onSuccess: () => toast.success("Referral logged"), onError: () => toast.error("Failed to log referral") }); setShowNew(false); }} className="space-y-3">
            <div>
              <label htmlFor="ref-name" className="text-sm font-medium">Child&apos;s Name / Reference</label>
              <Input id="ref-name" placeholder="Child name or anonymised reference" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="ref-dob" className="text-sm font-medium">Date of Birth</label>
                <Input id="ref-dob" type="date" />
              </div>
              <div>
                <label htmlFor="ref-gender" className="text-sm font-medium">Gender</label>
                <Select><SelectTrigger id="ref-gender"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non_binary">Non-binary</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label htmlFor="ref-referred-by" className="text-sm font-medium">Referred By</label>
              <Input id="ref-referred-by" placeholder="Name and role of referring professional" />
            </div>
            <div>
              <label htmlFor="ref-la" className="text-sm font-medium">Local Authority</label>
              <Input id="ref-la" placeholder="Placing local authority" />
            </div>
            <div>
              <label htmlFor="ref-source" className="text-sm font-medium">Source</label>
              <Select><SelectTrigger id="ref-source"><SelectValue placeholder="Referral source" /></SelectTrigger>
                <SelectContent>{Object.entries(SOURCE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="ref-needs" className="text-sm font-medium">Presenting Needs</label>
              <Textarea id="ref-needs" placeholder="Key needs (one per line)" rows={3} />
            </div>
            <div>
              <label htmlFor="ref-risks" className="text-sm font-medium">Risk Factors</label>
              <Textarea id="ref-risks" placeholder="Known risk factors (one per line)" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createReferral.isPending}>{createReferral.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Log Referral"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
