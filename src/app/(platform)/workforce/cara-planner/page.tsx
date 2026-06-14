"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import {
  Sparkles, CheckCircle2, Clock, ChevronRight,
  Plus, GitMerge, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useDevelopmentPlans } from "@/hooks/use-workforce";
import { useStaff } from "@/hooks/use-staff";
import {
  PATHWAY_STAGE_LABELS, COMPETENCY_DOMAIN_LABELS,
  type DevelopmentPlanStatus,
} from "@/types/extended";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

const STATUS_CONFIG: Record<DevelopmentPlanStatus, { label: string; colour: string }> = {
  draft:      { label: "Draft",      colour: "text-slate-600 bg-slate-100 border-slate-200"       },
  active:     { label: "Active",     colour: "text-emerald-700 bg-emerald-50 border-emerald-200"  },
  paused:     { label: "Paused",     colour: "text-amber-700 bg-amber-50 border-amber-200"        },
  completed:  { label: "Completed",  colour: "text-blue-700 bg-blue-50 border-blue-200"           },
  superseded: { label: "Superseded", colour: "text-slate-400 bg-slate-50 border-slate-200"        },
};

export default function CaraDevPlannerPage() {
  const [showCara, setShowCara] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>("all");

  const plansQuery = useDevelopmentPlans();
  const staffQuery = useStaff();

  const allPlans = plansQuery.data?.data ?? [];
  const staff    = staffQuery.data?.data ?? [];

  const getStaffName = (id: string) => staff.find((s) => s.id === id)?.full_name ?? id;

  const filtered = selectedStaff === "all" ? allPlans : allPlans.filter((p) => p.staff_id === selectedStaff);

  const staffWithPlans = [...new Set(allPlans.map((p) => p.staff_id))];

  return (
    <PageShell
      title="Cara Development Planner"
      subtitle="Cara-generated personalised development plans for every staff member"
      caraContext={{ pageTitle: "Cara Development Planner", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Cara Development Planner" subtitle="Chamberlain House — Staff Development Plans" targetId="cara-planner-content" />
          <SmartUploadButton variant="inline" label="Upload Development Plan" uploadContext="Workforce Intelligence — staff development plan or evidence document upload" />
          <Button
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => setShowCara((p) => !p)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate Plan with Cara
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Manual Plan
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="cara-planner-content" className="space-y-0">
      {showCara && (
        <div className="relative">
          <button onClick={() => setShowCara(false)} className="absolute top-3 right-3 z-10 text-slate-400 hover:text-slate-600 text-xs">✕ Close</button>
          <CaraPanel
            mode="staff_development_summary"
            pageContext={`Development planning hub: ${allPlans.length} active plans. Staff with plans: ${staffWithPlans.map(getStaffName).join(", ")}. Cara can generate a personalised development plan based on competency profile, career pathway target, and practice observations.`}
          />
        </div>
      )}

      {/* Cara hero card */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-100 shrink-0">
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-indigo-900 mb-1">How Cara Development Plans Work</h3>
            <p className="text-xs text-indigo-700 leading-relaxed mb-3">
              Cara analyses each staff member&apos;s competency profile, career pathway target, practice observations,
              and appraisal history to generate a structured, action-based development plan. Each plan includes
              targeted actions per competency domain, timescales, and success indicators — reviewed by the line manager
              before activation.
            </p>
            <Button
              size="sm"
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => setShowCara(true)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate New Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Staff filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setSelectedStaff("all")}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border transition-all",
            selectedStaff === "all"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300",
          )}
        >
          All Staff
        </button>
        {staffWithPlans.map((id) => (
          <button
            key={id}
            onClick={() => setSelectedStaff(id)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all",
              selectedStaff === id
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300",
            )}
          >
            {getStaffName(id).split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Development plans */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <GitMerge className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No development plans yet</p>
          <p className="text-xs mt-1">Use Cara to generate the first plan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((plan) => {
            const statusCfg = STATUS_CONFIG[plan.status];
            const completedActions = plan.actions.filter((a) => a.completed).length;
            const totalActions = plan.actions.length;
            const pct = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

            return (
              <div key={plan.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    {plan.aria_generated && (
                      <div className="p-1.5 rounded-lg bg-indigo-100 shrink-0 mt-0.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-800 mb-0.5">{plan.title}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span>{getStaffName(plan.staff_id)}</span>
                        <span>·</span>
                        <span>{PATHWAY_STAGE_LABELS[plan.from_stage]}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{PATHWAY_STAGE_LABELS[plan.to_stage]}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] border shrink-0", statusCfg.colour)}>
                    {statusCfg.label}
                  </Badge>
                </div>

                <div className="p-4 space-y-3">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Progress</span>
                      <span className="text-xs font-semibold text-slate-700">{completedActions}/{totalActions} actions</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-indigo-500")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1.5">
                    {plan.actions.map((action) => (
                      <div key={action.id} className={cn(
                        "flex items-start gap-2.5 rounded-xl px-3 py-2.5 border",
                        action.completed ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-slate-100",
                      )}>
                        {action.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-medium", action.completed ? "text-emerald-700 line-through" : "text-slate-800")}>
                            {action.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-slate-400">
                              {COMPETENCY_DOMAIN_LABELS[action.domain]}
                            </span>
                            {action.target_date && !action.completed && (
                              <span className="text-[10px] text-slate-400">· Due {action.target_date}</span>
                            )}
                            {action.completed && action.completed_at && (
                              <span className="text-[10px] text-emerald-600">· Completed {action.completed_at.slice(0, 10)}</span>
                            )}
                          </div>
                          {action.evidence_notes && (
                            <p className="text-[10px] text-slate-500 mt-1 italic">{action.evidence_notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cara rationale */}
                  {plan.aria_rationale && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-indigo-600 mb-1">Cara Rationale</p>
                      <p className="text-xs text-indigo-800 leading-relaxed">{plan.aria_rationale}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400">Created {plan.created_at.slice(0, 10)}</span>
                    <Link href={`/workforce/staff/${plan.staff_id}`} className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800">
                      View full profile <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>{/* close #cara-planner-content */}
    </PageShell>
  );
}
