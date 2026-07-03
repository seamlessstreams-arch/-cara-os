"use client";

import { ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTrustNotice, useAcknowledgeTrustNotice } from "@/hooks/use-comms";

const POINTS: Array<{ heading: string; body: string }> = [
  { heading: "Why Cara Comms replaces WhatsApp & personal email", body: "Keeping communication about children inside Cara protects them, protects you, and keeps records safe, lawful and auditable. Personal apps are not safe places for information about children." },
  { heading: "What Cara records", body: "Messages, who read them, who acknowledged them, and any edits are kept with an audit trail so the home can show safe, professional practice." },
  { heading: "Your location is not tracked", body: "Cara does not continuously track where you are. Location is only ever checked at sign-in events (clock in/out, breaks) — never in the background." },
  { heading: "Notifications stay private", body: "Push and in-app notifications never reveal child, incident, safeguarding, medication or HR details. They simply tell you to open the Comms Centre." },
  { heading: "Sensitive screens are protected", body: "Sensitive screens carry a faint watermark showing who is signed in, and their content hides when the window is inactive. Capturing or sharing children's information on personal devices — including screenshots and photos of the screen — is a breach of policy, and any captured image identifies the session it came from." },
  { heading: "You can challenge inaccurate records", body: "If you think a record about you is wrong, you can raise it and ask a manager to review it. This is designed to be fair, not punitive." },
  { heading: "Who can see audit & security events", body: "Only authorised managers and information-governance leads review audit and security events, proportionately and for the right reasons." },
  { heading: "Raising concerns", body: "You can speak to your manager, the safeguarding lead, or use the home's whistleblowing route at any time. You can reopen this notice whenever you like." },
];

export function StaffTrustNoticePanel({ onAcknowledged, compact = false }: { onAcknowledged?: () => void; compact?: boolean }) {
  const { data } = useTrustNotice();
  const ack = useAcknowledgeTrustNotice();

  return (
    <div className="max-w-2xl mx-auto rounded-2xl border border-[var(--cs-border)] bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cs-teal-bg)] text-[var(--cs-teal)]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--cs-navy)]">Staff Trust Notice</h2>
          <p className="text-xs text-[var(--cs-text-muted)]">A calm, plain-English summary of how Cara Comms works.</p>
        </div>
      </div>

      <div className={compact ? "space-y-3 max-h-72 overflow-y-auto pr-1" : "space-y-3"}>
        {POINTS.map((p) => (
          <div key={p.heading} className="rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] p-3">
            <p className="text-sm font-semibold text-[var(--cs-navy)]">{p.heading}</p>
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed mt-1">{p.body}</p>
          </div>
        ))}
      </div>

      {data?.acknowledged ? (
        <div className="flex items-center gap-2 text-sm text-[var(--cs-success)]">
          <Check className="h-4 w-4" /> You acknowledged this notice
          {data.acknowledged_at ? ` on ${new Date(data.acknowledged_at).toLocaleDateString("en-GB")}` : ""}.
        </div>
      ) : (
        <Button
          className="w-full"
          disabled={ack.isPending}
          onClick={() => ack.mutate(undefined, { onSuccess: () => onAcknowledged?.() })}
        >
          {ack.isPending ? "Saving…" : "I understand and acknowledge"}
        </Button>
      )}
    </div>
  );
}
