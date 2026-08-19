"use client";

import React, { useState } from "react";
import { useClientValue } from "@/hooks/use-client-value";
import { OnboardingFlow } from "./onboarding-flow";

export function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  // localStorage is the store; read it as one instead of copying it into
  // state from a mount effect. Server/hydration render no onboarding.
  const needsOnboarding = useClientValue(() => {
    try {
      return !localStorage.getItem("cs_onboarding_complete");
    } catch {
      return false;
    }
  }, false);
  const [completedNow, setCompletedNow] = useState(false);
  const showOnboarding = needsOnboarding && !completedNow;

  return (
    <>
      {children}
      {showOnboarding && <OnboardingFlow onComplete={() => setCompletedNow(true)} />}
    </>
  );
}
