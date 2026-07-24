import type { Metadata } from "next";
import { IncidentsHubTabs } from "@/components/incidents/incidents-hub-tabs";

export const metadata: Metadata = { title: "Incidents · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IncidentsHubTabs />
      {children}
    </>
  );
}
