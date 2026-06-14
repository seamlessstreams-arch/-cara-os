"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraCommandPanel
//
// Universal Cara command panel. Replaces the older mode-based CaraPanel with
// the typed command registry from cara-service.ts. Supports command selection,
// context preview, dictation, generation, editing, approval/rejection, copy,
// and insert-into-field.
//
// Usage:
//   <CaraCommandPanel
//     module="daily_log"
//     sourceContent={recordText}
//     childId={childId}
//     onInsert={(text) => setFieldValue(text)}
//   />
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useCaraCommand } from "@/hooks/use-cara-command";
import type { CaraCommandId } from "@/lib/cara/cara-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DictationButton } from "@/components/common/dictation-button";
import {
  Sparkles,
  ChevronDown,
  Copy,
  CheckCircle2,
  RefreshCw,
  X,
  AlertTriangle,
  ExternalLink,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Search,
} from "lucide-react";
import { CaraGuardrailBanner } from "./cara-guardrail-banner";
import { CaraTaskCreator } from "./cara-task-creator";
import { CaraDiffViewer } from "./cara-diff-viewer";
import { CaraFeedbackWidget } from "./cara-feedback-widget";

// Commands that improve/rewrite text — show the diff viewer
const TEXT_IMPROVEMENT_COMMANDS = new Set<string>([
  "improve_writing",
  "professionalise_record",
  "simplify_language",
  "check_tone",
  "check_factuality",
  "expand_text",
  "professional_tone",
]);

// Commands that can create tasks — shown the task creator on result
const TASK_CREATING_COMMANDS = new Set<string>([
  "extract_actions",
  "create_task_list",
  "suggest_incident_follow_up_tasks",
  "create_management_action_plan",
  "create_service_improvement_plan",
  "create_onboarding_tasks",
  "create_audit_action_plan",
  "create_delegated_audit_tasks",
  "create_task_from_text",
  "create_task_from_incident",
  "create_task_from_audit",
  "create_task_from_oversight",
  "create_calendar_follow_up_tasks",
  "extract_document_actions",
]);

// ── Command metadata for the UI ────────────────────────────────────────────

interface CommandUIEntry {
  id: CaraCommandId;
  label: string;
  group: string;
  modules: string[];
}

// Import the command registry from the service. Since this is a client
// component, we only need the labels and module filters — the heavy lifting
// happens server-side. We define a lightweight lookup here.
const COMMAND_GROUPS: {
  group: string;
  commands: { id: CaraCommandId; label: string; modules: string[] }[];
}[] = [
  {
    group: "Writing",
    commands: [
      { id: "improve_writing", label: "Improve writing", modules: [] },
      { id: "professionalise_record", label: "Professionalise record", modules: [] },
      { id: "simplify_language", label: "Simplify language", modules: [] },
      { id: "summarise_text", label: "Summarise", modules: [] },
      { id: "extract_actions", label: "Extract actions", modules: [] },
      { id: "extract_key_points", label: "Key points", modules: [] },
      { id: "check_missing_information", label: "Check missing info", modules: [] },
      { id: "check_tone", label: "Check tone", modules: [] },
      { id: "check_factuality", label: "Check factuality", modules: [] },
      { id: "convert_to_email", label: "Draft email", modules: [] },
      { id: "convert_to_letter", label: "Draft letter", modules: [] },
      { id: "create_task_list", label: "Create task list", modules: [] },
    ],
  },
  {
    group: "Daily records",
    commands: [
      { id: "draft_daily_log", label: "Draft daily log", modules: ["daily_log", "shift"] },
      { id: "draft_shift_summary", label: "Draft shift summary", modules: ["shift_summary", "shift"] },
      { id: "draft_handover", label: "Draft handover", modules: ["shift", "shift_summary"] },
      { id: "draft_keywork_session", label: "Draft key-work session", modules: ["key_work"] },
    ],
  },
  {
    group: "Children",
    commands: [
      { id: "draft_child_voice_summary", label: "Child voice summary", modules: ["child_record", "child_review"] },
      { id: "draft_placement_plan_update", label: "Placement plan update", modules: ["placement_plan"] },
      { id: "draft_risk_assessment_update", label: "Risk assessment update", modules: ["risk_assessment"] },
      { id: "draft_behaviour_support_update", label: "Behaviour support update", modules: ["behaviour_support_plan"] },
      { id: "draft_contact_summary", label: "Contact summary", modules: ["family_time", "contact"] },
      { id: "draft_education_summary", label: "Education summary", modules: ["education"] },
      { id: "draft_health_summary", label: "Health summary", modules: ["health"] },
      { id: "draft_independence_summary", label: "Independence summary", modules: ["independence", "pathway_plan"] },
    ],
  },
  {
    group: "Incidents",
    commands: [
      { id: "draft_incident_record", label: "Draft incident record", modules: ["incident"] },
      { id: "check_incident_chronology", label: "Check chronology", modules: ["incident"] },
      { id: "incident_risk_analysis", label: "Risk analysis", modules: ["incident"] },
      { id: "identify_missing_incident_information", label: "Missing info", modules: ["incident"] },
      { id: "suggest_incident_follow_up_tasks", label: "Follow-up tasks", modules: ["incident"] },
      { id: "draft_social_worker_update", label: "Social worker update", modules: ["incident", "child_record"] },
      { id: "draft_parent_carer_update", label: "Parent update", modules: ["incident", "child_record"] },
      { id: "draft_safeguarding_referral_support", label: "Safeguarding referral", modules: ["safeguarding"] },
    ],
  },
  {
    group: "Management oversight",
    commands: [
      { id: "draft_management_oversight", label: "Draft oversight", modules: ["management_oversight"] },
      { id: "improve_management_oversight", label: "Improve oversight", modules: ["management_oversight"] },
      { id: "review_management_oversight_quality", label: "Review quality", modules: ["management_oversight"] },
      { id: "identify_management_actions", label: "Identify actions", modules: ["management_oversight"] },
      { id: "check_oversight_reflection", label: "Check reflection", modules: ["management_oversight"] },
      { id: "check_oversight_challenge", label: "Check challenge", modules: ["management_oversight"] },
      { id: "check_oversight_child_focus", label: "Check child focus", modules: ["management_oversight"] },
      { id: "create_management_action_plan", label: "Action plan", modules: ["management_oversight", "audit"] },
    ],
  },
  {
    group: "RI / Quality",
    commands: [
      { id: "responsible_individual_qa_summary", label: "RI QA summary", modules: ["ri_dashboard", "quality_assurance"] },
      { id: "regulation_44_summary", label: "Reg 44 summary", modules: ["ri_dashboard", "regulation_44"] },
      { id: "regulation_45_summary", label: "Reg 45 summary", modules: ["ri_dashboard", "regulation_45"] },
      { id: "prepare_ofsted_readiness_summary", label: "Ofsted readiness", modules: ["ri_dashboard"] },
      { id: "identify_home_wide_themes", label: "Home-wide themes", modules: ["ri_dashboard"] },
      { id: "identify_repeated_shortfalls", label: "Repeated shortfalls", modules: ["ri_dashboard", "audit"] },
      { id: "create_service_improvement_plan", label: "Improvement plan", modules: ["ri_dashboard", "audit"] },
    ],
  },
  {
    group: "HR",
    commands: [
      { id: "draft_supervision_notes", label: "Supervision notes", modules: ["supervision"] },
      { id: "draft_team_meeting_minutes", label: "Team meeting minutes", modules: ["team_meeting"] },
      { id: "draft_return_to_work_note", label: "Return to work", modules: ["sickness", "hr"] },
      { id: "draft_investigation_questions", label: "Investigation questions", modules: ["hr_investigation"] },
      { id: "draft_outcome_letter", label: "Outcome letter", modules: ["hr"] },
      { id: "draft_performance_support_plan", label: "Performance plan", modules: ["hr"] },
      { id: "check_hr_fairness_and_tone", label: "Check HR fairness", modules: ["hr"] },
      { id: "draft_training_need_summary", label: "Training needs", modules: ["hr", "supervision"] },
    ],
  },
  {
    group: "Safer recruitment",
    commands: [
      { id: "draft_interview_questions", label: "Interview questions", modules: ["safer_recruitment"] },
      { id: "check_employment_gaps", label: "Employment gaps", modules: ["safer_recruitment"] },
      { id: "draft_reference_request", label: "Reference request", modules: ["safer_recruitment"] },
      { id: "draft_conditional_offer", label: "Conditional offer", modules: ["safer_recruitment"] },
      { id: "check_missing_recruitment_evidence", label: "Missing evidence", modules: ["safer_recruitment"] },
      { id: "create_onboarding_tasks", label: "Onboarding tasks", modules: ["safer_recruitment"] },
    ],
  },
  {
    group: "Audits",
    commands: [
      { id: "analyse_audit_findings", label: "Analyse findings", modules: ["audit"] },
      { id: "create_audit_action_plan", label: "Action plan", modules: ["audit"] },
      { id: "prioritise_audit_risks", label: "Prioritise risks", modules: ["audit"] },
      { id: "draft_manager_audit_response", label: "Manager response", modules: ["audit"] },
      { id: "create_delegated_audit_tasks", label: "Delegated tasks", modules: ["audit"] },
    ],
  },
  {
    group: "Documents",
    commands: [
      { id: "summarise_uploaded_document", label: "Summarise document", modules: ["documents"] },
      { id: "extract_document_actions", label: "Extract actions", modules: ["documents"] },
      { id: "identify_document_risks", label: "Identify risks", modules: ["documents"] },
    ],
  },
];

// ── Props ───────────────────────────────────────────────────────────────────

interface CaraCommandPanelProps {
  /** Current module — used to filter relevant commands */
  module?: string;
  /** Source text from the page (record content, form data, etc.) */
  sourceContent?: string;
  /** Child ID for context */
  childId?: string;
  /** Home ID for scoping */
  homeId?: string;
  /** Source record ID for audit linking */
  sourceRecordId?: string;
  /** Source record type */
  sourceRecordType?: string;
  /** Callback when user inserts Cara text into a field */
  onInsert?: (text: string) => void;
  /** Additional CSS */
  className?: string;
  /** Start collapsed */
  defaultCollapsed?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────

export function CaraCommandPanel({
  module,
  sourceContent,
  childId,
  homeId,
  sourceRecordId,
  sourceRecordType,
  onInsert,
  className,
  defaultCollapsed = false,
}: CaraCommandPanelProps) {
  const cara = useCaraCommand();

  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [selectedCommand, setSelectedCommand] = useState<CaraCommandId | "">("");
  const [inputText, setInputText] = useState("");
  const [editedText, setEditedText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");

  // Filter commands by module — show universal (modules=[]) + module-specific
  const filteredGroups = useMemo(() => {
    return COMMAND_GROUPS.map((group) => ({
      ...group,
      commands: group.commands.filter((cmd) => {
        // Module filter
        const moduleMatch = cmd.modules.length === 0 || (module && cmd.modules.includes(module));
        // Search filter
        const searchMatch = !commandSearch || cmd.label.toLowerCase().includes(commandSearch.toLowerCase());
        return moduleMatch && searchMatch;
      }),
    })).filter((group) => group.commands.length > 0);
  }, [module, commandSearch]);

  const handleInvoke = async () => {
    if (!selectedCommand) return;
    const text = inputText || sourceContent || "";
    if (!text.trim()) return;

    await cara.invoke({
      commandId: selectedCommand,
      inputText: text,
      homeId,
      childId,
      sourceModule: module,
      sourceRecordId,
      sourceRecordType,
    });
  };

  const handleCopy = () => {
    const text = isEditing ? editedText : cara.result?.generatedText;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInsert = () => {
    const text = isEditing ? editedText : cara.result?.generatedText;
    if (text && onInsert) {
      onInsert(text);
    }
  };

  const handleEdit = () => {
    if (cara.result) {
      setEditedText(cara.result.generatedText);
      setIsEditing(true);
    }
  };

  const handleApprove = async () => {
    if (!cara.result?.outputId) return;
    await cara.decide({
      outputId: cara.result.outputId,
      decision: "approve",
      editedText: isEditing ? editedText : undefined,
    });
  };

  const handleReject = async () => {
    if (!cara.result?.outputId) return;
    await cara.decide({
      outputId: cara.result.outputId,
      decision: "reject",
      decisionText: "Rejected by user",
    });
    cara.clear();
  };

  const handleNewCommand = () => {
    cara.clear();
    setSelectedCommand("");
    setInputText("");
    setEditedText("");
    setIsEditing(false);
  };

  const confidenceColor = cara.result?.confidence === "high"
    ? "text-green-700 bg-green-50"
    : cara.result?.confidence === "medium"
      ? "text-amber-700 bg-amber-50"
      : "text-red-700 bg-red-50";

  return (
    <div className={cn(
      "rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-white overflow-hidden",
      className,
    )}>
      {/* Header */}
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-blue-50 border-b border-[var(--cs-cara-gold-soft)]"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-[var(--cs-navy)] flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-[var(--cs-navy)]">Cara</div>
            <div className="text-[10px] text-[var(--cs-text-muted)]">
              {module ? `${module.replace(/_/g, " ")} assistant` : "AI assistant"}
            </div>
          </div>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-[var(--cs-text-muted)] transition-transform",
          collapsed && "rotate-180",
        )} />
      </button>

      {!collapsed && (
        <div className="p-4 space-y-3">
          {/* Result view */}
          {cara.result ? (
            <div className="space-y-3">
              {/* Draft banner */}
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="text-xs text-amber-800">
                  Cara suggested draft. Requires human review before use.
                </span>
                <Badge className={cn("ml-auto text-[9px] rounded-full border-0", confidenceColor)}>
                  {cara.result.confidence} confidence
                </Badge>
              </div>

              {/* Safeguarding guardrail flags */}
              {cara.result.guardrails?.flagged && (
                <CaraGuardrailBanner
                  flagged={cara.result.guardrails.flagged}
                  mandatoryReview={cara.result.guardrails.mandatoryReview}
                  flags={cara.result.guardrails.flags}
                  summary={cara.result.guardrails.summary}
                />
              )}

              {/* Diff viewer for text improvement commands */}
              {selectedCommand &&
                TEXT_IMPROVEMENT_COMMANDS.has(selectedCommand) &&
                (inputText || sourceContent) &&
                cara.result.generatedText &&
                !isEditing && (
                  <CaraDiffViewer
                    originalText={inputText || sourceContent || ""}
                    generatedText={cara.result.generatedText}
                    commandLabel={
                      COMMAND_GROUPS.flatMap((g) => g.commands).find(
                        (c) => c.id === selectedCommand,
                      )?.label
                    }
                  />
                )}

              {/* Generated/edited text */}
              {isEditing ? (
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows={8}
                  className="text-xs"
                />
              ) : (
                <div className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] p-3 text-xs text-[var(--cs-text-secondary)] whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {cara.result.generatedText}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1"
                  onClick={handleCopy}
                >
                  {copied ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </Button>

                {onInsert && (
                  <Button
                    size="sm"
                    className="text-xs gap-1 bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
                    onClick={handleInsert}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Insert
                  </Button>
                )}

                {!isEditing && (
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleEdit}>
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </Button>
                )}

                {cara.result.outputId && cara.result.approvalRequired && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1 text-green-700 border-green-200 hover:bg-green-50"
                      onClick={handleApprove}
                      disabled={cara.deciding}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1 text-red-700 border-red-200 hover:bg-red-50"
                      onClick={handleReject}
                      disabled={cara.deciding}
                    >
                      <ThumbsDown className="h-3 w-3" />
                      Reject
                    </Button>
                  </>
                )}

                <Button size="sm" variant="ghost" className="text-xs gap-1 ml-auto" onClick={handleNewCommand}>
                  <RefreshCw className="h-3 w-3" />
                  New
                </Button>
              </div>

              {/* Provider info */}
              {cara.result.llmUsed && (
                <div className="text-[9px] text-[var(--cs-text-muted)]">
                  Generated by {cara.result.modelId} via {cara.result.providerId}
                </div>
              )}
              {!cara.result.llmUsed && (
                <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] text-amber-700">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>Showing template output — AI enhancement available when provider is connected.</span>
                </div>
              )}

              {/* Task creator for task-generating commands */}
              {selectedCommand && TASK_CREATING_COMMANDS.has(selectedCommand) && cara.result.generatedText && (
                <CaraTaskCreator
                  generatedText={cara.result.generatedText}
                  outputId={cara.result.outputId}
                  homeId={homeId}
                  linkedChildId={childId}
                />
              )}

              {/* Feedback widget — always shown after generation */}
              {cara.result.outputId && selectedCommand && (
                <div className="mt-3 pt-3 border-t border-[var(--cs-border-subtle)]">
                  <CaraFeedbackWidget
                    outputId={cara.result.outputId}
                    commandId={selectedCommand}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Command selector */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">
                    Command
                  </label>
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--cs-text-muted)]" />
                    <input
                      type="text"
                      value={commandSearch}
                      onChange={(e) => setCommandSearch(e.target.value)}
                      placeholder="Search commands..."
                      className="w-full rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] pl-7 pr-2 py-1 text-[10px] text-[var(--cs-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--cs-cara-gold)]"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)]">
                  {filteredGroups.map((group) => (
                    <div key={group.group}>
                      <div className="px-2 py-1 text-[9px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider bg-white sticky top-0">
                        {group.group}
                      </div>
                      {group.commands.map((cmd) => (
                        <button
                          key={cmd.id}
                          type="button"
                          onClick={() => {
                            setSelectedCommand(cmd.id);
                            setCommandSearch("");
                          }}
                          className={cn(
                            "w-full text-left px-3 py-1.5 text-xs transition-colors",
                            selectedCommand === cmd.id
                              ? "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] font-medium"
                              : "text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]",
                          )}
                        >
                          {cmd.label}
                        </button>
                      ))}
                    </div>
                  ))}
                  {filteredGroups.length === 0 && (
                    <div className="px-3 py-4 text-xs text-[var(--cs-text-muted)] text-center">
                      No commands available for this context
                    </div>
                  )}
                </div>
              </div>

              {/* Input area */}
              {selectedCommand && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider block mb-1">
                      Source text or instruction
                    </label>
                    <div className="relative">
                      <Textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={sourceContent
                          ? "Add instructions (source text will be included automatically)..."
                          : "Paste or type the source text for Cara to work with..."
                        }
                        rows={4}
                        className="text-xs pr-10"
                      />
                      <div className="absolute bottom-2 right-2">
                        <DictationButton
                          size="sm"
                          onTranscript={(text) => setInputText((prev) => prev ? `${prev} ${text}` : text)}
                          onInterimTranscript={(text) => setInputText((prev) => {
                            const trimmed = prev.replace(/\s*…$/, "").trimEnd();
                            return trimmed ? `${trimmed} ${text}…` : `${text}…`;
                          })}
                          mode="append"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Context indicator */}
                  {sourceContent && (
                    <div className="rounded-lg bg-[var(--cs-surface)] border border-[var(--cs-border)] px-3 py-2">
                      <div className="text-[10px] text-[var(--cs-text-muted)] font-medium">Cara will use</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge className="text-[9px] rounded-full bg-blue-100 text-blue-700 border-0">
                          Source record ({sourceContent.length.toLocaleString()} chars)
                        </Badge>
                        {childId && (
                          <Badge className="text-[9px] rounded-full bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)] border-0">
                            Child context
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Generate button */}
                  <Button
                    onClick={handleInvoke}
                    disabled={cara.loading || (!inputText.trim() && !sourceContent)}
                    className="w-full bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
                    size="sm"
                  >
                    {cara.loading ? (
                      <><RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />Cara is thinking...</>
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5 mr-2" />Generate</>
                    )}
                  </Button>
                </>
              )}

              {/* Error */}
              {cara.error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-800">
                    {cara.error}
                    {cara.providerConfigured === false && (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-medium text-amber-800">Cara is being set up by your administrator.</p>
                        <p className="mt-0.5 text-[10px] text-amber-600">Intelligence features will be available once configuration is complete.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
