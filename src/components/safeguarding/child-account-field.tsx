"use client";

// Shared child-voice field — the child's own account/explanation in their own
// words. The child's voice is a Quality-Standards / Reg 6-7 expectation, and
// having one component means the prompt and framing are consistent across the
// safeguarding recording forms (body map, accident, …).

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ChildAccountField({
  id,
  value,
  onChange,
  label = "Child's account (their words)",
  placeholder = "What the child said happened, in their own words…",
  rows = 2,
  className,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} placeholder={placeholder} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
