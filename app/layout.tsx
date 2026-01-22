import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cashbook PWA",
  description: "Multi-user personal/family cashbook"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
