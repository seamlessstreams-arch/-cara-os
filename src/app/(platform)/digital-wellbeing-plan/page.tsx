"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useDigitalPlans } from "@/hooks/use-digital-plans";
import type { DigitalPlan } from "@/types/extended";
import {
  PARENTAL_CONTROL_LEVEL_LABEL,
  ONLINE_SAFETY_LEVEL_LABEL,
  APP_TYPE_LABEL,
  OVERSIGHT_LEVEL_LABEL,
} from "@/types/extended";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Smartphone,
  Shield,
  AlertTriangle,
  CheckCircle,
  Heart,
  Wifi,
  Lock,
  Eye,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const exportCols: ExportColumn<DigitalPlan>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Age", accessor: (r) => String(r.age) },
  { header: "Devices", accessor: (r) => r.devices_used.length.toString() },
  { header: "Apps", accessor: (r) => r.apps_used.length.toString() },
  { header: "Social Media Profiles", accessor: (r) => r.social_media_profiles.filter((p) => p.platform !== "None active").length.toString() },
  { header: "Parental Controls", accessor: (r) => PARENTAL_CONTROL_LEVEL_LABEL[r.parental_controls_level] },
  { header: "Reviewed", accessor: (r) => r.reviewed_date },
  { header: "Child Agreed", accessor: (r) => r.child_agreed ? "Yes" : "No" },
];

export default function DigitalWellbeingPlanPage() {
  const { data: res, isLoading } = useDigitalPlans();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterYP !== "all") items = items.filter((p) => p.child_id === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.child_id.localeCompare(b.child_id);
        case "review":
          return a.next_review_date.localeCompare(b.next_review_date);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterYP, sortBy]);

  const total = records.length;
  const allChildAgreed = records.length > 0 && records.every((p) => p.child_agreed);
  const sixtyDaysLater = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  const dueReview = records.filter((p) => p.next_review_date <= sixtyDaysLater).length;
  const totalApps = records.reduce((sum, p) => sum + p.apps_used.length, 0);

  if (isLoading) {
    return (
      <PageShell title="Digital Wellbeing Plan" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Digital Wellbeing Plan"
      subtitle="Per-child digital wellbeing — devices, apps, screen time, online safety, and trust-based oversight"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="digital-wellbeing-plans" />
          <PrintButton title="Digital Wellbeing Plans" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Plans</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildAgreed ? "100%" : `${records.filter((p) => p.child_agreed).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Child Agreed</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalApps}</p>
          <p className="text-xs text-muted-foreground">Apps Tracked</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", dueReview > 0 ? "text-amber-600" : "text-green-600")}>{dueReview}</p>
          <p className="text-xs text-muted-foreground">Review Due 60d</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Smartphone className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          The internet is part of every child&apos;s life. Our approach is education-led, trust-based, and
          age-appropriate — not blanket restriction. Children are partners in their own digital safety.
          Active monitoring happens transparently, not covertly.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="review">Earliest Review</SelectItem>
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
                  <Smartphone className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(p.child_id)} (age {p.age})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.devices_used.length} devices &middot; {p.apps_used.length} apps &middot; {PARENTAL_CONTROL_LEVEL_LABEL[p.parental_controls_level]} controls &middot; Reviewed {p.reviewed_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {p.child_agreed && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* devices */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Devices</p>
                    <div className="space-y-1">
                      {p.devices_used.map((dev, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{dev.device}</span>
                            <span className="text-xs text-muted-foreground capitalize">{dev.ownership}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{dev.primary_use}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* screen time */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">Agreed Screen Time</p>
                    <div className="space-y-1">
                      {p.agreed_screen_time_limits.map((s, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{s.period}: <span className="text-blue-700">{s.max_hours}h</span></p>
                          <p className="text-xs text-muted-foreground">{s.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* bedtime */}
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Bedtime Device Routine</p>
                    <p className="text-sm">{p.bedtime_routine_with_devices}</p>
                  </div>

                  {/* apps */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Apps Used</p>
                    <div className="space-y-1">
                      {p.apps_used.map((a, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{a.app}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">{APP_TYPE_LABEL[a.type]}</span>
                              <span className={cn("text-xs px-1.5 py-0.5 rounded-full",
                                a.oversight_level === "active_monitoring" ? "bg-amber-100 text-amber-800" :
                                a.oversight_level === "light" ? "bg-blue-100 text-blue-800" :
                                "bg-green-100 text-green-800"
                              )}>
                                {OVERSIGHT_LEVEL_LABEL[a.oversight_level]}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{a.agreed_use}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* online safety knowledge */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Shield className="h-3 w-3 inline mr-1" />Online Safety Knowledge
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {p.child_online_safety_knowledge.map((k, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">
                          <span>{k.topic}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                            k.level === "strong" ? "bg-green-100 text-green-800" :
                            k.level === "developing" ? "bg-blue-100 text-blue-800" :
                            k.level === "emerging" ? "bg-amber-100 text-amber-800" :
                            "bg-red-100 text-red-800"
                          )}>{ONLINE_SAFETY_LEVEL_LABEL[k.level]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* protections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Risk Factors
                      </p>
                      <ul className="space-y-1">
                        {p.exploitation_risk_factors.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                        <Shield className="h-3 w-3 inline mr-1" />Protections
                      </p>
                      <ul className="space-y-1">
                        {p.exploitation_protections.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* filters */}
                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">
                      <Lock className="h-3 w-3 inline mr-1" />Filters &amp; Controls in Place
                    </p>
                    <ul className="space-y-1">
                      {p.filtering_in_place.map((f, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Wifi className="h-3 w-3 text-slate-500 mt-1 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />Privacy &amp; Trust Approach
                    </p>
                    <p className="text-sm">{p.child_can_request_privacy}</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <Eye className="h-3 w-3 inline mr-1" />Staff Oversight Approach
                    </p>
                    <p className="text-sm">{p.staff_oversight_approach}</p>
                  </div>

                  {p.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{p.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Reviewed: {p.reviewed_date} with {getStaffName(p.reviewed_with)}</span>
                    <span>Next review: {p.next_review_date}</span>
                    <span>Controls level: {PARENTAL_CONTROL_LEVEL_LABEL[p.parental_controls_level]}</span>
                    {p.child_agreed && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Child Co-Authored</span>}
                  </div>

                  <SmartLinkPanel sourceType="digital-plans" sourceId={p.id} childId={p.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Digital wellbeing plans support Quality Standard 5
          (protection of children), Quality Standard 7 (health and wellbeing), KCSIE 2024 online safety
          requirements, and the Online Safety Act 2023. Plans are co-produced with each child and updated
          as digital landscape evolves. Linked to Online Safety, Exploitation Screening, and Device Policy.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
