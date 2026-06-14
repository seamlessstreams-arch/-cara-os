"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraMicrophoneButton
//
// A small, drop-in microphone button that opens the Cara dictation panel
// when clicked. The dictation panel handles capability checks and shows the
// appropriate state (insecure context, browser unsupported, permission
// denied, etc).
//
// Usage:
//   <CaraMicrophoneButton
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
import type { CaraRole } from "@/lib/cara/cara-permissions";
import { CaraDictationPanel } from "./cara-dictation-panel";

export interface CaraMicrophoneButtonProps {
  actorUserId: string;
  actorRole: CaraRole;
  organisationId?: string;
  homeId?: string;
  sourceModule?: string;
  sourceField?: string;
  // Called when the user accepts the transcript (insert into the field).
  onTranscript: (transcript: string) => void;
  // Called when the user wants the transcript handed to an Cara command
  // instead. Optional — if not provided, "Use with Cara" is hidden.
  onSendToCara?: (transcript: string) => void;
  // Optional: hide the button entirely if the role does not have
  // cara.dictate. The dictation panel itself enforces server-side, but
  // hiding the button is a small UX improvement.
  visibleForRoles?: ReadonlyArray<CaraRole>;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

const DEFAULT_VISIBLE_ROLES: ReadonlyArray<CaraRole> = [
  "registered_manager",
  "responsible_individual",
  "deputy_manager",
  "team_leader",
  "residential_support_worker",
  "hr_admin",
];

export function CaraMicrophoneButton({
  actorUserId,
  actorRole,
  organisationId,
  homeId,
  sourceModule,
  sourceField,
  onTranscript,
  onSendToCara,
  visibleForRoles = DEFAULT_VISIBLE_ROLES,
  className,
  size = "icon",
}: CaraMicrophoneButtonProps) {
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
        aria-label="Dictate with Cara"
        title="Dictate with Cara"
      >
        <Mic className="h-4 w-4" />
      </Button>
      {open ? (
        <CaraDictationPanel
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
          onSendToCara={
            onSendToCara
              ? (t) => {
                  onSendToCara(t);
                  setOpen(false);
                }
              : undefined
          }
        />
      ) : null}
    </>
  );
}
