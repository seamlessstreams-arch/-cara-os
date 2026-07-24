import type { Metadata } from "next";
import { CareEventsHubTabs } from "@/components/care-events/care-events-hub-tabs";

export const metadata: Metadata = { title: "Care Events · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CareEventsHubTabs />
      {children}
    </>
  );
}
