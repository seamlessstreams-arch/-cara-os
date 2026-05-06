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
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ExternalVisitor,
  VisitorType,
  VisitPurposeCategory,
} from "@/types/extended";
import {
  VISITOR_TYPE_LABEL,
  VISIT_PURPOSE_CATEGORY_LABEL,
} from "@/types/extended";
import { useExternalVisitors } from "@/hooks/use-external-visitors";

const typeColour: Record<VisitorType, string> = {
  professional: "bg-blue-100 text-blue-800",
  volunteer: "bg-green-100 text-green-800",
  contractor: "bg-amber-100 text-amber-800",
  inspector: "bg-purple-100 text-purple-800",
  family_of_staff: "bg-pink-100 text-pink-800",
  tradesperson: "bg-slate-100 text-slate-800",
  researcher: "bg-indigo-100 text-indigo-800",
  friend_of_child: "bg-rose-100 text-rose-800",
};

const exportCols: ExportColumn<ExternalVisitor>[] = [
  { header: "Date", accessor: (r: ExternalVisitor) => r.date },
  { header: "Visitor", accessor: (r: ExternalVisitor) => r.visitor_name },
  { header: "Organisation", accessor: (r: ExternalVisitor) => r.visitor_organisation },
  { header: "Role", accessor: (r: ExternalVisitor) => r.visitor_role },
  { header: "Type", accessor: (r: ExternalVisitor) => VISITOR_TYPE_LABEL[r.visitor_type] },
  { header: "Purpose", accessor: (r: ExternalVisitor) => r.purpose_of_visit },
  { header: "Arrival", accessor: (r: ExternalVisitor) => r.arrival_time },
  { header: "Departure", accessor: (r: ExternalVisitor) => r.departure_time },
  { header: "DBS Checked", accessor: (r: ExternalVisitor) => r.dbs_checked ? "Yes" : (r.dbs_required ? "REQUIRED" : "N/A") },
  { header: "Host Staff", accessor: (r: ExternalVisitor) => getStaffName(r.host_staff) },
];

export default function ExternalVisitorLogPage() {
  const { data: queryData, isLoading } = useExternalVisitors();
  const data = queryData?.data ?? [];

  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterType !== "all") items = items.filter((v) => v.visitor_type === filterType);
    if (filterCategory !== "all") items = items.filter((v) => v.purpose_category === filterCategory);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "type":
          return a.visitor_type.localeCompare(b.visitor_type);
        case "duration":
          const durA = (parseInt(a.departure_time.replace(":", "")) - parseInt(a.arrival_time.replace(":", "")));
          const durB = (parseInt(b.departure_time.replace(":", "")) - parseInt(b.arrival_time.replace(":", "")));
          return durB - durA;
        default:
          return 0;
      }
    });
    return items;
  }, [data, filterType, filterCategory, sortBy]);

  const totalVisits = data.length;
  const dbsCompliant = data.every((v) => !v.dbs_required || v.dbs_checked);
  const childInteractions = data.filter((v) => v.children_interacted_with.length > 0).length;
  const concerns = data.filter((v) => v.concerns_raised.length > 0).length;

  if (isLoading) {
    return (
      <PageShell
        title="External Visitor Log"
        subtitle="Records of all external visitors — professionals, contractors, volunteers, deliveries — with safeguarding checks"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

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
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="volunteer">Volunteer</SelectItem>
            <SelectItem value="contractor">Contractor</SelectItem>
            <SelectItem value="inspector">Inspector</SelectItem>
            <SelectItem value="tradesperson">Tradesperson</SelectItem>
            <SelectItem value="researcher">Researcher</SelectItem>
            <SelectItem value="friend_of_child">Friend of Child</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Purposes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Purposes</SelectItem>
            <SelectItem value="care_therapy">Care/Therapy</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="inspection">Inspection</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="family">Family</SelectItem>
            <SelectItem value="activity">Activity</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="health">Health</SelectItem>
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
          const dbsIssue = visit.dbs_required && !visit.dbs_checked;

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
                    <p className="font-medium truncate">{visit.visitor_name} ({visit.visitor_organisation})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {visit.date} &middot; {visit.arrival_time}–{visit.departure_time} &middot; {visit.purpose_of_visit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", typeColour[visit.visitor_type])}>
                    {VISITOR_TYPE_LABEL[visit.visitor_type]}
                  </span>
                  {visit.dbs_checked && <Shield className="h-4 w-4 text-green-500" />}
                  {dbsIssue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Visitor Details</p>
                      <p className="text-sm">{visit.visitor_role}</p>
                      <p className="text-xs text-muted-foreground mt-1">{visit.visitor_organisation}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Authorisation</p>
                      <p className="text-sm">Authorised: {getStaffName(visit.authorised_by)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Host: {getStaffName(visit.host_staff)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Compliance Checks</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className={cn("rounded-lg p-2 text-center text-sm",
                        visit.id_checked ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                      )}>
                        {visit.id_checked ? <CheckCircle className="h-4 w-4 inline mr-1" /> : <AlertTriangle className="h-4 w-4 inline mr-1" />}
                        ID Checked
                      </div>
                      <div className={cn("rounded-lg p-2 text-center text-sm",
                        !visit.dbs_required ? "bg-slate-100 text-slate-700" :
                        visit.dbs_checked ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                      )}>
                        {!visit.dbs_required ? "DBS N/A" : (visit.dbs_checked ? <><CheckCircle className="h-4 w-4 inline mr-1" />DBS Verified</> : <><AlertTriangle className="h-4 w-4 inline mr-1" />DBS REQUIRED</>)}
                      </div>
                      <div className={cn("rounded-lg p-2 text-center text-sm",
                        visit.signed_in && visit.signed_out ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"
                      )}>
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        Signed {visit.signed_in ? "In" : "—"}/{visit.signed_out ? "Out" : "—"}
                      </div>
                      <div className={cn("rounded-lg p-2 text-center text-sm",
                        visit.badge_issued ? "bg-blue-50 text-blue-800" : "bg-slate-100 text-slate-700"
                      )}>
                        Badge {visit.badge_issued ? "Issued" : "Not Required"}
                      </div>
                    </div>
                  </div>

                  {visit.children_interacted_with.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Children Interacted With</p>
                      <p className="text-sm">{visit.children_interacted_with.length} {visit.children_interacted_with.length === 1 ? "child" : "children"}</p>
                      <p className="text-xs text-amber-700 mt-1">{visit.unsupervised_access ? "Unsupervised access permitted (DBS verified, regular professional)" : "Supervised throughout"}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Areas Accessed</p>
                    <div className="flex flex-wrap gap-1">
                      {visit.areas_accessed.map((a, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{a}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Visit Feedback</p>
                    <p className="text-sm">{visit.feedback}</p>
                  </div>

                  {visit.concerns_raised.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">Concerns</p>
                      <ul className="space-y-1">
                        {visit.concerns_raised.map((c, i) => (
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
                    <span><Clock className="h-3 w-3 inline mr-1" />{visit.arrival_time}–{visit.departure_time}</span>
                    <span><Phone className="h-3 w-3 inline mr-1" />{VISIT_PURPOSE_CATEGORY_LABEL[visit.purpose_category]}</span>
                    <span><ClipboardList className="h-3 w-3 inline mr-1" />Host: {getStaffName(visit.host_staff)}</span>
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
