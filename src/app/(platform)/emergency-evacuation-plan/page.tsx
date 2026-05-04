"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Flame,
  AlertTriangle,
  CheckCircle,
  Heart,
  MapPin,
  Phone,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EvacuationPlan {
  id: string;
  scenarioName: string;
  scenarioType: "Fire" | "Gas leak" | "Water leak/flood" | "Power failure" | "Intruder/lockdown" | "Bomb threat" | "Carbon monoxide" | "Structural collapse" | "Severe weather";
  triggerCriteria: string[];
  primaryEvacuationRoute: string;
  secondaryEvacuationRoute: string;
  assemblyPoint: string;
  alternativeAssemblyPoint: string;
  rolesByStaff: { role: string; staffPosition: string; tasks: string[] }[];
  childSpecificConsiderations: { youngPerson: string; specialNeeds: string }[];
  evacuationOrder: string[];
  documentsToTake: string[];
  itemsNotToTakeBack: string[];
  emergencyContacts: { contact: string; number: string; when: string }[];
  rollCallProcedure: string;
  reentryProcess: string;
  postIncidentCare: string[];
  childPreparation: string;
  drillFrequency: string;
  lastDrillDate: string;
  nextDrillDue: string;
  reviewedDate: string;
  reviewedBy: string;
  approvedByFireOfficer: boolean;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: EvacuationPlan[] = [
  {
    id: "ev-001",
    scenarioName: "Fire — full building evacuation",
    scenarioType: "Fire",
    triggerCriteria: [
      "Fire alarm activation (continuous)",
      "Visible smoke or fire",
      "Heat detector activation",
      "Verbal report of fire that staff has verified",
    ],
    primaryEvacuationRoute: "Front door via main hallway and stairs (ground floor — direct out; first floor — descend stairs and out front door)",
    secondaryEvacuationRoute: "Back door via kitchen (if main hallway blocked)",
    assemblyPoint: "Designated assembly point on pavement opposite — by the lamp post at no.42",
    alternativeAssemblyPoint: "Cul-de-sac corner if primary blocked",
    rolesByStaff: [
      { role: "Lead/Coordinator", staffPosition: "First staff aware (usually shift lead)", tasks: ["Activate alarm if not already", "Call 999 from outside", "Coordinate evacuation", "Take roll call at assembly point"] },
      { role: "Floor sweep", staffPosition: "Second staff (if 2+ on shift)", tasks: ["Check all rooms top-down", "Close doors as you go (slows fire spread)", "Last person out closes external door"] },
      { role: "Child support", staffPosition: "Each child's primary staff that shift", tasks: ["Stay with child throughout", "Reassure", "Carry sensory items where possible (Casey)"] },
    ],
    childSpecificConsiderations: [
      { youngPerson: "yp_jordan", specialNeeds: "PTSD related to house fire (childhood) — high risk of dysregulation. Stay close. Reassure. Therapy session within 24h post-incident." },
      { youngPerson: "yp_casey", specialNeeds: "ASD + sensory profile. Alarm noise overwhelming. Bring Otter (soft toy) if grabbable. Sensory bag in hallway. Quiet space at assembly. Visual cards for communication." },
      { youngPerson: "yp_alex", specialNeeds: "ADHD — may bolt or freeze. Stay close. Verbal direction with calm pace." },
    ],
    evacuationOrder: [
      "Children evacuated first with staff",
      "Floor sweep last",
      "External door closed by last person",
      "Adjacent property neighbour notified",
    ],
    documentsToTake: [
      "Daily roll-call sheet (kept in hallway grab folder)",
      "Emergency contacts (phone-based)",
      "Children's quick-info sheets",
    ],
    itemsNotToTakeBack: [
      "Personal items not in grab bag",
      "Anything that delays evacuation",
    ],
    emergencyContacts: [
      { contact: "Emergency services", number: "999", when: "First — from outside" },
      { contact: "Registered Manager", number: "On-call mobile", when: "After 999" },
      { contact: "Local Authority Emergency Duty Team", number: "LA EDT number", when: "If RM unavailable" },
      { contact: "Adjacent neighbour (key holder)", number: "Listed in office", when: "If keys/access needed" },
    ],
    rollCallProcedure: "Lead conducts roll call by name. Each child's staff confirms presence and condition. Any missing person reported to fire crew immediately.",
    reentryProcess: "ONLY after fire service explicit clearance. Not before. RM authorises return. Damaged areas isolated. Children return to safe areas only.",
    postIncidentCare: [
      "Children's emotional wellbeing first — quiet space, drinks, food",
      "Therapy contact within 24h (Jordan PTSD risk; all if needed)",
      "Reg 40 notification to Ofsted",
      "LA notification",
      "Reflective debrief within 7 days",
      "Reg 45 review of incident",
    ],
    childPreparation: "All children briefed on plan in age-appropriate ways. Casey has visual social story. Jordan's plan includes specific sensitivity. Drills run quarterly with full child participation.",
    drillFrequency: "Quarterly minimum (Children's Homes Regs); plus unannounced",
    lastDrillDate: d(-30),
    nextDrillDue: d(60),
    reviewedDate: d(-60),
    reviewedBy: "staff_darren",
    approvedByFireOfficer: true,
  },
  {
    id: "ev-002",
    scenarioName: "Gas leak — partial evacuation",
    scenarioType: "Gas leak",
    triggerCriteria: [
      "Smell of gas",
      "Carbon monoxide alarm",
      "Reported leak by neighbour or contractor",
    ],
    primaryEvacuationRoute: "Out and away from building (200m minimum). Do NOT use light switches. Open doors/windows on way out if safe.",
    secondaryEvacuationRoute: "N/A — gas leaks require single rapid evacuation",
    assemblyPoint: "Park entrance 200m down road (further than fire assembly)",
    alternativeAssemblyPoint: "Nearby cafe (call ahead)",
    rolesByStaff: [
      { role: "Lead", staffPosition: "First staff aware", tasks: ["Evacuate immediately", "Call National Gas Emergency 0800 111 999 from outside", "Do NOT use phones inside building"] },
      { role: "Child support", staffPosition: "All staff", tasks: ["Get children out fast", "Open doors/windows where safe", "Do NOT switch lights"] },
    ],
    childSpecificConsiderations: [
      { youngPerson: "yp_casey", specialNeeds: "Speed required overrides usual sensory accommodations — Anna pre-briefs Casey that gas leak is a fast-out scenario" },
    ],
    evacuationOrder: ["All out fast — no roll call inside building"],
    documentsToTake: ["Phone (used outside only)"],
    itemsNotToTakeBack: ["Anything"],
    emergencyContacts: [
      { contact: "National Gas Emergency Service", number: "0800 111 999", when: "From outside immediately" },
      { contact: "Emergency services", number: "999 (if collapse/explosion)", when: "From outside" },
      { contact: "Registered Manager", number: "On-call", when: "After gas service notified" },
    ],
    rollCallProcedure: "At external assembly point only.",
    reentryProcess: "Only when National Gas Emergency Service explicitly clears the building.",
    postIncidentCare: [
      "Children reassured at safe location",
      "Alternative accommodation if needed (LA EDT)",
      "Post-incident reflective debrief",
    ],
    childPreparation: "Children briefed on gas leak scenario as separate from fire — different speed and different rules (no light switches).",
    drillFrequency: "Annual tabletop walkthrough; not a full physical drill (gas-specific)",
    lastDrillDate: d(-180),
    nextDrillDue: d(185),
    reviewedDate: d(-60),
    reviewedBy: "staff_darren",
    approvedByFireOfficer: true,
  },
  {
    id: "ev-003",
    scenarioName: "Intruder / lockdown",
    scenarioType: "Intruder/lockdown",
    triggerCriteria: [
      "Unauthorised person attempting entry",
      "Threat to children's safety",
      "Police-advised lockdown",
    ],
    primaryEvacuationRoute: "Lockdown — stay inside, lock doors, gather in safe room (lounge with security door)",
    secondaryEvacuationRoute: "Garden exit if intruder confirmed outside front",
    assemblyPoint: "Internal — secure lounge",
    alternativeAssemblyPoint: "Office (lockable from inside)",
    rolesByStaff: [
      { role: "Lead", staffPosition: "First staff aware", tasks: ["Call 999 immediately", "Lock external doors", "Direct children to safe room", "Stay calm and quiet"] },
      { role: "Child support", staffPosition: "All staff", tasks: ["Get children to safe room quickly and quietly", "Reassure", "Account for everyone"] },
    ],
    childSpecificConsiderations: [
      { youngPerson: "yp_casey", specialNeeds: "Need calm, structured response — visual schedule cards specifically for emergency situations" },
      { youngPerson: "yp_jordan", specialNeeds: "Past missing-from-care risk in stress — keep close, reassure" },
    ],
    evacuationOrder: ["Children to safe room first", "Staff secure perimeter", "Wait for police clearance"],
    documentsToTake: ["Phone (in safe room)"],
    itemsNotToTakeBack: ["Anything that delays securing the room"],
    emergencyContacts: [
      { contact: "Police 999", number: "999", when: "Immediately" },
      { contact: "Registered Manager", number: "On-call", when: "Once safe" },
    ],
    rollCallProcedure: "In safe room — quiet headcount.",
    reentryProcess: "Only after police explicit clearance.",
    postIncidentCare: [
      "Therapy support within 24h if children distressed",
      "Reg 40 notification",
      "Reflective debrief within 7 days",
    ],
    childPreparation: "Children briefed on lockdown procedure as part of personal safety education. Practiced through tabletop walkthroughs.",
    drillFrequency: "Annual tabletop walkthrough",
    lastDrillDate: d(-120),
    nextDrillDue: d(245),
    reviewedDate: d(-60),
    reviewedBy: "staff_darren",
    approvedByFireOfficer: false,
  },
];

const exportCols: ExportColumn<EvacuationPlan>[] = [
  { header: "Scenario", accessor: (r: EvacuationPlan) => r.scenarioName },
  { header: "Type", accessor: (r: EvacuationPlan) => r.scenarioType },
  { header: "Primary Route", accessor: (r: EvacuationPlan) => r.primaryEvacuationRoute },
  { header: "Assembly Point", accessor: (r: EvacuationPlan) => r.assemblyPoint },
  { header: "Last Drill", accessor: (r: EvacuationPlan) => r.lastDrillDate },
  { header: "Next Drill", accessor: (r: EvacuationPlan) => r.nextDrillDue },
  { header: "Fire Officer Approved", accessor: (r: EvacuationPlan) => r.approvedByFireOfficer ? "Yes" : "N/A" },
];

export default function EmergencyEvacuationPlanPage() {
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("type");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterType !== "all") items = items.filter((p) => p.scenarioType === filterType);
    items.sort((a, b) => {
      switch (sortBy) {
        case "type":
          return a.scenarioType.localeCompare(b.scenarioType);
        case "drill":
          return a.nextDrillDue.localeCompare(b.nextDrillDue);
        default:
          return 0;
      }
    });
    return items;
  }, [filterType, sortBy]);

  const total = data.length;
  const dueDrills = data.filter((p) => p.nextDrillDue <= d(60)).length;
  const allApproved = data.filter((p) => p.approvedByFireOfficer).length;

  return (
    <PageShell
      title="Emergency Evacuation Plan"
      subtitle="Building emergency response plans — fire, gas leak, lockdown — with child-specific considerations"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="emergency-evacuation-plan" />
          <PrintButton title="Emergency Evacuation Plan" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Plans</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", dueDrills > 0 ? "text-amber-600" : "text-green-600")}>{dueDrills}</p>
          <p className="text-xs text-muted-foreground">Drills Due 60d</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{allApproved}</p>
          <p className="text-xs text-muted-foreground">Fire Officer Approved</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">100%</p>
          <p className="text-xs text-muted-foreground">Child-Briefed</p>
        </div>
      </div>

      <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-6 flex items-start gap-2">
        <Flame className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
        <p className="text-sm text-red-800">
          Plans printed and posted in office, kitchen, and hallway. All staff briefed on first day. All children
          briefed in age- and need-appropriate ways. Drills run quarterly minimum. Child-specific considerations
          (sensory, trauma, ADHD) integral to every scenario.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scenario Types</SelectItem>
            <SelectItem value="Fire">Fire</SelectItem>
            <SelectItem value="Gas leak">Gas Leak</SelectItem>
            <SelectItem value="Water leak/flood">Water/Flood</SelectItem>
            <SelectItem value="Power failure">Power Failure</SelectItem>
            <SelectItem value="Intruder/lockdown">Intruder/Lockdown</SelectItem>
            <SelectItem value="Bomb threat">Bomb Threat</SelectItem>
            <SelectItem value="Carbon monoxide">Carbon Monoxide</SelectItem>
            <SelectItem value="Structural collapse">Structural</SelectItem>
            <SelectItem value="Severe weather">Severe Weather</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="type">By Type</SelectItem>
              <SelectItem value="drill">Earliest Drill</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const isExpanded = expandedId === p.id;

          return (
            <div key={p.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Flame className="h-5 w-5 text-red-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.scenarioName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last drill {p.lastDrillDate} &middot; Next due {p.nextDrillDue} &middot; Assembly: {p.assemblyPoint.slice(0, 50)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {p.approvedByFireOfficer && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">FO Approved</span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />Trigger Criteria
                    </p>
                    <ul className="space-y-1">
                      {p.triggerCriteria.map((t, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-red-600 mt-0.5">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                        <MapPin className="h-3 w-3 inline mr-1" />Primary Route
                      </p>
                      <p className="text-sm">{p.primaryEvacuationRoute}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Secondary Route</p>
                      <p className="text-sm">{p.secondaryEvacuationRoute}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">Assembly Point</p>
                      <p className="text-sm">{p.assemblyPoint}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Alternative</p>
                      <p className="text-sm">{p.alternativeAssemblyPoint}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Roles &amp; Tasks</p>
                    <div className="space-y-2">
                      {p.rolesByStaff.map((r, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border">
                          <p className="text-sm font-medium">{r.role} ({r.staffPosition})</p>
                          <ul className="space-y-1 mt-1">
                            {r.tasks.map((t, ti) => (
                              <li key={ti} className="text-xs flex items-start gap-1">
                                <CheckCircle className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {p.childSpecificConsiderations.length > 0 && (
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                        <Heart className="h-3 w-3 inline mr-1" />Child-Specific Considerations
                      </p>
                      <div className="space-y-1">
                        {p.childSpecificConsiderations.map((c, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                            <p className="font-medium">{getYPName(c.youngPerson)}</p>
                            <p className="text-xs text-muted-foreground">{c.specialNeeds}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Phone className="h-3 w-3 inline mr-1" />Emergency Contacts
                    </p>
                    <div className="space-y-1">
                      {p.emergencyContacts.map((c, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{c.contact} — {c.number}</p>
                          <p className="text-xs text-muted-foreground">{c.when}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Documents to Take</p>
                    <ul className="space-y-1">
                      {p.documentsToTake.map((doc, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Roll Call Procedure</p>
                    <p className="text-sm">{p.rollCallProcedure}</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Re-entry</p>
                    <p className="text-sm">{p.reentryProcess}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Post-Incident Care</p>
                    <ul className="space-y-1">
                      {p.postIncidentCare.map((c, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Heart className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child Preparation</p>
                    <p className="text-sm">{p.childPreparation}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Drill freq: {p.drillFrequency}</span>
                    <span>Last drill: {p.lastDrillDate}</span>
                    <span>Next drill: {p.nextDrillDue}</span>
                    <span>Reviewed: {p.reviewedDate} by {getStaffName(p.reviewedBy)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Evacuation plans support Regulatory Reform (Fire Safety) Order
          2005, Children&apos;s Homes Regulations 2015 Reg 23 (premises and accommodation), Quality Standard 25
          (protection of children), and statutory drill requirements. Plans approved by local fire officer
          where required. Linked to Fire Safety Equipment Checks, Fire Drills, Emergency Plans, and Protocol
          Drills.
        </p>
      </div>
    </PageShell>
  );
}
