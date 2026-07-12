"use client";

import { CaraOrchestrationPanel } from "@/components/cara/CaraOrchestrationPanel";
import { useAuthContext } from "@/contexts/auth-context";

export default function CaraIntelligencePage() {
  // Real session/home context (demo default: staff_darren @ home_oak).
  const { currentUser, currentRole } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const userId = currentUser?.id ?? "staff_darren";
  const role = currentRole;

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--cs-navy)]">
          Cara Intelligence Command Centre
        </h1>
        <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">
          One calm assistant — ask anything, Cara routes to the right specialist
          and brings back evidence-based answers.
        </p>
      </div>

      <CaraOrchestrationPanel
        homeId={homeId}
        userId={userId}
        role={role}
        currentPage="cara-intelligence"
      />
    </main>
  );
}
