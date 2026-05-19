"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { useContactPlans } from "@/hooks/use-contact-plans";
import type { ContactPlan, ContactPlanArrangement } from "@/types/extended";
import {
  CONTACT_METHOD_TYPE_LABEL,
  CONTACT_PLAN_SUPERVISION_LEVEL_LABEL,
  CONTACT_PLAN_STATUS_LABEL,
} from "@/types/extended";
import {
  ChevronUp,
  ChevronDown,
  Phone,
  Video,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Heart,
  Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ─── export columns ─── */
const exportCols: ExportColumn<ContactPlan>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Status", accessor: (r) => CONTACT_PLAN_STATUS_LABEL[r.status] },
  { header: "Created", accessor: (r) => r.created_date },
  { header: "Review Due", accessor: (r) => r.review_date },
  { header: "Arrangements", accessor: (r) => r.arrangements.length.toString() },
  { header: "Court Orders", accessor: (r) => r.court_orders ?? "None" },
  { header: "Risk Factors", accessor: (r) => r.risk_factors.length.toString() },
  { header: "Child Wishes", accessor: (r) => r.child_wishes },
  { header: "Next Contact", accessor: (r) => r.next_scheduled_contact },
  { header: "Assessment", accessor: (r) => r.overall_assessment },
];

/* ─── component ─── */
export default function ContactPlansPage() {
  const { data: res, isLoading } = useContactPlans();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYP, setFilterYP] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("review");

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterYP !== "all") list = list.filter((r) => r.child_id === filterYP);
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "review":
          return a.review_date.localeCompare(b.review_date);
        case "name":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "created":
          return b.created_date.localeCompare(a.created_date);
        default:
          return 0;
      }
    });
    return list;
  }, [records, filterYP, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const total = records.length;
    const active = records.filter((p) => p.status === "active").length;
    const underReview = records.filter((p) => p.status === "under_review").length;
    const totalArrangements = records.reduce((s, p) => s + p.arrangements.length, 0);
    const noContact = records.reduce((s, p) => s + p.arrangements.filter((a) => a.supervision_level === "no_contact").length, 0);
    return { total, active, underReview, totalArrangements, noContact };
  }, [records]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "under_review":
        return <Badge className="bg-amber-100 text-amber-800">Under Review</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const contactTypeIcon = (type: string) => {
    switch (type) {
      case "face_to_face": return <Users className="h-4 w-4 text-green-600" />;
      case "phone": return <Phone className="h-4 w-4 text-blue-600" />;
      case "video": return <Video className="h-4 w-4 text-purple-600" />;
      case "supervised": return <Shield className="h-4 w-4 text-amber-600" />;
      default: return <Heart className="h-4 w-4 text-pink-600" />;
    }
  };

  const supervisionBadge = (level: string) => {
    switch (level) {
      case "unsupervised":
        return <Badge className="bg-green-100 text-green-800 text-xs">Unsupervised</Badge>;
      case "monitored":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Monitored</Badge>;
      case "supervised":
        return <Badge className="bg-amber-100 text-amber-800 text-xs">Supervised</Badge>;
      case "no_contact":
        return <Badge className="bg-red-100 text-red-800 text-xs">No Contact</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{level}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <PageShell title="Contact Plans" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Contact Plans"
      subtitle="Family contact arrangements — frequency, supervision, child's wishes, and risk assessment"
      ariaContext={{ pageTitle: "Contact Plans", sourceType: "contact_log" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="contact-plans" />
          <PrintButton title="Contact Plans" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.underReview}</p>
            <p className="text-xs text-muted-foreground">Under Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.totalArrangements}</p>
            <p className="text-xs text-muted-foreground">Arrangements</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.noContact}</p>
            <p className="text-xs text-muted-foreground">No Contact Orders</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── alert for under-review plans ─── */}
      {stats.underReview > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Contact Plan Under Review</p>
              <p className="text-xs text-amber-700 mt-1">
                {records
                  .filter((p) => p.status === "under_review")
                  .map((p) => getYPName(p.child_id))
                  .join(", ")}{" "}
                — contact arrangements being reconsidered. Ensure child&apos;s wishes are central to any changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── filters ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterYP}
          onChange={(e) => setFilterYP(e.target.value)}
        >
          <option value="all">All Young People</option>
          <option value="yp_alex">{getYPName("yp_alex")}</option>
          <option value="yp_jordan">{getYPName("yp_jordan")}</option>
          <option value="yp_casey">{getYPName("yp_casey")}</option>
        </select>

        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {Object.entries(CONTACT_PLAN_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="review">Review Due</option>
            <option value="name">Name</option>
            <option value="created">Created</option>
          </select>
        </div>
      </div>

      {/* ─── plan cards ─── */}
      <div className="space-y-4">
        {filtered.map((plan) => {
          const expanded = expandedId === plan.id;

          return (
            <Card key={plan.id} className={cn("overflow-hidden", plan.status === "under_review" && "border-amber-200")}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(plan.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      plan.status === "active" ? "bg-green-100" :
                      plan.status === "under_review" ? "bg-amber-100" : "bg-red-100"
                    )}>
                      <Heart className={cn(
                        "h-5 w-5",
                        plan.status === "active" ? "text-green-600" :
                        plan.status === "under_review" ? "text-amber-600" : "text-red-600"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {getYPName(plan.child_id)}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {statusBadge(plan.status)}
                        <span className="text-xs text-muted-foreground">
                          {plan.arrangements.length} arrangement{plan.arrangements.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Next contact: {plan.next_scheduled_contact}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Review Due</p>
                      <p className="text-sm font-medium">{plan.review_date}</p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* arrangements */}
                  <div>
                    <p className="text-sm font-medium mb-3">Contact Arrangements</p>
                    <div className="space-y-3">
                      {plan.arrangements.map((arr: ContactPlanArrangement, idx: number) => (
                        <div key={idx} className={cn(
                          "border rounded-lg p-3",
                          arr.supervision_level === "no_contact" && "bg-red-50 border-red-200"
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {contactTypeIcon(arr.type)}
                              <span className="text-sm font-medium">{arr.contact_with}</span>
                              <span className="text-xs text-muted-foreground">({arr.relationship})</span>
                            </div>
                            {supervisionBadge(arr.supervision_level)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Frequency</p>
                              <p className="text-xs font-medium">{arr.frequency}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="text-xs font-medium">{arr.duration}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Type</p>
                              <p className="text-xs font-medium">{CONTACT_METHOD_TYPE_LABEL[arr.type]}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Venue</p>
                              <p className="text-xs font-medium">{arr.venue}</p>
                            </div>
                          </div>
                          {arr.supervision_reason && (
                            <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                              <span className="font-medium">Supervision rationale:</span> {arr.supervision_reason}
                            </p>
                          )}
                          {arr.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium">Notes:</span> {arr.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* child wishes */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 flex items-center gap-1 mb-1">
                      <Heart className="h-4 w-4" /> Child&apos;s Wishes
                    </p>
                    <p className="text-sm text-blue-700">{plan.child_wishes}</p>
                  </div>

                  {/* court orders */}
                  {plan.court_orders && (
                    <div className="border rounded-md p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Court Orders
                      </p>
                      <p className="text-sm">{plan.court_orders}</p>
                    </div>
                  )}

                  {/* risk and positive factors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Risk Factors
                      </p>
                      <ul className="space-y-1">
                        {plan.risk_factors.map((f, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-red-400 mt-1.5">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Positive Factors
                      </p>
                      <ul className="space-y-1">
                        {plan.positive_factors.map((f, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-400 mt-1.5">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* overall assessment */}
                  <div className="bg-muted/30 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Overall Assessment</p>
                    <p className="text-sm text-muted-foreground">{plan.overall_assessment}</p>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Created By</p>
                      <p className="text-sm font-medium">{getStaffName(plan.created_by)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">{plan.created_date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Reviewed</p>
                      <p className="text-sm font-medium">{plan.last_reviewed_date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Next Contact</p>
                      <p className="text-sm font-medium">{plan.next_scheduled_contact}</p>
                    </div>
                  </div>

                  <SmartLinkPanel sourceType="contact-plans" sourceId={plan.id} childId={plan.child_id} compact />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-[var(--cs-border)] rounded-lg p-4">
        <p className="text-sm font-medium text-[var(--cs-text-secondary)] mb-1">Regulatory Context</p>
        <p className="text-xs text-[var(--cs-text-secondary)]">
          Regulation 7(2)(b)(v) of the Children&apos;s Homes Regulations 2015 requires that the
          child&apos;s care plan includes arrangements for contact with family. Regulation 12
          (Contact and Access) requires that contact arrangements promote the child&apos;s welfare.
          The Children Act 1989 s.34 establishes a presumption of reasonable contact with parents
          unless restricted by court order. Quality Standard 1 (child-centred care) requires that
          children&apos;s wishes about contact are ascertained and given due weight. All contact
          arrangements are reviewed alongside the placement plan and at each LAC Review.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Family Contact"
        category="family_contact"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
