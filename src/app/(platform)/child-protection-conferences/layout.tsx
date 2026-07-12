import type { Metadata } from "next";

export const metadata: Metadata = { title: "CP Conferences · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
