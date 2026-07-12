import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hairdressing · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
