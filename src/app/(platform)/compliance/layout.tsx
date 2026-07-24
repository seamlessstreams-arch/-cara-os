import type { Metadata } from "next";
import { ComplianceHubTabs } from "@/components/compliance/compliance-hub-tabs";

export const metadata: Metadata = { title: "Compliance · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ComplianceHubTabs />
      {children}
    </>
  );
}
