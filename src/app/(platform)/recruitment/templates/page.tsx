"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import {
  Mail, FileText, Search, Copy, ExternalLink, Tag, Clock, Sparkles,
  Shield, Users, AlertTriangle, CheckCircle2, X, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ── Types ─────────────────────────────────────────────────────────────────────

type TemplateCategory =
  | "invitation"
  | "reference"
  | "offer"
  | "rejection"
  | "compliance"
  | "gap_explanation"
  | "onboarding";

interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  purpose: string;
  trigger: string;
  subject: string;
  body: string;
  safeguarding_note?: string;
  merge_fields: string[];
  regulation_ref?: string;
}

// ── Template data ─────────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  {
    id: "tpl_001",
    name: "Application Acknowledgement",
    category: "invitation",
    purpose: "Acknowledge receipt of application and set expectations",
    trigger: "Sent immediately on receipt of application",
    subject: "Your application to {{role_title}} at {{home_name}} — received",
    body: `Dear {{first_name}},

Thank you for applying for the position of {{role_title}} at {{home_name}}.

We have received your application and will review it carefully. You will hear from us within 5 working days regarding the outcome of the initial sift.

Please note that all appointments are subject to satisfactory completion of safer recruitment checks, including an enhanced DBS check, references, and verification of your right to work in the UK.

If you have any questions in the meantime, please do not hesitate to contact us at {{contact_email}}.

Yours sincerely,
{{manager_name}}
{{manager_role}}
{{home_name}}`,
    merge_fields: ["first_name", "role_title", "home_name", "contact_email", "manager_name", "manager_role"],
    regulation_ref: "Children's Homes Regulations 2015, Schedule 7",
  },
  {
    id: "tpl_002",
    name: "Interview Invitation",
    category: "invitation",
    purpose: "Invite shortlisted candidate to interview, including safer recruitment panel details",
    trigger: "Sent after shortlisting decision",
    subject: "Interview invitation — {{role_title}} at {{home_name}}",
    body: `Dear {{first_name}},

I am delighted to invite you to interview for the position of {{role_title}} at {{home_name}}.

Interview Details:
Date: {{interview_date}}
Time: {{interview_time}}
Location/Format: {{interview_location}}
Panel: {{panel_names}}

This will be a values-based interview lasting approximately {{interview_duration}} minutes. At least one panel member is trained in safer recruitment.

Please bring the following original documents to your interview:
• Proof of identity (passport or full UK birth certificate)
• Proof of right to work in the UK
• Proof of address (issued within the last 3 months)
• Details of any gaps in your employment history

If you are unable to attend, please contact us as soon as possible so we can arrange an alternative date.

We look forward to meeting you.

Yours sincerely,
{{manager_name}}
{{manager_role}}`,
    safeguarding_note: "Panel must include at least one person trained in safer recruitment (Sch. 7, para. 3)",
    merge_fields: ["first_name", "role_title", "home_name", "interview_date", "interview_time", "interview_location", "panel_names", "interview_duration", "manager_name", "manager_role"],
    regulation_ref: "Children's Homes Regulations 2015, Schedule 7, para. 3",
  },
  {
    id: "tpl_003",
    name: "Reference Request — Previous Employer",
    category: "reference",
    purpose: "Request a structured reference from a previous employer",
    trigger: "Sent after interview, before conditional offer",
    subject: "Reference request: {{candidate_name}} — {{candidate_role_title}}",
    body: `Dear {{referee_name}},

{{candidate_name}} has applied for the position of {{role_title}} at {{home_name}}, a children's residential home regulated by Ofsted.

{{candidate_name}} has named you as a referee and has given consent for us to contact you. They have indicated that they worked at {{referee_org}} in the role of {{candidate_role_at_org}} from {{employment_start}} to {{employment_end}}.

Given the safeguarding responsibilities associated with this role, we are required to obtain a structured reference. Please could you complete the enclosed reference form and return it by {{response_deadline}}.

The information you provide will be treated in strict confidence and used solely for the purpose of assessing the candidate's suitability for this post.

If you have any concerns regarding the suitability of this applicant to work with children, I would ask you to contact me directly and in confidence on {{manager_phone}}.

Thank you for your assistance.

Yours sincerely,
{{manager_name}}
{{manager_role}}
{{home_name}}`,
    safeguarding_note: "References must be obtained from all employers in the past 5 years. For the most recent employer, a reference must be obtained even if the candidate objects.",
    merge_fields: ["referee_name", "candidate_name", "role_title", "home_name", "referee_org", "candidate_role_at_org", "employment_start", "employment_end", "response_deadline", "manager_phone", "manager_name", "manager_role"],
    regulation_ref: "Children's Homes Regulations 2015, Schedule 7, para. 5",
  },
  {
    id: "tpl_004",
    name: "Reference Request — Character Reference",
    category: "reference",
    purpose: "Request a character reference when employer reference is unavailable",
    trigger: "Used when candidate cannot provide an employer reference for a period",
    subject: "Character reference request: {{candidate_name}}",
    body: `Dear {{referee_name}},

{{candidate_name}} has applied for the position of {{role_title}} at {{home_name}} and has provided your name as a character referee.

As this role involves working directly with children in a regulated residential setting, we are required to satisfy ourselves as to the candidate's suitability and good character.

We would be grateful if you could provide a written character reference covering:
• How long you have known {{candidate_name}} and in what capacity
• Your assessment of their suitability to work with children and young people
• Whether you are aware of any concerns regarding their conduct or character

Please return your reference by {{response_deadline}} to {{contact_email}}.

Please note that character references cannot be accepted from family members.

Thank you for your time.

Yours sincerely,
{{manager_name}}
{{manager_role}}`,
    merge_fields: ["referee_name", "candidate_name", "role_title", "home_name", "response_deadline", "contact_email", "manager_name", "manager_role"],
    regulation_ref: "Children's Homes Regulations 2015, Schedule 7",
  },
  {
    id: "tpl_005",
    name: "Reference Chaser",
    category: "reference",
    purpose: "Follow up with a referee who has not responded",
    trigger: "Sent 7 days after initial reference request with no response",
    subject: "Reminder: Reference request for {{candidate_name}}",
    body: `Dear {{referee_name}},

I am writing to follow up on our reference request for {{candidate_name}}, sent on {{original_request_date}}.

We are very keen to progress this candidate's application and would be grateful if you could return the completed reference by {{new_deadline}}.

If you have any difficulty completing the form, or if you would prefer to provide a verbal reference, please contact me on {{manager_phone}}.

Thank you again for your assistance.

Yours sincerely,
{{manager_name}}
{{manager_role}}`,
    merge_fields: ["referee_name", "candidate_name", "original_request_date", "new_deadline", "manager_phone", "manager_name", "manager_role"],
  },
  {
    id: "tpl_006",
    name: "Employment Gap Explanation Request",
    category: "gap_explanation",
    purpose: "Request a written explanation from the candidate for an employment gap",
    trigger: "Sent when a gap of 3+ months is identified in employment history",
    subject: "Employment history — additional information required",
    body: `Dear {{first_name}},

Thank you for your application for the position of {{role_title}} at {{home_name}}.

During our review of your employment history, we have identified a gap in your employment between {{gap_start_date}} and {{gap_end_date}} (approximately {{gap_days}} days).

As this is a regulated role working with children, we are required to account for all periods of your working life. This is a standard part of our safer recruitment process and is not a reflection of concern.

Could you please provide a brief written explanation of your activities during this period? Please email your response to {{contact_email}} by {{response_deadline}}.

If you have any questions, please do not hesitate to contact me.

Yours sincerely,
{{manager_name}}
{{manager_role}}`,
    safeguarding_note: "All gaps of 3+ months must be formally explained and recorded on the SCR.",
    merge_fields: ["first_name", "role_title", "home_name", "gap_start_date", "gap_end_date", "gap_days", "contact_email", "response_deadline", "manager_name", "manager_role"],
    regulation_ref: "Keeping Children Safe in Education 2024; OFSTED SCFF",
  },
  {
    id: "tpl_007",
    name: "Conditional Offer Letter",
    category: "offer",
    purpose: "Make a conditional offer of employment subject to satisfactory checks",
    trigger: "Sent after interview recommendation and before all checks are complete",
    subject: "Conditional offer of employment — {{role_title}} at {{home_name}}",
    body: `Dear {{first_name}},

I am delighted to offer you the position of {{role_title}} at {{home_name}}, subject to the satisfactory completion of the following pre-employment checks:

• Enhanced DBS check (including Barred List check)
• Verification of your right to work in the United Kingdom
• Receipt of satisfactory references (minimum of two)
• Verification of identity documents
• {{additional_checks}}

The terms of this offer are as follows:
Role: {{role_title}}
Start date: {{proposed_start_date}} (subject to checks)
Salary: {{salary}} per annum
Hours: {{hours_per_week}} hours per week
Contract type: {{contract_type}}

This offer is conditional and will become unconditional only once all safer recruitment checks have been completed to our satisfaction. We reserve the right to withdraw this offer if any check returns unsatisfactory results.

Please confirm your acceptance of this conditional offer by signing and returning the enclosed copy of this letter by {{acceptance_deadline}}.

We look forward to welcoming you to the team.

Yours sincerely,
{{manager_name}}
{{manager_role}}
{{home_name}}`,
    safeguarding_note: "A conditional offer must never become a confirmed start date until all mandatory checks are complete unless an exceptional start protocol has been authorised.",
    merge_fields: ["first_name", "role_title", "home_name", "additional_checks", "proposed_start_date", "salary", "hours_per_week", "contract_type", "acceptance_deadline", "manager_name", "manager_role"],
    regulation_ref: "Children's Homes Regulations 2015, Reg. 32",
  },
  {
    id: "tpl_008",
    name: "Exceptional Start Authorisation Notice",
    category: "offer",
    purpose: "Confirm an exceptional start has been authorised with risk mitigation documented",
    trigger: "Used only when a candidate starts before all checks are complete",
    subject: "Exceptional start authorisation — {{candidate_name}}",
    body: `INTERNAL DOCUMENT — NOT FOR DISTRIBUTION TO CANDIDATE

Exceptional Start Authorisation

Candidate: {{candidate_name}}
Role: {{role_title}}
Proposed Start Date: {{start_date}}
Authorised by: {{authorising_manager}}
Date of Authorisation: {{authorisation_date}}

Outstanding Checks at Time of Start:
{{outstanding_checks}}

Risk Mitigation Measures in Place:
{{risk_mitigation_measures}}

Review Date: {{review_date}}

This document confirms that an exceptional start has been authorised in accordance with regulation 32 of the Children's Homes (England) Regulations 2015. The above risk mitigation measures must remain in place until all outstanding checks have been satisfactorily completed.

This document must be retained on the staff file and SCR.

Signed: ____________________________
{{authorising_manager}} | {{authorisation_date}}`,
    safeguarding_note: "Exceptional starts are a significant safeguarding risk. This must only be used in exceptional circumstances with explicit RM sign-off and documented risk mitigation.",
    merge_fields: ["candidate_name", "role_title", "start_date", "authorising_manager", "authorisation_date", "outstanding_checks", "risk_mitigation_measures", "review_date"],
    regulation_ref: "Children's Homes Regulations 2015, Reg. 32(3)",
  },
  {
    id: "tpl_009",
    name: "Unconditional Offer / Final Clearance Letter",
    category: "offer",
    purpose: "Confirm unconditional appointment once all checks are satisfactorily completed",
    trigger: "Sent when all pre-employment checks are cleared",
    subject: "Confirmation of appointment — {{role_title}} at {{home_name}}",
    body: `Dear {{first_name}},

I am pleased to confirm your appointment to the position of {{role_title}} at {{home_name}}, subject to the terms set out in your contract of employment.

All pre-employment checks have been completed satisfactorily, including:
• Enhanced DBS check — cleared
• Right to Work verification — confirmed
• References — two satisfactory references received
• Identity verification — completed

Your confirmed start date is {{confirmed_start_date}}.

Enclosed with this letter you will find:
• Your contract of employment
• Staff handbook
• Induction schedule
• Information about your DBS update service registration

Please sign and return the enclosed copy of your contract by {{contract_return_deadline}}.

We very much look forward to welcoming you to {{home_name}} on {{confirmed_start_date}}.

Yours sincerely,
{{manager_name}}
{{manager_role}}`,
    merge_fields: ["first_name", "role_title", "home_name", "confirmed_start_date", "contract_return_deadline", "manager_name", "manager_role"],
    regulation_ref: "Children's Homes Regulations 2015, Schedule 7",
  },
  {
    id: "tpl_010",
    name: "Unsuccessful Application — After Sift",
    category: "rejection",
    purpose: "Notify candidate they have not progressed past initial sift",
    trigger: "Sent after sift decision — candidate not shortlisted",
    subject: "Your application to {{role_title}} at {{home_name}}",
    body: `Dear {{first_name}},

Thank you for taking the time to apply for the position of {{role_title}} at {{home_name}}.

After careful consideration, we regret to inform you that your application has not been progressed on this occasion. The standard of applications received was very high, and we were not able to invite all suitable candidates to interview.

We appreciate the time you invested in your application and wish you every success in your future endeavours.

Please do not hesitate to apply for future vacancies at {{home_name}} that may match your skills and experience.

Yours sincerely,
{{manager_name}}
{{manager_role}}`,
    merge_fields: ["first_name", "role_title", "home_name", "manager_name", "manager_role"],
  },
  {
    id: "tpl_011",
    name: "Unsuccessful Application — After Interview",
    category: "rejection",
    purpose: "Notify candidate they have not been appointed following interview",
    trigger: "Sent after panel recommendation: do not appoint",
    subject: "Your interview for {{role_title}} at {{home_name}}",
    body: `Dear {{first_name}},

Thank you for attending your interview for the position of {{role_title}} at {{home_name}} on {{interview_date}}.

The panel was impressed by several aspects of your application; however, after careful deliberation, we regret to inform you that we are unable to offer you this position on this occasion.

{{feedback_paragraph}}

We appreciate the time you gave to this process and wish you well in your future career.

Yours sincerely,
{{manager_name}}
{{manager_role}}`,
    merge_fields: ["first_name", "role_title", "home_name", "interview_date", "feedback_paragraph", "manager_name", "manager_role"],
  },
  {
    id: "tpl_012",
    name: "Offer Withdrawal — Failed Check",
    category: "rejection",
    purpose: "Withdraw conditional offer due to an unsatisfactory check outcome",
    trigger: "Used when a check returns a result that prevents appointment",
    subject: "Withdrawal of conditional offer — {{role_title}}",
    body: `Dear {{first_name}},

I am writing with regard to the conditional offer made to you on {{offer_date}} for the position of {{role_title}} at {{home_name}}.

Following the completion of our pre-employment checks, we have identified information that means we are unable to proceed with your appointment.

{{withdrawal_reason_paragraph}}

We regret that we are therefore withdrawing our conditional offer of employment with immediate effect.

If you believe this decision has been made in error, you have the right to appeal in writing to {{appeals_contact}} within 10 working days of the date of this letter.

Yours sincerely,
{{manager_name}}
{{manager_role}}`,
    safeguarding_note: "Withdrawals based on DBS disclosures must follow a fair process including an individual assessment. Take HR/legal advice before issuing.",
    merge_fields: ["first_name", "offer_date", "role_title", "home_name", "withdrawal_reason_paragraph", "appeals_contact", "manager_name", "manager_role"],
  },
  {
    id: "tpl_013",
    name: "DBS Concern — Individual Assessment Notice",
    category: "compliance",
    purpose: "Notify candidate of a DBS disclosure and begin individual assessment",
    trigger: "When DBS returns with relevant information — before any appointment decision",
    subject: "DBS check — further information required",
    body: `Dear {{first_name}},

We have received the outcome of your Enhanced DBS check in connection with your application for the position of {{role_title}} at {{home_name}}.

The certificate contains information that we are required to consider as part of our safer recruitment process. Before making any decision, we wish to give you the opportunity to respond.

We would like to arrange a meeting with you at {{meeting_date}} at {{meeting_time}} to discuss the information disclosed. You are welcome to bring a trade union representative or a colleague to this meeting.

Please be assured that any information disclosed will be treated with the utmost confidentiality and will be considered alongside all other information gathered during the recruitment process.

Please confirm your attendance at the above meeting by responding to this letter by {{confirmation_deadline}}.

Yours sincerely,
{{manager_name}}
{{manager_role}}`,
    safeguarding_note: "An individual risk assessment must be completed before any appointment decision where a DBS disclosure is present. This process must be documented and retained.",
    merge_fields: ["first_name", "role_title", "home_name", "meeting_date", "meeting_time", "confirmation_deadline", "manager_name", "manager_role"],
    regulation_ref: "Disclosure and Barring Service Code of Practice 2023",
  },
  {
    id: "tpl_014",
    name: "Reference Discrepancy — Candidate Notification",
    category: "compliance",
    purpose: "Notify candidate of a discrepancy between their application and a reference received",
    trigger: "When a discrepancy is identified between application details and reference content",
    subject: "Reference discrepancy — further information required",
    body: `Dear {{first_name}},

Thank you for your application for the position of {{role_title}} at {{home_name}}.

During our review of the references received, we have identified a discrepancy that we would like to discuss with you.

Specifically: {{discrepancy_description}}

Before we proceed further, we would be grateful if you could provide clarification in writing or arrange a telephone conversation with me. Please contact me on {{manager_phone}} or at {{contact_email}} by {{response_deadline}}.

Your response will be considered alongside all other information before any further decision is made.

Yours sincerely,
{{manager_name}}
{{manager_role}}`,
    safeguarding_note: "All reference discrepancies must be investigated and documented. Unresolved discrepancies must be escalated before any appointment is made.",
    merge_fields: ["first_name", "role_title", "home_name", "discrepancy_description", "manager_phone", "contact_email", "response_deadline", "manager_name", "manager_role"],
  },
  {
    id: "tpl_015",
    name: "Induction Welcome Letter",
    category: "onboarding",
    purpose: "Welcome new staff member and provide practical induction information",
    trigger: "Sent after final clearance and confirmed start date",
    subject: "Welcome to {{home_name}} — your induction information",
    body: `Dear {{first_name}},

We are delighted to welcome you to {{home_name}} as our new {{role_title}}.

Your induction will take place over your first {{induction_days}} days and will cover:
• Safeguarding and child protection
• Behaviour management policy
• Emergency procedures and lone working
• Medication management
• Recording and report writing
• Values, culture, and the Cara ethos

Practical Information:
• Reporting to: {{line_manager}}
• Your first shift: {{first_shift_details}}
• Dress code: {{dress_code}}
• Parking: {{parking_info}}

Please bring the following on your first day:
• Bank account details for payroll
• P45 (if available)
• National Insurance number
• DBS update service subscription details (if applicable)

Your designated induction mentor is {{mentor_name}}, who will be your first point of contact for any questions during your first weeks.

We look forward to welcoming you to the team.

Yours sincerely,
{{manager_name}}
{{manager_role}}
{{home_name}}`,
    merge_fields: ["first_name", "home_name", "role_title", "induction_days", "line_manager", "first_shift_details", "dress_code", "parking_info", "mentor_name", "manager_name", "manager_role"],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<TemplateCategory, { label: string; color: string; icon: React.ElementType }> = {
  invitation: { label: "Invitation", color: "bg-blue-100 text-blue-700", icon: Mail },
  reference: { label: "Reference", color: "bg-violet-100 text-violet-700", icon: Users },
  offer: { label: "Offer", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  rejection: { label: "Rejection", color: "bg-slate-100 text-slate-600", icon: X },
  compliance: { label: "Compliance", color: "bg-amber-100 text-amber-700", icon: Shield },
  gap_explanation: { label: "Gap Explanation", color: "bg-orange-100 text-orange-700", icon: Clock },
  onboarding: { label: "Onboarding", color: "bg-teal-100 text-teal-700", icon: FileText },
};

const ALL_CATEGORIES: TemplateCategory[] = [
  "invitation", "reference", "offer", "rejection", "compliance", "gap_explanation", "onboarding",
];

function CategoryBadge({ category }: { category: TemplateCategory }) {
  const { label, color, icon: Icon } = CATEGORY_META[category];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", color)}>
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

function MergeField({ field }: { field: string }) {
  return (
    <code className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded px-1 py-0.5 font-mono">
      {`{{${field}}}`}
    </code>
  );
}

// ── Template Detail Modal ─────────────────────────────────────────────────────

function TemplateModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);

  function copyToClipboard(text: string, part: "subject" | "body") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(part);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="space-y-1">
            <CategoryBadge category={template.category} />
            <h2 className="text-lg font-semibold text-slate-900 mt-1">{template.name}</h2>
            <p className="text-sm text-slate-500">{template.purpose}</p>
            {template.regulation_ref && (
              <p className="text-[10px] text-slate-400">Ref: {template.regulation_ref}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-4 mt-0.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Trigger */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <Clock className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-600">When to use</p>
              <p className="text-xs text-slate-500">{template.trigger}</p>
            </div>
          </div>

          {/* Safeguarding note */}
          {template.safeguarding_note && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-700">Safeguarding note</p>
                <p className="text-xs text-amber-600">{template.safeguarding_note}</p>
              </div>
            </div>
          )}

          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Subject line</label>
              <button
                onClick={() => copyToClipboard(template.subject, "subject")}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
              >
                {copied === "subject" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied === "subject" ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 font-medium">
              {template.subject}
            </div>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email / letter body</label>
              <button
                onClick={() => copyToClipboard(template.body, "body")}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
              >
                {copied === "body" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied === "body" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed overflow-y-auto max-h-56">
              {template.body}
            </pre>
          </div>

          {/* Merge fields */}
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Merge fields required</p>
            <div className="flex flex-wrap gap-1.5">
              {template.merge_fields.map((f) => (
                <MergeField key={f} field={f} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs text-slate-500">Cara can draft a personalised version for a specific candidate</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            <Button size="sm" onClick={() => copyToClipboard(template.body, "body")}>
              <Copy className="h-3 w-3 mr-1" />
              {copied === "body" ? "Copied!" : "Copy body"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Template Card ─────────────────────────────────────────────────────────────

function TemplateCard({ template, onOpen }: { template: Template; onOpen: () => void }) {
  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 cursor-pointer hover:bg-[var(--cs-surface)] hover:border-blue-200 transition-all"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <CategoryBadge category={template.category} />
        {template.regulation_ref && (
          <span className="text-[9px] text-slate-400 shrink-0 mt-0.5">{template.regulation_ref.split(",")[0]}</span>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 leading-snug">{template.name}</h3>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{template.purpose}</p>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-slate-400">
        <Clock className="h-3 w-3" />
        <span className="truncate">{template.trigger}</span>
      </div>

      {template.safeguarding_note && (
        <div className="flex items-center gap-1 text-[10px] text-amber-600">
          <Shield className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">Safeguarding note attached</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-wrap gap-1">
          {template.merge_fields.slice(0, 3).map((f) => (
            <code key={f} className="text-[9px] bg-slate-100 text-slate-500 rounded px-1 font-mono">
              {`{{${f}}}`}
            </code>
          ))}
          {template.merge_fields.length > 3 && (
            <code className="text-[9px] bg-slate-100 text-slate-400 rounded px-1 font-mono">
              +{template.merge_fields.length - 3} more
            </code>
          )}
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-400 shrink-0" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [showCara, setShowCara] = useState(false);

  const filtered = useMemo(() => {
    let list = TEMPLATES;
    if (categoryFilter !== "all") list = list.filter((t) => t.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.purpose.toLowerCase().includes(q) ||
        t.trigger.toLowerCase().includes(q) ||
        t.merge_fields.some((f) => f.includes(q))
      );
    }
    return list;
  }, [search, categoryFilter]);

  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: TEMPLATES.length };
    for (const t of TEMPLATES) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <PageShell
      title="Communication Templates"
      subtitle="Safer recruitment correspondence — regulation-compliant email and letter templates"
      caraContext={{ pageTitle: "Communication Templates", sourceType: "document" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Communication Templates" subtitle="Chamberlain House — Safer Recruitment Templates" targetId="templates-content" />
          <SmartUploadButton variant="inline" label="Upload Template Document" uploadContext="Safer Recruitment — communication template or correspondence document upload" />
          <Button size="sm" variant="outline" onClick={() => setShowCara((v) => !v)}>
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            {showCara ? "Hide Cara" : "Ask Cara"}
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="templates-content" className="space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Total templates</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{TEMPLATES.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Categories</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{ALL_CATEGORIES.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">With safeguarding notes</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {TEMPLATES.filter((t) => t.safeguarding_note).length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">With regulation refs</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {TEMPLATES.filter((t) => t.regulation_ref).length}
            </p>
          </div>
        </div>

        {/* Cara */}
        {showCara && (
          <CaraPanel
            pageContext="Recruitment template library. 15 UK safer recruitment correspondence templates covering application, references, offers, rejections, compliance, gap explanations, and onboarding. Templates include merge fields and regulation references."
            userRole="registered_manager"
            mode="assist"
          />
        )}

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setCategoryFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
                categoryFilter === "all"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              All ({countByCategory.all})
            </button>
            {ALL_CATEGORIES.map((cat) => {
              const { label } = CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
                    categoryFilter === cat
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {label} ({countByCategory[cat] ?? 0})
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No templates match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <TemplateCard key={t.id} template={t} onOpen={() => setActiveTemplate(t)} />
            ))}
          </div>
        )}

        {/* Cara guidance */}
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-violet-800">Cara can personalise any template</p>
            <p className="text-xs text-violet-600 mt-0.5">
              Select a template, then ask Cara to draft a personalised version for a specific candidate — Cara will populate merge fields from the candidate&apos;s record and adjust the tone for the context.
            </p>
          </div>
        </div>
      </div>

      {/* Template modal */}
      {activeTemplate && (
        <TemplateModal template={activeTemplate} onClose={() => setActiveTemplate(null)} />
      )}
    </PageShell>
  );
}
