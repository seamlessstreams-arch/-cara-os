"use client";

import React, { useState, useEffect } from "react";
import { OnboardingFlow } from "./onboarding-flow";

export function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const complete = localStorage.getItem("cs_onboarding_complete");
      if (!complete) setShowOnboarding(true);
    } catch {}
    setChecked(true);
  }, []);

  if (!checked) return <>{children}</>;

  return (
    <>
      {children}
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}
    </>
  );
}
