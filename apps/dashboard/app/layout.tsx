import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";

import { LiveStreamProvider } from "./live-stream-context";

export const metadata: Metadata = {
  title: "Sentinel DNS Dashboard",
  description: "Realtime control plane for Sentinel DNS",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <LiveStreamProvider>
          <Sidebar />
          <div className="flex-1 overflow-auto">{children}</div>
          <CommandPalette />
        </LiveStreamProvider>
      </body>
    </html>
  );
}
