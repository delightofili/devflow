import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "DevFlow — Developer Collaboration Platform",
    template: "%s | DevFlow",
  },
  description:
    "A real-time project management platform built for software development teams.",
  keywords: [
    "project management",
    "developer tools",
    "team collaboration",
    "kanban",
  ],
  authors: [{ name: "Delightsome Ofili" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0f0f0f] text-[#f5f5f5] antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
