"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ArrowUpDown, Heart, Shield, AlertCircle, CheckCircle, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

interface YoungCarerRecord {
  id: string;
  youngPerson: string;
  assessmentDate: string;
  carerStatus: "Identified young carer" | "Previous young carer (pre-care)" | "Risk of young carer role on family contact" | "Not a young carer";
  caringResponsibilities: string[];
  caringRecipient: string;
  ageWhenCaringStarted: number;
  durationOfCaringRole: string;
  emotionalImpactObserved: string[];
  practicalImpactObserved: string[];
  childWishesAroundCaring: string;
  parentLAAware: boolean;
  formalYoungCarerAssessment: boolean;
  assessmentLA: string;
  assessmentDate2: string;
  supportInPlace: string[];
  educationImpactProtections: string[];
  contactSupportArrangements: string;
  childAcceptsCarerStatus: boolean;
  childRefusesIdentification: string;
  reviewSchedule: string;
  reviewedDate: string;
  reviewedBy: string;
  notes: string;
}

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const data: YoungCarerRecord[] = [
  {
    id: "yc-001",
    youngPerson: "yp_jordan",
    assessmentDate: d(-30),
    carerStatus: "Previous young carer (pre-care)",
    caringResponsibilities: [
      "Cared for younger sister Tia (cooking, getting her to school, emotional support) when Mum's mental health and offending impacted",
      "Took on parental role at age 8-10 during periods of Mum's instability",
      "Did basic housework when Nan-Nan tried but couldn't manage Jordan's behaviour",
    ],
    caringRecipient: "Younger sister Tia + Mum (during her unwell periods)",
    ageWhenCaringStarted: 8,
    durationOfCaringRole: "Approximately 4 years (age 8-12) before placement",
    emotionalImpactObserved: [
      "Hyper-responsibility — feels guilty when not caring for someone",
      "Anxiety when Tia is reported unwell (current foster carer)",
      "Identity wrapped up in being 'the protector'",
      "Difficulty receiving care — 'I'm fine' default",
    ],
    practicalImpactObserved: [
      "Rapidly competent in household tasks (above peers)",
      "Worry about Mum's release impacting whether he 'has to' return to caring role",
    ],
    childWishesAroundCaring: "Jordan wants to be a brother, not a parent. He's said 'I don't want Tia depending on me to be okay.' But he also says 'I'll always look out for her'. Both can be true.",
    parentLAAware: true,
    formalYoungCarerAssessment: true,
    assessmentLA: "Valley Borough Council (statutory young carer assessment)",
    assessmentDate2: "2023-08-15",
    supportInPlace: [
      "Therapy explicitly addresses parentification",
      "Tia in long-term stable foster placement (eases worry)",
      "Boundary work in key working — Jordan's role with Tia is sibling, not carer",
      "Pre-release planning includes contact safety plan with explicit message: caring is NOT Jordan's job",
      "Cousin Devon connection helps share family caring weight",
    ],
    educationImpactProtections: [
      "School aware of carer history; Designated Teacher informed",
      "Homework support emphasises Jordan's own learning, not catching up",
      "Educational psychology assessment will explore impact",
    ],
    contactSupportArrangements: "Mother's release will be carefully framed: contact is for Jordan to receive love, not provide care. SW and prison-release planning aligned. Therapeutic support intensified around release date.",
    childAcceptsCarerStatus: true,
    childRefusesIdentification: "",
    reviewSchedule: "Quarterly with key worker; before each major contact event",
    reviewedDate: d(-30),
    reviewedBy: "staff_chervelle",
    notes: "Critical to recognise. Pre-care young-carer experience shapes Jordan's identity even though he no longer has caring role day-to-day. Mother's upcoming release is the major risk point.",
  },
  {
    id: "yc-002",
    youngPerson: "yp_alex",
    assessmentDate: d(-90),
    carerStatus: "Risk of young carer role on family contact",
    caringResponsibilities: [
      "Some emotional support of Mum during phone calls (Alex 'managing' her mood)",
      "Has taken on responsibility for younger sister Mia during family contact in past",
    ],
    caringRecipient: "Mother (emotional) and younger sister Mia (during contact only)",
    ageWhenCaringStarted: 7,
    durationOfCaringRole: "Periodic — escalates during family stress",
    emotionalImpactObserved: [
      "Phone calls with Mum sometimes leave Alex slightly flat (carrying Mum's emotional weight)",
      "Worry about Mia's wellbeing surfaces around contact times",
      "Some anxiety post-contact",
    ],
    practicalImpactObserved: [
      "Limited — most caring role mitigated by placement",
    ],
    childWishesAroundCaring: "Alex says 'I don't mind helping Mum, she's been through a lot.' Wants to be helpful but with boundaries.",
    parentLAAware: true,
    formalYoungCarerAssessment: false,
    assessmentLA: "Riverside County Council — informal awareness; not statutorily assessed",
    assessmentDate2: "",
    supportInPlace: [
      "Pre/post mother contact rituals (regulation support)",
      "Therapy addresses appropriate boundaries with Mum",
      "Key working monitors emotional residue from contact",
      "Phone call timing managed (not at vulnerable times)",
    ],
    educationImpactProtections: [
      "School aware of family complexity; Designated Teacher informed",
    ],
    contactSupportArrangements: "Phone calls and supervised visits. Staff prepare Alex before; debrief after. Boundary-coaching ongoing.",
    childAcceptsCarerStatus: false,
    childRefusesIdentification: "Alex doesn't see himself as a young carer — sees it as 'just being there for Mum'. Important to validate while gently introducing concept.",
    reviewSchedule: "Quarterly review; immediate review if family situation changes",
    reviewedDate: d(-90),
    reviewedBy: "staff_anna",
    notes: "Alex doesn't formally accept the young-carer label. We honour his framing while protecting against over-responsibility. Watch for phone call patterns and post-contact mood.",
  },
  {
    id: "yc-003",
    youngPerson: "yp_casey",
    assessmentDate: d(-60),
    carerStatus: "Not a young carer",
    caringResponsibilities: [],
    caringRecipient: "",
    ageWhenCaringStarted: 0,
    durationOfCaringRole: "",
    emotionalImpactObserved: [],
    practicalImpactObserved: [],
    childWishesAroundCaring: "N/A — Casey has no caring role and no current family caring expectations.",
    parentLAAware: true,
    formalYoungCarerAssessment: false,
    assessmentLA: "",
    assessmentDate2: "",
    supportInPlace: [],
    educationImpactProtections: [],
    contactSupportArrangements: "Letterbox-only birth family contact; no caring expectations from any direction.",
    childAcceptsCarerStatus: false,
    childRefusesIdentification: "",
    reviewSchedule: "Annual review unless circumstances change",
    reviewedDate: d(-60),
    reviewedBy: "staff_anna",
    notes: "Confirmed not a young carer. Record kept for completeness and to evidence consideration.",
  },
];

const statusColour: Record<string, string> = {
  "Identified young carer": "bg-amber-100 text-amber-800",
  "Previous young carer (pre-care)": "bg-purple-100 text-purple-800",
  "Risk of young carer role on family contact": "bg-blue-100 text-blue-800",
  "Not a young carer": "bg-slate-100 text-slate-800",
};

const exportCols: ExportColumn<YoungCarerRecord>[] = [
  { header: "Young Person", accessor: (r: YoungCarerRecord) => getYPName(r.youngPerson) },
  { header: "Carer Status", accessor: (r: YoungCarerRecord) => r.carerStatus },
  { header: "Recipient", accessor: (r: YoungCarerRecord) => r.caringRecipient },
  { header: "Age Started", accessor: (r: YoungCarerRecord) => String(r.ageWhenCaringStarted) },
  { header: "Formal Assessment", accessor: (r: YoungCarerRecord) => r.formalYoungCarerAssessment ? "Yes" : "No" },
  { header: "Child Accepts Status", accessor: (r: YoungCarerRecord) => r.childAcceptsCarerStatus ? "Yes" : "No" },
  { header: "Reviewed", accessor: (r: YoungCarerRecord) => r.reviewedDate },
];

export default function YoungCarerStatusPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterStatus !== "all") items = items.filter((r) => r.carerStatus === filterStatus);
    items.sort((a, b) => sortBy === "name" ? a.youngPerson.localeCompare(b.youngPerson) : 0);
    return items;
  }, [filterStatus, sortBy]);

  const total = data.length;
  const identified = data.filter((r) => r.carerStatus !== "Not a young carer").length;
  const formallyAssessed = data.filter((r) => r.formalYoungCarerAssessment).length;

  return (
    <PageShell
      title="Young Carer Status"
      subtitle="Identifying and supporting children with caring responsibilities — past, present, or risk-of"
      ariaContext={{ pageTitle: "Young Carer Status", sourceType: "child_record" }}
      actions={<div className="flex items-center gap-2"><ExportButton data={data} columns={exportCols} filename="young-carer-status" /><PrintButton title="Young Carer Status" /><AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} /></div>}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Records</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-amber-600">{identified}/{total}</p><p className="text-xs text-muted-foreground">Carer Status Identified</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-blue-600">{formallyAssessed}</p><p className="text-xs text-muted-foreground">Formal LA Assessment</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-green-600">100%</p><p className="text-xs text-muted-foreground">Child Voice Captured</p></div>
      </div>
      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          Many children entering care have been young carers — caring for siblings, parents with mental health
          difficulties, parental substance use. The role doesn&apos;t end at placement; identity and worry persist.
          We name it carefully, support what the child wants, and protect against over-responsibility.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[260px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Identified young carer">Identified Young Carer</SelectItem>
            <SelectItem value="Previous young carer (pre-care)">Previous (Pre-care)</SelectItem>
            <SelectItem value="Risk of young carer role on family contact">Risk on Contact</SelectItem>
            <SelectItem value="Not a young carer">Not a Young Carer</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1"><ArrowUpDown className="h-4 w-4 text-muted-foreground" /><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="name">By Child</SelectItem></SelectContent></Select></div>
      </div>
      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0"><Heart className="h-5 w-5 text-purple-600 shrink-0" /><div className="min-w-0"><p className="font-medium truncate">{getYPName(r.youngPerson)}</p><p className="text-xs text-muted-foreground mt-0.5">{r.carerStatus} {r.caringRecipient && `· caring for ${r.caringRecipient}`}</p></div></div>
                <div className="flex items-center gap-2 shrink-0 ml-3"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[r.carerStatus])}>{r.carerStatus.split(" ")[0]}</span>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
              </button>
              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-3 text-sm">
                  {r.caringResponsibilities.length > 0 && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Caring Responsibilities</p><ul className="space-y-1">{r.caringResponsibilities.map((c, i) => <li key={i} className="flex items-start gap-1"><Users className="h-3 w-3 text-purple-500 mt-1 shrink-0" /><span>{c}</span></li>)}</ul></div>}
                  {r.emotionalImpactObserved.length > 0 && <div className="bg-amber-50 rounded-lg p-3"><p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Emotional Impact</p><ul className="space-y-1">{r.emotionalImpactObserved.map((c, i) => <li key={i} className="flex items-start gap-1"><AlertCircle className="h-3 w-3 text-amber-500 mt-1 shrink-0" /><span>{c}</span></li>)}</ul></div>}
                  {r.childWishesAroundCaring && <div className="bg-pink-50 rounded-lg p-3"><p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1"><Heart className="h-3 w-3 inline mr-1" />Child&apos;s Wishes</p><p className="italic">{r.childWishesAroundCaring}</p></div>}
                  {r.supportInPlace.length > 0 && <div className="bg-emerald-50 rounded-lg p-3"><p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1"><Shield className="h-3 w-3 inline mr-1" />Support In Place</p><ul className="space-y-1">{r.supportInPlace.map((c, i) => <li key={i} className="flex items-start gap-1"><CheckCircle className="h-3 w-3 text-emerald-500 mt-1 shrink-0" /><span>{c}</span></li>)}</ul></div>}
                  {r.educationImpactProtections.length > 0 && <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Education Protections</p><ul className="space-y-1">{r.educationImpactProtections.map((c, i) => <li key={i} className="text-sm">• {c}</li>)}</ul></div>}
                  {r.contactSupportArrangements && <div className="bg-purple-50 rounded-lg p-3"><p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Contact Support</p><p>{r.contactSupportArrangements}</p></div>}
                  {r.childRefusesIdentification && <div className="bg-amber-50 rounded-lg p-3"><p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Note on Identification</p><p>{r.childRefusesIdentification}</p></div>}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t"><span>Reviewed: {r.reviewedDate} by {getStaffName(r.reviewedBy)}</span><span>Schedule: {r.reviewSchedule}</span>{r.formalYoungCarerAssessment && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">LA Assessed</span>}</div>
                  {r.notes && <div className="bg-slate-50 rounded-lg p-3 border"><p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p><p>{r.notes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-8 rounded-lg bg-muted/50 border p-4"><p className="text-xs text-muted-foreground"><strong>Regulatory Context:</strong> Young carer identification supports Children and Families Act 2014 s.96 (young carer assessments), Care Act 2014, Quality Standard 7 (health and wellbeing), and Quality Standard 9 (family relationships). Linked to Family Time Supervision and Trauma-Informed Timeline.</p></div>
      <CareEventsPanel
        title="Care Events — Wellbeing & Education"
        category={["wellbeing", "education", "health"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Young Carer Status — children with caring responsibilities for a parent or sibling, carer support, school impact, LA assessment, respite, plan, wellbeing"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
