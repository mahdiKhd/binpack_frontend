import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers";

export const metadata: Metadata = {
  title: { default: "PackLab — 3D Bin Packing", template: "%s · PackLab" },
  description: "Plan, optimize, and inspect three-dimensional container loads.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
