"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — ROOT REDIRECT
//
// Redirects /cara to /cara/dashboard so the dashboard is the default landing.
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CaraRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/cara/dashboard");
  }, [router]);

  return null;
}
