"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wand2, FileText, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CaraQuickActionContext, CaraArtifactType } from "@/types/cara-studio";
import { CARA_ARTIFACT_TYPE_LABELS } from "@/types/cara-studio";

const CONTEXT_ARTIFACT_TYPES: Record<string, CaraArtifactType[]> = {
  daily_log: ["keywork_session", "management_oversight", "risk_review", "team_meeting_discussion"],
  incident: ["incident_learning_review", "risk_review", "safeguarding_review", "management_oversight", "reflective_practice_prompt"],
  keywork: ["keywork_session", "direct_work_session", "child_friendly_explanation", "supervision_prompt", "child_plan"],
  direct_work: ["direct_work_session", "child_friendly_worksheet", "child_friendly_explanation", "visual_formulation", "reflective_workbook"],
  risk_assessment: ["risk_review", "safeguarding_review", "management_oversight", "action_plan"],
  placement_plan: ["placement_plan_update", "care_plan_update", "social_worker_update", "child_plan"],
  care_plan: ["care_plan_update", "placement_plan_update", "child_plan", "social_worker_update", "parent_professional_letter"],
  missing_from_care: ["risk_review", "safeguarding_review", "social_worker_update", "management_oversight"],
  education: ["child_plan", "social_worker_update", "parent_professional_letter", "action_plan", "child_friendly_explanation"],
  health: ["child_plan", "social_worker_update", "care_plan_update", "action_plan", "management_oversight"],
  medication: ["management_oversight", "staff_training", "reflective_practice_prompt", "action_plan"],
  complaint: ["management_oversight", "ri_briefing", "parent_professional_letter", "action_plan", "reg45_summary"],
  supervision: ["supervision_prompt", "reflective_practice_prompt", "staff_training", "management_oversight"],
  team_meeting: ["team_meeting_discussion", "management_oversight", "action_plan", "supervision_prompt"],
  staff_training: ["staff_training", "quiz", "flashcards", "reflective_practice_prompt", "scenario_simulation"],
  reg45: ["reg45_summary", "ofsted_readiness_summary", "ri_briefing", "annex_a_update"],
  annex_a: ["annex_a_update", "reg45_summary", "ofsted_readiness_summary", "ri_briefing"],
  ofsted_evidence: ["ofsted_readiness_summary", "ri_briefing", "reg45_summary", "annex_a_update"],
  policy: ["staff_training", "quiz", "reflective_practice_prompt", "team_meeting_discussion"],
  uploaded_document: ["management_oversight", "action_plan", "reg45_summary"],
  task: ["action_plan", "management_oversight", "supervision_prompt"],
  rota: ["team_meeting_discussion", "management_oversight", "staff_training"],
  handover: ["management_oversight", "reflective_practice_prompt", "team_meeting_discussion", "risk_review"],
  safeguarding: ["safeguarding_review", "risk_review", "social_worker_update", "management_oversight", "ri_briefing"],
  management_oversight: ["management_oversight", "reg45_summary", "ri_briefing", "action_plan"],
};

const DEFAULT_TYPES: CaraArtifactType[] = [
  "keywork_session", "management_oversight", "risk_review", "reg45_summary",
];

interface CaraStudioQuickActionButtonProps {
  context: CaraQuickActionContext;
  size?: "default" | "sm" | "xs";
  className?: string;
}

export function CaraStudioQuickActionButton({
  context,
  size = "sm",
  className,
}: CaraStudioQuickActionButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const types = CONTEXT_ARTIFACT_TYPES[context.record_type] ?? DEFAULT_TYPES;

  const handleGenerate = (artifactType: CaraArtifactType) => {
    const params = new URLSearchParams({
      from: context.record_type,
      record_id: context.record_id,
      artifact_type: artifactType,
    });
    if (context.child_id) params.set("child_id", context.child_id);
    if (context.home_id) params.set("home_id", context.home_id);
    setOpen(false);
    router.push(`/intelligence/cara/studio?${params.toString()}`);
  };

  return (
    <>
      <Button
        variant="outline"
        size={size === "xs" ? "sm" : size}
        className={`gap-1.5 ${className ?? ""}`}
        onClick={() => setOpen(true)}
      >
        <Wand2 className="h-3.5 w-3.5 text-violet-600" />
        <span>Generate with Cara</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Wand2 className="h-4 w-4 text-violet-600" />
              Generate from this record
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1 py-1">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => handleGenerate(type)}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-violet-50 hover:text-violet-700 transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                {CARA_ARTIFACT_TYPE_LABELS[type] ?? type}
              </button>
            ))}
            <div className="border-t mt-2 pt-2">
              <button
                onClick={() => { setOpen(false); router.push("/intelligence/cara/studio"); }}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full px-3 py-2 rounded-md hover:bg-muted/50"
              >
                <Layers className="h-3.5 w-3.5" />
                Open Cara Studio
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
