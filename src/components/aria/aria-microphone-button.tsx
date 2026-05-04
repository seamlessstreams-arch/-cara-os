"use client";

// ══════════════════════════════════════════════════════════════════════════════
// AriaMicrophoneButton
//
// A small, drop-in microphone button that opens the Aria dictation panel
// when clicked. The dictation panel handles capability checks and shows the
// appropriate state (insecure context, browser unsupported, permission
// denied, etc).
//
// Usage:
//   <AriaMicrophoneButton
//     actorUserId={...}
//     actorRole={...}
//     sourceModule="daily_log"
//     sourceField="narrative"
//     onTranscript={(transcript) => setNarrative((v) => `${v}\n${transcript}`)}
//   />
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import type { AriaRole } from "@/lib/aria/aria-permissions";
import { AriaDictationPanel } from "./aria-dictation-panel";

export interface AriaMicrophoneButtonProps {
  actorUserId: string;
  actorRole: AriaRole;
  organisationId?: string;
  homeId?: string;
  sourceModule?: string;
  sourceField?: string;
  // Called when the user accepts the transcript (insert into the field).
  onTranscript: (transcript: string) => void;
  // Called when the user wants the transcript handed to an Aria command
  // instead. Optional — if not provided, "Use with Aria" is hidden.
  onSendToAria?: (transcript: string) => void;
  // Optional: hide the button entirely if the role does not have
  // aria.dictate. The dictation panel itself enforces server-side, but
  // hiding the button is a small UX improvement.
  visibleForRoles?: ReadonlyArray<AriaRole>;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

const DEFAULT_VISIBLE_ROLES: ReadonlyArray<AriaRole> = [
  "registered_manager",
  "responsible_individual",
  "deputy_manager",
  "team_leader",
  "residential_support_worker",
  "hr_admin",
];

export function AriaMicrophoneButton({
  actorUserId,
  actorRole,
  organisationId,
  homeId,
  sourceModule,
  sourceField,
  onTranscript,
  onSendToAria,
  visibleForRoles = DEFAULT_VISIBLE_ROLES,
  className,
  size = "icon",
}: AriaMicrophoneButtonProps) {
  const [open, setOpen] = useState(false);

  if (!visibleForRoles.includes(actorRole)) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        className={className}
        onClick={() => setOpen(true)}
        aria-label="Dictate with Aria"
        title="Dictate with Aria"
      >
        <Mic className="h-4 w-4" />
      </Button>
      {open ? (
        <AriaDictationPanel
          open={open}
          onClose={() => setOpen(false)}
          actorUserId={actorUserId}
          actorRole={actorRole}
          organisationId={organisationId}
          homeId={homeId}
          sourceModule={sourceModule}
          sourceField={sourceField}
          onTranscript={(t) => {
            onTranscript(t);
            setOpen(false);
          }}
          onSendToAria={
            onSendToAria
              ? (t) => {
                  onSendToAria(t);
                  setOpen(false);
                }
              : undefined
          }
        />
      ) : null}
    </>
  );
}
