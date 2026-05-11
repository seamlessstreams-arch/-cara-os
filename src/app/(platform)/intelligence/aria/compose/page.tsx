"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Aria Compose — worked example
//
// Demonstrates the ARIACompose widget against three of the most common
// children's-home long-text fields: a daily log entry, an incident note, and
// a management oversight comment. Any other module can drop AriaCompose into
// its existing forms with one line.
//
// All four flows go through:
//   POST /api/aria/generate        (server-side auth + permission + audit)
//   /api/aria/transcribe           (voice dictation, audio discarded after)
//   PATCH /api/aria/generate       (manager decision: approve / reject / edit)
//
// The actor user id and role on this page are inputs so a manager can run
// through the flows during onboarding. In real adoption these come from the
// auth context.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, BookOpen, AlertTriangle, ClipboardCheck } from "lucide-react";
import { AriaCompose } from "@/components/aria/aria-compose";
import type { AriaRole } from "@/lib/aria/aria-permissions";

const ROLES: { value: AriaRole; label: string }[] = [
  { value: "registered_manager", label: "Registered Manager" },
  { value: "responsible_individual", label: "Responsible Individual" },
  { value: "deputy_manager", label: "Deputy Manager" },
  { value: "team_leader", label: "Team Leader" },
  { value: "residential_support_worker", label: "Residential Support Worker" },
  { value: "hr_admin", label: "HR / Admin" },
  { value: "auditor", label: "Auditor" },
];

export default function AriaComposePage() {
  const [actorUserId, setActorUserId] = useState("manager_demo_user");
  const [actorRole, setActorRole] = useState<AriaRole>("registered_manager");
  const [homeId, setHomeId] = useState("home_oak_house");

  const [dailyLog, setDailyLog] = useState("");
  const [incidentNotes, setIncidentNotes] = useState("");
  const [oversight, setOversight] = useState("");

  return (
    <PageShell title="ARIA — Compose">
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)] p-4 text-sm text-[var(--cs-navy)]">
        <Sparkles className="h-5 w-5 mt-0.5 text-[var(--cs-aria-gold)]" />
        <div>
          <div className="font-semibold">ARIA suggested draft, never final</div>
          <p className="text-[var(--cs-navy)]">
            This page demonstrates the universal ARIA layer in action. Each field
            below has the ARIA microphone button and the Ask ARIA command picker.
            ARIA runs on the server, every output is labelled as a draft, and
            every approve, edit, reject or rewrite-request is audit-logged. The
            same widget drops into any long-text field across Cornerstone.
          </p>
        </div>
      </div>

      {/* Actor context */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-4 w-4 text-[var(--cs-aria-gold)]" /> Acting as
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">User id (audit log)</label>
              <Input value={actorUserId} onChange={(e) => setActorUserId(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Role</label>
              <Select value={actorRole} onValueChange={(v) => setActorRole(v as AriaRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Home id</label>
              <Input value={homeId} onChange={(e) => setHomeId(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-[var(--cs-text-muted)] mt-3">
            ARIA respects roles. Mic button, Ask-ARIA picker, and HR-permissioned
            commands all hide for roles that don&apos;t hold the relevant Aria
            permission. The server enforces every check independently.
          </p>
        </CardContent>
      </Card>

      {/* Daily log */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-blue-500" /> Daily log entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AriaCompose
            value={dailyLog}
            onChange={setDailyLog}
            actorUserId={actorUserId}
            actorRole={actorRole}
            homeId={homeId}
            sourceModule="daily_log"
            sourceField="narrative"
            defaultCommand="professionalise_record"
            label="Narrative"
            placeholder="Write the daily log narrative, or tap the mic to dictate."
          />
        </CardContent>
      </Card>

      {/* Incident notes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Incident notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AriaCompose
            value={incidentNotes}
            onChange={setIncidentNotes}
            actorUserId={actorUserId}
            actorRole={actorRole}
            homeId={homeId}
            sourceModule="incident"
            sourceField="narrative"
            defaultCommand="draft_incident_record"
            commands={[
              { id: "draft_incident_record", label: "Draft incident record", permission: "aria.generate_drafts" },
              { id: "check_incident_chronology", label: "Check chronology", permission: "aria.analyse_risk" },
              { id: "incident_risk_analysis", label: "Risk analysis", permission: "aria.analyse_risk" },
              { id: "identify_missing_incident_information", label: "Missing information", permission: "aria.analyse_risk" },
              { id: "suggest_incident_follow_up_tasks", label: "Suggest follow-up tasks", permission: "aria.create_tasks" },
              { id: "draft_social_worker_update", label: "Draft SW update", permission: "aria.generate_drafts" },
              { id: "draft_parent_carer_update", label: "Draft parent / carer update", permission: "aria.generate_drafts" },
            ]}
            label="Notes"
            placeholder="Note what happened, who was involved, and when. ARIA can structure this into an incident record."
          />
        </CardContent>
      </Card>

      {/* Management oversight */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" /> Management oversight comment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AriaCompose
            value={oversight}
            onChange={setOversight}
            actorUserId={actorUserId}
            actorRole={actorRole}
            homeId={homeId}
            sourceModule="management_oversight"
            sourceField="comment"
            defaultCommand="draft_management_oversight"
            commands={[
              { id: "draft_management_oversight", label: "Draft oversight", permission: "aria.generate_drafts" },
              { id: "improve_management_oversight", label: "Improve oversight", permission: "aria.rewrite" },
              { id: "review_management_oversight_quality", label: "Review oversight quality", permission: "aria.summarise" },
              { id: "check_oversight_reflection", label: "Check reflection", permission: "aria.summarise" },
              { id: "check_oversight_challenge", label: "Check challenge", permission: "aria.summarise" },
              { id: "check_oversight_child_focus", label: "Check child focus", permission: "aria.summarise" },
              { id: "identify_management_actions", label: "Identify management actions", permission: "aria.summarise" },
            ]}
            label="Oversight"
            placeholder="Note what you have read and what you want to say. ARIA will draft a reflective oversight for you to review."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adoption pattern</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--cs-text-secondary)] space-y-2">
          <p>
            Drop <code className="text-xs bg-slate-100 rounded px-1 py-0.5">AriaCompose</code> into any existing
            form. Pass the actor identity and role from your auth context, the
            source module and field for audit linkage, and a default command
            appropriate to the field. The mic button and command picker hide
            automatically for roles that don&apos;t hold the required Aria
            permission.
          </p>
          <p>
            The same widget covers daily logs, incidents, key-work sessions,
            management oversight, complaints, supervision notes, return-to-work
            notes, audit responses, meeting minutes, and any other long-text
            field that benefits from dictation, drafting, or reviewing for tone
            and missing information.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
