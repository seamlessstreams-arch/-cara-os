"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD PRACTICE MODULES CARD
// Surfaces the four child-scoped practice-intelligence modules INLINE on the
// child record, so their signals reach the point of work instead of sitting on
// standalone pages:
//   • Rights & Restriction      • Staying Safe Plan
//   • Protective Relationships  • Post-Incident Reflection
// Panels are shared with the recording-form inline surfacing (practice-module-
// panels) — they summarise each module's own per-child intelligence and
// deep-link to the full module; they never duplicate the engine.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";
import {
  RightsRestrictionPanel,
  StayingSafePanel,
  RelationshipsPanel,
  ReflectionPanel,
} from "@/components/intelligence/practice-module-panels";

export function ChildPracticeModulesCard({ childId }: { childId: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
          Rights, Safety &amp; Relationships
        </CardTitle>
        <p className="text-xs text-[var(--cs-text-muted,#64748b)]">
          Cara&apos;s practice modules for this child — a summary, with the full module one click away.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <RightsRestrictionPanel childId={childId} />
          <StayingSafePanel childId={childId} />
          <RelationshipsPanel childId={childId} />
          <ReflectionPanel childId={childId} />
        </div>
      </CardContent>
    </Card>
  );
}
