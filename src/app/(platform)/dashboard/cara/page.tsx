"use client";

import { CaraCommandCentre } from "@/components/cara/CaraCommandCentre";
import { OfstedReadinessCard } from "@/components/cara/OfstedReadinessCard";

import { useAuthContext } from "@/contexts/auth-context";

export default function CaraPage() {
  // Real session/home context (demo default: staff_darren @ home_oak).
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const userId = currentUser?.id ?? "staff_darren";

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
