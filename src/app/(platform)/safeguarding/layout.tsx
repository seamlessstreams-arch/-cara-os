import type { Metadata } from "next";
import { SafeguardingHubTabs } from "@/components/safeguarding/safeguarding-hub-tabs";

export const metadata: Metadata = { title: "Safeguarding · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SafeguardingHubTabs />
      {children}
    </>
  );
}
