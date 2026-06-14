// ══════════════════════════════════════════════════════════════════════════════
// Cara Governance — Model Routing Rules Page
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";

// Import constants for display
const TASK_TYPES = [
  "safeguarding_analysis", "reg45_report", "annex_a_report", "rag44_evidence_review",
  "child_weekly_report", "child_review_report", "keywork_session_plan", "direct_work_session",
  "staff_briefing", "staff_supervision_reflection", "placement_planning", "risk_assessment_update",
  "behaviour_pattern_analysis", "incident_summary", "management_oversight", "daily_task_generation",
  "form_prompt_support", "policy_search", "evidence_search", "filing_cabinet_search",
  "public_research", "competitor_research", "training_material_generation", "creative_resource_generation",
  "admin_summary", "email_draft", "document_extraction", "document_classification", "quality_assurance_review",
] as const;

const RISK_MAP: Record<string, string> = {
  safeguarding_analysis: "critical",
  reg45_report: "high",
  annex_a_report: "high",
  rag44_evidence_review: "high",
  child_weekly_report: "medium",
  child_review_report: "high",
  keywork_session_plan: "medium",
  direct_work_session: "medium",
  staff_briefing: "low",
  staff_supervision_reflection: "medium",
  placement_planning: "high",
  risk_assessment_update: "high",
  behaviour_pattern_analysis: "medium",
  incident_summary: "medium",
  management_oversight: "high",
  daily_task_generation: "low",
  form_prompt_support: "low",
  policy_search: "low",
  evidence_search: "low",
  filing_cabinet_search: "low",
  public_research: "low",
  competitor_research: "low",
  training_material_generation: "low",
  creative_resource_generation: "low",
  admin_summary: "low",
  email_draft: "low",
  document_extraction: "low",
  document_classification: "low",
  quality_assurance_review: "medium",
};

const PROVIDER_MAP: Record<string, string> = {
  safeguarding_analysis: "azure_openai",
  reg45_report: "azure_openai",
  annex_a_report: "azure_openai",
  keywork_session_plan: "anthropic",
  direct_work_session: "anthropic",
  staff_briefing: "openai",
  public_research: "perplexity",
  competitor_research: "perplexity",
  document_extraction: "mistral",
  document_classification: "mistral",
  evidence_search: "voyage",
  creative_resource_generation: "anthropic",
  quality_assurance_review: "anthropic",
};

const RISK_STYLES: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function CaraRoutingPage() {
  const [filter, setFilter] = useState<string>("all");

  const filtered = TASK_TYPES.filter(t => {
    if (filter === "all") return true;
    return RISK_MAP[t] === filter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Model Routing Rules</h1>
        <p className="text-muted-foreground mt-1">
          How AI tasks are routed to providers based on risk level, data sensitivity, and task type.
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter by risk:</span>
        {["all", "critical", "high", "medium", "low"].map(level => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-3 py-1 text-xs rounded-full font-medium ${
              filter === level ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {level === "all" ? "All" : level}
          </button>
        ))}
      </div>

      {/* Routing Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Task Type</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Default Risk</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Preferred Provider</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Approval Required</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(task => {
              const risk = RISK_MAP[task] ?? "low";
              const provider = PROVIDER_MAP[task] ?? "openai";
              const needsApproval = ["safeguarding_analysis", "reg45_report", "annex_a_report", "rag44_evidence_review", "child_review_report", "placement_planning", "risk_assessment_update", "management_oversight"].includes(task);

              return (
                <tr key={task} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{task.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${RISK_STYLES[risk]}`}>
                      {risk}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{provider.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2">
                    {needsApproval ? (
                      <span className="text-amber-700 dark:text-amber-400 font-medium text-xs">Yes</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">No</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Routing explanation */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-2">
        <h4 className="font-semibold text-foreground">Routing Logic</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Classify input sensitivity (public → safeguarding_sensitive)</li>
          <li>Determine risk level from task type and context</li>
          <li>Select preferred provider for task type</li>
          <li>Validate provider is allowed for the data sensitivity level</li>
          <li>If blocked, fallback to next safe provider</li>
          <li>Apply PII redaction if sending to external provider</li>
          <li>Check cost limits before execution</li>
          <li>Flag for human approval if task type requires it</li>
        </ol>
      </div>
    </div>
  );
}
