import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/AuthContext";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Prodexa — Autonomous Pre-Launch Readiness Platform",
  description:
    "Runs your product through 6 specialized analysis modules combining real deterministic signals—Lighthouse, GitHub metadata, page structure—to generate a single Launch Readiness Score with copy-pasteable fixes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0C0E] text-[#EDEDEF] antialiased min-h-screen flex flex-col md:flex-row font-sans">
        <AuthProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
