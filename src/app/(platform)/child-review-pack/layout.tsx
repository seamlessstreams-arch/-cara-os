import type { Metadata } from "next";

export const metadata: Metadata = { title: "Child Review Pack · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
