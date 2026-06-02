"use client";

import { useRouter } from "next/navigation";
import { UniversalHomeEntry } from "@/components/forms/universal-home-entry";

export default function UniversalHomeRecordPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-[var(--cs-navy)]">Record for the Home</h1>
        <p className="text-sm text-[var(--cs-text-muted)]">
          Just write what happened. Cornerstone will classify it and route it everywhere.
        </p>
      </div>
      <UniversalHomeEntry onCancel={() => router.back()} />
    </div>
  );
}
