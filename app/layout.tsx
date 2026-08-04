import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/AuthContext";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Prodexa — AI Product Operating System",
  description: "From idea to launch-ready product. Prodexa guides founders through AI Blueprint generation, system architecture, and launch readiness auditing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090B] text-[#FAFAFA] antialiased min-h-screen flex flex-col md:flex-row">
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
