import type { Metadata } from "next";

export const metadata: Metadata = { title: "Debriefs · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
