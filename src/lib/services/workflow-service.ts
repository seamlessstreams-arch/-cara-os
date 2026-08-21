// ══════════════════════════════════════════════════════════════════════════════
// CARA — WORKFLOW ENGINE SERVICE
// Pre-built workflow templates for regulated care processes. Step-by-step
// progression with evidence linking, task auto-creation, and Cara suggestions.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type {
  CsWorkflow, CsWorkflowStep, WorkflowTemplateDefinition,
  WorkflowStatus, WorkflowStepStatus, WorkflowTemplateCode,
  ServiceResult,
} from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Pre-built workflow templates ────────────────────────────────────────────

export const WORKFLOW_TEMPLATES: WorkflowTemplateDefinition[] = [
  {
    code: "new_placement",
    title: "New Placement Admission",
    description: "End-to-end workflow for admitting a young person: referral assessment through to 72-hour review.",
    category: "placement",
    regulation_refs: ["CHR2015:Reg5", "CHR2015:Reg9", "SCCIF:OverallExperiences"],
    steps: [
      { title: "Referral Assessment", description: "Review referral documentation and assess placement suitability against Statement of Purpose", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true },
      { title: "Impact Risk Assessment", description: "Assess impact on existing young people. Complete group dynamics analysis.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true },
      { title: "Pre-Placement Planning", description: "Create initial care plan, risk assessment, and welcome pack. Brief staff team.", assigned_role: "deputy_manager", evidence_required: true, auto_create_task: true },
      { title: "Placement Agreement", description: "Ensure placement agreement is signed by LA and all essential information is received.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: false },
      { title: "Room & Environment", description: "Prepare bedroom, personalise space, ensure emergency equipment is accessible.", assigned_role: "team_leader", evidence_required: false, auto_create_task: true },
      { title: "Staff Briefing", description: "Full team briefing on young person's needs, triggers, strategies, and key contacts.", assigned_role: "deputy_manager", evidence_required: true, auto_create_task: true },
      { title: "Admission Day", description: "Welcome young person. Complete admission checklist, property inventory, and first daily log.", assigned_role: "team_leader", evidence_required: true, auto_create_task: true },
      { title: "72-Hour Review", description: "Initial placement review within 72 hours. Update risk assessment and care plan as needed.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true, estimated_hours: 72 },
    ],
  },
  {
    code: "incident_response",
    title: "Significant Incident Response",
    description: "Structured response to significant incidents including notifications, oversight, and learning.",
    category: "safeguarding",
    regulation_refs: ["CHR2015:Reg7", "CHR2015:Reg12", "SCCIF:SafeChildren"],
    steps: [
      { title: "Immediate Safety", description: "Ensure immediate safety of all young people and staff. Administer first aid if needed.", assigned_role: "team_leader", evidence_required: false, auto_create_task: false },
      { title: "Incident Recording", description: "Complete detailed incident report including body map if applicable.", assigned_role: "residential_care_worker", evidence_required: true, auto_create_task: true },
      { title: "Notifications", description: "Notify required parties: placing authority, parents/carers, Ofsted (if threshold met), LADO if applicable.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true },
      { title: "Management Oversight", description: "Registered Manager provides written oversight within 24 hours. Consider Cara quality check.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true, estimated_hours: 24 },
      { title: "Debrief", description: "Staff debrief and young person debrief (when appropriate). Record outcomes.", assigned_role: "deputy_manager", evidence_required: true, auto_create_task: true },
      { title: "Review & Learning", description: "Review incident for patterns, update risk assessment, identify learning points for team.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true },
    ],
  },
  {
    code: "missing_episode",
    title: "Missing from Care Episode",
    description: "Response protocol when a young person goes missing, through to return interview.",
    category: "safeguarding",
    regulation_refs: ["CHR2015:Reg14", "CHR2015:Reg7", "SCCIF:SafeChildren"],
    steps: [
      { title: "Immediate Actions", description: "Search premises, attempt contact, check known locations and associates.", assigned_role: "team_leader", evidence_required: false, auto_create_task: false },
      { title: "Police Notification", description: "Report to police within agreed timescale. Record reference number.", assigned_role: "team_leader", evidence_required: true, auto_create_task: true },
      { title: "LA & Carer Notifications", description: "Notify social worker, parents/carers, and management team.", assigned_role: "team_leader", evidence_required: true, auto_create_task: true },
      { title: "Ongoing Monitoring", description: "Regular attempts to contact. Update police if new information. Log all actions.", assigned_role: "residential_care_worker", evidence_required: true, auto_create_task: false },
      { title: "Safe Return", description: "Welcome back, physical welfare check, initial debrief in safe and calm manner.", assigned_role: "team_leader", evidence_required: true, auto_create_task: true },
      { title: "Return Interview", description: "Independent return interview within 72 hours. Record using child-friendly language.", assigned_role: "deputy_manager", evidence_required: true, auto_create_task: true, estimated_hours: 72 },
      { title: "Risk Assessment Update", description: "Update missing from care risk assessment. Identify triggers and prevention strategies.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true },
    ],
  },
  {
    code: "reg44_report",
    title: "Regulation 44 Monthly Visit",
    description: "Preparation and follow-up for the independent person's monthly monitoring visit.",
    category: "compliance",
    regulation_refs: ["Reg44:Monthly", "CHR2015:Reg8"],
    steps: [
      { title: "Pre-Visit Preparation", description: "Compile monthly data: incidents, complaints, missing episodes, staffing, training compliance, young people's views.", assigned_role: "deputy_manager", evidence_required: true, auto_create_task: true },
      { title: "Young People Consultation", description: "Gather views from young people about their experience this month.", assigned_role: "team_leader", evidence_required: true, auto_create_task: true },
      { title: "Staff Consultation", description: "Gather views from staff team. Include any concerns or positive observations.", assigned_role: "deputy_manager", evidence_required: true, auto_create_task: true },
      { title: "Visit Facilitation", description: "Support the Reg 44 visitor. Ensure access to records and private conversations with YP.", assigned_role: "registered_manager", evidence_required: false, auto_create_task: false },
      { title: "Report Review", description: "Review the Reg 44 report. Identify actions and recommendations.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true },
      { title: "Action Plan", description: "Create action plan from recommendations. Assign tasks with deadlines.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true },
    ],
  },
  {
    code: "reg45_review",
    title: "Regulation 45 Quality of Care Review",
    description: "Biannual quality of care review by the registered person.",
    category: "compliance",
    regulation_refs: ["Reg45:Biannual", "CHR2015:Reg8", "SCCIF:Leadership"],
    steps: [
      { title: "Data Gathering", description: "Compile 6-month data across all modules: incidents, outcomes, complaints, staffing, training, inspections.", assigned_role: "deputy_manager", evidence_required: true, auto_create_task: true },
      { title: "Young People's Views", description: "Structured consultation with all young people about their care experience.", assigned_role: "team_leader", evidence_required: true, auto_create_task: true },
      { title: "Staff Analysis", description: "Staff team feedback, supervision themes, training impact analysis.", assigned_role: "deputy_manager", evidence_required: true, auto_create_task: true },
      { title: "Outcomes Analysis", description: "Analyse progress against care plans, education outcomes, health, and wellbeing.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true },
      { title: "Report Drafting", description: "Draft the Reg 45 report covering all required areas with evidence references.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true },
      { title: "Responsible Individual Review", description: "RI reviews and signs off the report. Adds commentary.", assigned_role: "responsible_individual", evidence_required: true, auto_create_task: true },
      { title: "Action Plan & Distribution", description: "Finalise action plan, distribute to team, Ofsted, and placing authorities.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true },
    ],
  },
  {
    code: "staff_onboarding",
    title: "New Staff Onboarding",
    description: "Structured induction for new staff members covering all mandatory requirements.",
    category: "staffing",
    regulation_refs: ["CHR2015:Reg34", "SCCIF:Leadership"],
    steps: [
      { title: "Pre-Employment Checks", description: "Verify DBS, references, right to work, qualifications, and health declaration.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true },
      { title: "Induction Pack", description: "Prepare and issue induction pack: policies, Statement of Purpose, children's guides, staff handbook.", assigned_role: "deputy_manager", evidence_required: true, auto_create_task: true },
      { title: "Day 1 Orientation", description: "Building tour, introductions, IT setup, emergency procedures, safeguarding briefing.", assigned_role: "team_leader", evidence_required: true, auto_create_task: true },
      { title: "Mandatory Training", description: "Complete all mandatory training within first week: safeguarding, first aid, medication, de-escalation.", assigned_role: "deputy_manager", evidence_required: true, auto_create_task: true },
      { title: "Young People Introductions", description: "Structured introductions to each young person. Review individual care plans and risk assessments.", assigned_role: "team_leader", evidence_required: true, auto_create_task: true },
      { title: "Shadow Shifts", description: "Complete required shadow shifts before working unsupervised. Assess competency.", assigned_role: "team_leader", evidence_required: true, auto_create_task: true },
      { title: "Probation Review (1 Month)", description: "First formal probation review. Assess progress, identify support needs.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true, estimated_hours: 720 },
    ],
  },
  {
    code: "placement_ending",
    title: "Planned Placement Ending",
    description: "Structured transition when a young person's placement is ending.",
    category: "placement",
    regulation_refs: ["CHR2015:Reg5", "CHR2015:Reg9", "SCCIF:OverallExperiences"],
    steps: [
      { title: "Transition Planning", description: "Plan the transition with the young person, social worker, and receiving provision.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true },
      { title: "Life Story Work", description: "Complete life story work. Help the young person process their time at the home.", assigned_role: "team_leader", evidence_required: true, auto_create_task: true },
      { title: "Records Transfer", description: "Prepare records transfer pack. Ensure all documentation is complete and up to date.", assigned_role: "deputy_manager", evidence_required: true, auto_create_task: true },
      { title: "Farewell & Closure", description: "Support the young person through the move. Farewell activity if appropriate.", assigned_role: "team_leader", evidence_required: true, auto_create_task: true },
      { title: "Post-Placement Review", description: "Team debrief. Review what went well and learning points for future placements.", assigned_role: "registered_manager", evidence_required: true, auto_create_task: true },
    ],
  },
];

// ── Workflow CRUD ────────────────────────────────────────────────────────────

export async function listWorkflows(
  homeId: string,
  opts?: {
    status?: WorkflowStatus;
    template_code?: string;
    linked_child_id?: string;
    limit?: number;
  },
): Promise<ServiceResult<CsWorkflow[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_workflows") as SB).select("*").eq("home_id", homeId);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.template_code) q = q.eq("template_code", opts.template_code);
  if (opts?.linked_child_id) q = q.eq("linked_child_id", opts.linked_child_id);
  q = q.order("created_at", { ascending: false }).limit(opts?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getWorkflow(
  workflowId: string,
): Promise<ServiceResult<CsWorkflow & { steps: CsWorkflowStep[] }>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data: workflow, error: wErr } = await (s.from("cs_workflows") as SB)
    .select("*")
    .eq("id", workflowId)
    .single();
  if (wErr) return { ok: false, error: wErr.message };

  const { data: steps, error: sErr } = await (s.from("cs_workflow_steps") as SB)
    .select("*")
    .eq("workflow_id", workflowId)
    .order("step_number", { ascending: true });
  if (sErr) return { ok: false, error: sErr.message };

  return { ok: true, data: { ...workflow, steps: steps ?? [] } };
}

/**
 * Initiate a new workflow from a template.
 * Creates the workflow record and all step records.
 */
export async function initiateWorkflow(input: {
  homeId: string;
  templateCode: WorkflowTemplateCode;
  title?: string;
  linked_child_id?: string;
  linked_incident_id?: string;
  due_date?: string;
  metadata?: Record<string, unknown>;
  initiated_by: string;
}): Promise<ServiceResult<CsWorkflow>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const template = WORKFLOW_TEMPLATES.find((t) => t.code === input.templateCode);
  if (!template) return { ok: false, error: `Unknown workflow template: ${input.templateCode}` };

  // Create workflow
  const { data: workflow, error: wErr } = await (s.from("cs_workflows") as SB)
    .insert({
      home_id: input.homeId,
      template_code: input.templateCode,
      title: input.title ?? template.title,
      description: template.description,
      status: "in_progress",
      current_step: 1,
      total_steps: template.steps.length,
      linked_child_id: input.linked_child_id ?? null,
      linked_incident_id: input.linked_incident_id ?? null,
      initiated_by: input.initiated_by,
      due_date: input.due_date ?? null,
      metadata: input.metadata ?? null,
    })
    .select()
    .single();
  if (wErr) return { ok: false, error: wErr.message };

  // Create all steps
  const stepInserts = template.steps.map((step, idx) => ({
    workflow_id: workflow.id,
    step_number: idx + 1,
    title: step.title,
    description: step.description,
    status: idx === 0 ? "in_progress" : "pending",
    assigned_role: step.assigned_role,
    evidence_required: step.evidence_required,
    auto_create_task: step.auto_create_task,
  }));

  const { error: sErr } = await (s.from("cs_workflow_steps") as SB).insert(stepInserts);
  if (sErr) return { ok: false, error: sErr.message };

  return { ok: true, data: workflow };
}

/**
 * Complete a workflow step and advance to the next one.
 */
export async function completeWorkflowStep(
  stepId: string,
  userId: string,
  opts?: {
    completion_notes?: string;
    evidence_ids?: string[];
  },
): Promise<ServiceResult<CsWorkflowStep>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  // Complete this step
  const { data: step, error: stepErr } = await (s.from("cs_workflow_steps") as SB)
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: userId,
      completion_notes: opts?.completion_notes ?? null,
      evidence_ids: opts?.evidence_ids ?? [],
      evidence_notes: opts?.completion_notes ?? null,
    })
    .eq("id", stepId)
    .select()
    .single();
  if (stepErr) return { ok: false, error: stepErr.message };

  // Advance workflow
  const workflowId = step.workflow_id;

  // Get all steps to determine next
  const { data: allSteps } = await (s.from("cs_workflow_steps") as SB)
    .select("*")
    .eq("workflow_id", workflowId)
    .order("step_number", { ascending: true });

  const nextStep = (allSteps ?? []).find(
    (st: CsWorkflowStep) => st.step_number > step.step_number && st.status === "pending",
  );

  if (nextStep) {
    // Activate next step
    await (s.from("cs_workflow_steps") as SB)
      .update({ status: "in_progress" })
      .eq("id", nextStep.id);

    // Update workflow current_step
    await (s.from("cs_workflows") as SB)
      .update({ current_step: nextStep.step_number, updated_at: new Date().toISOString() })
      .eq("id", workflowId);
  } else {
    // All steps complete — mark workflow as completed
    await (s.from("cs_workflows") as SB)
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workflowId);
  }

  return { ok: true, data: step };
}

/**
 * Skip a workflow step (with reason).
 */
export async function skipWorkflowStep(
  stepId: string,
  userId: string,
  reason: string,
): Promise<ServiceResult<CsWorkflowStep>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_workflow_steps") as SB)
    .update({
      status: "skipped",
      completed_at: new Date().toISOString(),
      completed_by: userId,
      completion_notes: `Skipped: ${reason}`,
    })
    .eq("id", stepId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  return { ok: true, data };
}

/**
 * Cancel an entire workflow.
 */
export async function cancelWorkflow(
  workflowId: string,
  _userId: string,
): Promise<ServiceResult<CsWorkflow>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_workflows") as SB)
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", workflowId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Workflow progress ───────────────────────────────────────────────────────

export interface WorkflowProgress {
  total_steps: number;
  completed: number;
  skipped: number;
  in_progress: number;
  pending: number;
  blocked: number;
  percentage: number | null;
}

export function computeWorkflowProgress(steps: CsWorkflowStep[]): WorkflowProgress {
  const counts = { completed: 0, skipped: 0, in_progress: 0, pending: 0, blocked: 0 };
  for (const step of steps) {
    const s = step.status as WorkflowStepStatus;
    if (s in counts) counts[s]++;
  }
  const total = steps.length;
  const done = counts.completed + counts.skipped;
  return {
    total_steps: total,
    ...counts,
    percentage: total > 0 ? Math.round((done / total) * 100) : null,
  };
}

/**
 * Get a template definition by code.
 */
export function getWorkflowTemplate(code: WorkflowTemplateCode): WorkflowTemplateDefinition | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.code === code);
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  WORKFLOW_TEMPLATES,
  computeWorkflowProgress,
  getWorkflowTemplate,
};
