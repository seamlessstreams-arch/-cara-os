import type { Metadata } from "next";

export const metadata: Metadata = { title: "Home Pets · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
