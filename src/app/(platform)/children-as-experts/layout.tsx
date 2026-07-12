import type { Metadata } from "next";

export const metadata: Metadata = { title: "Children as Experts · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
