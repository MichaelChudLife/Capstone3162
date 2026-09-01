import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CCA Hub — Committee Workspace",
  description: "Task and event management for the Commerce and Computing Association committee.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
