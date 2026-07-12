import type { Metadata } from "next";

export const metadata: Metadata = { title: "Development Hub · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
