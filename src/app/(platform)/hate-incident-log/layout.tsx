import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hate Incidents · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
