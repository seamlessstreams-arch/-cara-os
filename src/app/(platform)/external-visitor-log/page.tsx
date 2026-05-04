"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield,
  Phone,
  ClipboardList,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExternalVisitor {
  id: string;
  date: string;
  arrivalTime: string;
  departureTime: string;
  visitorName: string;
  visitorOrganisation: string;
  visitorRole: string;
  visitorType: "Professional" | "Volunteer" | "Contractor" | "Inspector" | "Family-of-staff" | "Tradesperson" | "Researcher" | "Friend-of-child";
  purposeOfVisit: string;
  purposeCategory: "Care/Therapy" | "Maintenance" | "Inspection" | "Education" | "Family" | "Activity" | "Delivery" | "Health";
  authorisedBy: string;
  hostStaff: string;
  idChecked: boolean;
  dbsChecked: boolean;
  dbsRequired: boolean;
  signedNDA: boolean;
  signedSafeguarding: boolean;
  childrenInteractedWith: string[];
  unsupervisedAccess: boolean;
  areasAccessed: string[];
  signedIn: boolean;
  signedOut: boolean;
  badgeIssued: boolean;
  feedback: string;
  concernsRaised: string[];
  notes: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: ExternalVisitor[] = [
  {
    id: "ev-001",
    date: d(-1),
    arrivalTime: "10:15",
    departureTime: "11:45",
    visitorName: "Dr Priya Patel",
    visitorOrganisation: "CAMHS — Riverside",
    visitorRole: "Clinical Psychologist",
    visitorType: "Professional",
    purposeOfVisit: "Therapy session with Alex",
    purposeCategory: "Care/Therapy",
    authorisedBy: "staff_darren",
    hostStaff: "staff_anna",
    idChecked: true,
    dbsChecked: true,
    dbsRequired: true,
    signedNDA: true,
    signedSafeguarding: true,
    childrenInteractedWith: ["yp_alex"],
    unsupervisedAccess: true,
    areasAccessed: ["Therapy room", "Reception"],
    signedIn: true,
    signedOut: true,
    badgeIssued: true,
    feedback: "Productive session. Alex engaged well. Will continue weekly.",
    concernsRaised: [],
    notes: "Regular weekly visit. DBS on file. Standard therapy protocol followed.",
  },
  {
    id: "ev-002",
    date: d(-1),
    arrivalTime: "14:30",
    departureTime: "16:00",
    visitorName: "Mike Roberts",
    visitorOrganisation: "Roberts Plumbing Services",
    visitorRole: "Lead plumber",
    visitorType: "Contractor",
    purposeOfVisit: "Boiler servicing — annual maintenance",
    purposeCategory: "Maintenance",
    authorisedBy: "staff_darren",
    hostStaff: "staff_chervelle",
    idChecked: true,
    dbsChecked: false,
    dbsRequired: false,
    signedNDA: true,
    signedSafeguarding: true,
    childrenInteractedWith: [],
    unsupervisedAccess: false,
    areasAccessed: ["Boiler room", "Reception", "Kitchen"],
    signedIn: true,
    signedOut: true,
    badgeIssued: true,
    feedback: "Professional and respectful. Service completed within time. No issues.",
    concernsRaised: [],
    notes: "All children in school during visit. Staff supervision throughout. Service certificate provided.",
  },
  {
    id: "ev-003",
    date: d(-3),
    arrivalTime: "16:45",
    departureTime: "18:15",
    visitorName: "Coach James Walker",
    visitorOrganisation: "Riverside Boxing Club",
    visitorRole: "Boxing Coach (DBS verified)",
    visitorType: "Volunteer",
    purposeOfVisit: "Brief Alex on upcoming inter-club competition (could not attend club session)",
    purposeCategory: "Activity",
    authorisedBy: "staff_darren",
    hostStaff: "staff_lackson",
    idChecked: true,
    dbsChecked: true,
    dbsRequired: true,
    signedNDA: true,
    signedSafeguarding: true,
    childrenInteractedWith: ["yp_alex"],
    unsupervisedAccess: false,
    areasAccessed: ["Lounge"],
    signedIn: true,
    signedOut: true,
    badgeIssued: true,
    feedback: "Significant moment for Alex — first selected for inter-club. Coach's support continuing.",
    concernsRaised: [],
    notes: "Alex very motivated post-visit. Conversation in lounge with staff present. Boxing relationship a strong protective factor.",
  },
  {
    id: "ev-004",
    date: d(-5),
    arrivalTime: "09:00",
    departureTime: "11:30",
    visitorName: "Helen Frost",
    visitorOrganisation: "Riverside LA — Reg 44 Independent Person",
    visitorRole: "Independent Person (Reg 44)",
    visitorType: "Inspector",
    purposeOfVisit: "Monthly Reg 44 visit",
    purposeCategory: "Inspection",
    authorisedBy: "staff_darren",
    hostStaff: "staff_darren",
    idChecked: true,
    dbsChecked: true,
    dbsRequired: true,
    signedNDA: true,
    signedSafeguarding: true,
    childrenInteractedWith: ["yp_alex", "yp_jordan", "yp_casey"],
    unsupervisedAccess: true,
    areasAccessed: ["All bedrooms (with consent)", "Communal areas", "Office", "Garden"],
    signedIn: true,
    signedOut: true,
    badgeIssued: true,
    feedback: "Positive visit. Children spoke openly. Report to follow within 14 days. No concerns identified.",
    concernsRaised: [],
    notes: "Regular monthly Reg 44 visit. All three children opted to speak with Helen privately. Reports filed appropriately.",
  },
  {
    id: "ev-005",
    date: d(-7),
    arrivalTime: "13:00",
    departureTime: "14:30",
    visitorName: "Sarah Mitchell",
    visitorOrganisation: "Riverside County Council",
    visitorRole: "Allocated Social Worker (Alex)",
    visitorType: "Professional",
    purposeOfVisit: "Statutory 6-weekly visit",
    purposeCategory: "Care/Therapy",
    authorisedBy: "staff_darren",
    hostStaff: "staff_edward",
    idChecked: true,
    dbsChecked: true,
    dbsRequired: true,
    signedNDA: true,
    signedSafeguarding: true,
    childrenInteractedWith: ["yp_alex"],
    unsupervisedAccess: true,
    areasAccessed: ["Alex's bedroom (with consent)", "Office", "Reception"],
    signedIn: true,
    signedOut: true,
    badgeIssued: true,
    feedback: "Saw Alex alone for 30 mins as required. Reviewed bedroom and key records. Positive update.",
    concernsRaised: [],
    notes: "Standard statutory visit. Documentation completed. Visit logged in statutory-visit-log per requirements.",
  },
  {
    id: "ev-006",
    date: d(-10),
    arrivalTime: "11:00",
    departureTime: "12:00",
    visitorName: "Karen Hughes",
    visitorOrganisation: "Coram Voice",
    visitorRole: "Independent Advocate",
    visitorType: "Professional",
    purposeOfVisit: "Advocacy session with Jordan",
    purposeCategory: "Care/Therapy",
    authorisedBy: "staff_darren",
    hostStaff: "staff_chervelle",
    idChecked: true,
    dbsChecked: true,
    dbsRequired: true,
    signedNDA: true,
    signedSafeguarding: true,
    childrenInteractedWith: ["yp_jordan"],
    unsupervisedAccess: true,
    areasAccessed: ["Therapy room"],
    signedIn: true,
    signedOut: true,
    badgeIssued: true,
    feedback: "Confidential session. Jordan engaged well. Will continue regular involvement.",
    concernsRaised: [],
    notes: "Advocacy is confidential. Karen will share concerns directly with Jordan if appropriate. Standard arrangement.",
  },
  {
    id: "ev-007",
    date: d(-12),
    arrivalTime: "15:30",
    departureTime: "16:30",
    visitorName: "DPD Driver — Tom Fielding",
    visitorOrganisation: "DPD",
    visitorRole: "Delivery driver",
    visitorType: "Tradesperson",
    purposeOfVisit: "Delivery of Casey's adapted school equipment",
    purposeCategory: "Delivery",
    authorisedBy: "staff_anna",
    hostStaff: "staff_anna",
    idChecked: true,
    dbsChecked: false,
    dbsRequired: false,
    signedNDA: false,
    signedSafeguarding: false,
    childrenInteractedWith: [],
    unsupervisedAccess: false,
    areasAccessed: ["Front door only"],
    signedIn: true,
    signedOut: true,
    badgeIssued: false,
    feedback: "Quick delivery. No interaction with children. Items received.",
    concernsRaised: [],
    notes: "Delivery only — did not enter beyond front door. Standard delivery protocol.",
  },
  {
    id: "ev-008",
    date: d(-15),
    arrivalTime: "10:00",
    departureTime: "13:00",
    visitorName: "James Cole",
    visitorOrganisation: "Riverside Police — Exploitation Team",
    visitorRole: "Detective Constable",
    visitorType: "Professional",
    purposeOfVisit: "Multi-agency meeting re Jordan + community awareness brief",
    purposeCategory: "Care/Therapy",
    authorisedBy: "staff_darren",
    hostStaff: "staff_darren",
    idChecked: true,
    dbsChecked: true,
    dbsRequired: true,
    signedNDA: true,
    signedSafeguarding: true,
    childrenInteractedWith: [],
    unsupervisedAccess: false,
    areasAccessed: ["Office", "Meeting room"],
    signedIn: true,
    signedOut: true,
    badgeIssued: true,
    feedback: "Productive multi-agency conversation. Action plan agreed. Positive police-home partnership.",
    concernsRaised: [],
    notes: "Did not interact with children directly. Office-based meeting only. Information shared appropriately.",
  },
];

const typeColour: Record<string, string> = {
  Professional: "bg-blue-100 text-blue-800",
  Volunteer: "bg-green-100 text-green-800",
  Contractor: "bg-amber-100 text-amber-800",
  Inspector: "bg-purple-100 text-purple-800",
  "Family-of-staff": "bg-pink-100 text-pink-800",
  Tradesperson: "bg-slate-100 text-slate-800",
  Researcher: "bg-indigo-100 text-indigo-800",
  "Friend-of-child": "bg-rose-100 text-rose-800",
};

const exportCols: ExportColumn<ExternalVisitor>[] = [
  { header: "Date", accessor: (r: ExternalVisitor) => r.date },
  { header: "Visitor", accessor: (r: ExternalVisitor) => r.visitorName },
  { header: "Organisation", accessor: (r: ExternalVisitor) => r.visitorOrganisation },
  { header: "Role", accessor: (r: ExternalVisitor) => r.visitorRole },
  { header: "Type", accessor: (r: ExternalVisitor) => r.visitorType },
  { header: "Purpose", accessor: (r: ExternalVisitor) => r.purposeOfVisit },
  { header: "Arrival", accessor: (r: ExternalVisitor) => r.arrivalTime },
  { header: "Departure", accessor: (r: ExternalVisitor) => r.departureTime },
  { header: "DBS Checked", accessor: (r: ExternalVisitor) => r.dbsChecked ? "Yes" : (r.dbsRequired ? "REQUIRED" : "N/A") },
  { header: "Host Staff", accessor: (r: ExternalVisitor) => getStaffName(r.hostStaff) },
];

export default function ExternalVisitorLogPage() {
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterType !== "all") items = items.filter((v) => v.visitorType === filterType);
    if (filterCategory !== "all") items = items.filter((v) => v.purposeCategory === filterCategory);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "type":
          return a.visitorType.localeCompare(b.visitorType);
        case "duration":
          const durA = (parseInt(a.departureTime.replace(":", "")) - parseInt(a.arrivalTime.replace(":", "")));
          const durB = (parseInt(b.departureTime.replace(":", "")) - parseInt(b.arrivalTime.replace(":", "")));
          return durB - durA;
        default:
          return 0;
      }
    });
    return items;
  }, [filterType, filterCategory, sortBy]);

  const totalVisits = data.length;
  const dbsCompliant = data.every((v) => !v.dbsRequired || v.dbsChecked);
  const childInteractions = data.filter((v) => v.childrenInteractedWith.length > 0).length;
  const concerns = data.filter((v) => v.concernsRaised.length > 0).length;

  return (
    <PageShell
      title="External Visitor Log"
      subtitle="Records of all external visitors — professionals, contractors, volunteers, deliveries — with safeguarding checks"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="external-visitor-log" />
          <PrintButton title="External Visitor Log" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalVisits}</p>
          <p className="text-xs text-muted-foreground">Recent Visits</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", dbsCompliant ? "text-green-600" : "text-red-600")}>
            {dbsCompliant ? "100%" : "Issue"}
          </p>
          <p className="text-xs text-muted-foreground">DBS Compliance</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{childInteractions}</p>
          <p className="text-xs text-muted-foreground">Child Interactions</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", concerns > 0 ? "text-red-600" : "text-green-600")}>{concerns}</p>
          <p className="text-xs text-muted-foreground">Concerns Raised</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Shield className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          All external visitors are signed in/out, ID checked, and DBS-verified where required (any
          unsupervised access to children). Visitors interacting with children must hold an enhanced DBS
          and have completed safeguarding induction.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Professional">Professional</SelectItem>
            <SelectItem value="Volunteer">Volunteer</SelectItem>
            <SelectItem value="Contractor">Contractor</SelectItem>
            <SelectItem value="Inspector">Inspector</SelectItem>
            <SelectItem value="Tradesperson">Tradesperson</SelectItem>
            <SelectItem value="Researcher">Researcher</SelectItem>
            <SelectItem value="Friend-of-child">Friend-of-child</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Purposes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Purposes</SelectItem>
            <SelectItem value="Care/Therapy">Care/Therapy</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
            <SelectItem value="Inspection">Inspection</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="Family">Family</SelectItem>
            <SelectItem value="Activity">Activity</SelectItem>
            <SelectItem value="Delivery">Delivery</SelectItem>
            <SelectItem value="Health">Health</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
              <SelectItem value="duration">Longest Visit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((visit) => {
          const isExpanded = expandedId === visit.id;
          const dbsIssue = visit.dbsRequired && !visit.dbsChecked;

          return (
            <div key={visit.id} className={cn("rounded-xl border bg-white overflow-hidden",
              dbsIssue && "border-l-4 border-l-red-500"
            )}>
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : visit.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Users className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{visit.visitorName} ({visit.visitorOrganisation})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {visit.date} &middot; {visit.arrivalTime}–{visit.departureTime} &middot; {visit.purposeOfVisit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", typeColour[visit.visitorType])}>
                    {visit.visitorType}
                  </span>
                  {visit.dbsChecked && <Shield className="h-4 w-4 text-green-500" />}
                  {dbsIssue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Visitor Details</p>
                      <p className="text-sm">{visit.visitorRole}</p>
                      <p className="text-xs text-muted-foreground mt-1">{visit.visitorOrganisation}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Authorisation</p>
                      <p className="text-sm">Authorised: {getStaffName(visit.authorisedBy)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Host: {getStaffName(visit.hostStaff)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Compliance Checks</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className={cn("rounded-lg p-2 text-center text-sm",
                        visit.idChecked ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                      )}>
                        {visit.idChecked ? <CheckCircle className="h-4 w-4 inline mr-1" /> : <AlertTriangle className="h-4 w-4 inline mr-1" />}
                        ID Checked
                      </div>
                      <div className={cn("rounded-lg p-2 text-center text-sm",
                        !visit.dbsRequired ? "bg-slate-100 text-slate-700" :
                        visit.dbsChecked ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                      )}>
                        {!visit.dbsRequired ? "DBS N/A" : (visit.dbsChecked ? <><CheckCircle className="h-4 w-4 inline mr-1" />DBS Verified</> : <><AlertTriangle className="h-4 w-4 inline mr-1" />DBS REQUIRED</>)}
                      </div>
                      <div className={cn("rounded-lg p-2 text-center text-sm",
                        visit.signedIn && visit.signedOut ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"
                      )}>
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        Signed {visit.signedIn ? "In" : "—"}/{visit.signedOut ? "Out" : "—"}
                      </div>
                      <div className={cn("rounded-lg p-2 text-center text-sm",
                        visit.badgeIssued ? "bg-blue-50 text-blue-800" : "bg-slate-100 text-slate-700"
                      )}>
                        Badge {visit.badgeIssued ? "Issued" : "Not Required"}
                      </div>
                    </div>
                  </div>

                  {visit.childrenInteractedWith.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Children Interacted With</p>
                      <p className="text-sm">{visit.childrenInteractedWith.length} {visit.childrenInteractedWith.length === 1 ? "child" : "children"}</p>
                      <p className="text-xs text-amber-700 mt-1">{visit.unsupervisedAccess ? "Unsupervised access permitted (DBS verified, regular professional)" : "Supervised throughout"}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Areas Accessed</p>
                    <div className="flex flex-wrap gap-1">
                      {visit.areasAccessed.map((a, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{a}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Visit Feedback</p>
                    <p className="text-sm">{visit.feedback}</p>
                  </div>

                  {visit.concernsRaised.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">Concerns</p>
                      <ul className="space-y-1">
                        {visit.concernsRaised.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 text-red-500 mt-1 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {visit.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{visit.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />{visit.arrivalTime}–{visit.departureTime}</span>
                    <span><Phone className="h-3 w-3 inline mr-1" />{visit.purposeCategory}</span>
                    <span><ClipboardList className="h-3 w-3 inline mr-1" />Host: {getStaffName(visit.hostStaff)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> External visitor records support Quality Standard 5
          (protection of children), Regulation 32 (fitness of workers — extended to volunteers/contractors
          with access), and the home&apos;s safeguarding policy. All visitors with unsupervised access
          to children require enhanced DBS. Linked to Visitor Log (front door) and Reg 44 visit records.
        </p>
      </div>
    </PageShell>
  );
}
