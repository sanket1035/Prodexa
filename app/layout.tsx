import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { SidebarProvider } from "@/lib/sidebar/SidebarContext";
import Sidebar from "@/components/Sidebar";
import MainWrapper from "@/components/MainWrapper";

export const metadata: Metadata = {
  title: "Prodexa — AI Product Operating System",
  description:
    "From idea to launch-ready product. Prodexa guides founders through AI Blueprint generation, architecture design, and launch readiness auditing.",
  keywords: ["AI", "product blueprint", "startup", "launch audit"],
  metadataBase: new URL("https://prodexa-ai-rho.vercel.app"),
  openGraph: {
    title: "Prodexa — AI Product Operating System",
    description:
      "From idea to launch-ready product. Prodexa guides founders through AI Blueprint generation, architecture design, and launch readiness auditing.",
    url: "https://prodexa-ai-rho.vercel.app",
    siteName: "Prodexa AI",
    images: [
      {
        url: "/og-preview.png",
        width: 1200,
        height: 630,
        alt: "Prodexa — AI Product Operating System",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prodexa — AI Product Operating System",
    description:
      "From idea to launch-ready product. Prodexa guides founders through AI Blueprint generation, architecture design, and launch readiness auditing.",
    images: ["/og-preview.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0 }}>
        <AuthProvider>
          <ThemeProvider>
            <SidebarProvider>
              <div className="app-shell">
                <Sidebar />
                <MainWrapper>{children}</MainWrapper>
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
