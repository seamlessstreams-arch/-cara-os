import type { Metadata } from "next";

export const metadata: Metadata = { title: "Infection Control · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
