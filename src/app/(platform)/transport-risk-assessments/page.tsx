"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Car,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  Repeat,
  Phone,
  Wrench,
  Eye,
  CalendarClock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

import type { TransportRA, JourneyType } from "@/types/extended";
import { useTransportRAs } from "@/hooks/use-transport-ras";

type RiskLevel = "Low" | "Medium" | "High";

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const riskColour: Record<string, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-red-100 text-red-800",
};

const journeyTypeColour: Record<JourneyType, string> = {
  "Routine recurring": "bg-blue-100 text-blue-800",
  "School run": "bg-indigo-100 text-indigo-800",
  Activity: "bg-purple-100 text-purple-800",
  Appointment: "bg-cyan-100 text-cyan-800",
  "Family contact": "bg-pink-100 text-pink-800",
  "Holiday/trip": "bg-emerald-100 text-emerald-800",
  Emergency: "bg-red-100 text-red-800",
};

const exportCols: ExportColumn<TransportRA>[] = [
  { header: "Journey", accessor: (r: TransportRA) => r.journeyTitle },
  { header: "Type", accessor: (r: TransportRA) => r.journeyType },
  { header: "Young People", accessor: (r: TransportRA) => r.youngPeople.map(getYPName).join("; ") },
  { header: "Driver", accessor: (r: TransportRA) => getStaffName(r.staffDriver) },
  { header: "Passengers", accessor: (r: TransportRA) => r.passengers },
  { header: "Vehicle", accessor: (r: TransportRA) => r.vehicle },
  { header: "Duration (mins)", accessor: (r: TransportRA) => r.expectedDurationMins },
  { header: "Recurring", accessor: (r: TransportRA) => r.recurringFrequency ?? "—" },
  { header: "Behaviour Risk", accessor: (r: TransportRA) => r.behaviourRiskRating },
  { header: "Missing-from-care Risk", accessor: (r: TransportRA) => r.missingFromCareRisk },
  { header: "Last Reviewed", accessor: (r: TransportRA) => r.lastReviewedDate },
  { header: "Reviewed By", accessor: (r: TransportRA) => getStaffName(r.reviewedBy) },
  { header: "Next Review", accessor: (r: TransportRA) => r.nextReviewDate },
  { header: "Signed Off RM", accessor: (r: TransportRA) => (r.signedOffByRM ? "Yes" : "No") },
  { header: "In Use", accessor: (r: TransportRA) => (r.inUseStatus ? "Yes" : "No") },
];

const recurringTypes: JourneyType[] = ["Routine recurring", "School run", "Family contact"];

export default function TransportRiskAssessmentsPage() {
  const { data: result, isLoading } = useTransportRAs(undefined, "home_oak");
  const data = result?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortBy, setSortBy] = useState("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((a) => a.youngPeople.includes(filterYP));
    if (filterType !== "all") items = items.filter((a) => a.journeyType === filterType);
    if (filterRisk !== "all") items = items.filter((a) => a.behaviourRiskRating === filterRisk || a.missingFromCareRisk === filterRisk);
    items.sort((a, b) => {
      switch (sortBy) {
        case "review":
          return a.nextReviewDate.localeCompare(b.nextReviewDate);
        case "title":
          return a.journeyTitle.localeCompare(b.journeyTitle);
        case "risk": {
          const ord: Record<RiskLevel, number> = { High: 0, Medium: 1, Low: 2 };
          const aMax = Math.min(ord[a.behaviourRiskRating], ord[a.missingFromCareRisk]);
          const bMax = Math.min(ord[b.behaviourRiskRating], ord[b.missingFromCareRisk]);
          return aMax - bMax;
        }
        case "duration":
          return b.expectedDurationMins - a.expectedDurationMins;
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterType, filterRisk, sortBy, data]);

  const total = data.length;
  const activeRAs = data.filter((a) => a.inUseStatus).length;
  const highRisk = data.filter((a) => a.behaviourRiskRating === "High" || a.missingFromCareRisk === "High" || a.hazards.some((h) => h.severity === "High")).length;
  const dueReview = data.filter((a) => a.nextReviewDate <= d(30)).length;
  const recurring = data.filter((a) => recurringTypes.includes(a.journeyType) || !!a.recurringFrequency).length;

  return (
    <PageShell
      title="Transport Risk Assessments"
      subtitle="Per-route, per-child, per-purpose journey risk assessments"
      ariaContext={{ pageTitle: "Transport Risk Assessments", sourceType: "document" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="transport-risk-assessments" />
          <PrintButton title="Transport Risk Assessments" />
          <AriaStudioQuickActionButton context={{ record_type: "risk_assessment", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : (<>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{activeRAs}</p>
          <p className="text-xs text-muted-foreground">Active RAs</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", highRisk > 0 ? "text-red-600" : "text-green-600")}>{highRisk}</p>
          <p className="text-xs text-muted-foreground">High-Risk Routes</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", dueReview > 0 ? "text-amber-600" : "text-green-600")}>{dueReview}</p>
          <p className="text-xs text-muted-foreground">Reviews Due 30d</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{recurring}</p>
          <p className="text-xs text-muted-foreground">Recurring Journeys</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Car className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Every recurring journey, school run, family contact, activity and one-off trip is risk-assessed
          per-child and per-purpose. Reassessed when route, vehicle, driver or child circumstances change —
          and at minimum every 90 days for active routes. Total of {total} assessments on file.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Young People" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Young People</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Routine recurring">Routine recurring</SelectItem>
            <SelectItem value="School run">School run</SelectItem>
            <SelectItem value="Activity">Activity</SelectItem>
            <SelectItem value="Appointment">Appointment</SelectItem>
            <SelectItem value="Family contact">Family contact</SelectItem>
            <SelectItem value="Holiday/trip">Holiday/trip</SelectItem>
            <SelectItem value="Emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Risks" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="review">Earliest Review</SelectItem>
              <SelectItem value="title">By Title</SelectItem>
              <SelectItem value="risk">By Risk</SelectItem>
              <SelectItem value="duration">Longest Journey</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((ra) => {
          const isExpanded = expandedId === ra.id;
          const overallRisk: RiskLevel =
            ra.hazards.some((h) => h.severity === "High") || ra.behaviourRiskRating === "High" || ra.missingFromCareRisk === "High"
              ? "High"
              : ra.hazards.some((h) => h.severity === "Medium") || ra.behaviourRiskRating === "Medium" || ra.missingFromCareRisk === "Medium"
              ? "Medium"
              : "Low";

          return (
            <div key={ra.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : ra.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Car className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{ra.journeyTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ra.youngPeople.map(getYPName).join(", ")} &middot; Driver: {getStaffName(ra.staffDriver)} &middot; {ra.expectedDurationMins} min &middot; Next review {ra.nextReviewDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", journeyTypeColour[ra.journeyType])}>
                    {ra.journeyType}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", riskColour[overallRisk])}>
                    {overallRisk} Risk
                  </span>
                  {ra.signedOffByRM && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* journey overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <MapPin className="h-3 w-3 inline mr-1" />Route
                      </p>
                      <p className="text-sm">{ra.routeDescription}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Car className="h-3 w-3 inline mr-1" />Vehicle &amp; Logistics
                      </p>
                      <p className="text-sm">{ra.vehicle}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span><Users className="h-3 w-3 inline mr-1" />{ra.passengers} passenger{ra.passengers === 1 ? "" : "s"}</span>
                        <span><Clock className="h-3 w-3 inline mr-1" />{ra.expectedDurationMins} mins</span>
                        {ra.recurringFrequency && <span><Repeat className="h-3 w-3 inline mr-1" />{ra.recurringFrequency}</span>}
                      </div>
                    </div>
                  </div>

                  {/* hazards */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Hazards &amp; Controls</p>
                    <div className="space-y-2">
                      {ra.hazards.map((h, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{h.hazard}</p>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", riskColour[h.severity])}>{h.severity}</span>
                          </div>
                          <div className="text-xs flex items-start gap-1">
                            <Shield className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                            <span><span className="font-semibold">Control:</span> {h.control}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* child-specific considerations */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Child-Specific Considerations</p>
                    <div className="space-y-2">
                      {Object.entries(ra.childSpecificConsiderations).map(([ypId, note]) => (
                        <div key={ypId} className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                          <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">{getYPName(ypId)}</p>
                          <p className="text-sm text-purple-900">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* behaviour & missing risks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Behaviour Risk</p>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", riskColour[ra.behaviourRiskRating])}>{ra.behaviourRiskRating}</span>
                      </div>
                      <ul className="space-y-1 mt-1">
                        {ra.behaviourMitigations.map((m, i) => (
                          <li key={i} className="text-xs flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Missing-from-Care Risk</p>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", riskColour[ra.missingFromCareRisk])}>{ra.missingFromCareRisk}</span>
                      </div>
                      <ul className="space-y-1 mt-1">
                        {ra.missingMitigations.map((m, i) => (
                          <li key={i} className="text-xs flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* route-specific */}
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />Route-Specific Risks
                    </p>
                    <ul className="space-y-1">
                      {ra.specificRisksByRoute.map((r, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* emergency / breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">
                        <Phone className="h-3 w-3 inline mr-1" />Emergency Procedure
                      </p>
                      <p className="text-sm text-red-900">{ra.emergencyProcedure}</p>
                    </div>
                    <div className="bg-slate-100 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">
                        <Wrench className="h-3 w-3 inline mr-1" />Breakdown Procedure
                      </p>
                      <p className="text-sm">{ra.breakdownProcedure}</p>
                    </div>
                  </div>

                  {/* footer meta */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Eye className="h-3 w-3 inline mr-1" />Reviewed by: {getStaffName(ra.reviewedBy)} on {ra.lastReviewedDate}</span>
                    <span><CalendarClock className="h-3 w-3 inline mr-1" />Next review: {ra.nextReviewDate}</span>
                    {ra.signedOffByRM && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">RM signed off</span>}
                    {ra.inUseStatus && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">In use</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Transport risk assessments are required under Quality Standard 5
          (Health and Wellbeing) and Regulation 23 (Behaviour management and discipline) of the Children&apos;s
          Homes (England) Regulations 2015, alongside Health and Safety at Work Act 1974 duties to staff.
          Each route, vehicle, driver and child combination is individually assessed; assessments are reviewed
          when any element changes and at minimum every 90 days for active routes.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Transport & Risk"
        category={["activity", "behaviour"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Transport Risk Assessments — vehicle safety checks, driver competency, journey risk assessments, child-specific transport risks, safeguarding during transport, Reg 45 safety evidence"
        recordType="risk_assessment"
        className="mt-6"
      />
      </>)}
    </PageShell>
  );
}
