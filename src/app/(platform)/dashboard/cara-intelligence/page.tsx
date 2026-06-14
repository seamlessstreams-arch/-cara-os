import { CaraOrchestrationPanel } from "@/components/cara/CaraOrchestrationPanel";

export default async function CaraIntelligencePage() {
  // TODO: Replace with real session/home context from auth provider
  const homeId = "00000000-0000-0000-0000-000000000000";
  const userId = "00000000-0000-0000-0000-000000000000";
  const role = "registered_manager";

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
