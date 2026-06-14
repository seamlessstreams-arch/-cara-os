import { CaraCommandCentre } from "@/components/cara/CaraCommandCentre";
import { OfstedReadinessCard } from "@/components/cara/OfstedReadinessCard";

export default async function CaraPage() {
  // TODO: Replace these placeholders with Cara's real session/home context.
  const homeId = "00000000-0000-0000-0000-000000000000";
  const userId = "00000000-0000-0000-0000-000000000000";

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cara Intelligence Centre</h1>
        <p className="mt-1 text-sm text-slate-600">
          Live oversight, evidence, Ofsted readiness, practice support and AI governance.
        </p>
      </div>

      <OfstedReadinessCard homeId={homeId} userId={userId} />

      <CaraCommandCentre
        homeId={homeId}
        userId={userId}
        defaultRoleMode="registered_manager"
      />
    </main>
  );
}
