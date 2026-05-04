"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle, CheckCircle2,
  XCircle, Search, Users, ShieldCheck, ClipboardCheck, BadgeCheck, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type InductionType = "Pre-shift brief" | "Half-day full induction" | "Returning staff refresh";

interface InductionTopic {
  topic: string;
  covered: boolean;
  notes: string;
}

interface AgencyInduction {
  id: string;
  agencyStaffName: string;
  agency: string;
  dateInducted: string;
  inductedBy: string; // staff ID
  inductionDuration: number; // minutes
  inductionType: InductionType;
  childrenInformedAboutAgencyArrival: boolean;
  agencyDbsVerified: boolean;
  agencyTrainingVerified: boolean;
  agencyReferencesVerified: boolean;
  inductionTopics: InductionTopic[];
  childInformationShared: string;
  keyPoliciesShared: string[];
  photoTakenAndVerified: boolean;
  behaviourSupportPlansBriefed: boolean;
  agencyStaffSignedInductionPack: boolean;
  shiftsBooked: number;
  agencyStaffFeedback: string;
  homeFeedbackOnAgency: string;
  repeatBookingApproved: boolean;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const TYPE_CLR: Record<InductionType, string> = {
  "Pre-shift brief": "bg-amber-100 text-amber-800",
  "Half-day full induction": "bg-blue-100 text-blue-800",
  "Returning staff refresh": "bg-purple-100 text-purple-800",
};

const TYPE_BORDER: Record<InductionType, string> = {
  "Pre-shift brief": "border-l-amber-400",
  "Half-day full induction": "border-l-blue-400",
  "Returning staff refresh": "border-l-purple-400",
};

const STANDARD_TOPICS: string[] = [
  "Children's individual needs (high-level only)",
  "Behaviour support principles",
  "Sensory awareness for Casey",
  "Restraint policy (overview)",
  "Recording requirements",
  "Reporting concerns",
  "Fire procedures",
  "Safe touch protocols",
  "Medication policy (no admin without separate certification)",
  "Phone/communication",
];

const buildTopics = (allCovered: boolean, exceptions: Record<string, { covered?: boolean; notes?: string }> = {}): InductionTopic[] =>
  STANDARD_TOPICS.map((topic) => ({
    topic,
    covered: exceptions[topic]?.covered ?? allCovered,
    notes: exceptions[topic]?.notes ?? "",
  }));

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: AgencyInduction[] = [
  {
    id: "ind_001",
    agencyStaffName: "Marcus Thompson",
    agency: "CareStaff Solutions",
    dateInducted: d(-90),
    inductedBy: "staff_darren",
    inductionDuration: 240,
    inductionType: "Half-day full induction",
    childrenInformedAboutAgencyArrival: true,
    agencyDbsVerified: true,
    agencyTrainingVerified: true,
    agencyReferencesVerified: true,
    inductionTopics: buildTopics(true, {
      "Sensory awareness for Casey": { covered: true, notes: "Walked through Casey's sensory profile (high-level). Demonstrated low-arousal approach, dim lighting in lounge, avoidance of sudden noise. No clinical detail shared." },
      "Restraint policy (overview)": { covered: true, notes: "Marcus is PRICE Level 2 trained via agency. Confirmed he understands Oak House's positive handling ethos — last resort, recorded, reviewed." },
      "Phone/communication": { covered: true, notes: "Phone policy explained — phones in locker during shift. Marcus signed phone agreement." },
    }),
    childInformationShared: "High-level only: 3 young people aged 13–16, mixed presentations, two with EHCPs, one with sensory needs, one with attachment-related behaviours. No diagnoses, full names of family, or trauma history shared at induction stage. Detail shared shift-by-shift on a need-to-know basis at handover.",
    keyPoliciesShared: ["Safeguarding & Child Protection", "Behaviour Support & Positive Handling", "Recording & Reporting", "Medication", "Health & Safety / Fire", "Phone & Social Media", "Whistleblowing"],
    photoTakenAndVerified: true,
    behaviourSupportPlansBriefed: true,
    agencyStaffSignedInductionPack: true,
    shiftsBooked: 6,
    agencyStaffFeedback: "Induction was thorough and welcoming. Felt confident going into first shift. Appreciated being introduced to YP gradually rather than all at once. The behaviour support overview was clear without being overloaded with detail.",
    homeFeedbackOnAgency: "CareStaff Solutions provided a complete vetting pack ahead of induction. Marcus arrived early, was prepared, and engaged well. Preferred worker — added to repeat booking list.",
    repeatBookingApproved: true,
  },
  {
    id: "ind_002",
    agencyStaffName: "Priya Patel",
    agency: "NightOwl Staffing",
    dateInducted: d(-180),
    inductedBy: "staff_ryan",
    inductionDuration: 240,
    inductionType: "Half-day full induction",
    childrenInformedAboutAgencyArrival: true,
    agencyDbsVerified: true,
    agencyTrainingVerified: true,
    agencyReferencesVerified: true,
    inductionTopics: buildTopics(true, {
      "Children's individual needs (high-level only)": { covered: true, notes: "Night-specific briefing — sleep routines, who needs check-ins, who is unsettled by torch light. No diagnoses shared." },
      "Sensory awareness for Casey": { covered: true, notes: "Casey's sensitivity to noise/light covered in detail given waking night role. Priya shown how to do silent door checks." },
      "Medication policy (no admin without separate certification)": { covered: true, notes: "Priya is medication-trained via agency. Oak House MAR system demonstrated. Witness countersign rule reinforced." },
    }),
    childInformationShared: "Night-shift specific: sleep routines, check frequencies, room locations, what to do if a YP is awake distressed (call on-call). High-level only — no histories or trauma detail shared at induction.",
    keyPoliciesShared: ["Safeguarding & Child Protection", "Night Support & Lone Working", "Medication", "Behaviour Support", "Fire & Emergency", "Recording & Reporting"],
    photoTakenAndVerified: true,
    behaviourSupportPlansBriefed: true,
    agencyStaffSignedInductionPack: true,
    shiftsBooked: 17,
    agencyStaffFeedback: "Best induction I've had in 4 years of agency work. Pack was clear, Ryan was patient, and the home felt organised. Coming back to Oak House always feels safe and prepared.",
    homeFeedbackOnAgency: "Priya is our preferred waking night agency worker. NightOwl's vetting is rigorous and the worker matches the paperwork. Strongly recommended for repeat booking.",
    repeatBookingApproved: true,
  },
  {
    id: "ind_003",
    agencyStaffName: "Aisha Bello",
    agency: "CareStaff Solutions",
    dateInducted: d(-30),
    inductedBy: "staff_darren",
    inductionDuration: 60,
    inductionType: "Returning staff refresh",
    childrenInformedAboutAgencyArrival: true,
    agencyDbsVerified: true,
    agencyTrainingVerified: true,
    agencyReferencesVerified: true,
    inductionTopics: buildTopics(true, {
      "Children's individual needs (high-level only)": { covered: true, notes: "Updated on changes since last shift 6 months ago — one new admission, one YP moved on. High-level only." },
      "Behaviour support principles": { covered: true, notes: "BSPs reviewed for current cohort. Updated approach for Casey explained." },
      "Recording requirements": { covered: true, notes: "Reminder of new daily log template introduced 3 months ago. Aisha walked through example entries." },
    }),
    childInformationShared: "Refresh briefing — focus on what has changed since Aisha's last shift. New YP introduced at high level, BSP changes summarised, current routines confirmed.",
    keyPoliciesShared: ["Safeguarding (refresher)", "Updated Recording Template", "Behaviour Support (current BSPs)", "Phone & Social Media (annual reminder)"],
    photoTakenAndVerified: true,
    behaviourSupportPlansBriefed: true,
    agencyStaffSignedInductionPack: true,
    shiftsBooked: 4,
    agencyStaffFeedback: "Glad to be back. The refresh was the right length — not patronising but covered everything that had changed. Appreciated the honest update on Casey's recent BSP changes.",
    homeFeedbackOnAgency: "Aisha is one of our most consistent agency workers. CareStaff continue to be reliable. Approved for repeat booking — preferred worker list.",
    repeatBookingApproved: true,
  },
  {
    id: "ind_004",
    agencyStaffName: "Daniel Okafor",
    agency: "Premier Care Agency",
    dateInducted: d(-14),
    inductedBy: "staff_ryan",
    inductionDuration: 180,
    inductionType: "Half-day full induction",
    childrenInformedAboutAgencyArrival: true,
    agencyDbsVerified: true,
    agencyTrainingVerified: false,
    agencyReferencesVerified: false,
    inductionTopics: buildTopics(true, {
      "Behaviour support principles": { covered: true, notes: "Daniel had limited prior experience in children's homes. Concepts explained at greater depth. Some understanding gaps remained." },
      "Phone/communication": { covered: true, notes: "Phone policy explained twice — Daniel asked clarifying questions. Signed agreement. Note: subsequently breached during first shift (see Agency Staff Log ag_004)." },
      "Recording requirements": { covered: true, notes: "Daniel needed extra time on recording standards. Examples provided. Concern noted re. brevity of his actual shift notes afterwards." },
    }),
    childInformationShared: "Full briefing pack delivered, but at high level — three young people, mixed presentations, two with EHCPs. Detailed BSP information shared on a need-to-know basis at handover.",
    keyPoliciesShared: ["Safeguarding & Child Protection", "Behaviour Support & Positive Handling", "Recording & Reporting", "Medication", "Phone & Social Media", "Whistleblowing"],
    photoTakenAndVerified: true,
    behaviourSupportPlansBriefed: true,
    agencyStaffSignedInductionPack: true,
    shiftsBooked: 1,
    agencyStaffFeedback: "Induction was long but useful. Felt overwhelmed by the amount of policy detail.",
    homeFeedbackOnAgency: "Premier Care Agency vetting was incomplete — references and training matrix not verified at point of booking. Daniel performed below standard during shift (see ag_004) — phone use during shift and weak engagement. Repeat booking NOT approved. Feedback formally returned to agency in writing. Premier Care to be reviewed as a supplier.",
    repeatBookingApproved: false,
  },
  {
    id: "ind_005",
    agencyStaffName: "Sofia Martinez",
    agency: "Bright Futures Agency",
    dateInducted: d(-2),
    inductedBy: "staff_anna",
    inductionDuration: 120,
    inductionType: "Half-day full induction",
    childrenInformedAboutAgencyArrival: true,
    agencyDbsVerified: true,
    agencyTrainingVerified: true,
    agencyReferencesVerified: true,
    inductionTopics: buildTopics(false, {
      "Children's individual needs (high-level only)": { covered: true, notes: "High-level cohort overview given. Names, ages, EHCP status." },
      "Behaviour support principles": { covered: true, notes: "Oak House positive handling ethos explained." },
      "Recording requirements": { covered: true, notes: "Daily log template walked through." },
      "Reporting concerns": { covered: true, notes: "Safeguarding flowchart shared. LADO process explained." },
      "Fire procedures": { covered: true, notes: "Fire walk completed — all exits, assembly point, refuge area." },
      "Phone/communication": { covered: true, notes: "Phone policy signed." },
      "Sensory awareness for Casey": { covered: false, notes: "Pending — to be covered before any shift involving Casey. Sofia not yet booked." },
      "Restraint policy (overview)": { covered: false, notes: "Pending — Sofia not yet PRICE certified. Agency confirms training booked for next week. No shift to be booked until certified." },
      "Safe touch protocols": { covered: false, notes: "Pending — to be covered alongside restraint policy." },
      "Medication policy (no admin without separate certification)": { covered: false, notes: "Pending — Sofia does not currently hold medication certification. Will not be administering medication regardless of completion." },
    }),
    childInformationShared: "First-time induction — high-level cohort overview only. No detailed BSPs or histories shared until induction is complete and first shift confirmed.",
    keyPoliciesShared: ["Safeguarding & Child Protection (Part 1)", "Recording & Reporting", "Fire & Emergency", "Phone & Social Media"],
    photoTakenAndVerified: true,
    behaviourSupportPlansBriefed: false,
    agencyStaffSignedInductionPack: false,
    shiftsBooked: 0,
    agencyStaffFeedback: "Two-hour first session was a good pace. Looking forward to completing the remaining topics next week before my first shift.",
    homeFeedbackOnAgency: "Bright Futures Agency new supplier — first induction. Vetting pack complete. Sofia presents well. Induction split across two sessions due to outstanding PRICE certification. No shift to be booked until full induction signed off. Approval pending completion.",
    repeatBookingApproved: false,
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function AgencyStaffInductionPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterAgency, setFilterAgency] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const agencies = useMemo(() => Array.from(new Set(data.map((r) => r.agency))).sort(), [data]);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.agencyStaffName.toLowerCase().includes(q) ||
        r.agency.toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") rows = rows.filter((r) => r.inductionType === filterType);
    if (filterAgency !== "all") rows = rows.filter((r) => r.agency === filterAgency);
    rows.sort((a, b) => sortBy === "newest"
      ? b.dateInducted.localeCompare(a.dateInducted)
      : a.dateInducted.localeCompare(b.dateInducted));
    return rows;
  }, [data, search, filterType, filterAgency, sortBy]);

  /* summary stats */
  const activeAgencies = agencies.length;
  const yearStart = new Date().toISOString().slice(0, 4) + "-01-01";
  const inductionsThisYear = data.filter((r) => r.dateInducted >= yearStart).length;
  const approvedForRepeat = data.filter((r) => r.repeatBookingApproved).length;
  const dbsVerifiedCount = data.filter((r) => r.agencyDbsVerified).length;

  const exportCols: ExportColumn<AgencyInduction>[] = [
    { header: "Date", accessor: (r: AgencyInduction) => r.dateInducted },
    { header: "Agency Worker", accessor: (r: AgencyInduction) => r.agencyStaffName },
    { header: "Agency", accessor: (r: AgencyInduction) => r.agency },
    { header: "Inducted By", accessor: (r: AgencyInduction) => getStaffName(r.inductedBy) },
    { header: "Type", accessor: (r: AgencyInduction) => r.inductionType },
    { header: "Duration (mins)", accessor: (r: AgencyInduction) => String(r.inductionDuration) },
    { header: "DBS Verified", accessor: (r: AgencyInduction) => r.agencyDbsVerified ? "Yes" : "No" },
    { header: "Training Verified", accessor: (r: AgencyInduction) => r.agencyTrainingVerified ? "Yes" : "No" },
    { header: "References Verified", accessor: (r: AgencyInduction) => r.agencyReferencesVerified ? "Yes" : "No" },
    { header: "BSPs Briefed", accessor: (r: AgencyInduction) => r.behaviourSupportPlansBriefed ? "Yes" : "No" },
    { header: "Pack Signed", accessor: (r: AgencyInduction) => r.agencyStaffSignedInductionPack ? "Yes" : "No" },
    { header: "Shifts Booked", accessor: (r: AgencyInduction) => String(r.shiftsBooked) },
    { header: "Repeat Approved", accessor: (r: AgencyInduction) => r.repeatBookingApproved ? "Yes" : "No" },
  ];

  return (
    <PageShell
      title="Agency Staff Induction"
      subtitle="Reg 32 · Quality Standard 13 · KCSIE 2024 — Induction of agency staff who cover shifts"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Agency Staff Induction" />
          <ExportButton data={data} columns={exportCols} filename="agency-staff-induction" />
        </div>
      }
    >
      <div id="print-area">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Agencies", value: activeAgencies, icon: Building2, clr: "text-blue-600" },
            { label: "Inductions This Year", value: inductionsThisYear, icon: ClipboardCheck, clr: "text-amber-600" },
            { label: "Approved for Repeat", value: approvedForRepeat, icon: BadgeCheck, clr: "text-green-600" },
            { label: "DBS Verified", value: `${dbsVerifiedCount}/${data.length}`, icon: ShieldCheck, clr: "text-purple-600" },
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

        {/* filters / sort */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search worker or agency..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Induction Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Induction Types</SelectItem>
              <SelectItem value="Pre-shift brief">Pre-shift brief</SelectItem>
              <SelectItem value="Half-day full induction">Half-day full induction</SelectItem>
              <SelectItem value="Returning staff refresh">Returning staff refresh</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAgency} onValueChange={setFilterAgency}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Agency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agencies</SelectItem>
              {agencies.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
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

        {/* induction cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const topicsCovered = r.inductionTopics.filter((t) => t.covered).length;
            const topicsTotal = r.inductionTopics.length;
            const fullyComplete =
              r.agencyDbsVerified && r.agencyTrainingVerified && r.agencyReferencesVerified &&
              r.behaviourSupportPlansBriefed && r.agencyStaffSignedInductionPack &&
              topicsCovered === topicsTotal;
            return (
              <Card key={r.id} className={cn("border-l-4", TYPE_BORDER[r.inductionType])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {r.agencyStaffName}
                        <Badge variant="outline" className={TYPE_CLR[r.inductionType]}>{r.inductionType}</Badge>
                        {r.repeatBookingApproved
                          ? <Badge variant="outline" className="bg-green-100 text-green-800">Repeat OK</Badge>
                          : <Badge variant="outline" className="bg-red-100 text-red-800">Repeat Declined</Badge>}
                        {!fullyComplete && <Badge variant="outline" className="bg-amber-100 text-amber-800">Induction in progress</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.agency} · {r.dateInducted} · {r.inductionDuration} mins · By {getStaffName(r.inductedBy)} · Topics {topicsCovered}/{topicsTotal} · Shifts booked: {r.shiftsBooked}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* vetting checklist */}
                    <div>
                      <p className="font-medium mb-1">Vetting & Pre-Shift Verification</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { label: "DBS Verified", ok: r.agencyDbsVerified },
                          { label: "Training Verified", ok: r.agencyTrainingVerified },
                          { label: "References Verified", ok: r.agencyReferencesVerified },
                          { label: "Photo Verified", ok: r.photoTakenAndVerified },
                          { label: "BSPs Briefed", ok: r.behaviourSupportPlansBriefed },
                          { label: "Induction Pack Signed", ok: r.agencyStaffSignedInductionPack },
                          { label: "Children Informed", ok: r.childrenInformedAboutAgencyArrival },
                        ].map((c) => (
                          <div key={c.label} className="flex items-center gap-1.5 text-xs">
                            {c.ok
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                            <span className={c.ok ? "" : "text-red-700 font-medium"}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* topics */}
                    <div>
                      <p className="font-medium mb-1">Induction Topics ({topicsCovered}/{topicsTotal} covered)</p>
                      <div className="space-y-1.5">
                        {r.inductionTopics.map((t) => (
                          <div key={t.topic} className={cn(
                            "rounded p-2 text-xs",
                            t.covered ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
                          )}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {t.covered
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                : <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                              <span className="font-medium">{t.topic}</span>
                            </div>
                            {t.notes && <p className="text-muted-foreground ml-5">{t.notes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* child information shared */}
                    <div>
                      <p className="font-medium mb-1">Child Information Shared (high-level only)</p>
                      <p className="text-muted-foreground text-xs">{r.childInformationShared}</p>
                    </div>

                    {/* policies */}
                    <div>
                      <p className="font-medium mb-1">Key Policies Shared</p>
                      <div className="flex flex-wrap gap-1.5">
                        {r.keyPoliciesShared.map((p) => (
                          <Badge key={p} variant="outline" className="bg-muted/50 text-xs">{p}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* feedback */}
                    {r.agencyStaffFeedback && (
                      <div>
                        <p className="font-medium mb-1">Agency Staff Feedback</p>
                        <p className="text-muted-foreground text-xs">{r.agencyStaffFeedback}</p>
                      </div>
                    )}
                    {r.homeFeedbackOnAgency && (
                      <div>
                        <p className="font-medium mb-1">Home Feedback on Agency</p>
                        <p className="text-muted-foreground text-xs">{r.homeFeedbackOnAgency}</p>
                      </div>
                    )}

                    {/* repeat booking */}
                    <div className={cn(
                      "rounded p-2",
                      r.repeatBookingApproved ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                    )}>
                      <p className={cn(
                        "text-xs font-medium",
                        r.repeatBookingApproved ? "text-green-800" : "text-red-800"
                      )}>
                        {r.repeatBookingApproved
                          ? "Approved for repeat booking — added to preferred worker list."
                          : r.shiftsBooked === 0
                            ? "Repeat booking pending — induction not yet fully complete."
                            : "Repeat booking declined — feedback returned to agency."}
                      </p>
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
            Children&apos;s Homes (England) Regulations 2015, Reg 32 — Fitness of Workers — requires that all persons working at the home (including agency staff covering shifts) are of integrity and good character, have the necessary qualifications, skills and experience, and are physically and mentally fit. Quality Standard 13 (Leadership and Management) requires the registered person to ensure staff (including agency staff) understand the home&apos;s ethos, the children&apos;s needs, and their role in safeguarding. KCSIE 2024 reinforces that agency staff must receive a documented local induction, be briefed on individual children on a need-to-know basis, and understand reporting and safeguarding routes. Induction records must be retained, vetting verified before first shift, and any concerns fed back to the supplying agency in writing. Repeat booking decisions should be evidenced. Agency use is monitored under Reg 44/45.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
