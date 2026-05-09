"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { useDailyRoutinePlans } from "@/hooks/use-daily-routine-plans";
import type { DailyRoutinePlan } from "@/types/extended";
import { ROUTINE_PLAN_STATUS_LABEL } from "@/types/extended";
import {
  ChevronUp,
  ChevronDown,
  Clock,
  Sun,
  Coffee,
  Heart,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ─── export columns ─── */
const exportCols: ExportColumn<DailyRoutinePlan>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Created By", accessor: (r) => getStaffName(r.created_by) },
  { header: "Created", accessor: (r) => r.created_date },
  { header: "Review Due", accessor: (r) => r.review_date },
  { header: "Status", accessor: (r) => ROUTINE_PLAN_STATUS_LABEL[r.status] },
  { header: "Weekday Steps", accessor: (r) => r.weekday_routine.length.toString() },
  { header: "Weekend Steps", accessor: (r) => r.weekend_routine.length.toString() },
  { header: "Sensory Needs", accessor: (r) => r.sensory_considerations.length.toString() },
  { header: "Child Input", accessor: (r) => r.child_input },
];

/* ─── component ─── */
export default function DailyRoutinePlansPage() {
  const { data: res, isLoading } = useDailyRoutinePlans();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYP, setFilterYP] = useState("all");
  const [viewMode, setViewMode] = useState<"weekday" | "weekend">("weekday");

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterYP !== "all") list = list.filter((r) => r.child_id === filterYP);
    return list;
  }, [records, filterYP]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  if (isLoading) {
    return (
      <PageShell title="Daily Routine Plans" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Daily Routine Plans"
      subtitle="Personalised daily structures for each young person — predictability, choice, and age-appropriate independence"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="daily-routine-plans" />
          <PrintButton title="Daily Routine Plans" />
        </div>
      }
    >
      {/* ─── key principle ─── */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <Heart className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Individualised, Not Institutional</p>
            <p className="text-xs text-blue-700 mt-1">
              Every child&apos;s routine is different because every child is different. Routines are
              co-produced with children, adapted to their needs, and regularly reviewed. Structure
              provides safety — not control. A good routine says &quot;we thought about what YOU
              need&quot; not &quot;everyone does the same thing.&quot;
            </p>
          </div>
        </div>
      </div>

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

        <div className="flex items-center gap-1 ml-auto border rounded-md overflow-hidden">
          <button
            className={cn("px-3 py-1.5 text-sm", viewMode === "weekday" ? "bg-blue-100 text-blue-800" : "bg-white")}
            onClick={() => setViewMode("weekday")}
          >
            Weekday
          </button>
          <button
            className={cn("px-3 py-1.5 text-sm", viewMode === "weekend" ? "bg-blue-100 text-blue-800" : "bg-white")}
            onClick={() => setViewMode("weekend")}
          >
            Weekend
          </button>
        </div>
      </div>

      {/* ─── routine cards ─── */}
      <div className="space-y-4">
        {filtered.map((plan) => {
          const expanded = expandedId === plan.id;
          const routine = viewMode === "weekday" ? plan.weekday_routine : plan.weekend_routine;

          return (
            <Card key={plan.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(plan.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{getYPName(plan.child_id)}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-green-100 text-green-800">{ROUTINE_PLAN_STATUS_LABEL[plan.status]}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {plan.weekday_routine.length} weekday steps · {plan.weekend_routine.length} weekend steps
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Review Due</p>
                      <p className="text-sm">{plan.review_date}</p>
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
                  {/* routine timeline */}
                  <div>
                    <p className="text-sm font-medium mb-3 flex items-center gap-1">
                      {viewMode === "weekday" ? <Sun className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
                      {viewMode === "weekday" ? "Weekday" : "Weekend"} Routine
                    </p>
                    <div className="space-y-2">
                      {routine.map((slot, idx) => (
                        <div key={idx} className="flex items-start gap-3 border-l-2 border-blue-200 pl-3 py-1">
                          <div className="min-w-[60px]">
                            <span className="text-xs font-mono font-medium text-blue-700">{slot.time}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{slot.activity}</p>
                            {slot.support && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                <span className="font-medium">Support:</span> {slot.support}
                              </p>
                            )}
                            {slot.flexibility && (
                              <p className="text-xs text-green-700 mt-0.5">
                                <span className="font-medium">Flex:</span> {slot.flexibility}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* sensory considerations */}
                  {plan.sensory_considerations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Sensory Considerations</p>
                      <ul className="space-y-1">
                        {plan.sensory_considerations.map((sc, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-purple-400 mt-1.5">•</span> {sc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* transition support */}
                  <div>
                    <p className="text-sm font-medium mb-2">Transition Support</p>
                    <ul className="space-y-1">
                      {plan.transition_support.map((ts, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-400 mt-1.5">•</span> {ts}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* child input */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Child&apos;s Input
                    </p>
                    <p className="text-sm text-green-700">{plan.child_input}</p>
                  </div>

                  {/* flexibility statement */}
                  <div>
                    <p className="text-sm font-medium mb-1">Flexibility Statement</p>
                    <p className="text-sm text-muted-foreground">{plan.flexibility}</p>
                  </div>

                  {/* notes */}
                  <div className="bg-muted/30 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Staff Notes</p>
                    <p className="text-sm text-muted-foreground">{plan.notes}</p>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Created By</p>
                      <p className="text-sm font-medium">{getStaffName(plan.created_by)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">{plan.created_date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Review</p>
                      <p className="text-sm font-medium">{plan.review_date}</p>
                    </div>
                  </div>

                  <SmartLinkPanel sourceType="daily-routine-plans" sourceId={plan.id} childId={plan.child_id} compact />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          Quality Standard 1 (Child-Centred Care) requires that daily life in the home is organised
          around the individual needs of each child. Regulation 6 (Quality and Purpose of Care)
          requires that care meets each child&apos;s needs as set out in their placement plan.
          Routines should be personalised, age-appropriate, and promote independence while providing
          the predictability that children who have experienced trauma need. Ofsted examines whether
          daily life feels &quot;homely&quot; and individualised, not institutional or one-size-fits-all.
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
