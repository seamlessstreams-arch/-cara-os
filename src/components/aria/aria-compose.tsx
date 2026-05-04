"use client";

// ══════════════════════════════════════════════════════════════════════════════
// AriaCompose
//
// A reusable composer for any long-text field in Cornerstone. Pairs a
// textarea with the Aria microphone button and an "Ask Aria" command picker,
// then renders the suggested draft for the manager to insert, send back to
// Aria for refinement, or discard.
//
// Drop-in usage:
//
//   const [text, setText] = useState("");
//   <AriaCompose
//     value={text}
//     onChange={setText}
//     actorUserId={user.id}
//     actorRole={user.role}
//     homeId={home.id}
//     sourceModule="daily_log"
//     sourceField="narrative"
//     childId={child?.id}
//     defaultCommand="professionalise_record"
//     placeholder="Write the daily log entry..."
//   />
//
// The widget only requests the microphone after a click. The mic button is
// hidden when the role doesn't grant aria.dictate. The Aria panel hides
// when the role doesn't grant aria.use. Server still enforces every
// permission, regardless of UI hiding.
// ══════════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  XCircle,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AriaMicrophoneButton } from "./aria-microphone-button";
import { ariaCan, type AriaPermission, type AriaRole } from "@/lib/aria/aria-permissions";
import type { AriaCommandId } from "@/lib/aria/aria-types";

interface CommandSpec {
  id: AriaCommandId;
  label: string;
  permission: AriaPermission;
}

// A focused subset of commands suitable as quick-pick options on any field.
// The full registry is on the server. Add to this list as you adopt new
// commands in your form.
const QUICK_COMMANDS: CommandSpec[] = [
  { id: "improve_writing", label: "Improve writing", permission: "aria.rewrite" },
  { id: "professionalise_record", label: "Professionalise record", permission: "aria.rewrite" },
  { id: "simplify_language", label: "Simplify language", permission: "aria.rewrite" },
  { id: "summarise_text", label: "Summarise", permission: "aria.summarise" },
  { id: "extract_actions", label: "Extract actions", permission: "aria.summarise" },
  { id: "extract_key_points", label: "Extract key points", permission: "aria.summarise" },
  { id: "check_missing_information", label: "Check missing information", permission: "aria.summarise" },
  { id: "check_tone", label: "Check tone", permission: "aria.summarise" },
  { id: "check_factuality", label: "Check factuality", permission: "aria.summarise" },
  { id: "draft_handover", label: "Draft handover", permission: "aria.generate_drafts" },
  { id: "convert_to_email", label: "Draft email", permission: "aria.generate_drafts" },
  { id: "convert_to_letter", label: "Draft letter", permission: "aria.generate_drafts" },
];

export interface AriaComposeProps {
  value: string;
  onChange: (next: string) => void;

  actorUserId: string;
  actorRole: AriaRole;
  organisationId?: string;
  homeId?: string;
  childId?: string;
  staffId?: string;

  sourceModule?: string;
  sourceRecordType?: string;
  sourceRecordId?: string;
  sourceField?: string;

  // Optional override of the default Aria command shown in the picker.
  defaultCommand?: AriaCommandId;
  // Optional override of the visible quick-pick commands.
  commands?: CommandSpec[];

  // Standard textarea concerns
  label?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  textareaClassName?: string;

  // Optional: hide the mic button entirely (e.g. on non-narrative fields).
  hideMicrophone?: boolean;
}

interface AriaResult {
  outputId?: string;
  generatedText: string;
  ariaLabel: "Aria suggested draft";
  llmUsed: boolean;
  approvalRequired: boolean;
  persisted: boolean;
}

export function AriaCompose(props: AriaComposeProps) {
  const {
    value,
    onChange,
    actorUserId,
    actorRole,
    organisationId,
    homeId,
    childId,
    staffId,
    sourceModule,
    sourceRecordType,
    sourceRecordId,
    sourceField,
    defaultCommand = "professionalise_record",
    commands = QUICK_COMMANDS,
    label,
    placeholder,
    rows = 8,
    className,
    textareaClassName,
    hideMicrophone = false,
  } = props;

  const visibleCommands = useMemo(
    () => commands.filter((c) => ariaCan(actorRole, c.permission)),
    [commands, actorRole],
  );

  const [commandId, setCommandId] = useState<AriaCommandId>(
    visibleCommands.find((c) => c.id === defaultCommand)?.id ??
      visibleCommands[0]?.id ??
      defaultCommand,
  );

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AriaResult | null>(null);
  const [resultEdited, setResultEdited] = useState("");
  const [editing, setEditing] = useState(false);
  const canUseAria = ariaCan(actorRole, "aria.use");

  async function runCommand() {
    if (!value || value.trim().length < 5) {
      setError("Add some text to the field before running an Aria command.");
      return;
    }
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/aria/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorUserId,
          actorRole,
          organisationId,
          homeId,
          childId,
          staffId,
          sourceModule,
          sourceRecordType,
          sourceRecordId,
          commandId,
          inputText: value,
          inputMetadata: sourceField ? { field: sourceField } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Aria command failed.");
      } else {
        setResult(data.data as AriaResult);
        setResultEdited((data.data as AriaResult).generatedText ?? "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  async function decide(decision: "approve" | "reject" | "request_changes" | "withdraw") {
    if (!result?.outputId) {
      // No persistence — silently treat as local-only when Supabase isn't
      // configured. The UI behaves the same; we just can't audit-log.
      return;
    }
    try {
      await fetch("/api/aria/generate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorUserId,
          actorRole,
          outputId: result.outputId,
          decision,
          editedText: editing ? resultEdited : undefined,
        }),
      });
    } catch {
      // best-effort
    }
  }

  function insertIntoField() {
    const text = editing ? resultEdited : result?.generatedText ?? "";
    if (!text) return;
    onChange(text);
    void decide("approve");
    setResult(null);
    setEditing(false);
  }

  function appendIntoField() {
    const text = editing ? resultEdited : result?.generatedText ?? "";
    if (!text) return;
    onChange(value ? `${value.trimEnd()}\n\n${text}` : text);
    void decide("approve");
    setResult(null);
    setEditing(false);
  }

  function discard() {
    void decide("reject");
    setResult(null);
    setEditing(false);
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <label className="block text-xs font-semibold text-slate-600">{label}</label>
      ) : null}
      <div className="flex items-start gap-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn("flex-1 text-sm", textareaClassName)}
        />
        {!hideMicrophone ? (
          <AriaMicrophoneButton
            actorUserId={actorUserId}
            actorRole={actorRole}
            organisationId={organisationId}
            homeId={homeId}
            sourceModule={sourceModule}
            sourceField={sourceField}
            onTranscript={(t) => onChange(value ? `${value.trimEnd()}\n\n${t}` : t)}
          />
        ) : null}
      </div>

      {canUseAria && visibleCommands.length > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span className="text-xs text-slate-500">Ask Aria:</span>
          <Select value={commandId} onValueChange={(v) => setCommandId(v as AriaCommandId)}>
            <SelectTrigger className="h-8 w-56 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibleCommands.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={runCommand}
            disabled={running}
            className="gap-1.5 h-8"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {running ? "Working..." : "Run"}
          </Button>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1.5">
          <AlertTriangle className="h-3.5 w-3.5" /> {error}
        </div>
      ) : null}

      {result ? (
        <Card className="border-violet-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                <span>Aria suggested draft</span>
                <Badge className="border bg-violet-50 text-violet-800 border-violet-200 text-xs">
                  {result.llmUsed ? "Generated" : "Not configured"}
                </Badge>
                {result.approvalRequired ? (
                  <Badge className="border bg-amber-50 text-amber-800 border-amber-200 text-xs">
                    Requires human review
                  </Badge>
                ) : null}
              </span>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing((v) => !v)} className="gap-1.5 h-7">
                <Pencil className="h-3.5 w-3.5" /> {editing ? "Stop editing" : "Edit"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {editing ? (
              <Textarea
                value={resultEdited}
                onChange={(e) => setResultEdited(e.target.value)}
                className="min-h-[180px] text-sm"
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans">
                {result.generatedText}
              </pre>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={insertIntoField}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Replace field
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={appendIntoField}
                className="gap-1.5"
              >
                Append to field
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={runCommand}
                disabled={running}
                className="gap-1.5"
              >
                {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
                Re-run
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={discard}
                className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50 ml-auto"
              >
                <XCircle className="h-3.5 w-3.5" /> Discard
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
