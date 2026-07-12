import type { Metadata } from "next";

export const metadata: Metadata = { title: "Children's Rights · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
